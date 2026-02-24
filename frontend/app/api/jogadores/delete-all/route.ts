import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { prisma } from '@backend/lib/prisma'

// Rota temporária para limpar todos os jogadores
export async function DELETE(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

    // Deleta todos os jogadores do usuário
    const resultado = await prisma.jogador.deleteMany({
      where: {
        userId: auth.userId
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
