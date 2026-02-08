import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@backend/lib/auth'
import { prisma } from '@backend/lib/prisma'
import { simularPartidaDetalhada } from '@backend/lib/partidas-detalhadas'
import { registrarPartidaEmAndamento } from '@backend/lib/matchmaking'
import { armazenarPartidaDesafio } from '@backend/lib/jogadores-online'

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
    const { oponenteId, tipo } = body

    if (!oponenteId || !tipo) {
      return NextResponse.json({ error: 'OponenteId e tipo são obrigatórios' }, { status: 400 })
    }

    if (oponenteId === decoded.userId) {
      return NextResponse.json({ error: 'Você não pode desafiar a si mesmo' }, { status: 400 })
    }

    if (tipo !== 'amistoso' && tipo !== 'ranqueado') {
      return NextResponse.json({ error: 'Tipo inválido. Use "amistoso" ou "ranqueado"' }, { status: 400 })
    }

    // Verifica se o oponente existe e tem clube
    const oponente = await prisma.user.findUnique({
      where: { id: oponenteId },
      include: { clube: true }
    })

    if (!oponente) {
      return NextResponse.json({ error: 'Oponente não encontrado' }, { status: 404 })
    }

    if (!oponente.clube) {
      return NextResponse.json({ error: 'Oponente não tem clube criado' }, { status: 400 })
    }

    const desafiante = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { nome: true, sobrenome: true }
    })
    const desafianteNome = desafiante ? `${desafiante.nome} ${desafiante.sobrenome}` : 'Oponente'

    // Simula a partida
    const resultado = await simularPartidaDetalhada(decoded.userId, oponenteId, tipo)
    
    // Armazena partida para o desafiado receber no próximo poll (para ambos jogarem)
    armazenarPartidaDesafio(oponenteId, resultado, desafianteNome, tipo)
    
    // Registra partida em andamento para controle de pausa (apenas se for ranqueada)
    if (resultado.partida?.id && tipo === 'ranqueado') {
      registrarPartidaEmAndamento(
        resultado.partida.id,
        decoded.userId,
        oponenteId
      )
    }

    return NextResponse.json({
      sucesso: true,
      partida: resultado
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao desafiar jogador' }, { status: 400 })
  }
}
