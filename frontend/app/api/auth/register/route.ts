import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@backend/lib/prisma'
import { hashPassword } from '@backend/lib/auth'
import { obterJogadoresNormais } from '@backend/lib/jogadores-reais'
import { z } from 'zod'

const registerSchema = z.object({
  nome: z.string().min(2),
  sobrenome: z.string().min(2),
  login: z.string().min(3),
  email: z.string().email(),
  senha: z.string().min(6)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    // Verifica se login ou email já existe
    const usuarioExistente = await prisma.user.findFirst({
      where: {
        OR: [
          { login: data.login },
          { email: data.email }
        ]
      }
    })

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'Login ou email já cadastrado' },
        { status: 400 }
      )
    }

    // Cria o usuário
    const senhaHash = await hashPassword(data.senha)
    const user = await prisma.user.create({
      data: {
        nome: data.nome,
        sobrenome: data.sobrenome,
        login: data.login,
        email: data.email,
        senha: senhaHash
      },
      select: {
        id: true,
        nome: true,
        sobrenome: true,
        login: true,
        email: true
      }
    })

    // Cria 11 jogadores iniciais normais (jogadores reais)
    const jogadoresReais = obterJogadoresNormais(11)
    const jogadoresIniciais = []
    
    for (const jogadorReal of jogadoresReais) {
      const imagem = `/jogadores/${jogadorReal.raridade}-${Math.floor(Math.random() * 5) + 1}.svg`
      const jogadorCriado = await prisma.jogador.create({
        data: {
          nome: jogadorReal.nome,
          posicao: jogadorReal.posicao,
          posicaoCompleta: jogadorReal.posicaoCompleta,
          timeAtual: jogadorReal.timeAtual,
          raridade: jogadorReal.raridade,
          overall: jogadorReal.overall,
          imagem: imagem,
          userId: user.id
        }
      })
      jogadoresIniciais.push(jogadorCriado)
    }

    return NextResponse.json({ 
      user,
      jogadoresIniciais: jogadoresIniciais.length 
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro no registro:', error)
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    )
  }
}
