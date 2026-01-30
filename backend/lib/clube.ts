import { prisma } from '@/lib/prisma'

// Escudos disponíveis (IDs dos escudos)
export const ESCUDOS_DISPONIVEIS = [
  'flamengo', 'palmeiras', 'corinthians', 'santos', 'fluminense',
  'atletico-mg', 'gremio', 'internacional', 'cruzeiro', 'sao-paulo',
  'botafogo', 'vasco', 'athletico-pr', 'bahia', 'fortaleza',
  'cuiaba', 'coritiba', 'goias', 'america-mg', 'bragantino'
]

// Formações disponíveis
export const FORMACOES_DISPONIVEIS = [
  '4-4-2',
  '4-3-3',
  '4-5-1',
  '3-5-2',
  '3-4-3',
  '5-3-2',
  '4-2-3-1',
  '4-1-4-1'
]

// Cria ou atualiza um clube
export async function criarOuAtualizarClube(
  userId: string,
  nome: string,
  sigla: string,
  escudo: string,
  formacao: string = '4-4-2'
) {
  if (!prisma || !prisma.clube) {
    throw new Error('Prisma client não está inicializado')
  }

  try {
    const clubeExistente = await prisma.clube.findUnique({
      where: { userId }
    })

    if (clubeExistente) {
      return await prisma.clube.update({
        where: { userId },
        data: {
          nome,
          sigla,
          escudo,
          formacao
        }
      })
    }

    return await prisma.clube.create({
      data: {
        userId,
        nome,
        sigla,
        escudo,
        formacao
      }
    })
  } catch (error: any) {
    console.error('Erro ao criar/atualizar clube:', error)
    throw new Error(`Erro ao salvar clube: ${error.message || 'Erro desconhecido'}`)
  }
}

// Obtém o clube do usuário
export async function obterClube(userId: string) {
  const clube = await prisma.clube.findUnique({
    where: { userId },
    include: {
      escalacao: {
        orderBy: [
          { isTitular: 'desc' },
          { posicao: 'asc' }
        ]
      }
    }
  })
  
  if (!clube) return null
  
  // Busca os jogadores da escalação
  const jogadoresIds = clube.escalacao.map(e => e.jogadorId)
  const jogadores = await prisma.jogador.findMany({
    where: { id: { in: jogadoresIds } }
  })
  
  return {
    ...clube,
    escalacao: clube.escalacao.map(e => ({
      ...e,
      jogador: jogadores.find(j => j.id === e.jogadorId)
    }))
  }
}

// Salva a escalação
export async function salvarEscalacao(clubeId: string, jogadoresIds: string[], isTitular: boolean[], posicoes?: (number | null)[]) {
  // Remove escalação anterior primeiro
  await prisma.escalacao.deleteMany({
    where: { clubeId }
  })

  // Cria nova escalação usando create individual para evitar problemas de constraint
  const escalacoes = []
  
  for (let index = 0; index < jogadoresIds.length; index++) {
    const jogadorId = jogadoresIds[index]
    const isTitularAtual = isTitular[index] || false
    
    // Para titulares, usa a posição do campo (0-indexed), para reservas usa index + 11
    let posicaoFinal: number
    
    if (isTitularAtual && posicoes && posicoes[index] !== null && posicoes[index] !== undefined) {
      posicaoFinal = posicoes[index]! + 1 // Converte de 0-indexed para 1-indexed
    } else if (isTitularAtual) {
      // Se é titular mas não tem posição definida, usa o índice
      posicaoFinal = index + 1
    } else {
      // Para reservas, começa do 12 em diante
      const numTitulares = isTitular.filter(t => t).length
      const indiceReserva = index - numTitulares
      posicaoFinal = numTitulares + indiceReserva + 1
    }
    
    try {
      const escalacao = await prisma.escalacao.create({
        data: {
          clubeId,
          jogadorId,
          posicao: posicaoFinal,
          isTitular: isTitularAtual
        }
      })
      escalacoes.push(escalacao)
    } catch (error: any) {
      console.error(`Erro ao criar escalação para jogador ${jogadorId}:`, error)
      // Continua com os outros jogadores mesmo se um falhar
    }
  }

  return escalacoes
}

// Obtém os jogadores escalados (titulares e reservas)
export async function obterJogadoresEscalados(clubeId: string) {
  const escalacao = await prisma.escalacao.findMany({
    where: { clubeId },
    orderBy: [
      { isTitular: 'desc' },
      { posicao: 'asc' }
    ]
  })

  // Busca os jogadores separadamente
  const jogadoresIds = escalacao.map(e => e.jogadorId)
  const jogadores = await prisma.jogador.findMany({
    where: { id: { in: jogadoresIds } }
  })

  // Mapeia os jogadores de volta para a escalação
  const escalacaoComJogadores = escalacao.map(e => ({
    ...e,
    jogador: jogadores.find(j => j.id === e.jogadorId)
  })).filter(e => e.jogador) // Remove se não encontrar o jogador

  return {
    titulares: escalacaoComJogadores.filter(e => e.isTitular).map(e => e.jogador!),
    reservas: escalacaoComJogadores.filter(e => !e.isTitular).map(e => e.jogador!)
  }
}
