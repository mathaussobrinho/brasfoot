import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@backend/lib/prisma'
import { verifyToken } from '@backend/lib/auth'

// Rota temporária para limpar todos os jogadores
export async function DELETE(request: NextRequest) {
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

    // Deleta todos os jogadores do usuário
    const resultado = await prisma.jogador.deleteMany({
      where: {
        userId: decoded.userId
      }
    })

    return NextResponse.json({
      message: 'Todos os jogadores foram deletados',
      quantidade: resultado.count
    })
  } catch (error) {
    console.error('Erro ao deletar jogadores:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar jogadores' },
      { status: 500 }
    )
  }
}
