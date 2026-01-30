import { prisma } from './prisma'
import { atualizarOverallTecnico } from './tecnico'

// Simula uma partida contra bot
export async function simularPartidaBot(userId: string) {
  // Obtém o time do jogador
  const jogadores = await prisma.jogador.findMany({
    where: { userId },
    orderBy: { overall: 'desc' },
    take: 11
  })

  if (jogadores.length < 11) {
    throw new Error('Você precisa de pelo menos 11 jogadores para jogar')
  }

  // Calcula o overall médio do time
  const overallMedio = jogadores.reduce((sum, j) => sum + j.overall, 0) / jogadores.length

  // Obtém o overall do técnico
  const tecnicoOverall = await prisma.user.findUnique({
    where: { id: userId },
    select: { tecnicoOverall: true }
  }) || { tecnicoOverall: 50 }

  // Força do time = média dos jogadores + bônus do técnico
  const forcaTime = overallMedio + (tecnicoOverall.tecnicoOverall / 10)

  // Bot tem força aleatória entre 60-80
  const forcaBot = 60 + Math.random() * 20

  // Calcula resultado (simplificado)
  const diferenca = forcaTime - forcaBot
  const gols1 = Math.max(0, Math.floor(2 + diferenca / 10 + (Math.random() * 2 - 1)))
  const gols2 = Math.max(0, Math.floor(2 - diferenca / 10 + (Math.random() * 2 - 1)))

  const venceu = gols1 > gols2

  // Salva a partida
  const partida = await prisma.partida.create({
    data: {
      jogador1Id: userId,
      tipo: 'bot',
      resultado1: gols1,
      resultado2: gols2,
      vencedorId: venceu ? userId : null
    }
  })

  // Atualiza overall do técnico
  await atualizarOverallTecnico(userId, venceu)

  return {
    partida,
    resultado: `${gols1} x ${gols2}`,
    venceu
  }
}

// Inicia uma partida ranqueada (busca oponente)
export async function buscarOponente(userId: string) {
  // Busca um oponente com overall de técnico similar
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tecnicoOverall: true }
  })

  if (!user) {
    throw new Error('Usuário não encontrado')
  }

  // Busca oponente com overall entre -5 e +5 do seu
  const oponente = await prisma.user.findFirst({
    where: {
      id: { not: userId },
      tecnicoOverall: {
        gte: user.tecnicoOverall - 5,
        lte: user.tecnicoOverall + 5
      }
    }
  })

  return oponente
}

// Simula partida ranqueada
export async function simularPartidaRanqueada(userId1: string, userId2: string) {
  // Time 1
  const jogadores1 = await prisma.jogador.findMany({
    where: { userId: userId1 },
    orderBy: { overall: 'desc' },
    take: 11
  })

  if (jogadores1.length < 11) {
    throw new Error('Você precisa de pelo menos 11 jogadores')
  }

  // Time 2
  const jogadores2 = await prisma.jogador.findMany({
    where: { userId: userId2 },
    orderBy: { overall: 'desc' },
    take: 11
  })

  if (jogadores2.length < 11) {
    throw new Error('Oponente precisa de pelo menos 11 jogadores')
  }

  // Calcula forças
  const overallMedio1 = jogadores1.reduce((sum, j) => sum + j.overall, 0) / jogadores1.length
  const overallMedio2 = jogadores2.reduce((sum, j) => sum + j.overall, 0) / jogadores2.length

  const user1 = await prisma.user.findUnique({
    where: { id: userId1 },
    select: { tecnicoOverall: true }
  }) || { tecnicoOverall: 50 }

  const user2 = await prisma.user.findUnique({
    where: { id: userId2 },
    select: { tecnicoOverall: true }
  }) || { tecnicoOverall: 50 }

  const forcaTime1 = overallMedio1 + (user1.tecnicoOverall / 10)
  const forcaTime2 = overallMedio2 + (user2.tecnicoOverall / 10)

  // Calcula resultado
  const diferenca = forcaTime1 - forcaTime2
  const gols1 = Math.max(0, Math.floor(2 + diferenca / 10 + (Math.random() * 2 - 1)))
  const gols2 = Math.max(0, Math.floor(2 - diferenca / 10 + (Math.random() * 2 - 1)))

  const vencedorId = gols1 > gols2 ? userId1 : (gols2 > gols1 ? userId2 : null)

  // Salva a partida
  const partida = await prisma.partida.create({
    data: {
      jogador1Id: userId1,
      jogador2Id: userId2,
      tipo: 'ranqueado',
      resultado1: gols1,
      resultado2: gols2,
      vencedorId
    }
  })

  // Atualiza overall dos técnicos
  await atualizarOverallTecnico(userId1, gols1 > gols2)
  await atualizarOverallTecnico(userId2, gols2 > gols1)

  return {
    partida,
    resultado: `${gols1} x ${gols2}`,
    vencedorId
  }
}
