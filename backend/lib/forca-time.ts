// Sistema de cálculo de força do time baseado em posições e overalls

interface JogadorEscalado {
  nome: string
  posicao: string
  posicaoCompleta: string
  overall: number
}

/** Jogador escalado com a posição do slot (onde foi colocado no campo) */
export interface JogadorComSlot {
  nome: string
  posicao: string
  posicaoCompleta: string
  overall: number
  slotIndex: number
  posicaoEsperada: string
}

// Compatibilidade: posição natural do jogador vs posição do slot no campo
const POSICOES_RESTRITIVAS = ['goleiro', 'lateral d', 'lateral e', 'zagueiro']
const COMPATIBILIDADE: Record<string, string[]> = {
  'volante': ['volante', 'meia'],
  'meia': ['meia', 'meia ofensivo', 'volante'],
  'meia ofensivo': ['meia ofensivo', 'meia', 'atacante'],
  'atacante': ['atacante', 'meia ofensivo']
}

function normalizarPosicao(p: string): string {
  return (p || '').toLowerCase().trim()
}

/** Verifica se o jogador pode atuar na posição esperada (ex.: Ronaldinho não pode ser Goleiro) */
function fatorCompatibilidade(posicaoJogador: string, posicaoEsperada: string): number {
  const j = normalizarPosicao(posicaoJogador)
  const e = normalizarPosicao(posicaoEsperada)
  if (j === e) return 1.0
  if (POSICOES_RESTRITIVAS.includes(e)) {
    // Goleiro, Lateral D/E, Zagueiro: só conta 100% se for a posição certa
    if (j.includes(e) || e.includes(j)) return 0.85
    return 0.35 // Jogador em posição incompatível (ex.: atacante no gol)
  }
  const comp = COMPATIBILIDADE[e] || [e]
  if (comp.some(c => j.includes(c) || c.includes(j))) return 0.8
  return 0.35
}

interface ForcaTime {
  forcaTotal: number // 1-100
  forcaAtaque: number
  forcaMeio: number
  forcaDefesa: number
  forcaGoleiro: number
  detalhes: {
    ataque: { media: number; quantidade: number }
    meio: { media: number; quantidade: number }
    defesa: { media: number; quantidade: number }
    goleiro: { media: number; quantidade: number }
  }
}

// Calcula a força do time baseado nas posições dos jogadores
export function calcularForcaTime(titulares: JogadorEscalado[]): ForcaTime {
  if (titulares.length < 11) {
    throw new Error('Precisa de pelo menos 11 jogadores')
  }

  // Separa jogadores por posição
  const goleiros = titulares.filter(j => 
    j.posicao === 'Goleiro' || j.posicaoCompleta === 'Goleiro'
  )
  
  const defensores = titulares.filter(j => 
    j.posicao === 'Zagueiro' || 
    j.posicao === 'Lateral' ||
    j.posicaoCompleta.includes('Zagueiro') ||
    j.posicaoCompleta.includes('Lateral')
  )
  
  const meioCampistas = titulares.filter(j => 
    j.posicao === 'Volante' || 
    j.posicao === 'Meia' ||
    j.posicaoCompleta.includes('Volante') ||
    j.posicaoCompleta.includes('Meia')
  )
  
  const atacantes = titulares.filter(j => 
    j.posicao === 'Atacante' ||
    j.posicaoCompleta.includes('Atacante') ||
    j.posicaoCompleta.includes('Ponta') ||
    j.posicaoCompleta.includes('Centroavante')
  )

  // Calcula médias por setor
  const mediaGoleiro = goleiros.length > 0
    ? goleiros.reduce((sum, j) => sum + j.overall, 0) / goleiros.length
    : 50

  const mediaDefesa = defensores.length > 0
    ? defensores.reduce((sum, j) => sum + j.overall, 0) / defensores.length
    : 50

  const mediaMeio = meioCampistas.length > 0
    ? meioCampistas.reduce((sum, j) => sum + j.overall, 0) / meioCampistas.length
    : 50

  const mediaAtaque = atacantes.length > 0
    ? atacantes.reduce((sum, j) => sum + j.overall, 0) / atacantes.length
    : 50

  // Calcula força de cada setor (normalizado para 0-100)
  // Goleiro: peso 15%
  const forcaGoleiro = Math.min(100, (mediaGoleiro / 99) * 100)
  
  // Defesa: peso 25% (importante para não tomar gols)
  const forcaDefesa = Math.min(100, (mediaDefesa / 99) * 100)
  
  // Meio: peso 30% (controle de jogo)
  const forcaMeio = Math.min(100, (mediaMeio / 99) * 100)
  
  // Ataque: peso 30% (fazer gols)
  const forcaAtaque = Math.min(100, (mediaAtaque / 99) * 100)

  // Força total ponderada
  const forcaTotal = Math.round(
    forcaGoleiro * 0.15 +
    forcaDefesa * 0.25 +
    forcaMeio * 0.30 +
    forcaAtaque * 0.30
  )

  return {
    forcaTotal: Math.max(1, Math.min(100, forcaTotal)),
    forcaAtaque: Math.round(forcaAtaque),
    forcaMeio: Math.round(forcaMeio),
    forcaDefesa: Math.round(forcaDefesa),
    forcaGoleiro: Math.round(forcaGoleiro),
    detalhes: {
      goleiro: { media: Math.round(mediaGoleiro), quantidade: goleiros.length },
      defesa: { media: Math.round(mediaDefesa), quantidade: defensores.length },
      meio: { media: Math.round(mediaMeio), quantidade: meioCampistas.length },
      ataque: { media: Math.round(mediaAtaque), quantidade: atacantes.length }
    }
  }
}

/** Calcula a força do time considerando compatibilidade de posição (jogador no lugar certo = 100%, errado = penalidade) */
export function calcularForcaTimeComCompatibilidade(titularesComSlot: JogadorComSlot[]): ForcaTime {
  if (titularesComSlot.length < 11) {
    throw new Error('Precisa de pelo menos 11 jogadores')
  }

  const comEfetivo = titularesComSlot.map(j => ({
    ...j,
    overallEfetivo: j.overall * fatorCompatibilidade(j.posicaoCompleta || j.posicao, j.posicaoEsperada)
  }))

  const setor = (pos: string): 'goleiro' | 'defesa' | 'meio' | 'ataque' => {
    const p = normalizarPosicao(pos)
    if (p.includes('goleiro')) return 'goleiro'
    if (p.includes('zagueiro') || p.includes('lateral')) return 'defesa'
    if (p.includes('volante') || p.includes('meia')) return 'meio'
    return 'ataque'
  }

  const goleiros = comEfetivo.filter(j => setor(j.posicaoEsperada) === 'goleiro')
  const defensores = comEfetivo.filter(j => setor(j.posicaoEsperada) === 'defesa')
  const meioCampistas = comEfetivo.filter(j => setor(j.posicaoEsperada) === 'meio')
  const atacantes = comEfetivo.filter(j => setor(j.posicaoEsperada) === 'ataque')

  const mediaGoleiro = goleiros.length > 0 ? goleiros.reduce((s, j) => s + j.overallEfetivo, 0) / goleiros.length : 50
  const mediaDefesa = defensores.length > 0 ? defensores.reduce((s, j) => s + j.overallEfetivo, 0) / defensores.length : 50
  const mediaMeio = meioCampistas.length > 0 ? meioCampistas.reduce((s, j) => s + j.overallEfetivo, 0) / meioCampistas.length : 50
  const mediaAtaque = atacantes.length > 0 ? atacantes.reduce((s, j) => s + j.overallEfetivo, 0) / atacantes.length : 50

  const forcaGoleiro = Math.min(100, (mediaGoleiro / 99) * 100)
  const forcaDefesa = Math.min(100, (mediaDefesa / 99) * 100)
  const forcaMeio = Math.min(100, (mediaMeio / 99) * 100)
  const forcaAtaque = Math.min(100, (mediaAtaque / 99) * 100)

  const forcaTotal = Math.round(
    forcaGoleiro * 0.15 + forcaDefesa * 0.25 + forcaMeio * 0.30 + forcaAtaque * 0.30
  )

  return {
    forcaTotal: Math.max(1, Math.min(100, forcaTotal)),
    forcaAtaque: Math.round(forcaAtaque),
    forcaMeio: Math.round(forcaMeio),
    forcaDefesa: Math.round(forcaDefesa),
    forcaGoleiro: Math.round(forcaGoleiro),
    detalhes: {
      goleiro: { media: Math.round(mediaGoleiro), quantidade: goleiros.length },
      defesa: { media: Math.round(mediaDefesa), quantidade: defensores.length },
      meio: { media: Math.round(mediaMeio), quantidade: meioCampistas.length },
      ataque: { media: Math.round(mediaAtaque), quantidade: atacantes.length }
    }
  }
}

// Calcula probabilidade de gol baseado nas forças
export function calcularProbabilidadeGol(
  forcaAtaqueAtacante: number,
  forcaDefesaDefensor: number,
  forcaGoleiroDefensor: number
): number {
  // Ataque forte vs defesa fraca = mais chance de gol
  // Ataque fraco vs defesa forte = menos chance de gol
  
  const diferencaAtaqueDefesa = forcaAtaqueAtacante - forcaDefesaDefensor
  const bonusGoleiro = forcaGoleiroDefensor * 0.3 // Goleiro bom reduz chance de gol
  
  // Base de 10% de chance, ajustada pela diferença
  let probabilidade = 10 + (diferencaAtaqueDefesa * 0.5) - (bonusGoleiro * 0.1)
  
  // Limita entre 1% e 50%
  return Math.max(1, Math.min(50, probabilidade))
}

// Calcula probabilidade de defesa (goleiro salvar)
export function calcularProbabilidadeDefesa(
  forcaGoleiro: number,
  forcaAtaqueOponente: number
): number {
  // Goleiro bom tem mais chance de defender
  const diferenca = forcaGoleiro - forcaAtaqueOponente
  
  // Base de 30% de chance de defesa
  let probabilidade = 30 + (diferenca * 0.4)
  
  // Limita entre 10% e 80%
  return Math.max(10, Math.min(80, probabilidade))
}
