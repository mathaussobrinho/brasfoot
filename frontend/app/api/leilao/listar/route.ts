import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@backend/lib/prisma'
import { verifyToken } from '@backend/lib/auth'
import { finalizarLeiloesExpirados } from '@backend/lib/leilao'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Finaliza leilões expirados primeiro
    await finalizarLeiloesExpirados()

    // Lista leilões ativos
    const leiloes = await prisma.leilao.findMany({
      where: { vendido: false },
      include: {
        jogador: {
          select: {
            id: true,
            nome: true,
            posicao: true,
            posicaoCompleta: true,
            timeAtual: true,
            raridade: true,
            overall: true,
            imagem: true
          }
        },
        user: {
          select: {
            id: true,
            nome: true,
            sobrenome: true,
            login: true
          }
        }
      },
      orderBy: { dataFim: 'asc' }
    })

    return NextResponse.json({ leiloes })
  } catch (error) {
    console.error('Erro ao listar leilões:', error)
    return NextResponse.json({ error: 'Erro ao listar leilões' }, { status: 500 })
  }
}
