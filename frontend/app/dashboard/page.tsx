'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  nome: string
  sobrenome: string
  login: string
  email: string
  tecnicoOverall?: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tirosDisponiveis, setTirosDisponiveis] = useState(0)
  const [temPasseAtivo, setTemPasseAtivo] = useState(false)
  const [clube, setClube] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchUserData(token)
  }, [router])

  const fetchUserData = async (token: string) => {
    try {
      const [userRes, clubeRes] = await Promise.all([
        fetch('/api/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/clube/obter', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (!userRes.ok) {
        if (userRes.status === 401) {
          localStorage.removeItem('token')
          router.push('/login')
        }
        return
      }

      const userData = await userRes.json()
      setUser(userData.user)
      setTirosDisponiveis(userData.tirosDisponiveis)
      setTemPasseAtivo(userData.temPasseAtivo)

      if (clubeRes.ok) {
        const clubeData = await clubeRes.json()
        setClube(clubeData.clube)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
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
            <h1 className="text-3xl font-bold text-gray-800">
              ⚽ Brashero
            </h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Sair
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-gray-600">Bem-vindo,</p>
              <p className="text-xl font-bold text-gray-800">
                {user?.nome} {user?.sobrenome}
              </p>
            </div>

            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-gray-600">Tiros Disponíveis</p>
              <p className="text-3xl font-bold text-green-700">
                {tirosDisponiveis}
              </p>
            </div>

            <div className={`p-4 rounded-lg ${temPasseAtivo ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              <p className="text-gray-600">Passe de Temporada</p>
              <p className={`text-xl font-bold ${temPasseAtivo ? 'text-yellow-700' : 'text-gray-600'}`}>
                {temPasseAtivo ? '✅ Ativo' : '❌ Inativo'}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-purple-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Overall do Técnico</p>
                <p className="text-2xl font-bold text-purple-700">
                  {user?.tecnicoOverall || 50}
                </p>
                {clube && (
                  <p className="text-sm text-gray-600 mt-1">
                    Técnico do {clube.nome} ({clube.sigla})
                  </p>
                )}
              </div>
              {clube && (
                <div className="w-16 h-16 flex items-center justify-center">
                  <img
                    src={`/api/escudos/${clube.escudo}`}
                    alt={clube.nome}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/dashboard/gacha"
            className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition text-center"
          >
            <div className="text-6xl mb-4">🎰</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Gacha</h2>
            <p className="text-gray-600">Use seus tiros para conseguir jogadores!</p>
          </Link>

          <Link
            href="/dashboard/jogadores"
            className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition text-center"
          >
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Meus Jogadores</h2>
            <p className="text-gray-600">Veja sua coleção de jogadores</p>
          </Link>

          <Link
            href="/dashboard/loja"
            className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition text-center"
          >
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Loja</h2>
            <p className="text-gray-600">Compre tiros e passe de temporada</p>
          </Link>

          <Link
            href="/dashboard/leilao"
            className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition text-center"
          >
            <div className="text-6xl mb-4">🔨</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Leilão</h2>
            <p className="text-gray-600">Compre e venda jogadores em leilão</p>
          </Link>

          <Link
            href="/dashboard/vendas"
            className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition text-center"
          >
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Vendas</h2>
            <p className="text-gray-600">Venda direta de jogadores</p>
          </Link>

          <Link
            href="/dashboard/partidas"
            className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition text-center"
          >
            <div className="text-6xl mb-4">⚽</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Partidas</h2>
            <p className="text-gray-600">Jogue contra bot ou outros players</p>
          </Link>

          <Link
            href="/dashboard/clube"
            className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition text-center"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Meu Clube</h2>
            <p className="text-gray-600">Crie seu clube e escale seu time</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
