'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CORES_RARIDADE } from '@backend/lib/gacha'

interface Leilao {
  id: string
  jogadorId: string
  lanceAtual: number
  dataFim: string
  jogador: {
    id: string
    nome: string
    posicao: string
    posicaoCompleta: string
    timeAtual: string | null
    raridade: string
    overall: number
    imagem: string
  }
  user: {
    id: string
    nome: string
    sobrenome: string
    login: string
  }
}

export default function LeilaoPage() {
  const router = useRouter()
  const [leiloes, setLeiloes] = useState<Leilao[]>([])
  const [loading, setLoading] = useState(true)
  const [lanceValor, setLanceValor] = useState<Record<string, number>>({})
  const [dandoLance, setDandoLance] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchLeiloes(token)
    const interval = setInterval(() => fetchLeiloes(token), 5000) // Atualiza a cada 5 segundos

    return () => clearInterval(interval)
  }, [router])

  const fetchLeiloes = async (token: string) => {
    try {
      const response = await fetch('/api/leilao/listar', {
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
      setLeiloes(data.leiloes)
    } catch (error) {
      console.error('Erro ao buscar leilões:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDarLance = async (leilaoId: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    const valor = lanceValor[leilaoId]
    if (!valor || valor <= 0) {
      alert('Digite um valor válido')
      return
    }

    setDandoLance(leilaoId)

    try {
      const response = await fetch('/api/leilao/lance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leilaoId, valor })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Erro ao dar lance')
        return
      }

      alert('Lance realizado com sucesso!')
      setLanceValor({ ...lanceValor, [leilaoId]: 0 })
      fetchLeiloes(token)
    } catch (error) {
      alert('Erro ao conectar com o servidor')
    } finally {
      setDandoLance(null)
    }
  }

  const getTempoRestante = (dataFim: string) => {
    const agora = new Date()
    const fim = new Date(dataFim)
    const diff = fim.getTime() - agora.getTime()

    if (diff <= 0) return 'Expirado'

    const segundos = Math.floor(diff / 1000)
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60

    return `${minutos}:${segs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">🔨 Leilão</h1>
            <Link
              href="/dashboard"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              Voltar
            </Link>
          </div>

          <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-700">
              ⏰ Cada lance adiciona 1 minuto ao timer. Se ninguém der um lance maior em 1 minuto, o jogador é vendido.
            </p>
          </div>

          {leiloes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-xl mb-4">Nenhum leilão ativo no momento!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leiloes.map((leilao) => (
                <div
                  key={leilao.id}
                  className="bg-gray-50 rounded-lg p-4 shadow-md hover:shadow-lg transition"
                >
                  <div className="text-center mb-4">
                    <div
                      className="w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center text-4xl"
                      style={{ backgroundColor: CORES_RARIDADE[leilao.jogador.raridade as keyof typeof CORES_RARIDADE] || '#9CA3AF' }}
                    >
                      ⚽
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{leilao.jogador.nome}</h3>
                    <p className="text-gray-600 mb-1">{leilao.jogador.posicaoCompleta || leilao.jogador.posicao}</p>
                    {leilao.jogador.timeAtual && (
                      <p className="text-sm text-blue-600 mb-1">🏆 {leilao.jogador.timeAtual}</p>
                    )}
                    <p className="text-lg font-semibold mb-2">Overall: {leilao.jogador.overall}</p>
                    <p className="text-sm text-gray-600 mb-2">
                      Vendedor: {leilao.user.nome} {leilao.user.sobrenome}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 font-semibold">Lance Atual:</span>
                      <span className="text-2xl font-bold text-green-600">
                        R$ {leilao.lanceAtual.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-700 font-semibold">Tempo Restante:</span>
                      <span className="text-lg font-bold text-red-600">
                        {getTempoRestante(leilao.dataFim)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={leilao.lanceAtual + 1}
                        step="0.01"
                        value={lanceValor[leilao.id] || ''}
                        onChange={(e) => setLanceValor({ ...lanceValor, [leilao.id]: parseFloat(e.target.value) || 0 })}
                        placeholder="Valor do lance"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleDarLance(leilao.id)}
                        disabled={dandoLance === leilao.id || !lanceValor[leilao.id] || lanceValor[leilao.id] <= leilao.lanceAtual}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                      >
                        {dandoLance === leilao.id ? '...' : 'Dar Lance'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
