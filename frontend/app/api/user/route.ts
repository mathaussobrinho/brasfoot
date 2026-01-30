import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@backend/lib/prisma'
import { verifyToken } from '@backend/lib/auth'
import { getTirosDisponiveis } from '@backend/lib/tiros'
import { verificarPasseAtivo } from '@backend/lib/passe'

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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

    const tirosDisponiveis = await getTirosDisponiveis(decoded.userId)
    const temPasseAtivo = await verificarPasseAtivo(decoded.userId)

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
