import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@backend/lib/prisma'
import { verifyToken } from '@backend/lib/auth'
import { adicionarTirosComprados } from '@backend/lib/tiros'
import { criarPasseTemporada } from '@backend/lib/passe'
import { z } from 'zod'

const compraSchema = z.object({
  tipo: z.enum(['tiros', 'passe']),
  quantidade: z.number().optional() // Para tiros
})

// Preços
const PRECO_TIRO = 2.0 // R$ 2,00 por tiro
const PRECO_PASSE = 29.90 // R$ 29,90 pelo passe

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

    const body = await request.json()
    const data = compraSchema.parse(body)

    let compra

    if (data.tipo === 'tiros') {
      if (!data.quantidade || data.quantidade <= 0) {
        return NextResponse.json(
          { error: 'Quantidade inválida' },
          { status: 400 }
        )
      }

      const valor = data.quantidade * PRECO_TIRO

      try {
        // Verifica se o usuário existe
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        })

        if (!user) {
          return NextResponse.json(
            { error: 'Usuário não encontrado' },
            { status: 404 }
          )
        }

        // Adiciona os tiros comprados
        await adicionarTirosComprados(decoded.userId, data.quantidade)

        // Registra a compra
        compra = await prisma.compra.create({
          data: {
            userId: decoded.userId,
            tipo: 'tiros',
            quantidade: data.quantidade,
            valor
          }
        })
      } catch (error: any) {
        console.error('Erro ao adicionar tiros:', error)
        return NextResponse.json(
          { error: `Erro ao processar compra: ${error.message || 'Erro desconhecido'}` },
          { status: 500 }
        )
      }
    } else if (data.tipo === 'passe') {
      try {
        // Verifica se o usuário existe
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        })

        if (!user) {
          return NextResponse.json(
            { error: 'Usuário não encontrado' },
            { status: 404 }
          )
        }

        // Cria ou renova o passe
        await criarPasseTemporada(decoded.userId)

        // Registra a compra
        compra = await prisma.compra.create({
          data: {
            userId: decoded.userId,
            tipo: 'passe',
            valor: PRECO_PASSE
          }
        })
      } catch (error: any) {
        console.error('Erro ao criar passe:', error)
        return NextResponse.json(
          { error: `Erro ao processar compra: ${error.message || 'Erro desconhecido'}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ compra, message: 'Compra realizada com sucesso!' })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro na compra:', error)
    return NextResponse.json(
      { error: `Erro ao processar compra: ${error.message || 'Erro desconhecido'}` },
      { status: 500 }
    )
  }
}
