'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CORES_RARIDADE } from '@backend/lib/gacha'
import { obterPosicoesFormacao } from '@backend/lib/formacoes'

interface EventoPartida {
  minuto: number
  tipo: 'gol' | 'cartao-amarelo' | 'cartao-vermelho' | 'substituicao' | 'chute' | 'defesa' | 'falta' | 'escanteio' | 'lateral'
  jogador: string
  time: 1 | 2
  detalhes?: string
}

export default function PartidasPage() {
  const router = useRouter()
  const [jogando, setJogando] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [tecnicoOverall, setTecnicoOverall] = useState(50)
  
  // Estados do jogo em tempo real
  const [tempoDecorrido, setTempoDecorrido] = useState(0) // 0-60 segundos
  const [pausado, setPausado] = useState(false)
  const [eventosMostrados, setEventosMostrados] = useState<EventoPartida[]>([])
  const [placar, setPlacar] = useState({ time1: 0, time2: 0 })
  const [estatisticas, setEstatisticas] = useState<any>(null)
  const [noIntervalo, setNoIntervalo] = useState(false)
  const [eventosCompletos, setEventosCompletos] = useState<EventoPartida[]>([])
  const [detalhesPartida, setDetalhesPartida] = useState<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const eventosMostradosRef = useRef<EventoPartida[]>([])
  
  // Estados do modal de escalação
  const [mostrarModalEscalacao, setMostrarModalEscalacao] = useState(false)
  const [jogadores, setJogadores] = useState<any[]>([])
  const [clube, setClube] = useState<any>(null)
  const [titulares, setTitulares] = useState<string[]>([])
  const [reservas, setReservas] = useState<string[]>([])
  const [posicoesJogadores, setPosicoesJogadores] = useState<Record<string, number>>({})
  const [salvandoEscalacao, setSalvandoEscalacao] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchUserData(token)
  }, [router])

  useEffect(() => {
    if (jogando && !pausado && !noIntervalo) {
      intervalRef.current = setInterval(() => {
        setTempoDecorrido(prev => {
          const novo = Math.min(prev + 0.1, 60)
          
          // Verifica se chegou no intervalo (30 segundos = primeiro tempo)
          if (novo >= 30 && prev < 30 && !noIntervalo) {
            setNoIntervalo(true)
            setPausado(true)
            return novo
          }
          
          // Verifica eventos que devem aparecer
          if (detalhesPartida && detalhesPartida.eventos) {
            const eventosParaAdicionar: EventoPartida[] = []
            
            detalhesPartida.eventos.forEach((e: EventoPartida) => {
              // Converte minuto do jogo (1-90) para tempo decorrido (0-60 segundos)
              const tempoEvento = (e.minuto / 90) * 60
              
              // Verifica se já foi mostrado usando uma chave única
              const chaveEvento = `${e.minuto}-${e.jogador}-${e.tipo}-${e.time}`
              const jaMostrado = eventosMostradosRef.current.some(ev => 
                `${ev.minuto}-${ev.jogador}-${ev.tipo}-${ev.time}` === chaveEvento
              )
              
              // Verifica se o evento deve aparecer agora (entre prev e novo) e ainda não foi mostrado
              if (tempoEvento > prev && tempoEvento <= novo && !jaMostrado) {
                eventosParaAdicionar.push(e)
              }
            })
            
            // Adiciona eventos um por vez com delay
            if (eventosParaAdicionar.length > 0) {
              eventosParaAdicionar.forEach((e, idx) => {
                setTimeout(() => {
                  // Verifica novamente se já foi adicionado (evita race condition)
                  const chaveEvento = `${e.minuto}-${e.jogador}-${e.tipo}-${e.time}`
                  const jaAdicionado = eventosMostradosRef.current.some(ev => 
                    `${ev.minuto}-${ev.jogador}-${ev.tipo}-${ev.time}` === chaveEvento
                  )
                  
                  if (!jaAdicionado) {
                    eventosMostradosRef.current.push(e)
                    setEventosMostrados([...eventosMostradosRef.current])
                    
                    // Atualiza placar se for gol
                    if (e.tipo === 'gol') {
                      setPlacar(prev => ({
                        time1: e.time === 1 ? prev.time1 + 1 : prev.time1,
                        time2: e.time === 2 ? prev.time2 + 1 : prev.time2
                      }))
                    }
                  }
                }, idx * 200) // Delay de 200ms entre eventos
              })
            }
          }
          
          // Verifica se terminou o jogo
          if (novo >= 60) {
            setPausado(true)
          }
          
          return novo
        })
      }, 100) // Atualiza a cada 100ms
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [jogando, pausado, noIntervalo, detalhesPartida])

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch('/api/user', {
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
      setTecnicoOverall(data.user.tecnicoOverall || 50)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    }
  }

  const carregarDadosEscalacao = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const [jogadoresRes, clubeRes] = await Promise.all([
        fetch('/api/jogadores', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/clube/obter', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (!jogadoresRes.ok || !clubeRes.ok) return

      const jogadoresData = await jogadoresRes.json()
      const clubeData = await clubeRes.json()

      setJogadores(jogadoresData.jogadores.filter((j: any) => !j.emLeilao))
      
      if (clubeData.clube) {
        setClube(clubeData.clube)
        const escalados = clubeData.clube.escalacao || []
        const tit = escalados.filter((e: any) => e.isTitular).map((e: any) => e.jogadorId)
        const res = escalados.filter((e: any) => !e.isTitular).map((e: any) => e.jogadorId)
        setTitulares(tit)
        setReservas(res)
        
        const posicoes: Record<string, number> = {}
        escalados.forEach((e: any) => {
          if (e.isTitular && e.posicao) {
            posicoes[e.jogadorId] = e.posicao - 1
          }
        })
        setPosicoesJogadores(posicoes)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }, [])

  const abrirModalEscalacao = async () => {
    await carregarDadosEscalacao()
    setMostrarModalEscalacao(true)
  }

  const salvarEscalacao = async () => {
    if (titulares.length < 11) {
      alert('Você precisa escalar pelo menos 11 titulares!')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    setSalvandoEscalacao(true)

    try {
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
        alert(data.error || 'Erro ao salvar escalação')
        return
      }

      alert('Escalação salva com sucesso!')
      setMostrarModalEscalacao(false)
      await carregarDadosEscalacao() // Recarrega os dados
    } catch (error) {
      alert('Erro ao conectar com o servidor')
    } finally {
      setSalvandoEscalacao(false)
    }
  }

  const iniciarJogo = (dadosPartida: any) => {
    setDetalhesPartida(dadosPartida.detalhes)
    setEventosCompletos(dadosPartida.detalhes.eventos || [])
    setEstatisticas(dadosPartida.detalhes.estatisticas)
    setPlacar({ time1: 0, time2: 0 })
    eventosMostradosRef.current = []
    setEventosMostrados([])
    setTempoDecorrido(0)
    setNoIntervalo(false)
    setPausado(false)
    setJogando(true)
  }

  const continuarSegundoTempo = () => {
    setNoIntervalo(false)
    setPausado(false)
  }

  const handleJogarBot = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    setJogando(false)
    setResultado(null)

    try {
      const response = await fetch('/api/partidas/bot', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Erro ao jogar partida')
        return
      }

      setResultado(data)
      iniciarJogo(data)
      await fetchUserData(token)
    } catch (error) {
      alert('Erro ao conectar com o servidor')
    }
  }

  const handleJogarRanqueado = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    setJogando(false)
    setResultado(null)

    try {
      const response = await fetch('/api/partidas/ranqueado', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Erro ao jogar partida')
        return
      }

      setResultado(data)
      iniciarJogo(data)
      await fetchUserData(token)
    } catch (error) {
      alert('Erro ao conectar com o servidor')
    }
  }

  const formatarTempo = (segundos: number) => {
    if (segundos < 30) {
      return `${Math.floor(segundos)}'`
    } else {
      return `${Math.floor(segundos - 30)}'`
    }
  }

  const obterTempoJogo = () => {
    if (tempoDecorrido < 30) {
      return { tempo: Math.floor(tempoDecorrido), periodo: 1 }
    } else {
      return { tempo: Math.floor(tempoDecorrido - 30), periodo: 2 }
    }
  }

  const tempoJogo = obterTempoJogo()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">⚽ Partidas</h1>
            <Link
              href="/dashboard"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              Voltar
            </Link>
          </div>

          {!jogando && !resultado && (
            <>
              <div className="mb-6 p-4 bg-purple-100 rounded-lg">
                <p className="text-gray-700 font-semibold mb-1">Overall do Técnico</p>
                <p className="text-3xl font-bold text-purple-700">{tecnicoOverall}</p>
                <p className="text-sm text-gray-600 mt-2">
                  💡 Seu overall sobe com vitórias e desce com derrotas! (Apenas em partidas ranqueadas)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">🤖 Jogar contra Bot</h2>
                  <p className="text-gray-600 mb-4">
                    Jogue uma partida contra um bot. Perfeito para treinar!
                  </p>
                  <button
                    onClick={handleJogarBot}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    Jogar contra Bot
                  </button>
                </div>

                <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">🏆 Partida Ranqueada</h2>
                  <p className="text-gray-600 mb-4">
                    Jogue contra outro jogador com overall similar. Ganhe para subir seu ranking!
                  </p>
                  <button
                    onClick={handleJogarRanqueado}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    Jogar Ranqueado
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-2">ℹ️ Como Funciona:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Você precisa de pelo menos 11 jogadores para jogar</li>
                  <li>• A força do seu time é calculada pela média dos overalls dos seus 11 melhores jogadores</li>
                  <li>• O overall do técnico também influencia no resultado</li>
                  <li>• Vitórias aumentam seu overall de técnico (+1 ponto) - apenas em partidas ranqueadas</li>
                  <li>• Derrotas diminuem seu overall de técnico (-1 ponto) - apenas em partidas ranqueadas</li>
                </ul>
              </div>
            </>
          )}

          {/* Jogo em Tempo Real */}
          {jogando && detalhesPartida && (
            <div className="space-y-6">
              {/* Timer e Placar */}
              <div className="text-center relative">
                <div className="mb-4">
                  <div className="text-4xl font-bold text-gray-800 mb-2">
                    {tempoJogo.tempo}' - {tempoJogo.periodo}º Tempo
                  </div>
                  {pausado && !noIntervalo && (
                    <p className="text-yellow-600 font-semibold">⏸️ PAUSADO</p>
                  )}
                </div>

                {/* Placar Centralizado */}
                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="text-center">
                    <div className="w-20 h-20 flex items-center justify-center mb-2 mx-auto">
                      {detalhesPartida.clube1?.escudo ? (
                        <img
                          src={`/api/escudos/${detalhesPartida.clube1.escudo}`}
                          alt={detalhesPartida.clube1.nome}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-4xl">
                          ⚽
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-lg">{detalhesPartida.clube1?.nome || 'Seu Clube'}</p>
                    <p className="text-sm text-gray-600">{detalhesPartida.clube1?.sigla || 'CLB'}</p>
                  </div>
                  
                  <div className="text-6xl font-bold text-gray-800">
                    {placar.time1} x {placar.time2}
                  </div>
                  
                  <div className="text-center">
                    <div className="w-20 h-20 flex items-center justify-center mb-2 mx-auto">
                      {detalhesPartida.clube2?.escudo ? (
                        <img
                          src={`/api/escudos/${detalhesPartida.clube2.escudo}`}
                          alt={detalhesPartida.clube2.nome}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-4xl">
                          ⚽
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-lg">{detalhesPartida.clube2?.nome || 'Oponente'}</p>
                    <p className="text-sm text-gray-600">{detalhesPartida.clube2?.sigla || 'OPO'}</p>
                  </div>
                </div>
              </div>

              {/* Botão Pausar/Continuar - Fixo no meio (não aparece durante intervalo) */}
              {!noIntervalo && (
                <div className="flex justify-center mb-4">
                  <button
                    onClick={() => setPausado(!pausado)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition text-lg shadow-lg"
                  >
                    {pausado ? '▶️ Continuar' : '⏸️ Pausar'}
                  </button>
                </div>
              )}

              {/* Opção de mudar escalação quando pausado (exceto durante intervalo) */}
              {pausado && !noIntervalo && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">⚙️ Jogo Pausado</h3>
                  <p className="text-gray-700 mb-4 text-center">Você pode alterar sua escalação agora.</p>
                  <div className="text-center">
                    <button
                      onClick={abrirModalEscalacao}
                      className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                    >
                      📋 Mudar Escalação
                    </button>
                  </div>
                </div>
              )}

              {/* Intervalo */}
              {noIntervalo && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">⏸️ INTERVALO</h2>
                  <p className="text-gray-700 mb-4 text-center">Primeiro tempo terminou! Faça suas substituições se necessário.</p>
                  
                    <div className="mb-4 p-4 bg-white rounded-lg">
                    <p className="text-sm text-gray-600 text-center mb-4">
                      💡 Você pode alterar sua escalação agora se desejar.
                    </p>
                    <div className="text-center">
                      <button
                        onClick={abrirModalEscalacao}
                        className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
                      >
                        📋 Mudar Escalação
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={continuarSegundoTempo}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                    >
                      Continuar para o 2º Tempo
                    </button>
                  </div>
                </div>
              )}

              {/* Eventos da Partida */}
              {eventosMostrados.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <h3 className="font-bold text-gray-800 mb-2">📋 Lances da Partida:</h3>
                  <div className="space-y-2">
                    {eventosMostrados.map((evento, idx) => (
                      <div key={idx} className="text-sm">
                        {evento.tipo === 'gol' && (
                          <p className="text-green-700 font-semibold">
                            ⚽ {formatarTempo((evento.minuto / 90) * 60)} - GOOOL! {evento.jogador} ({evento.time === 1 ? detalhesPartida.clube1.sigla : detalhesPartida.clube2.sigla})
                          </p>
                        )}
                        {evento.tipo === 'cartao-amarelo' && (
                          <p className="text-yellow-600">
                            🟨 {formatarTempo((evento.minuto / 90) * 60)} - Cartão Amarelo para {evento.jogador}
                          </p>
                        )}
                        {evento.tipo === 'cartao-vermelho' && (
                          <p className="text-red-600">
                            🟥 {formatarTempo((evento.minuto / 90) * 60)} - Cartão Vermelho para {evento.jogador}
                          </p>
                        )}
                        {evento.tipo === 'substituicao' && (
                          <p className="text-blue-600">
                            🔄 {formatarTempo((evento.minuto / 90) * 60)} - Substituição: {evento.detalhes}
                          </p>
                        )}
                        {evento.tipo === 'chute' && (
                          <p className="text-gray-600">
                            ⚽ {formatarTempo((evento.minuto / 90) * 60)} - Chute de {evento.jogador}
                          </p>
                        )}
                        {evento.tipo === 'defesa' && (
                          <p className="text-gray-600">
                            🛡️ {formatarTempo((evento.minuto / 90) * 60)} - Defesa do goleiro
                          </p>
                        )}
                        {evento.tipo === 'falta' && (
                          <p className="text-orange-600">
                            ⚠️ {formatarTempo((evento.minuto / 90) * 60)} - Falta de {evento.jogador}
                          </p>
                        )}
                        {evento.tipo === 'escanteio' && (
                          <p className="text-gray-600">
                            📐 {formatarTempo((evento.minuto / 90) * 60)} - Escanteio para {evento.time === 1 ? detalhesPartida.clube1.sigla : detalhesPartida.clube2.sigla}
                          </p>
                        )}
                        {evento.tipo === 'lateral' && (
                          <p className="text-gray-600">
                            📏 {formatarTempo((evento.minuto / 90) * 60)} - Lateral para {evento.time === 1 ? detalhesPartida.clube1.sigla : detalhesPartida.clube2.sigla}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estatísticas Centralizadas */}
              {estatisticas && tempoDecorrido >= 60 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">📊 Estatísticas</h3>
                  <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <div className="text-center">
                      <p className="font-semibold mb-2">Posse de Bola</p>
                      <p className="text-xl">{estatisticas.posseBola.time1}% x {estatisticas.posseBola.time2}%</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold mb-2">Finalizações</p>
                      <p className="text-xl">{estatisticas.finalizacoes.time1} x {estatisticas.finalizacoes.time2}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold mb-2">Roubadas de Bola</p>
                      <p className="text-xl">{estatisticas.roubadasBola.time1} x {estatisticas.roubadasBola.time2}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold mb-2">Passes Errados</p>
                      <p className="text-xl">{estatisticas.passesErrados.time1} x {estatisticas.passesErrados.time2}</p>
                    </div>
                    <div className="text-center col-span-2">
                      <p className="font-semibold mb-2">Faltas</p>
                      <p className="text-xl">{estatisticas.faltas.time1} x {estatisticas.faltas.time2}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Gols Centralizados */}
              {eventosMostrados.filter(e => e.tipo === 'gol').length > 0 && tempoDecorrido >= 60 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">⚽ Gols</h3>
                  <div className="space-y-2 max-w-2xl mx-auto">
                    {eventosMostrados
                      .filter(e => e.tipo === 'gol')
                      .map((evento, idx) => (
                        <p key={idx} className="text-center text-gray-700">
                          {formatarTempo((evento.minuto / 90) * 60)}' - {evento.jogador} ({evento.time === 1 ? detalhesPartida.clube1.sigla : detalhesPartida.clube2.sigla})
                        </p>
                      ))}
                  </div>
                </div>
              )}

              {/* Resultado Final */}
              {tempoDecorrido >= 60 && resultado && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 text-center">
                  <h2 className="text-3xl font-bold mb-4">
                    {resultado.vencedorId && resultado.partida && resultado.vencedorId === resultado.partida.jogador1Id 
                      ? '🎉 Vitória!' 
                      : resultado.vencedorId 
                      ? '😔 Derrota' 
                      : '🤝 Empate'}
                  </h2>
                  <p className="text-gray-700 mb-4">
                    {resultado.vencedorId && resultado.partida && resultado.vencedorId === resultado.partida.jogador1Id
                      ? '✅ Parabéns pela vitória!'
                      : resultado.vencedorId
                      ? '❌ Melhor sorte na próxima!'
                      : '⚖️ Empate!'}
                  </p>
                  <button
                    onClick={() => {
                      setJogando(false)
                      setTempoDecorrido(0)
                      eventosMostradosRef.current = []
                      setEventosMostrados([])
                      setPlacar({ time1: 0, time2: 0 })
                      setResultado(null)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                  >
                    Voltar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Escalação */}
      {mostrarModalEscalacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📋 Mudar Escalação</h2>
                <button
                  onClick={() => setMostrarModalEscalacao(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {clube && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>{clube.nome} ({clube.sigla})</strong> - Formação: {clube.formacao}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Titulares: {titulares.length}/11 | Reservas: {reservas.length}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Titulares */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-3">Titulares ({titulares.length}/11)</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {titulares.map((jogadorId) => {
                      const jogador = jogadores.find(j => j.id === jogadorId)
                      if (!jogador) return null
                      return (
                        <div
                          key={jogador.id}
                          className="bg-white p-2 rounded-lg shadow flex items-center justify-between"
                          style={{ borderLeft: `4px solid ${CORES_RARIDADE[jogador.raridade as keyof typeof CORES_RARIDADE]}` }}
                        >
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{jogador.nome}</p>
                            <p className="text-xs text-gray-600">{jogador.posicaoCompleta} ({jogador.overall})</p>
                          </div>
                          <button
                            onClick={() => {
                              setTitulares(titulares.filter(id => id !== jogadorId))
                              setReservas([...reservas, jogadorId])
                              const novasPosicoes = { ...posicoesJogadores }
                              delete novasPosicoes[jogadorId]
                              setPosicoesJogadores(novasPosicoes)
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                          >
                            Remover
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Reservas */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-3">Reservas ({reservas.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {reservas.map((jogadorId) => {
                      const jogador = jogadores.find(j => j.id === jogadorId)
                      if (!jogador) return null
                      return (
                        <div
                          key={jogador.id}
                          className="bg-white p-2 rounded-lg shadow flex items-center justify-between"
                          style={{ borderLeft: `4px solid ${CORES_RARIDADE[jogador.raridade as keyof typeof CORES_RARIDADE]}` }}
                        >
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{jogador.nome}</p>
                            <p className="text-xs text-gray-600">{jogador.posicaoCompleta} ({jogador.overall})</p>
                          </div>
                          <button
                            onClick={() => {
                              if (titulares.length >= 11) {
                                alert('Você já tem 11 titulares! Remova um primeiro.')
                                return
                              }
                              setReservas(reservas.filter(id => id !== jogadorId))
                              setTitulares([...titulares, jogadorId])
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                          >
                            Titular
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Jogadores Disponíveis */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">
                  Jogadores Disponíveis ({jogadores.filter(j => !titulares.includes(j.id) && !reservas.includes(j.id)).length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {jogadores
                    .filter(j => !titulares.includes(j.id) && !reservas.includes(j.id))
                    .map((jogador) => (
                      <div
                        key={jogador.id}
                        className="bg-white p-2 rounded-lg shadow text-sm cursor-pointer hover:bg-gray-50"
                        style={{ borderLeft: `3px solid ${CORES_RARIDADE[jogador.raridade as keyof typeof CORES_RARIDADE]}` }}
                        onClick={() => {
                          if (titulares.length >= 11) {
                            setReservas([...reservas, jogador.id])
                          } else {
                            setTitulares([...titulares, jogador.id])
                          }
                        }}
                      >
                        <p className="font-semibold text-gray-800 text-xs truncate">{jogador.nome}</p>
                        <p className="text-xs text-gray-600">{jogador.posicaoCompleta} ({jogador.overall})</p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => setMostrarModalEscalacao(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarEscalacao}
                  disabled={salvandoEscalacao || titulares.length < 11}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50"
                >
                  {salvandoEscalacao ? 'Salvando...' : 'Salvar Escalação'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
