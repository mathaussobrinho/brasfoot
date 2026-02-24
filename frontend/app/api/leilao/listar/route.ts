import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { prisma } from '@backend/lib/prisma'
import { finalizarLeiloesExpirados } from '@backend/lib/leilao'

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

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
