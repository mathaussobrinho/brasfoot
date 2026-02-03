import { obterJogadorReal } from './jogadores-reais'

// Sistema de porcentagens do Gacha
export const GACHA_RATES = {
  normal: 59,      // 59%
  raro: 30,        // 30%
  epico: 8,        // 8%
  lendario: 2,     // 2%
  prismatico: 1    // 1%
} as const

export type Raridade = 'normal' | 'raro' | 'epico' | 'lendario' | 'prismatico'

// Nomes de jogadores por posição
const NOMES_JOGADORES = [
  'João', 'Pedro', 'Carlos', 'Lucas', 'Gabriel', 'Rafael', 'Felipe', 'Bruno',
  'André', 'Thiago', 'Marcos', 'Daniel', 'Ricardo', 'Fernando', 'Rodrigo',
  'Eduardo', 'Gustavo', 'Leonardo', 'Matheus', 'Vinicius', 'Diego', 'Paulo',
  'Roberto', 'Henrique', 'Fábio', 'Renato', 'Alexandre', 'Juliano', 'César',
  'Maurício', 'Sérgio', 'Antônio', 'José', 'Francisco', 'Luiz', 'Marcelo'
]

const SOBRENOMES_JOGADORES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
  'Pereira', 'Lima', 'Gomes', 'Ribeiro', 'Carvalho', 'Almeida', 'Lopes',
  'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Monteiro',
  'Cardoso', 'Teixeira', 'Mendes', 'Araújo', 'Martins', 'Nascimento', 'Moreira',
  'Freitas', 'Costa', 'Ramos', 'Reis', 'Machado', 'Araújo', 'Nunes'
]

const POSICOES = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante']

// Overall baseado na raridade
const OVERALL_BY_RARITY = {
  normal: { min: 50, max: 65 },
  raro: { min: 66, max: 75 },
  epico: { min: 76, max: 85 },
  lendario: { min: 86, max: 99 },
  prismatico: { min: 95, max: 99 }
}

// Cores das raridades
export const CORES_RARIDADE = {
  normal: '#9CA3AF',
  raro: '#3B82F6',
  epico: '#A855F7',
  lendario: '#F59E0B',
  prismatico: '#FFD700' // Dourado para cartas prismáticas
}

// Função para gerar um jogador aleatório baseado na raridade
export function gerarJogador(raridade: Raridade) {
  // Usa jogadores reais
  const jogadorReal = obterJogadorReal(raridade)

  // Gera uma imagem temporária baseada na raridade (usando placeholder)
  const imagem = `/jogadores/${raridade}-${Math.floor(Math.random() * 5) + 1}.svg`

  return {
    nome: jogadorReal.nome,
    posicao: jogadorReal.posicao,
    posicaoCompleta: jogadorReal.posicaoCompleta,
    timeAtual: jogadorReal.timeAtual,
    raridade: jogadorReal.raridade,
    overall: jogadorReal.overall,
    imagem
  }
}

// Função para determinar a raridade baseada nas porcentagens
export function determinarRaridade(): Raridade {
  const random = Math.random() * 100

  // Verifica primeiro a raridade mais rara (prismático)
  if (random < GACHA_RATES.prismatico) {
    return 'prismatico'
  } else if (random < GACHA_RATES.prismatico + GACHA_RATES.lendario) {
    return 'lendario'
  } else if (random < GACHA_RATES.prismatico + GACHA_RATES.lendario + GACHA_RATES.epico) {
    return 'epico'
  } else if (random < GACHA_RATES.prismatico + GACHA_RATES.lendario + GACHA_RATES.epico + GACHA_RATES.raro) {
    return 'raro'
  } else {
    return 'normal'
  }
}

// Função para realizar um "tiro" no gacha
export function realizarGacha() {
  const raridade = determinarRaridade()
  const jogador = gerarJogador(raridade)
  return { jogador, raridade }
}
