'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Algo deu errado</h2>
        <p className="text-gray-600 mb-6">{error.message || 'Erro ao carregar o dashboard.'}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Tentar de novo
          </button>
          <Link
            href="/dashboard"
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition inline-block"
          >
            Ir ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
