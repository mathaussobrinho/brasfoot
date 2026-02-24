import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { prisma } from '@backend/lib/prisma'
import { simularPartidaDetalhada } from '@backend/lib/partidas-detalhadas'
import { registrarPartidaEmAndamento } from '@backend/lib/matchmaking'
<<<<<<< HEAD
import { obterJogadoresEscalados } from '@backend/lib/clube'
=======
import { armazenarPartidaDesafio } from '@backend/lib/jogadores-online'
>>>>>>> 682515e712151ffed0370d7ae7304b79d3cd5e1d

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { oponenteId, tipo } = body

    if (!oponenteId || !tipo) {
      return NextResponse.json({ error: 'OponenteId e tipo são obrigatórios' }, { status: 400 })
    }

    if (oponenteId === auth.userId) {
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

<<<<<<< HEAD
    // Verifica se o oponente tem 11 jogadores escalados
    const escalacaoOponente = await obterJogadoresEscalados(oponente.clube.id)
    if (escalacaoOponente.titulares.length < 11) {
      return NextResponse.json(
        { error: 'Oponente não tem time completo (precisa de 11 jogadores escalados)' },
        { status: 400 }
      )
    }
=======
    const desafiante = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { nome: true, sobrenome: true }
    })
    const desafianteNome = desafiante ? `${desafiante.nome} ${desafiante.sobrenome}` : 'Oponente'
>>>>>>> 682515e712151ffed0370d7ae7304b79d3cd5e1d

    // Simula a partida
    const resultado = await simularPartidaDetalhada(auth.userId, oponenteId, tipo)
    
    // Armazena partida para o desafiado receber no próximo poll (para ambos jogarem)
    armazenarPartidaDesafio(oponenteId, resultado, desafianteNome, tipo)
    
    // Registra partida em andamento para controle de pausa (apenas se for ranqueada)
    if (resultado.partida?.id && tipo === 'ranqueado') {
      registrarPartidaEmAndamento(
        resultado.partida.id,
        auth.userId,
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
