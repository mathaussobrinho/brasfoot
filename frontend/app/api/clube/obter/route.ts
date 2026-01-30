import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@backend/lib/auth'
import { obterClube } from '@backend/lib/clube'

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

    const clube = await obterClube(decoded.userId)

    return NextResponse.json({ clube })
  } catch (error) {
    console.error('Erro ao obter clube:', error)
    return NextResponse.json({ error: 'Erro ao obter clube' }, { status: 500 })
  }
}
