import { prisma } from '@/lib/prisma'
import { obterJogadoresEscalados } from '@/lib/clube'
import { atualizarOverallTecnico } from '@/lib/tecnico'
import { calcularForcaTime, calcularProbabilidadeGol, calcularProbabilidadeDefesa } from '@/lib/forca-time'

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

  // Calcula força do time 1 usando o novo sistema
  const forcaTime1Obj = calcularForcaTime(titulares1.map(j => ({
    nome: j.nome,
    posicao: j.posicao,
    posicaoCompleta: j.posicaoCompleta,
    overall: j.overall
  })))
  const user1 = await prisma.user.findUnique({
    where: { id: userId1 },
    select: { tecnicoOverall: true }
  }) || { tecnicoOverall: 50 }
  
  // Ajusta força total com bônus do técnico (até 10% de bônus)
  const bonusTecnico1 = (user1.tecnicoOverall / 100) * 10
  const forcaTime1 = Math.min(100, forcaTime1Obj.forcaTotal + bonusTecnico1)

  let clube2: any = null
  let titulares2: any[] = []
  let forcaTime2 = 0

  let forcaTime2Obj: any = null
  
  if (tipo === 'bot') {
    // Bot tem força aleatória
    forcaTime2 = 60 + Math.random() * 20
    titulares2 = Array(11).fill(null).map(() => ({
      nome: `Bot Player ${Math.floor(Math.random() * 100)}`,
      overall: Math.floor(60 + Math.random() * 20),
      posicao: 'Jogador',
      posicaoCompleta: 'Jogador'
    }))
    
    // Bot tem forças balanceadas
    forcaTime2Obj = {
      forcaAtaque: 50 + Math.random() * 20,
      forcaDefesa: 50 + Math.random() * 20,
      forcaGoleiro: 50 + Math.random() * 20,
      forcaMeio: 50 + Math.random() * 20
    }
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

    // Calcula força do time 2 usando o novo sistema
    const forcaTime2Obj = calcularForcaTime(titulares2.map((j: any) => ({
      nome: j.nome,
      posicao: j.posicao,
      posicaoCompleta: j.posicaoCompleta,
      overall: j.overall
    })))
    const user2 = await prisma.user.findUnique({
      where: { id: userId2 },
      select: { tecnicoOverall: true }
    }) || { tecnicoOverall: 50 }
    
    // Ajusta força total com bônus do técnico (até 10% de bônus)
    const bonusTecnico2 = (user2.tecnicoOverall / 100) * 10
    forcaTime2 = Math.min(100, forcaTime2Obj.forcaTotal + bonusTecnico2)
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
  
  // Ajusta forças por setor com penalidades
  const forcaAtaque1Ajustada = forcaTime1Obj.forcaAtaque * (1 - penalidadeTime1)
  const forcaDefesa1Ajustada = forcaTime1Obj.forcaDefesa * (1 - penalidadeTime1)
  const forcaGoleiro1Ajustada = forcaTime1Obj.forcaGoleiro * (1 - penalidadeTime1)
  
  const forcaAtaque2Ajustada = forcaTime2Obj.forcaAtaque * (1 - penalidadeTime2)
  const forcaDefesa2Ajustada = forcaTime2Obj.forcaDefesa * (1 - penalidadeTime2)
  const forcaGoleiro2Ajustada = forcaTime2Obj.forcaGoleiro * (1 - penalidadeTime2)

  // Simula gols baseado em probabilidades de ataque vs defesa
  let gols1 = 0
  let gols2 = 0
  
  // Para cada minuto, calcula chance de gol baseado nas forças
  for (let minuto = 1; minuto <= 90; minuto++) {
    // Chance de gol do time 1 (ataque time1 vs defesa time2)
    const probGol1 = calcularProbabilidadeGol(
      forcaAtaque1Ajustada,
      forcaDefesa2Ajustada,
      forcaGoleiro2Ajustada
    )
    
    // Chance de defesa do time 2
    const probDefesa2 = calcularProbabilidadeDefesa(
      forcaGoleiro2Ajustada,
      forcaAtaque1Ajustada
    )
    
    // Probabilidade final = probGol - (probDefesa * fator)
    const probFinal1 = Math.max(0.5, probGol1 - (probDefesa2 * 0.2))
    
    if (Math.random() * 100 < probFinal1) {
      const minutoDisponivel = obterMinutoDisponivel()
      if (minutoDisponivel !== null) {
        const atacantes = titulares1.filter(j => 
          j.posicao === 'Atacante' || j.posicaoCompleta.includes('Atacante') || 
          j.posicaoCompleta.includes('Ponta') || j.posicaoCompleta.includes('Centroavante')
        )
        const jogador = atacantes.length > 0 
          ? atacantes[Math.floor(Math.random() * atacantes.length)]
          : titulares1[Math.floor(Math.random() * titulares1.length)]
        
        eventos.push({
          minuto: minutoDisponivel,
          tipo: 'gol',
          jogador: jogador.nome,
          time: 1
        })
        gols1++
      }
    }
    
    // Chance de gol do time 2 (ataque time2 vs defesa time1)
    const probGol2 = calcularProbabilidadeGol(
      forcaAtaque2Ajustada,
      forcaDefesa1Ajustada,
      forcaGoleiro1Ajustada
    )
    
    // Chance de defesa do time 1
    const probDefesa1 = calcularProbabilidadeDefesa(
      forcaGoleiro1Ajustada,
      forcaAtaque2Ajustada
    )
    
    // Probabilidade final = probGol - (probDefesa * fator)
    const probFinal2 = Math.max(0.5, probGol2 - (probDefesa1 * 0.2))
    
    if (Math.random() * 100 < probFinal2) {
      const minutoDisponivel = obterMinutoDisponivel()
      if (minutoDisponivel !== null) {
        const atacantes = tipo === 'bot' 
          ? titulares2 
          : titulares2.filter((j: any) => 
              j.posicao === 'Atacante' || j.posicaoCompleta.includes('Atacante') || 
              j.posicaoCompleta.includes('Ponta') || j.posicaoCompleta.includes('Centroavante')
            )
        const jogador = atacantes.length > 0 
          ? atacantes[Math.floor(Math.random() * atacantes.length)]
          : titulares2[Math.floor(Math.random() * titulares2.length)]
        
        eventos.push({
          minuto: minutoDisponivel,
          tipo: 'gol',
          jogador: jogador.nome,
          time: 2
        })
        gols2++
      }
    }
  }
  
  // Calcula diferenca para estatísticas
  const forcaTime1Ajustada = forcaTime1 * (1 - penalidadeTime1)
  const forcaTime2Ajustada = forcaTime2 * (1 - penalidadeTime2)
  const diferenca = forcaTime1Ajustada - forcaTime2Ajustada

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
