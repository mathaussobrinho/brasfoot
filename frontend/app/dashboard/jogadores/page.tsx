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

export default function JogadoresPage() {
  const router = useRouter()
  const [jogadores, setJogadores] = useState<Jogador[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroRaridade, setFiltroRaridade] = useState<string>('todos')
  const [deletando, setDeletando] = useState(false)

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
      setJogadores(data.jogadores)
    } catch (error) {
      console.error('Erro ao buscar jogadores:', error)
    } finally {
      setLoading(false)
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

  const handleDeletarTodos = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    if (!confirm('⚠️ TEMPORÁRIO: Tem certeza que deseja deletar TODOS os seus jogadores? Esta ação não pode ser desfeita!')) {
      return
    }

    setDeletando(true)

    try {
      const response = await fetch('/api/jogadores/delete-all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        alert('Erro ao deletar jogadores')
        return
      }

      const data = await response.json()
      alert(`✅ ${data.quantidade} jogador(es) deletado(s) com sucesso!`)
      
      // Atualiza a lista
      await fetchJogadores(token)
    } catch (error) {
      alert('Erro ao conectar com o servidor')
    } finally {
      setDeletando(false)
    }
  }

  const jogadoresFiltrados = filtroRaridade === 'todos'
    ? jogadores
    : jogadores.filter(j => j.raridade === filtroRaridade)

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
            <h1 className="text-3xl font-bold text-gray-800">👥 Meus Jogadores</h1>
            <div className="flex gap-2">
              {jogadores.length > 0 && (
                <button
                  onClick={handleDeletarTodos}
                  disabled={deletando}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm"
                  title="Botão temporário - Deleta todos os jogadores"
                >
                  {deletando ? 'Deletando...' : '🗑️ Limpar Todos (TEMP)'}
                </button>
              )}
              <Link
                href="/dashboard"
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                Voltar
              </Link>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Filtrar por Raridade:</label>
            <select
              value={filtroRaridade}
              onChange={(e) => setFiltroRaridade(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="normal">Normal</option>
              <option value="raro">Raro</option>
              <option value="epico">Épico</option>
              <option value="lendario">Lendário</option>
            </select>
          </div>

          <p className="text-gray-600 mb-4">
            Total: {jogadoresFiltrados.length} jogador(es)
          </p>

          {jogadoresFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-xl mb-4">Você ainda não tem jogadores!</p>
              <Link
                href="/dashboard/gacha"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Ir para Gacha
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jogadoresFiltrados.map((jogador) => (
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
                    {jogador.emLeilao && (
                      <p className="text-xs text-yellow-600 mb-1">⚡ Em Leilão</p>
                    )}
                    {jogador.precoVendaDireta && (
                      <p className="text-xs text-green-600 mb-1">💰 R$ {jogador.precoVendaDireta.toFixed(2)}</p>
                    )}
                    <span
                      className="inline-block px-3 py-1 rounded-full text-white text-sm font-bold"
                      style={{ backgroundColor: CORES_RARIDADE[jogador.raridade as keyof typeof CORES_RARIDADE] || '#9CA3AF' }}
                    >
                      {getRaridadeLabel(jogador.raridade)}
                    </span>
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
