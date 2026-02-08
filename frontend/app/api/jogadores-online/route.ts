import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@backend/lib/auth'
import { prisma } from '@backend/lib/prisma'
import {
  adicionarJogadorOnline,
  removerJogadorOnline,
  obterJogadoresOnline,
  adicionarMensagemChat,
  obterMensagensChat,
  obterPartidaDesafio
} from '@backend/lib/jogadores-online'

// GET - Obtém jogadores online e mensagens do chat
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

    const jogadores = obterJogadoresOnline()
    const mensagens = obterMensagensChat()
    const partidaDesafio = obterPartidaDesafio(decoded.userId)

    return NextResponse.json({
      jogadores,
      mensagens,
      ...(partidaDesafio && { partidaDesafio })
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao obter jogadores online' }, { status: 400 })
  }
}

// POST - Atualiza status online ou envia mensagem
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
    const { acao, mensagem } = body

    if (acao === 'atualizar-online') {
      // Atualiza status online do jogador
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { clube: true }
      })

      if (user) {
        adicionarJogadorOnline({
          userId: user.id,
          nome: user.nome,
          sobrenome: user.sobrenome,
          login: user.login,
          tecnicoOverall: user.tecnicoOverall || 50,
          clube: user.clube ? {
            nome: user.clube.nome,
            sigla: user.clube.sigla
          } : undefined,
          timestamp: Date.now()
        })
      }

      return NextResponse.json({ sucesso: true })
    } else if (acao === 'enviar-mensagem') {
      if (!mensagem || mensagem.trim().length === 0) {
        return NextResponse.json({ error: 'Mensagem não pode estar vazia' }, { status: 400 })
      }

      if (mensagem.length > 500) {
        return NextResponse.json({ error: 'Mensagem muito longa (máximo 500 caracteres)' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { nome: true, sobrenome: true, login: true }
      })

      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      const novaMensagem = adicionarMensagemChat(
        decoded.userId,
        `${user.nome} ${user.sobrenome}`,
        user.login,
        mensagem.trim()
      )

      return NextResponse.json({
        sucesso: true,
        mensagem: novaMensagem
      })
    } else {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao processar requisição' }, { status: 400 })
  }
}

// DELETE - Remove jogador online
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    removerJogadorOnline(decoded.userId)

    return NextResponse.json({ sucesso: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao remover jogador online' }, { status: 400 })
  }
}
