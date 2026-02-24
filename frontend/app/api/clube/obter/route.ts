import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/getAuthUser'
import { obterClube, obterTitularesComPosicaoSlot } from '@backend/lib/clube'
import { calcularForcaTimeComCompatibilidade } from '@backend/lib/forca-time'

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthUser(request)
    if (auth instanceof NextResponse) return auth

    const clube = await obterClube(auth.userId)
    let poder = null

    if (clube?.id) {
      try {
        const titularesComSlot = await obterTitularesComPosicaoSlot(clube.id)
        if (titularesComSlot.length >= 11) {
          poder = calcularForcaTimeComCompatibilidade(titularesComSlot.map(t => ({
            nome: t.jogador.nome,
            posicao: t.jogador.posicao,
            posicaoCompleta: t.jogador.posicaoCompleta,
            overall: t.jogador.overall,
            slotIndex: t.slotIndex,
            posicaoEsperada: t.posicaoEsperada
          })))
        }
      } catch {
        // Ignora erro de poder (ex.: escalação incompleta)
      }
    }

    return NextResponse.json({ clube, poder })
  } catch (error) {
    console.error('Erro ao obter clube:', error)
    return NextResponse.json({ error: 'Erro ao obter clube' }, { status: 500 })
  }
}
