// Sistema de jogadores online e chat

interface JogadorOnline {
  userId: string
  nome: string
  sobrenome: string
  login: string
  tecnicoOverall: number
  timestamp: number
  clube?: {
    nome: string
    sigla: string
  }
}

interface MensagemChat {
  id: string
  userId: string
  nome: string
  login: string
  mensagem: string
  timestamp: number
}

// Jogadores online (em memória)
const jogadoresOnline: Map<string, JogadorOnline> = new Map()

// Mensagens do chat (últimas 100)
const mensagensChat: MensagemChat[] = []

// Partidas de desafio aguardando o desafiado aceitar/receber (userId do desafiado -> dados da partida)
const partidasDesafioParaJogador: Map<string, { partida: any; desafianteNome: string; tipo: string }> = new Map()

// Armazena partida de desafio para o jogador desafiado
export function armazenarPartidaDesafio(desafiadoId: string, partida: any, desafianteNome: string, tipo: string): void {
  partidasDesafioParaJogador.set(desafiadoId, { partida, desafianteNome, tipo })
}

// Obtém e remove partida de desafio para o jogador (consome - só retorna uma vez)
export function obterPartidaDesafio(userId: string): { partida: any; desafianteNome: string; tipo: string } | null {
  const dados = partidasDesafioParaJogador.get(userId)
  if (dados) {
    partidasDesafioParaJogador.delete(userId)
    return dados
  }
  return null
}

// Adiciona jogador online
export function adicionarJogadorOnline(jogador: JogadorOnline): void {
  jogadoresOnline.set(jogador.userId, {
    ...jogador,
    timestamp: Date.now()
  })
}

// Remove jogador online
export function removerJogadorOnline(userId: string): void {
  jogadoresOnline.delete(userId)
}

// Verifica se jogador está online
export function estaOnline(userId: string): boolean {
  return jogadoresOnline.has(userId)
}

// Obtém lista de jogadores online
export function obterJogadoresOnline(): JogadorOnline[] {
  return Array.from(jogadoresOnline.values())
}

// Adiciona mensagem ao chat
export function adicionarMensagemChat(
  userId: string,
  nome: string,
  login: string,
  mensagem: string
): MensagemChat {
  const novaMensagem: MensagemChat = {
    id: `${Date.now()}-${userId}`,
    userId,
    nome,
    login,
    mensagem,
    timestamp: Date.now()
  }

  mensagensChat.push(novaMensagem)

  // Mantém apenas as últimas 100 mensagens
  if (mensagensChat.length > 100) {
    mensagensChat.shift()
  }

  return novaMensagem
}

// Obtém mensagens do chat
export function obterMensagensChat(): MensagemChat[] {
  return mensagensChat
}

// Limpa jogadores offline (mais de 5 minutos sem atualizar)
export function limparJogadoresOffline(): void {
  const agora = Date.now()
  const cincoMinutos = 5 * 60 * 1000

  for (const [userId, jogador] of jogadoresOnline.entries()) {
    if (agora - jogador.timestamp > cincoMinutos) {
      jogadoresOnline.delete(userId)
    }
  }
}

// Limpa periodicamente
setInterval(() => {
  limparJogadoresOffline()
}, 60000) // A cada 1 minuto
