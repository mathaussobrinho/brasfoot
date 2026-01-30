'use client'

import { CORES_RARIDADE } from '@backend/lib/gacha'

interface JogadorCardProps {
  jogador: {
    id: string
    nome: string
    posicao: string
    raridade: string
    overall: number
    imagem: string
  }
  tamanho?: 'pequeno' | 'medio' | 'grande'
}

export default function JogadorCard({ jogador, tamanho = 'medio' }: JogadorCardProps) {
  const getRaridadeLabel = (raridade: string) => {
    const labels: Record<string, string> = {
      normal: 'Normal',
      raro: 'Raro',
      epico: 'Épico',
      lendario: 'Lendário'
    }
    return labels[raridade] || raridade
  }

  const tamanhos = {
    pequeno: { card: 'w-32 h-40', imagem: 80, texto: 'text-sm' },
    medio: { card: 'w-48 h-64', imagem: 120, texto: 'text-base' },
    grande: { card: 'w-64 h-80', imagem: 160, texto: 'text-lg' }
  }

  const tamanhoConfig = tamanhos[tamanho]
  const corRaridade = CORES_RARIDADE[jogador.raridade as keyof typeof CORES_RARIDADE] || '#9CA3AF'

  return (
    <div className={`${tamanhoConfig.card} bg-white rounded-lg shadow-lg p-4 flex flex-col items-center justify-center`}>
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-3"
        style={{ backgroundColor: corRaridade }}
      >
        ⚽
      </div>
      <h3 className={`${tamanhoConfig.texto} font-bold text-gray-800 mb-1 text-center`}>
        {jogador.nome}
      </h3>
      <p className="text-gray-600 mb-1 text-center text-sm">{jogador.posicao}</p>
      <p className={`${tamanhoConfig.texto} font-semibold mb-2`}>Overall: {jogador.overall}</p>
      <span
        className="inline-block px-3 py-1 rounded-full text-white text-xs font-bold"
        style={{ backgroundColor: corRaridade }}
      >
        {getRaridadeLabel(jogador.raridade)}
      </span>
    </div>
  )
}
