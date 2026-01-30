import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@backend/lib/prisma'
import { verifyPassword, generateToken } from '@backend/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  login: z.string(),
  senha: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = loginSchema.parse(body)

    // Busca o usuário por login ou email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { login: data.login },
          { email: data.login }
        ]
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Login ou senha incorretos' },
        { status: 401 }
      )
    }

    // Verifica a senha
    const senhaValida = await verifyPassword(data.senha, user.senha)
    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Login ou senha incorretos' },
        { status: 401 }
      )
    }

    // Gera o token
    const token = generateToken(user.id)

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        sobrenome: user.sobrenome,
        login: user.login,
        email: user.email
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
