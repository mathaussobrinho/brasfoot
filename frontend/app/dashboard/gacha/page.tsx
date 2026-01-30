'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CORES_RARIDADE } from '@backend/lib/gacha'

interface Jogador {
  id: string
  nome: string
  posicao: string
  raridade: string
  overall: number
  imagem: string
}

export default function GachaPage() {
  const router = useRouter()
  const [tirosDisponiveis, setTirosDisponiveis] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loading10, setLoading10] = useState(false)
  const [ultimoJogador, setUltimoJogador] = useState<Jogador | null>(null)
  const [ultimaRaridade, setUltimaRaridade] = useState<string>('')
  const [ultimosJogadores, setUltimosJogadores] = useState<Jogador[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchTiros(token)
  }, [router])

  const fetchTiros = async (token: string) => {
    try {
      const response = await fetch('/api/gacha', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          router.push('/login')
        }
        return
      }

      const data = await response.json()
      setTirosDisponiveis(data.tirosDisponiveis)
    } catch (error) {
      console.error('Erro ao buscar tiros:', error)
    }
  }

  const handleGacha = async (quantidade: number = 1) => {
    const token = localStorage.getItem('token')
    if (!token) return

    if (tirosDisponiveis < quantidade) {
      alert(`Você precisa de ${quantidade} tiros, mas só tem ${tirosDisponiveis} disponíveis!`)
      return
    }

    if (quantidade === 1) {
      setLoading(true)
    } else {
      setLoading10(true)
    }

    try {
      const response = await fetch('/api/gacha', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantidade })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Erro ao realizar gacha')
        return
      }

      if (quantidade === 1) {
        // Para 1 tiro, mostra apenas o último
        setUltimoJogador(data.jogadores[0])
        setUltimaRaridade(data.jogadores[0].raridade)
        setUltimosJogadores([])
      } else {
        // Para múltiplos tiros, mostra todos
        setUltimosJogadores(data.jogadores)
        setUltimoJogador(null)
      }

      setTirosDisponiveis(data.tirosDisponiveis)
    } catch (error) {
      alert('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
      setLoading10(false)
    }
  }

  const getRaridadeLabel = (raridade: string) => {
    const labels: Record<string, string> = {
      normal: 'Normal',
      raro: 'Raro',
      epico: 'Épico',
      lendario: 'Lendário'
    }
    return labels[raridade] || raridade
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">🎰 Gacha</h1>
            <Link
              href="/dashboard"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              Voltar
            </Link>
          </div>

          <div className="text-center mb-6">
            <div className="bg-green-100 p-4 rounded-lg inline-block">
              <p className="text-gray-600">Tiros Disponíveis</p>
              <p className="text-4xl font-bold text-green-700">{tirosDisponiveis}</p>
            </div>
          </div>

          <div className="text-center mb-6 space-y-4">
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => handleGacha(1)}
                disabled={loading || loading10 || tirosDisponiveis < 1}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Abrindo...' : '🎯 Dar 1 Tiro'}
              </button>
              
              <button
                onClick={() => handleGacha(10)}
                disabled={loading || loading10 || tirosDisponiveis < 10}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading10 ? 'Abrindo...' : '🎁 Dar 10 Tiros (Ganha 11!)'}
              </button>
            </div>
            {tirosDisponiveis < 10 && tirosDisponiveis > 0 && (
              <p className="text-sm text-gray-600">
                💡 Dica: Você precisa de 10 tiros para usar o pacote de 10 tiros (ganha 11 jogadores!)
              </p>
            )}
          </div>

          {ultimoJogador && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <h2 className="text-2xl font-bold text-center mb-4">Jogador Obtido!</h2>
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="text-center">
                  <div
                    className="w-32 h-32 mx-auto mb-4 rounded-full flex items-center justify-center text-6xl"
                    style={{ backgroundColor: CORES_RARIDADE[ultimaRaridade as keyof typeof CORES_RARIDADE] || '#9CA3AF' }}
                  >
                    ⚽
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{ultimoJogador.nome}</h3>
                  <p className="text-gray-600 mb-2">{ultimoJogador.posicao}</p>
                  <p className="text-lg font-semibold mb-2">Overall: {ultimoJogador.overall}</p>
                  <span
                    className="inline-block px-4 py-2 rounded-full text-white font-bold"
                    style={{ backgroundColor: CORES_RARIDADE[ultimaRaridade as keyof typeof CORES_RARIDADE] || '#9CA3AF' }}
                  >
                    {getRaridadeLabel(ultimaRaridade)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {ultimosJogadores.length > 0 && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <h2 className="text-2xl font-bold text-center mb-4">
                {ultimosJogadores.length} Jogadores Obtidos! 🎉
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ultimosJogadores.map((jogador) => (
                  <div key={jogador.id} className="bg-white rounded-lg p-4 shadow-lg">
                    <div className="text-center">
                      <div
                        className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center text-4xl"
                        style={{ backgroundColor: CORES_RARIDADE[jogador.raridade as keyof typeof CORES_RARIDADE] || '#9CA3AF' }}
                      >
                        ⚽
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">{jogador.nome}</h3>
                      <p className="text-sm text-gray-600 mb-1">{jogador.posicao}</p>
                      <p className="text-sm font-semibold mb-2">Overall: {jogador.overall}</p>
                      <span
                        className="inline-block px-3 py-1 rounded-full text-white text-xs font-bold"
                        style={{ backgroundColor: CORES_RARIDADE[jogador.raridade as keyof typeof CORES_RARIDADE] || '#9CA3AF' }}
                      >
                        {getRaridadeLabel(jogador.raridade)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-2">Chances de Raridade:</h3>
            <ul className="space-y-1 text-sm">
              <li>🟦 Normal: 60%</li>
              <li>🟦 Raro: 30%</li>
              <li>🟦 Épico: 8%</li>
              <li>🟦 Lendário: 2%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
