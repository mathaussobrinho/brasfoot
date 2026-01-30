import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@backend/lib/auth'
import { prisma } from '@backend/lib/prisma'
import { simularPartidaDetalhada } from '@backend/lib/partidas-detalhadas'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Busca oponente
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { tecnicoOverall: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const oponente = await prisma.user.findFirst({
      where: {
        id: { not: decoded.userId },
        tecnicoOverall: {
          gte: user.tecnicoOverall - 5,
          lte: user.tecnicoOverall + 5
        },
        clube: { isNot: null } // Precisa ter clube criado
      }
    })

    if (!oponente) {
      return NextResponse.json({ error: 'Nenhum oponente encontrado no momento' }, { status: 404 })
    }

    const resultado = await simularPartidaDetalhada(decoded.userId, oponente.id, 'ranqueado')

    return NextResponse.json({
      ...resultado,
      oponente: {
        id: oponente.id,
        nome: oponente.nome,
        sobrenome: oponente.sobrenome
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao simular partida' }, { status: 400 })
  }
}
