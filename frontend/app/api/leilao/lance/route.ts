import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@backend/lib/auth'
import { darLance } from '@backend/lib/leilao'
import { z } from 'zod'

const lanceSchema = z.object({
  leilaoId: z.string(),
  valor: z.number().min(1)
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
    const data = lanceSchema.parse(body)

    const leilao = await darLance(data.leilaoId, decoded.userId, data.valor)

    return NextResponse.json({ leilao })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Erro ao dar lance' }, { status: 400 })
  }
}
