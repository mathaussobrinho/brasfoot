import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
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
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const data = criarClubeSchema.parse(body)

    const clube = await criarOuAtualizarClube(
      auth.userId,
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

    return NextResponse.json(
      { error: error.message || 'Erro ao criar clube' },
      { status: 500 }
    )
  }
}
