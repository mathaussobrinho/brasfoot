import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@backend/lib/auth'
import { prisma } from '@backend/lib/prisma'
import { salvarEscalacao } from '@backend/lib/clube'
import { z } from 'zod'

const escalacaoSchema = z.object({
  jogadoresIds: z.array(z.string()).min(11),
  isTitular: z.array(z.boolean()),
  posicoes: z.array(z.number().nullable()).optional()
})

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

    const body = await request.json()
    const data = escalacaoSchema.parse(body)

    // Verifica se o clube existe
    const clube = await prisma.clube.findUnique({
      where: { userId: decoded.userId }
    })

    if (!clube) {
      return NextResponse.json({ error: 'Clube não encontrado' }, { status: 404 })
    }

    // Verifica se os jogadores pertencem ao usuário
    const jogadores = await prisma.jogador.findMany({
      where: {
        id: { in: data.jogadoresIds },
        userId: decoded.userId
      }
    })

    if (jogadores.length !== data.jogadoresIds.length) {
      return NextResponse.json({ error: 'Alguns jogadores não pertencem a você' }, { status: 400 })
    }

    const escalacao = await salvarEscalacao(clube.id, data.jogadoresIds, data.isTitular, data.posicoes)

    return NextResponse.json({ escalacao })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Erro ao salvar escalação' }, { status: 400 })
  }
}
