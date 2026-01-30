import { NextRequest, NextResponse } from 'next/server'
import { gerarEscudoSVG, obterEscudoConfig } from '@/lib/escudos'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const escudoId = resolvedParams.id
    const config = obterEscudoConfig(escudoId)
    const svg = gerarEscudoSVG(config)

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('Erro ao gerar escudo:', error)
    return new NextResponse('Escudo não encontrado', { status: 404 })
  }
}
