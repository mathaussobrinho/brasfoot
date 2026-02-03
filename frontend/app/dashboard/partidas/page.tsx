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
  
  // Estados do matchmaking
  const [buscandoOponente, setBuscandoOponente] = useState(false)
  const [matchmakingInterval, setMatchmakingInterval] = useState<NodeJS.Timeout | null>(null)
  
  // Estados do sistema de pausa
  const [pausasRestantes, setPausasRestantes] = useState(3)
  const [pausadoPorOponente, setPausadoPorOponente] = useState(false)
  const [statusPartidaInterval, setStatusPartidaInterval] = useState<NodeJS.Timeout | null>(null)
  
  // Estado para identificar qual time o jogador atual é (1 ou 2)
  const [meuTime, setMeuTime] = useState<1 | 2>(1)
  
  // Estados do sistema de jogadores online
  const [jogadoresOnline, setJogadoresOnline] = useState<any[]>([])
  const [mensagensChat, setMensagensChat] = useState<any[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [enviandoMensagem, setEnviandoMensagem] = useState(false)
  const [mostrarJogadoresOnline, setMostrarJogadoresOnline] = useState(false)
  const chatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
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

    // Verifica se há partida salva no localStorage
    const partidaSalva = localStorage.getItem('partidaEmAndamento')
    if (partidaSalva) {
      try {
        const dadosPartida = JSON.parse(partidaSalva)
        const agora = Date.now()
        const tempoSalvo = dadosPartida.timestamp || 0
        const tempoDecorridoSalvo = dadosPartida.tempoDecorrido || 0
        
        // Calcula tempo decorrido desde que foi salvo
        const tempoDecorridoDesdeSalvo = (agora - tempoSalvo) / 1000 // em segundos
        const novoTempoDecorrido = Math.min(60, tempoDecorridoSalvo + tempoDecorridoDesdeSalvo)
        
        // Restaura estado da partida
        setDetalhesPartida(dadosPartida.detalhes)
        setEventosCompletos(dadosPartida.detalhes.eventos || [])
        setEstatisticas(dadosPartida.detalhes.estatisticas)
        setPlacar(dadosPartida.placar || { time1: 0, time2: 0 })
        setTempoDecorrido(novoTempoDecorrido)
        setNoIntervalo(dadosPartida.noIntervalo || false)
        setPausado(false) // Sempre despausa ao recarregar
        setJogando(true)
        setResultado(dadosPartida.resultado)
        setMeuTime(dadosPartida.meuTime || 1)
        
        // Restaura eventos já mostrados
        if (dadosPartida.eventosMostrados) {
          eventosMostradosRef.current = dadosPartida.eventosMostrados
          setEventosMostrados(dadosPartida.eventosMostrados)
        }
        
        // Se a partida ainda não terminou, continua
        if (novoTempoDecorrido < 60) {
          // Inicia polling do status da partida se for ranqueada
          if (dadosPartida.resultado?.partida?.id) {
            iniciarPollingStatusPartida(dadosPartida.resultado.partida.id)
          }
        }
      } catch (error) {
        console.error('Erro ao restaurar partida:', error)
        localStorage.removeItem('partidaEmAndamento')
      }
    }

    fetchUserData(token)
    
    // Atualiza status online
    atualizarStatusOnline(token)
    
    // Inicia polling de jogadores online e chat
    iniciarPollingJogadoresOnline(token)
    
    return () => {
      // Remove jogador online ao sair
      if (token) {
        fetch('/api/jogadores-online', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {})
      }
      
      if (chatIntervalRef.current) {
        clearInterval(chatIntervalRef.current)
      }
    }
  }, [router])

  // Salva partida no localStorage periodicamente
  useEffect(() => {
    if (jogando && detalhesPartida && resultado) {
      const dadosParaSalvar = {
        detalhes: detalhesPartida,
        placar,
        tempoDecorrido,
        noIntervalo,
        pausado,
        resultado,
        meuTime,
        eventosMostrados: eventosMostradosRef.current,
        timestamp: Date.now()
      }
      localStorage.setItem('partidaEmAndamento', JSON.stringify(dadosParaSalvar))
    } else {
      // Remove partida salva se não estiver jogando
      localStorage.removeItem('partidaEmAndamento')
    }
  }, [jogando, detalhesPartida, placar, tempoDecorrido, noIntervalo, pausado, resultado, meuTime])

  useEffect(() => {
    if (jogando && !pausado && !noIntervalo) {
      intervalRef.current = setInterval(() => {
        setTempoDecorrido(prev => {
          const novo = Math.min(prev + 0.1, 60)
          
          // Verifica se chegou no intervalo (30 segundos = primeiro tempo)
          if (novo >= 30 && prev < 30 && !noIntervalo) {
            setNoIntervalo(true)
            setPausado(true)
            
            // Marca intervalo no servidor se for partida ranqueada
            const partidaId = resultado?.partida?.id
            if (partidaId) {
              const token = localStorage.getItem('token')
              if (token) {
                fetch('/api/partidas/marcar-intervalo', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ partidaId })
                }).catch(() => {})
              }
            }
            
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

  const atualizarStatusOnline = async (token: string) => {
    try {
      await fetch('/api/jogadores-online', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ acao: 'atualizar-online' })
      })
    } catch (error) {
      console.error('Erro ao atualizar status online:', error)
    }
  }

  const iniciarPollingJogadoresOnline = (token: string) => {
    const atualizar = async () => {
      try {
        const response = await fetch('/api/jogadores-online', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setJogadoresOnline(data.jogadores || [])
          setMensagensChat(data.mensagens || [])
        }
      } catch (error) {
        console.error('Erro ao buscar jogadores online:', error)
      }
    }

    atualizar() // Primeira atualização imediata
    chatIntervalRef.current = setInterval(atualizar, 3000) // A cada 3 segundos
  }

  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || enviandoMensagem) return

    const token = localStorage.getItem('token')
    if (!token) return

    setEnviandoMensagem(true)

    try {
      const response = await fetch('/api/jogadores-online', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          acao: 'enviar-mensagem',
          mensagem: novaMensagem
        })
      })

      if (response.ok) {
        setNovaMensagem('')
        // Atualiza mensagens imediatamente
        iniciarPollingJogadoresOnline(token)
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao enviar mensagem')
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor')
    } finally {
      setEnviandoMensagem(false)
    }
  }

  const desafiarJogador = async (oponenteId: string, tipo: 'amistoso' | 'ranqueado') => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('/api/partidas/desafiar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oponenteId,
          tipo
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Erro ao desafiar jogador')
        return
      }

      if (data.partida) {
        setResultado(data.partida)
        iniciarJogo(data.partida)
        await fetchUserData(token)
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor')
    }
  }

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
      // Armazena userId para uso no polling
      if (data.user.id) {
        localStorage.setItem('userId', data.user.id)
      }
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
    setPausasRestantes(3)
    setPausadoPorOponente(false)
    setJogando(true)
    
    // Identifica qual time o jogador atual é
    const userId = localStorage.getItem('userId')
    if (dadosPartida.partida) {
      if (dadosPartida.partida.jogador1Id === userId) {
        setMeuTime(1)
      } else if (dadosPartida.partida.jogador2Id === userId) {
        setMeuTime(2)
      }
    }
    
    // Inicia polling do status da partida se for ranqueada
    if (dadosPartida.partida?.id) {
      iniciarPollingStatusPartida(dadosPartida.partida.id)
    }
  }

  const continuarSegundoTempo = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    const partidaId = resultado?.partida?.id
    if (!partidaId) {
      // Se não for partida ranqueada, apenas continua localmente
      setNoIntervalo(false)
      setPausado(false)
      return
    }

    // Se for partida ranqueada, sincroniza com o servidor
    try {
      const response = await fetch('/api/partidas/continuar-segundo-tempo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ partidaId })
      })

      const data = await response.json()
      
      if (data.sucesso) {
        setNoIntervalo(false)
        setPausado(false)
      }
    } catch (error) {
      console.error('Erro ao continuar segundo tempo:', error)
      // Continua localmente mesmo com erro
      setNoIntervalo(false)
      setPausado(false)
    }
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

    setBuscandoOponente(true)
    setJogando(false)
    setResultado(null)

    try {
      // Entra na fila
      const entrarResponse = await fetch('/api/partidas/matchmaking', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const entrarData = await entrarResponse.json()

      if (!entrarResponse.ok) {
        alert(entrarData.error || 'Erro ao entrar na fila')
        setBuscandoOponente(false)
        return
      }

      // Inicia polling para verificar se encontrou oponente
      const interval = setInterval(async () => {
        try {
          const statusResponse = await fetch('/api/partidas/matchmaking', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          const statusData = await statusResponse.json()

          if (statusData.encontrou && statusData.partida) {
            // Encontrou oponente!
            clearInterval(interval)
            setMatchmakingInterval(null)
            setBuscandoOponente(false)
            
            setResultado(statusData.partida)
            iniciarJogo(statusData.partida)
            
            // Inicia polling do status da partida (para pausa)
            iniciarPollingStatusPartida(statusData.partida.partida?.id)
            
            await fetchUserData(token)
          }
        } catch (error) {
          console.error('Erro ao verificar matchmaking:', error)
        }
      }, 2000) // Verifica a cada 2 segundos

      setMatchmakingInterval(interval)
    } catch (error) {
      alert('Erro ao conectar com o servidor')
      setBuscandoOponente(false)
    }
  }

  const cancelarBusca = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    if (matchmakingInterval) {
      clearInterval(matchmakingInterval)
      setMatchmakingInterval(null)
    }

    try {
      await fetch('/api/partidas/matchmaking', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('Erro ao cancelar busca:', error)
    }

    setBuscandoOponente(false)
  }

  const iniciarPollingStatusPartida = (partidaId: string | undefined) => {
    if (!partidaId) return

    const token = localStorage.getItem('token')
    if (!token) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/partidas/matchmaking?partidaId=${partidaId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()

        if (data.pausado !== undefined) {
          setPausado(data.pausado)
          setPausasRestantes(data.pausasRestantes || 3)
          
          // Se foi pausado por outro jogador
          if (data.pausado && data.pausadoPor) {
            const userId = localStorage.getItem('userId')
            if (data.pausadoPor !== userId) {
              setPausadoPorOponente(true)
            } else {
              setPausadoPorOponente(false)
            }
          } else {
            setPausadoPorOponente(false)
          }
        }
        
        // Sincroniza intervalo
        if (data.noIntervalo !== undefined) {
          setNoIntervalo(data.noIntervalo)
        }
      } catch (error) {
        console.error('Erro ao verificar status da partida:', error)
      }
    }, 1000) // Verifica a cada 1 segundo

    setStatusPartidaInterval(interval)
  }

  const handlePausarPartida = async () => {
    if (pausasRestantes <= 0) {
      alert('Você já usou todas as suas 3 pausas!')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) return

    const partidaId = resultado?.partida?.id
    if (!partidaId) return

    try {
      const response = await fetch('/api/partidas/matchmaking', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          partidaId,
          acao: pausado ? 'despausar' : 'pausar'
        })
      })

      const data = await response.json()

      if (data.sucesso) {
        setPausado(data.pausado)
        setPausasRestantes(data.pausasRestantes || 0)
      } else {
        alert(data.error || 'Erro ao pausar partida')
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor')
    }
  }

  // Limpa intervals ao desmontar
  useEffect(() => {
    return () => {
      if (matchmakingInterval) {
        clearInterval(matchmakingInterval)
      }
      if (statusPartidaInterval) {
        clearInterval(statusPartidaInterval)
      }
    }
  }, [matchmakingInterval, statusPartidaInterval])

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

          {!jogando && !resultado && !buscandoOponente && (
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

              {/* Seção de Jogadores Online */}
              <div className="mb-6 bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                <button
                  onClick={() => setMostrarJogadoresOnline(!mostrarJogadoresOnline)}
                  className="w-full p-4 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-between"
                >
                  <h2 className="text-xl font-bold text-gray-800">
                    👥 Jogadores Online ({jogadoresOnline.length})
                  </h2>
                  <span className="text-2xl">{mostrarJogadoresOnline ? '▼' : '▶'}</span>
                </button>

                {mostrarJogadoresOnline && (
                  <div className="p-4">
                    {/* Chat */}
                    <div className="mb-4 bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <h3 className="font-bold text-gray-800 mb-2">💬 Chat</h3>
                      <div className="space-y-2 mb-3">
                        {mensagensChat.map((msg) => (
                          <div key={msg.id} className="text-sm">
                            <span className="font-semibold text-blue-600">{msg.login}:</span>
                            <span className="text-gray-700 ml-2">{msg.mensagem}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={novaMensagem}
                          onChange={(e) => setNovaMensagem(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
                          placeholder="Digite sua mensagem..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          maxLength={500}
                        />
                        <button
                          onClick={enviarMensagem}
                          disabled={enviandoMensagem || !novaMensagem.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>

                    {/* Lista de Jogadores */}
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2">Jogadores Disponíveis</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {jogadoresOnline.length === 0 ? (
                          <p className="text-gray-500 text-sm">Nenhum jogador online no momento</p>
                        ) : (
                          jogadoresOnline.map((jogador) => {
                            const userId = localStorage.getItem('userId')
                            if (jogador.userId === userId) return null // Não mostra a si mesmo

                            return (
                              <div
                                key={jogador.userId}
                                className="bg-gray-50 p-3 rounded-lg flex items-center justify-between"
                              >
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {jogador.nome} {jogador.sobrenome} (@{jogador.login})
                                  </p>
                                  {jogador.clube && (
                                    <p className="text-sm text-gray-600">
                                      {jogador.clube.nome} ({jogador.clube.sigla}) - Overall: {jogador.tecnicoOverall}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => desafiarJogador(jogador.userId, 'amistoso')}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition"
                                  >
                                    🎮 Amistoso
                                  </button>
                                  <button
                                    onClick={() => desafiarJogador(jogador.userId, 'ranqueado')}
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition"
                                  >
                                    🏆 Ranqueado
                                  </button>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
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

          {/* Tela de busca de oponente */}
          {buscandoOponente && (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-block animate-spin text-6xl mb-4">⚽</div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Procurando jogador...</h2>
                  <p className="text-gray-600">Aguarde enquanto encontramos um oponente para você</p>
                </div>
                
                {/* Animação de pontos */}
                <div className="flex justify-center gap-2 mb-6">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>

                <button
                  onClick={cancelarBusca}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Cancelar Busca
                </button>
              </div>
            </div>
          )}

          {/* Jogo em Tempo Real */}
          {jogando && detalhesPartida && (
            <div className="space-y-6">
              {/* Timer e Placar */}
              <div className="text-center relative">
                <div className="mb-4">
                  <div className="text-4xl font-bold text-gray-800 mb-2">
                    {(() => {
                      const tempo = obterTempoJogo()
                      return `${tempo.tempo}' - ${tempo.periodo}º Tempo`
                    })()}
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

              {/* Botão Pausar/Continuar - Fixo no meio (não aparece durante intervalo ou no final) */}
              {!noIntervalo && tempoDecorrido < 60 && (
                <div className="flex flex-col items-center gap-2 mb-4">
                  <button
                    onClick={handlePausarPartida}
                    disabled={pausado && pausadoPorOponente}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pausado 
                      ? (pausadoPorOponente ? '⏸️ Pausado pelo oponente' : '▶️ Continuar')
                      : '⏸️ Pausar'}
                  </button>
                  {!pausadoPorOponente && (
                    <p className="text-sm text-gray-600">
                      Pausas restantes: {pausasRestantes}/3
                    </p>
                  )}
                </div>
              )}

              {/* Opção de mudar escalação quando pausado (exceto durante intervalo) */}
              {pausado && !noIntervalo && !pausadoPorOponente && (
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
              
              {pausado && pausadoPorOponente && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">⏸️ Jogo Pausado pelo Oponente</h3>
                  <p className="text-gray-700 mb-4 text-center">Aguarde o oponente continuar o jogo...</p>
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
                          <p className={`font-semibold ${evento.time === meuTime ? 'text-green-700' : 'text-red-700'}`}>
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
                        <p key={idx} className={`text-center font-semibold ${evento.time === meuTime ? 'text-green-700' : 'text-red-700'}`}>
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
                      // Limpa intervals
                      if (statusPartidaInterval) {
                        clearInterval(statusPartidaInterval)
                        setStatusPartidaInterval(null)
                      }
                      
                      // Remove partida salva
                      localStorage.removeItem('partidaEmAndamento')
                      
                      setJogando(false)
                      setTempoDecorrido(0)
                      eventosMostradosRef.current = []
                      setEventosMostrados([])
                      setPlacar({ time1: 0, time2: 0 })
                      setResultado(null)
                      setPausado(false)
                      setPausasRestantes(3)
                      setPausadoPorOponente(false)
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
