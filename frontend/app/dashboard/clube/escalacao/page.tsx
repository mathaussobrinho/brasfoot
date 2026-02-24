'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CORES_RARIDADE } from '@backend/lib/gacha'
import { obterPosicoesFormacao } from '@backend/lib/formacoes'
import { FORMACOES_DISPONIVEIS } from '@backend/lib/clube'

interface Jogador {
  id: string
  nome: string
  posicao: string
  posicaoCompleta: string
  raridade: string
  overall: number
  imagem: string
  emLeilao?: boolean
}

export default function EscalacaoPage() {
  const router = useRouter()
  const [jogadores, setJogadores] = useState<Jogador[]>([])
  const [clube, setClube] = useState<any>(null)
  const [poder, setPoder] = useState<{ forcaTotal: number; forcaGoleiro: number; forcaDefesa: number; forcaMeio: number; forcaAtaque: number; detalhes?: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [titulares, setTitulares] = useState<string[]>([])
  const [reservas, setReservas] = useState<string[]>([])
  const [jogadorSelecionado, setJogadorSelecionado] = useState<string | null>(null)
  const [posicoesJogadores, setPosicoesJogadores] = useState<Record<string, number>>({}) // jogadorId -> índice da posição
  const [jogadorArrastando, setJogadorArrastando] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchData(token)
  }, [router])

  const fetchData = async (token: string) => {
    try {
      const [jogadoresRes, clubeRes] = await Promise.all([
        fetch('/api/jogadores', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/clube/obter', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (!jogadoresRes.ok || !clubeRes.ok) {
        if (jogadoresRes.status === 401 || clubeRes.status === 401) {
          localStorage.removeItem('token')
          router.push('/login')
        }
        return
      }

      const jogadoresData = await jogadoresRes.json()
      const clubeData = await clubeRes.json()

      setJogadores(jogadoresData.jogadores.filter((j: Jogador) => !j.emLeilao))
      
      if (clubeData.clube) {
        setClube(clubeData.clube)
        setPoder(clubeData.poder || null)
        const escalados = clubeData.clube.escalacao || []
        const tit = escalados.filter((e: any) => e.isTitular).map((e: any) => e.jogadorId)
        const res = escalados.filter((e: any) => !e.isTitular).map((e: any) => e.jogadorId)
        setTitulares(tit)
        setReservas(res)
        
        // Restaura posições dos jogadores (posicao no banco é 1-indexed, convertemos para 0-indexed)
        const posicoes: Record<string, number> = {}
        escalados.forEach((e: any) => {
          if (e.isTitular && e.posicao) {
            posicoes[e.jogadorId] = e.posicao - 1
          }
        })
        setPosicoesJogadores(posicoes)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMoverParaTitular = (jogadorId: string, posicaoIndex?: number) => {
    if (titulares.length >= 11 && !titulares.includes(jogadorId)) {
      alert('Você já tem 11 titulares! Remova um primeiro.')
      return
    }
    
    if (!titulares.includes(jogadorId)) {
      setTitulares([...titulares, jogadorId])
    }
    setReservas(reservas.filter(id => id !== jogadorId))
    
    // Se não especificou posição, não força posicionamento (permite mudança manual)
    if (posicaoIndex !== undefined) {
      setPosicoesJogadores({ ...posicoesJogadores, [jogadorId]: posicaoIndex })
    }
  }

  const handlePosicionarJogador = (jogadorId: string, posicaoIndex: number) => {
    // Se já tem um jogador nessa posição, troca
    const jogadorNaPosicao = Object.keys(posicoesJogadores).find(
      id => posicoesJogadores[id] === posicaoIndex
    )
    
    if (jogadorNaPosicao && jogadorNaPosicao !== jogadorId) {
      // Remove o jogador da posição anterior
      const novaPosicoes = { ...posicoesJogadores }
      delete novaPosicoes[jogadorNaPosicao]
      novaPosicoes[jogadorId] = posicaoIndex
      setPosicoesJogadores(novaPosicoes)
    } else {
      setPosicoesJogadores({ ...posicoesJogadores, [jogadorId]: posicaoIndex })
    }
    
    // Garante que está nos titulares
    if (!titulares.includes(jogadorId)) {
      handleMoverParaTitular(jogadorId, posicaoIndex)
    }
  }

  // Handlers para drag and drop
  const handleDragStart = (e: React.DragEvent, jogadorId: string) => {
    setJogadorArrastando(jogadorId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, posicaoIndex: number) => {
    e.preventDefault()
    if (jogadorArrastando) {
      handlePosicionarJogador(jogadorArrastando, posicaoIndex)
      setJogadorArrastando(null)
    }
  }

  const handleDragEnd = () => {
    setJogadorArrastando(null)
  }

  const handleMoverParaReserva = (jogadorId: string) => {
    // Limita reservas a 12 jogadores
    if (reservas.length >= 12 && !reservas.includes(jogadorId)) {
      alert('Você pode ter no máximo 12 reservas!')
      return
    }
    
    if (!reservas.includes(jogadorId)) {
      setReservas([...reservas, jogadorId])
    }
    setTitulares(titulares.filter(id => id !== jogadorId))
    // Remove a posição quando vai para reserva
    const novasPosicoes = { ...posicoesJogadores }
    delete novasPosicoes[jogadorId]
    setPosicoesJogadores(novasPosicoes)
  }

  const handleRemover = (jogadorId: string) => {
    setTitulares(titulares.filter(id => id !== jogadorId))
    setReservas(reservas.filter(id => id !== jogadorId))
    const novasPosicoes = { ...posicoesJogadores }
    delete novasPosicoes[jogadorId]
    setPosicoesJogadores(novasPosicoes)
  }

  // Função para verificar se um jogador pode jogar em uma posição
  const podeJogarNaPosicao = (jogador: Jogador, posicaoNecessaria: string): boolean => {
    const posicaoJogador = jogador.posicaoCompleta || jogador.posicao
    const posicaoJogadorLower = posicaoJogador.toLowerCase()
    const posicaoNecessariaLower = posicaoNecessaria.toLowerCase()
    
    // Posições restritivas - só aceita jogadores da posição exata
    const posicoesRestritivas = ['goleiro', 'lateral d', 'lateral e', 'zagueiro']
    
    if (posicoesRestritivas.includes(posicaoNecessariaLower)) {
      // Para goleiro, lateral e zagueiro, só aceita se for exatamente essa posição
      return posicaoJogadorLower === posicaoNecessariaLower ||
             posicaoJogadorLower.includes(posicaoNecessariaLower) ||
             posicaoNecessariaLower.includes(posicaoJogadorLower)
    }
    
    // Mapeamento de compatibilidade para outras posições
    const compatibilidade: Record<string, string[]> = {
      'Volante': ['Volante', 'Meia'],
      'Meia': ['Meia', 'Meia Ofensivo', 'Volante'],
      'Meia Ofensivo': ['Meia Ofensivo', 'Meia', 'Atacante'],
      'Atacante': ['Atacante', 'Meia Ofensivo']
    }
    
    const posicoesCompativeis = compatibilidade[posicaoNecessaria] || [posicaoNecessaria]
    return posicoesCompativeis.some(pos => 
      posicaoJogadorLower.includes(pos.toLowerCase()) ||
      pos.toLowerCase().includes(posicaoJogadorLower)
    )
  }

  // Função para calcular a pontuação de um jogador para uma posição
  const calcularPontuacao = (jogador: Jogador, posicaoNecessaria: string): number => {
    const posicaoJogador = jogador.posicaoCompleta || jogador.posicao
    const posicaoJogadorLower = posicaoJogador.toLowerCase()
    const posicaoNecessariaLower = posicaoNecessaria.toLowerCase()
    
    // Posições restritivas - retorna -Infinity se não for da posição correta
    const posicoesRestritivas = ['goleiro', 'lateral d', 'lateral e', 'zagueiro']
    
    if (posicoesRestritivas.includes(posicaoNecessariaLower)) {
      // Para goleiro, lateral e zagueiro, só aceita se for exatamente essa posição
      const podeJogar = posicaoJogadorLower === posicaoNecessariaLower ||
                       posicaoJogadorLower.includes(posicaoNecessariaLower) ||
                       posicaoNecessariaLower.includes(posicaoJogadorLower)
      
      if (!podeJogar) {
        return -Infinity // Não pode jogar nesta posição
      }
    } else {
      // Para outras posições, verifica compatibilidade
      if (!podeJogarNaPosicao(jogador, posicaoNecessaria)) {
        return -Infinity // Não pode jogar nesta posição
      }
    }
    
    let pontuacao = jogador.overall
    
    // Bônus se a posição é exata
    if (posicaoJogadorLower === posicaoNecessariaLower) {
      pontuacao += 20
    } else if (podeJogarNaPosicao(jogador, posicaoNecessaria)) {
      pontuacao += 10
    }
    
    // Bônus por raridade
    const bonusRaridade: Record<string, number> = {
      'prismatico': 25,
      'lendario': 15,
      'epico': 10,
      'raro': 5,
      'normal': 0
    }
    pontuacao += bonusRaridade[jogador.raridade] || 0
    
    return pontuacao
  }

  // Escalação automática - posiciona cada jogador na posição correta
  const handleEscalacaoAutomatica = () => {
    if (jogadores.length < 11) {
      alert('Você precisa ter pelo menos 11 jogadores para escalação automática!')
      return
    }

    const formacao = clube?.formacao || '4-4-2'
    const posicoesFormacao = obterPosicoesFormacao(formacao)
    
    // Usa todos os jogadores disponíveis (a escalação automática substitui a atual)
    const jogadoresDisponiveis = [...jogadores]
    const novosTitulares: string[] = []
    const novasPosicoes: Record<string, number> = {}
    
    // Para cada posição da formação (11 posições)
    for (let i = 0; i < Math.min(11, posicoesFormacao.length); i++) {
      const posicaoNecessaria = posicoesFormacao[i].posicao
      
      // Encontra o melhor jogador para esta posição específica
      // Filtra apenas jogadores que podem jogar nesta posição
      const jogadoresCompativeis = jogadoresDisponiveis.filter(j => 
        calcularPontuacao(j, posicaoNecessaria) !== -Infinity
      )
      
      if (jogadoresCompativeis.length === 0) {
        // Se não há jogadores compatíveis, usa qualquer um (fallback)
        console.warn(`Nenhum jogador compatível para posição ${posicaoNecessaria}`)
      }
      
      let melhorJogador: Jogador | null = null
      let melhorPontuacao = -Infinity
      let melhorIndex = -1
      
      const listaParaBuscar = jogadoresCompativeis.length > 0 ? jogadoresCompativeis : jogadoresDisponiveis
      
      for (let j = 0; j < listaParaBuscar.length; j++) {
        const jogador = listaParaBuscar[j]
        const pontuacao = calcularPontuacao(jogador, posicaoNecessaria)
        
        if (pontuacao > melhorPontuacao) {
          melhorPontuacao = pontuacao
          melhorJogador = jogador
          melhorIndex = jogadoresDisponiveis.indexOf(jogador)
        }
      }
      
      if (melhorJogador) {
        novosTitulares.push(melhorJogador.id)
        // Posiciona o jogador na posição correta (índice i)
        novasPosicoes[melhorJogador.id] = i
        jogadoresDisponiveis.splice(melhorIndex, 1)
      }
    }
    
    // Limita reservas a 12 jogadores (os melhores restantes)
    const jogadoresRestantes = jogadoresDisponiveis
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 12)
      .map(j => j.id)
    
    // Atualiza o estado
    setTitulares(novosTitulares)
    setReservas(jogadoresRestantes)
    setPosicoesJogadores(novasPosicoes)
    
    alert(`Escalação automática concluída! ${novosTitulares.length} titulares escalados nas posições corretas.`)
  }

  const handleSalvar = async () => {
    if (titulares.length < 11) {
      alert('Você precisa escalar pelo menos 11 titulares!')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    setSalvando(true)

    try {
      const todosJogadores = [...titulares, ...reservas]
      const isTitular = [...titulares.map(() => true), ...reservas.map(() => false)]

      // Ordena titulares pela posição no campo
      const titularesOrdenados = [...titulares].sort((a, b) => {
        const posA = posicoesJogadores[a] ?? 999
        const posB = posicoesJogadores[b] ?? 999
        return posA - posB
      })

      const posicoesArray = [
        ...titularesOrdenados.map(id => posicoesJogadores[id] ?? null),
        ...reservas.map(() => null)
      ]

      const response = await fetch('/api/clube/escalacao', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jogadoresIds: [...titularesOrdenados, ...reservas],
          isTitular: [...titularesOrdenados.map(() => true), ...reservas.map(() => false)],
          posicoes: posicoesArray
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Erro ao salvar escalação:', data)
        alert(data.error || data.details || 'Erro ao salvar escalação')
        return
      }

      alert('Escalação salva com sucesso!')
      fetchData(token)
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

  if (!clube) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-2xl p-6 text-center">
            <p className="text-xl text-gray-800 mb-4">Você precisa criar um clube primeiro!</p>
            <Link
              href="/dashboard/clube"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Criar Clube
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const jogadoresEscalados = [...titulares, ...reservas]
  const jogadoresDisponiveis = jogadores.filter(j => !jogadoresEscalados.includes(j.id))
  const posicoesFormacao = obterPosicoesFormacao(clube?.formacao || '4-4-2')

  const obterJogadorNaPosicao = (posicaoIndex: number) => {
    const jogadorId = Object.keys(posicoesJogadores).find(
      id => posicoesJogadores[id] === posicaoIndex
    )
    return jogadorId ? jogadores.find(j => j.id === jogadorId) : null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">⚽ Escalar Time</h1>
              {clube && (
                <p className="text-gray-600 mt-1">
                  {clube.nome} ({clube.sigla}) - Formação: {clube.formacao}
                </p>
              )}
            </div>
            <Link
              href="/dashboard/clube"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              Voltar
            </Link>
          </div>

          <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-700">
                  💡 Arraste um jogador para uma posição no campo ou clique na posição e depois no jogador. Você precisa de pelo menos 11 titulares.
                </p>
                <p className="text-sm font-semibold mt-2">
                  Titulares: {titulares.length}/11 | Reservas: {reservas.length}/12
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleEscalacaoAutomatica}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                title="Escala automaticamente os melhores jogadores para cada posição"
              >
                ⚡ Escalação Automática
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando || titulares.length < 11}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvando ? 'Salvando...' : 'Salvar Escalação'}
              </button>
            </div>
          </div>

          {poder && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Poder do time</h3>
              <p className="text-sm text-gray-600 mb-2">
                Baseado nos 11 titulares e na compatibilidade das posições (jogador no lugar certo rende mais).
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-3xl font-bold text-blue-700">{poder.forcaTotal}</div>
                <div className="flex gap-3 text-sm">
                  <span title="Goleiro">GK: {poder.forcaGoleiro}</span>
                  <span title="Defesa">DEF: {poder.forcaDefesa}</span>
                  <span title="Meio">MEIO: {poder.forcaMeio}</span>
                  <span title="Ataque">ATA: {poder.forcaAtaque}</span>
                </div>
              </div>
            </div>
          )}

          {/* Campo de Futebol */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Campo - Formação {clube?.formacao}</h2>
              <div className="flex items-center gap-3">
                <label className="text-gray-700 font-semibold">Formação:</label>
                <select
                  value={clube?.formacao || '4-4-2'}
                  onChange={async (e) => {
                    const novaFormacao = e.target.value
                    const token = localStorage.getItem('token')
                    if (!token || !clube) return

                    try {
                      const response = await fetch('/api/clube/criar', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          nome: clube.nome,
                          sigla: clube.sigla,
                          escudo: clube.escudo,
                          formacao: novaFormacao
                        })
                      })

                      const data = await response.json()
                      if (response.ok) {
                        setClube({ ...clube, formacao: novaFormacao })
                        // Limpa as posições quando muda a formação
                        setPosicoesJogadores({})
                        alert('Formação atualizada! Reescale seu time.')
                      } else {
                        alert(data.error || 'Erro ao atualizar formação')
                      }
                    } catch (error) {
                      alert('Erro ao conectar com o servidor')
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {FORMACOES_DISPONIVEIS.map((formacao) => (
                    <option key={formacao} value={formacao}>
                      {formacao}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="relative bg-gradient-to-b from-green-600 to-green-700 rounded-lg overflow-hidden shadow-2xl w-full" style={{ aspectRatio: '16/9', height: '500px' }}>
              {/* Gramado com padrão */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
              }}></div>
              
              {/* Linhas do campo */}
              <div className="absolute inset-0 border-4 border-white">
                {/* Linha central horizontal */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
                
                {/* Círculo central */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full"></div>
                
                {/* Área do gol esquerda - Grande */}
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-40 h-3/4 border-2 border-white border-r-0"></div>
                {/* Área do gol esquerda - Pequena */}
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-24 h-1/3 border-2 border-white border-r-0"></div>
                {/* Gol esquerdo */}
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-8 h-20 border-2 border-white border-r-0 bg-white bg-opacity-20"></div>
                
                {/* Área do gol direita - Grande */}
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-40 h-3/4 border-2 border-white border-l-0"></div>
                {/* Área do gol direita - Pequena */}
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-24 h-1/3 border-2 border-white border-l-0"></div>
                {/* Gol direito */}
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-8 h-20 border-2 border-white border-l-0 bg-white bg-opacity-20"></div>
                
                {/* Linhas laterais (meio campo) */}
                <div className="absolute top-0 bottom-0 left-1/4 w-0.5 bg-white opacity-50"></div>
                <div className="absolute top-0 bottom-0 right-1/4 w-0.5 bg-white opacity-50"></div>
              </div>

              {/* Posições dos jogadores */}
              {posicoesFormacao.map((pos, index) => {
                const jogador = obterJogadorNaPosicao(index)
                return (
                  <div
                    key={index}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onClick={() => {
                      if (jogadorSelecionado) {
                        handlePosicionarJogador(jogadorSelecionado, index)
                        setJogadorSelecionado(null)
                      } else if (jogador) {
                        setJogadorSelecionado(jogador.id)
                      }
                    }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                      jogadorSelecionado === jogador?.id ? 'ring-4 ring-blue-500' : ''
                    } ${jogador ? 'hover:scale-110' : 'hover:scale-105'} ${
                      jogadorArrastando ? 'ring-2 ring-yellow-400' : ''
                    }`}
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`
                    }}
                  >
                    {jogador ? (
                      <div className="relative group">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xl border-white transition-transform hover:scale-110"
                          style={{ 
                            backgroundColor: CORES_RARIDADE[jogador.raridade as keyof typeof CORES_RARIDADE] || '#9CA3AF',
                            borderWidth: '3px'
                          }}
                          title={`${jogador.nome} - ${jogador.posicaoCompleta || jogador.posicao} (${jogador.overall})`}
                        >
                          {jogador.overall}
                        </div>
                        <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 whitespace-nowrap max-w-[100px] opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <div className="bg-black bg-opacity-90 text-white text-xs px-2 py-1 rounded text-center shadow-lg">
                            {jogador.nome}
                          </div>
                        </div>
                        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap max-w-[100px]">
                          <div className="bg-black bg-opacity-60 text-white text-[10px] px-1.5 py-0.5 rounded text-center truncate">
                            {jogador.nome.split(' ').slice(0, 2).join(' ')}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-white bg-white bg-opacity-10 flex items-center justify-center text-white text-[10px] text-center px-1 hover:bg-opacity-20 transition">
                        <span className="truncate">{pos.posicao}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Titulares */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Titulares ({titulares.length}/11)</h2>
              <div className="space-y-2 h-[400px] overflow-y-auto border-2 border-green-300 rounded-lg p-4 bg-green-50">
                {titulares.map((jogadorId) => {
                  const jogador = jogadores.find(j => j.id === jogadorId)
                  if (!jogador) return null
                  const posicaoIndex = posicoesJogadores[jogadorId]
                  return (
                    <div 
                      key={jogadorId}
                      draggable
                      onDragStart={(e) => handleDragStart(e, jogadorId)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white rounded-lg p-3 shadow flex items-center justify-between cursor-move transition ${
                        jogadorSelecionado === jogadorId ? 'ring-2 ring-blue-500' : ''
                      } hover:shadow-lg`}
                      onClick={() => setJogadorSelecionado(jogadorSelecionado === jogadorId ? null : jogadorId)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                          style={{ backgroundColor: CORES_RARIDADE[jogador.raridade as keyof typeof CORES_RARIDADE] || '#9CA3AF' }}
                        >
                          ⚽
                        </div>
                        <div>
                          <p className="font-semibold">{jogador.nome}</p>
                          <p className="text-sm text-gray-600">
                            {jogador.posicaoCompleta || jogador.posicao} - {jogador.overall}
                            {posicaoIndex !== undefined && ` (Posição ${posicaoIndex + 1})`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMoverParaReserva(jogadorId)
                          }}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Reserva
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemover(jogadorId)
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Reservas */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Reservas ({reservas.length}/12)</h2>
              <div className="space-y-2 h-[400px] overflow-y-auto border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
                {reservas.slice(0, 12).map((jogadorId) => {
                  const jogador = jogadores.find(j => j.id === jogadorId)
                  if (!jogador) return null
                  return (
                    <div 
                      key={jogadorId} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, jogadorId)}
                      onDragEnd={handleDragEnd}
                      className="bg-white rounded-lg p-3 shadow flex items-center justify-between cursor-move hover:shadow-lg transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                          style={{ backgroundColor: CORES_RARIDADE[jogador.raridade as keyof typeof CORES_RARIDADE] || '#9CA3AF' }}
                        >
                          ⚽
                        </div>
                        <div>
                          <p className="font-semibold">{jogador.nome}</p>
                          <p className="text-sm text-gray-600">{jogador.posicaoCompleta || jogador.posicao} - {jogador.overall}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMoverParaTitular(jogadorId)}
                          disabled={titulares.length >= 11}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          Titular
                        </button>
                        <button
                          onClick={() => handleRemover(jogadorId)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Jogadores Disponíveis */}
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Jogadores Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {jogadoresDisponiveis.map((jogador) => (
                <div 
                  key={jogador.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, jogador.id)}
                  onDragEnd={handleDragEnd}
                  className="bg-gray-50 rounded-lg p-3 shadow flex items-center justify-between cursor-move hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                      style={{ backgroundColor: CORES_RARIDADE[jogador.raridade as keyof typeof CORES_RARIDADE] || '#9CA3AF' }}
                    >
                      ⚽
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{jogador.nome}</p>
                      <p className="text-xs text-gray-600">{jogador.posicaoCompleta || jogador.posicao} - {jogador.overall}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMoverParaTitular(jogador.id)}
                    disabled={titulares.length >= 11}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
