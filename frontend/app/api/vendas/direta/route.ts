import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@backend/lib/prisma'
import { verifyToken } from '@backend/lib/auth'
import { calcularPrecoVendaDireta, atualizarPrecoVendaDireta } from '@backend/lib/vendas'
import { z } from 'zod'

const vendaDiretaSchema = z.object({
  jogadorId: z.string()
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
    const data = vendaDiretaSchema.parse(body)

    const jogador = await prisma.jogador.findUnique({
      where: { id: data.jogadorId }
    })

    if (!jogador) {
      return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 })
    }

    if (jogador.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Você não é o dono deste jogador' }, { status: 403 })
    }

    if (jogador.emLeilao) {
      return NextResponse.json({ error: 'Jogador está em leilão. Remova do leilão primeiro.' }, { status: 400 })
    }

    // Calcula e atualiza o preço
    const preco = await atualizarPrecoVendaDireta(data.jogadorId)

    return NextResponse.json({ preco, jogador })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Erro ao calcular preço' }, { status: 400 })
  }
}

// GET para obter preço de venda direta
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

    const { searchParams } = new URL(request.url)
    const jogadorId = searchParams.get('jogadorId')

    if (!jogadorId) {
      return NextResponse.json({ error: 'jogadorId é obrigatório' }, { status: 400 })
    }

    const jogador = await prisma.jogador.findUnique({
      where: { id: jogadorId }
    })

    if (!jogador) {
      return NextResponse.json({ error: 'Jogador não encontrado' }, { status: 404 })
    }

    const preco = await calcularPrecoVendaDireta(jogador.nome, jogador.raridade)

    return NextResponse.json({ preco, jogador })
  } catch (error) {
    console.error('Erro ao obter preço:', error)
    return NextResponse.json({ error: 'Erro ao obter preço' }, { status: 500 })
  }
}
