import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@backend/lib/prisma'
import { verifyToken } from '@backend/lib/auth'
import { realizarGacha, gerarJogador } from '@backend/lib/gacha'
import { usarTiro, getTirosDisponiveis } from '@backend/lib/tiros'
import { z } from 'zod'

const gachaSchema = z.object({
  quantidade: z.number().min(1).max(10).optional().default(1)
})

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { quantidade } = gachaSchema.parse(body)

    // Verifica se tem tiros disponíveis
    const tirosDisponiveis = await getTirosDisponiveis(decoded.userId)
    if (tirosDisponiveis < quantidade) {
      return NextResponse.json(
        { error: `Você precisa de ${quantidade} tiros, mas só tem ${tirosDisponiveis} disponíveis` },
        { status: 400 }
      )
    }

    // Usa os tiros
    const tirosUsados = await usarTiro(decoded.userId, quantidade)
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
          userId: decoded.userId
        }
      })

      jogadoresCriados.push(jogadorCriado)

      // Salva no log do gacha
      const log = await prisma.gachaLog.create({
        data: {
          userId: decoded.userId,
          jogadorId: jogadorCriado.id,
          raridade
        }
      })

      logsCriados.push(log)
    }

    // Retorna os novos tiros disponíveis
    const novosTiros = await getTirosDisponiveis(decoded.userId)

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
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const tirosDisponiveis = await getTirosDisponiveis(decoded.userId)

    return NextResponse.json({ tirosDisponiveis })
  } catch (error) {
    console.error('Erro ao buscar tiros:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar tiros' },
      { status: 500 }
    )
  }
}
