import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@backend/lib/auth'
import { prisma } from '@backend/lib/prisma'
import {
  entrarNaFila,
  sairDaFila,
  estaNaFila,
  encontrarOponente,
  pausarPartida,
  despausarPartida,
  obterStatusPartida,
  obterPartidaEncontrada,
  armazenarPartidaEncontrada,
  removerPartidaEncontrada,
  marcarIntervalo
} from '@backend/lib/matchmaking'
import { simularPartidaDetalhada } from '@backend/lib/partidas-detalhadas'
import { registrarPartidaEmAndamento } from '@backend/lib/matchmaking'

// GET - Verifica status da busca
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

    const { searchParams } = new URL(request.url)
    const partidaId = searchParams.get('partidaId')

    // Se tem partidaId, verifica status da partida (para pausa)
    if (partidaId) {
      const status = obterStatusPartida(partidaId, decoded.userId)
      if (!status) {
        return NextResponse.json({ error: 'Partida não encontrada' }, { status: 404 })
      }
      return NextResponse.json(status)
    }

    // Primeiro verifica se já tem uma partida encontrada aguardando
    const partidaEncontrada = obterPartidaEncontrada(decoded.userId)
    if (partidaEncontrada) {
      // Não remove imediatamente - deixa disponível por um tempo
      // A partida será removida automaticamente após timeout ou quando ambos já tiverem buscado
      
      return NextResponse.json({
        buscando: false,
        encontrou: true,
        partida: partidaEncontrada.dadosPartida
      })
    }

    // Verifica se encontrou oponente
    const oponente = encontrarOponente(decoded.userId)
    
    if (oponente) {
      // Encontrou oponente! Cria a partida
      const oponenteData = await prisma.user.findUnique({
        where: { id: oponente.userId },
        include: { clube: true }
      })

      if (!oponenteData || !oponenteData.clube) {
        sairDaFila(decoded.userId)
        return NextResponse.json({ 
          buscando: true,
          encontrou: false 
        })
      }

      // Simula a partida
      const resultado = await simularPartidaDetalhada(decoded.userId, oponente.userId, 'ranqueado')
      
      // Registra partida em andamento para controle de pausa
      if (resultado.partida?.id) {
        registrarPartidaEmAndamento(
          resultado.partida.id,
          decoded.userId,
          oponente.userId
        )
        
        // IMPORTANTE: Armazena a partida ANTES de retornar
        // para que o outro jogador possa buscá-la no próximo polling
        armazenarPartidaEncontrada(
          resultado.partida.id,
          decoded.userId,
          oponente.userId,
          resultado
        )
      }

      return NextResponse.json({
        buscando: false,
        encontrou: true,
        partida: resultado
      })
    }

    return NextResponse.json({
      buscando: true,
      encontrou: false
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao verificar matchmaking' }, { status: 400 })
  }
}

// POST - Entrar na fila
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { tecnicoOverall: true, clube: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (!user.clube) {
      return NextResponse.json({ error: 'Você precisa criar um clube primeiro!' }, { status: 400 })
    }

    // Verifica se já está na fila
    if (estaNaFila(decoded.userId)) {
      return NextResponse.json({ 
        sucesso: true,
        mensagem: 'Já está na fila',
        buscando: true
      })
    }

    entrarNaFila(decoded.userId, user.tecnicoOverall || 50)

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Entrou na fila de matchmaking',
      buscando: true
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao entrar na fila' }, { status: 400 })
  }
}

// DELETE - Sair da fila
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

    sairDaFila(decoded.userId)

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Saiu da fila de matchmaking'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao sair da fila' }, { status: 400 })
  }
}

// PUT - Pausar/Despausar partida
export async function PUT(request: NextRequest) {
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
    const { partidaId, acao } = body // acao: 'pausar' ou 'despausar'

    if (!partidaId || !acao) {
      return NextResponse.json({ error: 'PartidaId e ação são obrigatórios' }, { status: 400 })
    }

    if (acao === 'pausar') {
      const resultado = pausarPartida(partidaId, decoded.userId)
      return NextResponse.json(resultado)
    } else if (acao === 'despausar') {
      const resultado = despausarPartida(partidaId, decoded.userId)
      return NextResponse.json(resultado)
    } else {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao pausar/despausar' }, { status: 400 })
  }
}
