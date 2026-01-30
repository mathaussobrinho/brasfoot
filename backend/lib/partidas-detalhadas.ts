import { prisma } from '@/lib/prisma'
import { obterJogadoresEscalados } from '@/lib/clube'
import { atualizarOverallTecnico } from '@/lib/tecnico'

interface EventoPartida {
  minuto: number
  tipo: 'gol' | 'cartao-amarelo' | 'cartao-vermelho' | 'substituicao' | 'chute' | 'defesa' | 'falta' | 'escanteio' | 'lateral'
  jogador: string
  time: 1 | 2
  detalhes?: string
}

interface EstatisticasPartida {
  posseBola: { time1: number, time2: number }
  finalizacoes: { time1: number, time2: number }
  roubadasBola: { time1: number, time2: number }
  passesErrados: { time1: number, time2: number }
  faltas: { time1: number, time2: number }
}

// Simula uma partida detalhada estilo Brasfoot
export async function simularPartidaDetalhada(
  userId1: string,
  userId2: string | null,
  tipo: 'bot' | 'ranqueado'
) {
  // Obtém os clubes
  const clube1 = await prisma.clube.findUnique({
    where: { userId: userId1 }
  })

  if (!clube1) {
    throw new Error('Você precisa criar um clube primeiro!')
  }

  const escalacao1 = await obterJogadoresEscalados(clube1.id)
  const titulares1 = escalacao1.titulares.slice(0, 11)

  if (titulares1.length < 11) {
    throw new Error('Você precisa escalar pelo menos 11 jogadores!')
  }

  // Calcula força do time 1
  const overallMedio1 = titulares1.reduce((sum, j) => sum + j.overall, 0) / titulares1.length
  const user1 = await prisma.user.findUnique({
    where: { id: userId1 },
    select: { tecnicoOverall: true }
  }) || { tecnicoOverall: 50 }
  const forcaTime1 = overallMedio1 + (user1.tecnicoOverall / 10)

  let clube2: any = null
  let titulares2: any[] = []
  let forcaTime2 = 0

  if (tipo === 'bot') {
    // Bot tem força aleatória
    forcaTime2 = 60 + Math.random() * 20
    titulares2 = Array(11).fill(null).map(() => ({
      nome: `Bot Player ${Math.floor(Math.random() * 100)}`,
      overall: Math.floor(60 + Math.random() * 20),
      posicao: 'Jogador',
      posicaoCompleta: 'Jogador'
    }))
  } else {
    // Partida ranqueada
    if (!userId2) {
      throw new Error('Oponente não encontrado')
    }

    clube2 = await prisma.clube.findUnique({
      where: { userId: userId2 }
    })

    if (!clube2) {
      throw new Error('Oponente não tem clube criado')
    }

    const escalacao2 = await obterJogadoresEscalados(clube2.id)
    titulares2 = escalacao2.titulares.slice(0, 11)

    if (titulares2.length < 11) {
      throw new Error('Oponente não tem 11 jogadores escalados')
    }

    const overallMedio2 = titulares2.reduce((sum: number, j: any) => sum + j.overall, 0) / titulares2.length
    const user2 = await prisma.user.findUnique({
      where: { id: userId2 },
      select: { tecnicoOverall: true }
    }) || { tecnicoOverall: 50 }
    forcaTime2 = overallMedio2 + (user2.tecnicoOverall / 10)
  }

  // Gera eventos da partida - apenas 1 evento por minuto
  const eventos: EventoPartida[] = []
  
  // Cria uma lista de minutos disponíveis (1-90)
  const minutosDisponiveis = Array.from({ length: 90 }, (_, i) => i + 1)
  
  // Função para obter um minuto disponível e removê-lo da lista
  const obterMinutoDisponivel = (): number | null => {
    if (minutosDisponiveis.length === 0) return null
    const index = Math.floor(Math.random() * minutosDisponiveis.length)
    const minuto = minutosDisponiveis[index]
    minutosDisponiveis.splice(index, 1) // Remove o minuto da lista
    return minuto
  }

  // Contadores de cartões vermelhos por time (para calcular força dinâmica)
  let cartoesVermelhosTime1 = 0
  let cartoesVermelhosTime2 = 0
  
  // Cartões (aleatórios) - máximo 4
  const numCartoes = Math.min(Math.floor(Math.random() * 4), minutosDisponiveis.length)
  for (let i = 0; i < numCartoes; i++) {
    const minuto = obterMinutoDisponivel()
    if (minuto === null) break
    const timeAleatorio = Math.random() > 0.5 ? 1 : 2
    const jogadores = timeAleatorio === 1 ? titulares1 : titulares2
    const isVermelho = Math.random() > 0.8
    
    if (isVermelho) {
      if (timeAleatorio === 1) {
        cartoesVermelhosTime1++
      } else {
        cartoesVermelhosTime2++
      }
    }
    
    eventos.push({
      minuto,
      tipo: isVermelho ? 'cartao-vermelho' : 'cartao-amarelo',
      jogador: jogadores[Math.floor(Math.random() * jogadores.length)].nome,
      time: timeAleatorio as 1 | 2
    })
  }

  // Calcula força ajustada considerando cartões vermelhos
  // Cada cartão vermelho reduz a força do time em 5% (time fica com menos jogadores)
  const penalidadeTime1 = cartoesVermelhosTime1 * 0.05
  const penalidadeTime2 = cartoesVermelhosTime2 * 0.05
  const forcaTime1Ajustada = forcaTime1 * (1 - penalidadeTime1)
  const forcaTime2Ajustada = forcaTime2 * (1 - penalidadeTime2)

  // Simula a partida com forças ajustadas
  const diferenca = forcaTime1Ajustada - forcaTime2Ajustada
  const gols1 = Math.max(0, Math.floor(2 + diferenca / 10 + (Math.random() * 3 - 1.5)))
  const gols2 = Math.max(0, Math.floor(2 - diferenca / 10 + (Math.random() * 3 - 1.5)))
  
  // Gols do time 1
  for (let i = 0; i < gols1; i++) {
    const minuto = obterMinutoDisponivel()
    if (minuto === null) break
    const jogador = titulares1[Math.floor(Math.random() * titulares1.length)]
    eventos.push({
      minuto,
      tipo: 'gol',
      jogador: jogador.nome,
      time: 1
    })
  }

  // Gols do time 2
  for (let i = 0; i < gols2; i++) {
    const minuto = obterMinutoDisponivel()
    if (minuto === null) break
    const jogador = titulares2[Math.floor(Math.random() * titulares2.length)]
    eventos.push({
      minuto,
      tipo: 'gol',
      jogador: jogador.nome,
      time: 2
    })
  }

  // Chutes, defesas, faltas, escanteios, laterais (eventos comuns)
  // Limita a quantidade para não ultrapassar minutos disponíveis
  const numEventosComuns = Math.min(Math.floor(Math.random() * 15) + 10, minutosDisponiveis.length)
  for (let i = 0; i < numEventosComuns; i++) {
    const minuto = obterMinutoDisponivel()
    if (minuto === null) break
    const timeAleatorio = Math.random() > 0.5 ? 1 : 2
    const jogadores = timeAleatorio === 1 ? titulares1 : titulares2
    const tiposEvento: Array<'chute' | 'defesa' | 'falta' | 'escanteio' | 'lateral'> = ['chute', 'defesa', 'falta', 'escanteio', 'lateral']
    const tipoAleatorio = tiposEvento[Math.floor(Math.random() * tiposEvento.length)]
    
    eventos.push({
      minuto,
      tipo: tipoAleatorio,
      jogador: jogadores[Math.floor(Math.random() * jogadores.length)].nome,
      time: timeAleatorio as 1 | 2
    })
  }

  // Ordena eventos por minuto
  eventos.sort((a, b) => a.minuto - b.minuto)

  // Gera estatísticas
  const estatisticas: EstatisticasPartida = {
    posseBola: {
      time1: 50 + Math.floor((diferenca / 10) * 10),
      time2: 50 - Math.floor((diferenca / 10) * 10)
    },
    finalizacoes: {
      time1: 8 + Math.floor((diferenca / 10) * 5) + Math.floor(Math.random() * 10),
      time2: 8 - Math.floor((diferenca / 10) * 5) + Math.floor(Math.random() * 10)
    },
    roubadasBola: {
      time1: 10 + Math.floor(Math.random() * 10),
      time2: 10 + Math.floor(Math.random() * 10)
    },
    passesErrados: {
      time1: 5 + Math.floor(Math.random() * 10),
      time2: 5 + Math.floor(Math.random() * 10)
    },
    faltas: {
      time1: 10 + Math.floor(Math.random() * 10),
      time2: 10 + Math.floor(Math.random() * 10)
    }
  }

  // Gera notas dos jogadores (simplificado)
  const notasJogadores1 = titulares1.map(j => ({
    jogador: j.nome,
    posicao: j.posicaoCompleta || j.posicao,
    nota: (6 + (j.overall / 20) + (Math.random() * 2 - 1)).toFixed(1)
  }))

  const notasJogadores2 = titulares2.map((j: any) => ({
    jogador: j.nome,
    posicao: j.posicaoCompleta || j.posicao,
    nota: (6 + (j.overall / 20) + (Math.random() * 2 - 1)).toFixed(1)
  }))

  const vencedorId = gols1 > gols2 ? userId1 : (gols2 > gols1 ? userId2 : null)

  // Salva a partida
  const detalhesPartida = JSON.stringify({
    eventos,
    estatisticas,
    notasJogadores1,
    notasJogadores2,
    clube1: {
      nome: clube1.nome,
      sigla: clube1.sigla,
      escudo: clube1.escudo
    },
    clube2: clube2 ? {
      nome: clube2.nome,
      sigla: clube2.sigla,
      escudo: clube2.escudo
    } : { nome: 'Bot', sigla: 'BOT', escudo: 'flamengo' }
  })

  const partida = await prisma.partida.create({
    data: {
      jogador1Id: userId1,
      jogador2Id: userId2,
      tipo,
      resultado1: gols1,
      resultado2: gols2,
      vencedorId,
      detalhes: detalhesPartida
    }
  })

  // Atualiza overall dos técnicos apenas em partidas ranqueadas
  if (tipo === 'ranqueado') {
    await atualizarOverallTecnico(userId1, gols1 > gols2)
    if (userId2) {
      await atualizarOverallTecnico(userId2, gols2 > gols1)
    }
  }

  return {
    partida,
    resultado: `${gols1} x ${gols2}`,
    vencedorId,
    detalhes: JSON.parse(detalhesPartida)
  }
}
