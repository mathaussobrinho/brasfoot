import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@backend/lib/auth'
import { criarOuAtualizarClube } from '@backend/lib/clube'
import { z } from 'zod'

const criarClubeSchema = z.object({
  nome: z.string().min(3),
  sigla: z.string().min(2).max(5),
  escudo: z.string(),
  formacao: z.string().optional().default('4-4-2')
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
    const data = criarClubeSchema.parse(body)

    const clube = await criarOuAtualizarClube(
      decoded.userId,
      data.nome,
      data.sigla,
      data.escudo,
      data.formacao
    )

    return NextResponse.json({ clube })
  } catch (error: any) {
    console.error('Erro completo ao criar clube:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ 
      error: error.message || 'Erro ao criar clube',
      details: error.stack 
    }, { status: 500 })
  }
}
