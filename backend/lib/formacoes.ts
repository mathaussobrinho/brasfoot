// Configurações de formações com posições no campo

export interface PosicaoCampo {
  x: number // 0-100 (percentual)
  y: number // 0-100 (percentual)
  posicao: string // Goleiro, Zagueiro, Lateral D, etc
}

export const FORMACOES_POSICOES: Record<string, PosicaoCampo[]> = {
  '4-4-2': [
    { x: 5, y: 50, posicao: 'Goleiro' }, // Goleiro na esquerda (parte de trás)
    { x: 20, y: 15, posicao: 'Lateral E' }, // Lateral esquerdo (topo)
    { x: 20, y: 40, posicao: 'Zagueiro' }, // Zagueiro esquerdo
    { x: 20, y: 60, posicao: 'Zagueiro' }, // Zagueiro direito
    { x: 20, y: 85, posicao: 'Lateral D' }, // Lateral direito (baixo)
    { x: 45, y: 20, posicao: 'Meia' }, // Meia esquerdo
    { x: 45, y: 50, posicao: 'Meia' }, // Meia central
    { x: 45, y: 80, posicao: 'Meia' }, // Meia direito
    { x: 75, y: 35, posicao: 'Atacante' }, // Atacante esquerdo
    { x: 75, y: 65, posicao: 'Atacante' }, // Atacante direito
    { x: 90, y: 50, posicao: 'Meia Ofensivo' } // Meia ofensivo (frente/direita)
  ],
  '4-3-3': [
    { x: 5, y: 50, posicao: 'Goleiro' },
    { x: 20, y: 15, posicao: 'Lateral E' },
    { x: 20, y: 40, posicao: 'Zagueiro' },
    { x: 20, y: 60, posicao: 'Zagueiro' },
    { x: 20, y: 85, posicao: 'Lateral D' },
    { x: 45, y: 30, posicao: 'Meia' },
    { x: 45, y: 50, posicao: 'Meia' },
    { x: 45, y: 70, posicao: 'Meia' },
    { x: 80, y: 25, posicao: 'Atacante' },
    { x: 80, y: 50, posicao: 'Atacante' },
    { x: 80, y: 75, posicao: 'Atacante' }
  ],
  '4-5-1': [
    { x: 5, y: 50, posicao: 'Goleiro' },
    { x: 20, y: 15, posicao: 'Lateral E' },
    { x: 20, y: 40, posicao: 'Zagueiro' },
    { x: 20, y: 60, posicao: 'Zagueiro' },
    { x: 20, y: 85, posicao: 'Lateral D' },
    { x: 45, y: 15, posicao: 'Meia' },
    { x: 45, y: 35, posicao: 'Meia' },
    { x: 45, y: 50, posicao: 'Meia' },
    { x: 45, y: 65, posicao: 'Meia' },
    { x: 45, y: 85, posicao: 'Meia' },
    { x: 85, y: 50, posicao: 'Atacante' }
  ],
  '3-5-2': [
    { x: 5, y: 50, posicao: 'Goleiro' },
    { x: 20, y: 30, posicao: 'Zagueiro' },
    { x: 20, y: 50, posicao: 'Zagueiro' },
    { x: 20, y: 70, posicao: 'Zagueiro' },
    { x: 45, y: 10, posicao: 'Lateral E' },
    { x: 45, y: 35, posicao: 'Meia' },
    { x: 45, y: 50, posicao: 'Meia' },
    { x: 45, y: 65, posicao: 'Meia' },
    { x: 45, y: 90, posicao: 'Lateral D' },
    { x: 80, y: 35, posicao: 'Atacante' },
    { x: 80, y: 65, posicao: 'Atacante' }
  ],
  '3-4-3': [
    { x: 5, y: 50, posicao: 'Goleiro' },
    { x: 20, y: 30, posicao: 'Zagueiro' },
    { x: 20, y: 50, posicao: 'Zagueiro' },
    { x: 20, y: 70, posicao: 'Zagueiro' },
    { x: 45, y: 20, posicao: 'Lateral E' },
    { x: 45, y: 50, posicao: 'Meia' },
    { x: 45, y: 80, posicao: 'Lateral D' },
    { x: 65, y: 50, posicao: 'Meia Ofensivo' },
    { x: 85, y: 25, posicao: 'Atacante' },
    { x: 85, y: 50, posicao: 'Atacante' },
    { x: 85, y: 75, posicao: 'Atacante' }
  ],
  '5-3-2': [
    { x: 5, y: 50, posicao: 'Goleiro' },
    { x: 20, y: 10, posicao: 'Lateral E' },
    { x: 20, y: 35, posicao: 'Zagueiro' },
    { x: 20, y: 50, posicao: 'Zagueiro' },
    { x: 20, y: 65, posicao: 'Zagueiro' },
    { x: 20, y: 90, posicao: 'Lateral D' },
    { x: 45, y: 30, posicao: 'Meia' },
    { x: 45, y: 50, posicao: 'Meia' },
    { x: 45, y: 70, posicao: 'Meia' },
    { x: 80, y: 35, posicao: 'Atacante' },
    { x: 80, y: 65, posicao: 'Atacante' }
  ],
  '4-2-3-1': [
    { x: 5, y: 50, posicao: 'Goleiro' },
    { x: 20, y: 15, posicao: 'Lateral E' },
    { x: 20, y: 40, posicao: 'Zagueiro' },
    { x: 20, y: 60, posicao: 'Zagueiro' },
    { x: 20, y: 85, posicao: 'Lateral D' },
    { x: 40, y: 40, posicao: 'Volante' },
    { x: 40, y: 60, posicao: 'Volante' },
    { x: 60, y: 25, posicao: 'Meia Ofensivo' },
    { x: 60, y: 50, posicao: 'Meia Ofensivo' },
    { x: 60, y: 75, posicao: 'Meia Ofensivo' },
    { x: 90, y: 50, posicao: 'Atacante' }
  ],
  '4-1-4-1': [
    { x: 5, y: 50, posicao: 'Goleiro' },
    { x: 20, y: 15, posicao: 'Lateral E' },
    { x: 20, y: 40, posicao: 'Zagueiro' },
    { x: 20, y: 60, posicao: 'Zagueiro' },
    { x: 20, y: 85, posicao: 'Lateral D' },
    { x: 35, y: 50, posicao: 'Volante' },
    { x: 55, y: 20, posicao: 'Meia' },
    { x: 55, y: 40, posicao: 'Meia' },
    { x: 55, y: 60, posicao: 'Meia' },
    { x: 55, y: 80, posicao: 'Meia' },
    { x: 90, y: 50, posicao: 'Atacante' }
  ]
}

export function obterPosicoesFormacao(formacao: string): PosicaoCampo[] {
  return FORMACOES_POSICOES[formacao] || FORMACOES_POSICOES['4-4-2']
}
