import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { prisma } from '@backend/lib/prisma'
import { realizarGacha, gerarJogador } from '@backend/lib/gacha'
import { usarTiro, getTirosDisponiveis } from '@backend/lib/tiros'
import { z } from 'zod'

const gachaSchema = z.object({
  quantidade: z.number().min(1).max(10).optional().default(1)
})

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json().catch(() => ({}))
    const { quantidade } = gachaSchema.parse(body)

    // Verifica se tem tiros disponíveis
    const tirosDisponiveis = await getTirosDisponiveis(auth.userId)
    if (tirosDisponiveis < quantidade) {
      return NextResponse.json(
        { error: `Você precisa de ${quantidade} tiros, mas só tem ${tirosDisponiveis} disponíveis` },
        { status: 400 }
      )
    }

    // Usa os tiros
    const tirosUsados = await usarTiro(auth.userId, quantidade)
    if (!tirosUsados) {
      return NextResponse.json(
        { error: 'Erro ao usar tiros' },
        { status: 400 }
      )
    }

    // Determina quantos jogadores criar
    // Se for 10 tiros, cria 11 jogadores (1 extra)
    const quantidadeJogadores = quantidade === 10 ? 11 : quantidade

    const jogadoresCriados = []
    const logsCriados = []

    // Realiza os gachas
    for (let i = 0; i < quantidadeJogadores; i++) {
      const { jogador, raridade } = realizarGacha()

      // Salva o jogador
      const jogadorCriado = await prisma.jogador.create({
        data: {
          nome: jogador.nome,
          posicao: jogador.posicao,
          posicaoCompleta: jogador.posicaoCompleta,
          timeAtual: jogador.timeAtual,
          raridade: jogador.raridade,
          overall: jogador.overall,
          imagem: jogador.imagem,
          userId: auth.userId
        }
      })

      jogadoresCriados.push(jogadorCriado)

      // Salva no log do gacha
      const log = await prisma.gachaLog.create({
        data: {
          userId: auth.userId,
          jogadorId: jogadorCriado.id,
          raridade
        }
      })

      logsCriados.push(log)
    }

    // Retorna os novos tiros disponíveis
    const novosTiros = await getTirosDisponiveis(auth.userId)

    return NextResponse.json({
      jogadores: jogadoresCriados,
      quantidade: quantidadeJogadores,
      tirosUsados: quantidade,
      tirosDisponiveis: novosTiros
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro no gacha:', error)
    return NextResponse.json(
      { error: 'Erro ao realizar gacha' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

    const tirosDisponiveis = await getTirosDisponiveis(auth.userId)

    return NextResponse.json({ tirosDisponiveis })
  } catch (error) {
    console.error('Erro ao buscar tiros:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar tiros' },
      { status: 500 }
    )
  }
}
