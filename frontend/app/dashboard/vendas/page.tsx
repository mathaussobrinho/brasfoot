'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CORES_RARIDADE } from '@backend/lib/gacha'

interface Jogador {
  id: string
  nome: string
  posicao: string
  posicaoCompleta: string
  timeAtual: string | null
  raridade: string
  overall: number
  imagem: string
  emLeilao: boolean
  precoVendaDireta: number | null
}

export default function VendasPage() {
  const router = useRouter()
  const [jogadores, setJogadores] = useState<Jogador[]>([])
  const [loading, setLoading] = useState(true)
  const [vendendo, setVendendo] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchJogadores(token)
  }, [router])

  const fetchJogadores = async (token: string) => {
    try {
      const response = await fetch('/api/jogadores', {
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
      setJogadores(data.jogadores.filter((j: Jogador) => !j.emLeilao))
    } catch (error) {
      console.error('Erro ao buscar jogadores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCalcularPreco = async (jogadorId: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    setVendendo(jogadorId)

    try {
      const response = await fetch(`/api/vendas/direta?jogadorId=${jogadorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        alert('Erro ao calcular preço')
        return
      }

      const data = await response.json()
      
      if (confirm(`Preço de venda: R$ ${data.preco.toFixed(2)}\n\nDeseja colocar este jogador à venda?`)) {
        // Aqui você pode implementar a lógica de venda direta
        alert('Funcionalidade de venda direta em desenvolvimento!')
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor')
    } finally {
      setVendendo(null)
      fetchJogadores(token)
    }
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
            <h1 className="text-3xl font-bold text-gray-800">💰 Venda Direta</h1>
            <Link
              href="/dashboard"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              Voltar
            </Link>
          </div>

          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              💡 O preço de venda é calculado dinamicamente baseado na raridade e quantas pessoas têm o jogador.
              Quanto mais pessoas têm, mais barato fica, mas sempre respeitando a hierarquia de raridade.
            </p>
          </div>

          {jogadores.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-xl mb-4">Você não tem jogadores disponíveis para venda!</p>
              <Link
                href="/dashboard/jogadores"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Ver Meus Jogadores
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jogadores.map((jogador) => (
                <div
                  key={jogador.id}
                  className="bg-gray-50 rounded-lg p-4 shadow-md hover:shadow-lg transition"
                >
                  <div className="text-center">
                    <div
                      className="w-24 h-24 mx-auto mb-3 rounded-full flex items-center justify-center text-5xl"
                      style={{ backgroundColor: CORES_RARIDADE[jogador.raridade as keyof typeof CORES_RARIDADE] || '#9CA3AF' }}
                    >
                      ⚽
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{jogador.nome}</h3>
                    <p className="text-gray-600 mb-1">{jogador.posicaoCompleta || jogador.posicao}</p>
                    {jogador.timeAtual && (
                      <p className="text-sm text-blue-600 mb-1">🏆 {jogador.timeAtual}</p>
                    )}
                    <p className="text-lg font-semibold mb-2">Overall: {jogador.overall}</p>
                    <button
                      onClick={() => handleCalcularPreco(jogador.id)}
                      disabled={vendendo === jogador.id}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                    >
                      {vendendo === jogador.id ? 'Calculando...' : '💰 Ver Preço de Venda'}
                    </button>
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
