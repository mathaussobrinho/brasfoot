import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { prisma } from '@backend/lib/prisma'
import { getTirosDisponiveis } from '@backend/lib/tiros'
import { verificarPasseAtivo } from '@backend/lib/passe'

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        nome: true,
        sobrenome: true,
        login: true,
        email: true,
        tecnicoOverall: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const tirosDisponiveis = await getTirosDisponiveis(auth.userId)
    const temPasseAtivo = await verificarPasseAtivo(auth.userId)

    return NextResponse.json({
      user,
      tirosDisponiveis,
      temPasseAtivo
    })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do usuário' },
      { status: 500 }
    )
  }
}
