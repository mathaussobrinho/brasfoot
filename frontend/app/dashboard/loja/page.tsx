'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LojaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [quantidadeTiros, setQuantidadeTiros] = useState(5)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const handleComprarTiros = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    setLoading(true)
    setMensagem('')

    try {
      const response = await fetch('/api/compras', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: 'tiros',
          quantidade: quantidadeTiros
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || 'Erro ao comprar tiros'
        setMensagem(errorMsg)
        console.error('Erro na compra:', data)
        
        // Se o erro for de usuário não encontrado, sugere fazer login novamente
        if (errorMsg.includes('Usuário não encontrado') || errorMsg.includes('Foreign key')) {
          setTimeout(() => {
            if (confirm('Parece que sua sessão expirou. Deseja fazer login novamente?')) {
              localStorage.removeItem('token')
              router.push('/login')
            }
          }, 1000)
        }
        return
      }

      setMensagem(`✅ Compra realizada! ${quantidadeTiros} tiros adicionados à sua conta.`)
      setQuantidadeTiros(5)
    } catch (error) {
      setMensagem('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleComprarPasse = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    if (!confirm('Deseja comprar o Passe de Temporada por R$ 29,90?')) {
      return
    }

    setLoading(true)
    setMensagem('')

    try {
      const response = await fetch('/api/compras', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: 'passe'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.error || 'Erro ao comprar passe'
        setMensagem(errorMsg)
        console.error('Erro na compra do passe:', data)
        
        // Se o erro for de usuário não encontrado, sugere fazer login novamente
        if (errorMsg.includes('Usuário não encontrado') || errorMsg.includes('Foreign key')) {
          setTimeout(() => {
            if (confirm('Parece que sua sessão expirou. Deseja fazer login novamente?')) {
              localStorage.removeItem('token')
              router.push('/login')
            }
          }, 1000)
        }
        return
      }

      setMensagem('✅ Passe de Temporada adquirido! Agora você tem 10 tiros por dia!')
    } catch (error) {
      setMensagem('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">🛒 Loja</h1>
            <Link
              href="/dashboard"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              Voltar
            </Link>
          </div>

          {mensagem && (
            <div className={`mb-4 p-4 rounded-lg ${
              mensagem.includes('✅') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {mensagem}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Comprar Tiros */}
            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Comprar Tiros</h2>
              <p className="text-gray-600 mb-4">
                Compre tiros extras para usar no gacha! Cada tiro custa R$ 2,00.
              </p>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Quantidade de Tiros:
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantidadeTiros}
                  onChange={(e) => setQuantidadeTiros(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <p className="text-xl font-bold text-blue-700">
                  Total: R$ {(quantidadeTiros * 2.0).toFixed(2)}
                </p>
              </div>

              <button
                onClick={handleComprarTiros}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Comprar Tiros'}
              </button>
            </div>

            {/* Comprar Passe */}
            <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">⭐ Passe de Temporada</h2>
              <p className="text-gray-600 mb-4">
                Com o passe de temporada, você ganha <strong>10 tiros por dia</strong> ao invés de 5!
                Duração: 30 dias
              </p>
              
              <div className="mb-4">
                <p className="text-xl font-bold text-yellow-700">
                  Preço: R$ 29,90
                </p>
              </div>

              <ul className="mb-4 text-sm text-gray-600 space-y-1">
                <li>✅ 10 tiros por dia (ao invés de 5)</li>
                <li>✅ Válido por 30 dias</li>
                <li>✅ Reset automático às 12:00</li>
              </ul>

              <button
                onClick={handleComprarPasse}
                disabled={loading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Comprar Passe'}
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-2">ℹ️ Informações:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Os tiros diários são resetados automaticamente todos os dias às 12:00</li>
              <li>• Tiros comprados são adicionados aos tiros diários</li>
              <li>• O passe de temporada pode ser renovado antes do término</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
