// Sistema de matchmaking para partidas ranqueadas

interface JogadorNaFila {
  userId: string
  tecnicoOverall: number
  timestamp: number
  partidaId?: string // Quando encontrar oponente
}

// Fila de jogadores procurando partida (em memória)
// Em produção, usar Redis ou banco de dados
const filaMatchmaking: Map<string, JogadorNaFila> = new Map()

// Partidas encontradas (aguardando ambos os jogadores buscarem)
interface PartidaEncontrada {
  partidaId: string
  jogador1Id: string
  jogador2Id: string
  dadosPartida: any
  timestamp: number
}

const partidasEncontradas: Map<string, PartidaEncontrada> = new Map() // key: partidaId
const partidasPorJogador: Map<string, string> = new Map() // key: userId, value: partidaId

// Partidas em andamento (para sincronização de pausa)
interface PartidaEmAndamento {
  partidaId: string
  jogador1Id: string
  jogador2Id: string
  pausasJogador1: number
  pausasJogador2: number
  pausado: boolean
  pausadoPor?: string // userId que pausou
  noIntervalo: boolean
  jogador1ProntoIntervalo: boolean
  jogador2ProntoIntervalo: boolean
}

const partidasEmAndamento: Map<string, PartidaEmAndamento> = new Map()

// Adiciona jogador na fila
export function entrarNaFila(userId: string, tecnicoOverall: number): void {
  filaMatchmaking.set(userId, {
    userId,
    tecnicoOverall,
    timestamp: Date.now()
  })
}

// Remove jogador da fila
export function sairDaFila(userId: string): void {
  filaMatchmaking.delete(userId)
}

// Verifica se jogador está na fila
export function estaNaFila(userId: string): boolean {
  return filaMatchmaking.has(userId)
}

// Tenta encontrar um oponente
export function encontrarOponente(userId: string): JogadorNaFila | null {
  const jogador = filaMatchmaking.get(userId)
  if (!jogador) return null

  // Procura oponente com overall similar (±5 pontos)
  for (const [oponenteId, oponente] of filaMatchmaking.entries()) {
    if (oponenteId !== userId) {
      const diferencaOverall = Math.abs(oponente.tecnicoOverall - jogador.tecnicoOverall)
      if (diferencaOverall <= 5) {
        // Remove ambos da fila
        filaMatchmaking.delete(userId)
        filaMatchmaking.delete(oponenteId)
        
        return oponente
      }
    }
  }

  return null
}

// Verifica se o jogador tem uma partida encontrada aguardando
export function obterPartidaEncontrada(userId: string): PartidaEncontrada | null {
  const partidaId = partidasPorJogador.get(userId)
  if (!partidaId) return null
  
  const partida = partidasEncontradas.get(partidaId)
  return partida || null
}

// Armazena partida encontrada para ambos os jogadores
export function armazenarPartidaEncontrada(
  partidaId: string,
  jogador1Id: string,
  jogador2Id: string,
  dadosPartida: any
): void {
  const partida: PartidaEncontrada = {
    partidaId,
    jogador1Id,
    jogador2Id,
    dadosPartida,
    timestamp: Date.now()
  }
  
  partidasEncontradas.set(partidaId, partida)
  partidasPorJogador.set(jogador1Id, partidaId)
  partidasPorJogador.set(jogador2Id, partidaId)
}

// Remove partida encontrada (quando ambos já buscaram ou após timeout)
export function removerPartidaEncontrada(partidaId: string): void {
  const partida = partidasEncontradas.get(partidaId)
  if (partida) {
    partidasPorJogador.delete(partida.jogador1Id)
    partidasPorJogador.delete(partida.jogador2Id)
    partidasEncontradas.delete(partidaId)
  }
}

// Limpa partidas encontradas antigas (mais de 10 minutos)
export function limparPartidasEncontradasAntigas(): void {
  const agora = Date.now()
  const dezMinutos = 10 * 60 * 1000

  for (const [partidaId, partida] of partidasEncontradas.entries()) {
    if (agora - partida.timestamp > dezMinutos) {
      removerPartidaEncontrada(partidaId)
    }
  }
}

// Limpa jogadores antigos da fila (mais de 5 minutos)
export function limparFilaAntiga(): void {
  const agora = Date.now()
  const cincoMinutos = 5 * 60 * 1000

  for (const [userId, jogador] of filaMatchmaking.entries()) {
    if (agora - jogador.timestamp > cincoMinutos) {
      filaMatchmaking.delete(userId)
    }
  }
}

// Registra partida em andamento
export function registrarPartidaEmAndamento(
  partidaId: string,
  jogador1Id: string,
  jogador2Id: string
): void {
  partidasEmAndamento.set(partidaId, {
    partidaId,
    jogador1Id,
    jogador2Id,
    pausasJogador1: 0,
    pausasJogador2: 0,
    pausado: false,
    noIntervalo: false,
    jogador1ProntoIntervalo: false,
    jogador2ProntoIntervalo: false
  })
}

// Pausa partida
export function pausarPartida(partidaId: string, userId: string): { sucesso: boolean; pausado: boolean; pausasRestantes: number } {
  const partida = partidasEmAndamento.get(partidaId)
  if (!partida) {
    return { sucesso: false, pausado: false, pausasRestantes: 0 }
  }

  const isJogador1 = partida.jogador1Id === userId
  const isJogador2 = partida.jogador2Id === userId

  if (!isJogador1 && !isJogador2) {
    return { sucesso: false, pausado: false, pausasRestantes: 0 }
  }

  // Verifica se ainda tem pausas disponíveis
  const pausasUsadas = isJogador1 ? partida.pausasJogador1 : partida.pausasJogador2
  if (pausasUsadas >= 3) {
    return { sucesso: false, pausado: partida.pausado, pausasRestantes: 0 }
  }

  // Pausa a partida
  partida.pausado = true
  partida.pausadoPor = userId

  // Incrementa contador de pausas
  if (isJogador1) {
    partida.pausasJogador1++
  } else {
    partida.pausasJogador2++
  }

  return {
    sucesso: true,
    pausado: true,
    pausasRestantes: 3 - (isJogador1 ? partida.pausasJogador1 : partida.pausasJogador2)
  }
}

// Despausa partida
export function despausarPartida(partidaId: string, userId: string): { sucesso: boolean; pausado: boolean } {
  const partida = partidasEmAndamento.get(partidaId)
  if (!partida) {
    return { sucesso: false, pausado: false }
  }

  if (partida.pausadoPor !== userId && partida.pausadoPor) {
    // Só quem pausou pode despausar, ou se ninguém pausou
    return { sucesso: false, pausado: partida.pausado }
  }

  partida.pausado = false
  partida.pausadoPor = undefined

  return { sucesso: true, pausado: false }
}

// Obtém status da partida
export function obterStatusPartida(partidaId: string, userId: string): {
  pausado: boolean
  pausasRestantes: number
  pausadoPor?: string
  noIntervalo?: boolean
} | null {
  const partida = partidasEmAndamento.get(partidaId)
  if (!partida) return null

  const isJogador1 = partida.jogador1Id === userId
  const isJogador2 = partida.jogador2Id === userId

  if (!isJogador1 && !isJogador2) return null

  const pausasUsadas = isJogador1 ? partida.pausasJogador1 : partida.pausasJogador2

  return {
    pausado: partida.pausado,
    pausasRestantes: 3 - pausasUsadas,
    pausadoPor: partida.pausadoPor,
    noIntervalo: partida.noIntervalo
  }
}

// Remove partida quando termina
export function removerPartidaEmAndamento(partidaId: string): void {
  partidasEmAndamento.delete(partidaId)
}

// Continua segundo tempo (sincronizado)
export function continuarSegundoTempo(partidaId: string, userId: string): { sucesso: boolean; noIntervalo: boolean } {
  const partida = partidasEmAndamento.get(partidaId)
  if (!partida) {
    return { sucesso: false, noIntervalo: false }
  }

  const isJogador1 = partida.jogador1Id === userId
  const isJogador2 = partida.jogador2Id === userId

  if (!isJogador1 && !isJogador2) {
    return { sucesso: false, noIntervalo: partida.noIntervalo }
  }

  // Marca que o jogador está pronto para continuar
  if (isJogador1) {
    partida.jogador1ProntoIntervalo = true
  } else {
    partida.jogador2ProntoIntervalo = true
  }

  // Se ambos estiverem prontos, continua o segundo tempo
  if (partida.jogador1ProntoIntervalo && partida.jogador2ProntoIntervalo) {
    partida.noIntervalo = false
    partida.jogador1ProntoIntervalo = false
    partida.jogador2ProntoIntervalo = false
  }

  return { sucesso: true, noIntervalo: partida.noIntervalo }
}

// Marca que está no intervalo
export function marcarIntervalo(partidaId: string): void {
  const partida = partidasEmAndamento.get(partidaId)
  if (partida) {
    partida.noIntervalo = true
    partida.jogador1ProntoIntervalo = false
    partida.jogador2ProntoIntervalo = false
  }
}

// Limpa fila periodicamente (chamar de um cron job ou timer)
setInterval(() => {
  limparFilaAntiga()
  limparPartidasEncontradasAntigas()
}, 60000) // A cada 1 minuto
