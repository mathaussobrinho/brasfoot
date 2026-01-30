'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ESCUDOS_DISPONIVEIS, FORMACOES_DISPONIVEIS } from '@backend/lib/clube'
import { ESCUDOS_CONFIG } from '@backend/lib/escudos'

export default function ClubePage() {
  const router = useRouter()
  const [clube, setClube] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    escudo: 'flamengo',
    formacao: '4-4-2'
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchClube(token)
  }, [router])

  const fetchClube = async (token: string) => {
    try {
      const response = await fetch('/api/clube/obter', {
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
      if (data.clube) {
        setClube(data.clube)
        setFormData({
          nome: data.clube.nome,
          sigla: data.clube.sigla,
          escudo: data.clube.escudo,
          formacao: data.clube.formacao
        })
      }
    } catch (error) {
      console.error('Erro ao buscar clube:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    if (!formData.nome || !formData.sigla) {
      alert('Preencha todos os campos obrigatórios')
      return
    }
    const token = localStorage.getItem('token')
    if (!token) return

    setSalvando(true)

    try {
      const response = await fetch('/api/clube/criar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Erro ao criar/atualizar clube')
        return
      }

      const foiCriado = !clube
      setClube(data.clube)
      
      if (foiCriado) {
        // Se foi criado pela primeira vez, redireciona para escalação
        router.push('/dashboard/clube/escalacao')
      } else {
        alert('Clube atualizado com sucesso!')
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor')
    } finally {
      setSalvando(false)
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">🏆 Meu Clube</h1>
            <Link
              href="/dashboard"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              Voltar
            </Link>
          </div>

          {clube && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img
                    src={`/api/escudos/${clube.escudo}`}
                    alt={clube.nome}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">{clube.nome} ({clube.sigla})</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Nome do Clube *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Sigla * (2-5 caracteres)
              </label>
              <input
                type="text"
                value={formData.sigla}
                onChange={(e) => setFormData({ ...formData, sigla: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={2}
                maxLength={5}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Escudo
              </label>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {ESCUDOS_CONFIG.map((escudoConfig) => (
                  <button
                    key={escudoConfig.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, escudo: escudoConfig.id })}
                    className={`p-2 border-2 rounded-lg transition ${
                      formData.escudo === escudoConfig.id
                        ? 'border-blue-500 bg-blue-100'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title={escudoConfig.nome}
                  >
                    <div className="w-16 h-16 flex items-center justify-center bg-white rounded-full overflow-hidden">
                      <img
                        src={`/api/escudos/${escudoConfig.id}`}
                        alt={escudoConfig.nome}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Fallback se a imagem não carregar
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.parentElement!.innerHTML = '<div class="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-xl">⚽</div>'
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>


            {!clube && (
              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
              >
                {salvando ? 'Criando...' : 'Criar Clube'}
              </button>
            )}
          </form>

          {clube && (
            <div className="mt-6 space-y-3">
              <button
                onClick={handleSubmit}
                disabled={salvando}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
              >
                {salvando ? 'Atualizando...' : 'Atualizar Clube'}
              </button>
              <Link
                href="/dashboard/clube/escalacao"
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
              >
                ⚽ Escalar Time
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
