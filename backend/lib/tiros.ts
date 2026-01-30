import { prisma } from './prisma'
import { addDays, startOfDay, isAfter, isBefore } from 'date-fns'

const HORA_RESET = 12 // 12:00

// Verifica se precisa resetar os tiros (após 12:00)
export async function verificarResetTiros(userId: string) {
  const agora = new Date()
  const hojeMeioDia = startOfDay(agora)
  hojeMeioDia.setHours(HORA_RESET, 0, 0, 0)

  let tirosDiarios = await prisma.tirosDiarios.findUnique({
    where: { userId }
  })

  if (!tirosDiarios) {
    // Primeira vez - criar registro
    tirosDiarios = await prisma.tirosDiarios.create({
      data: {
        userId,
        tirosUsados: 0,
        tirosComprados: 0,
        ultimoReset: agora
      }
    })
    return tirosDiarios
  }

  const ultimoReset = new Date(tirosDiarios.ultimoReset)
  const ultimoResetMeioDia = startOfDay(ultimoReset)
  ultimoResetMeioDia.setHours(HORA_RESET, 0, 0, 0)

  // Verifica se já passou das 12:00 de hoje E o último reset foi antes das 12:00 de hoje
  const jaPassouMeioDiaHoje = isAfter(agora, hojeMeioDia)
  const ultimoResetFoiAntesDeHoje = isBefore(ultimoResetMeioDia, hojeMeioDia) || 
                                    ultimoResetMeioDia.getTime() < hojeMeioDia.getTime()

  if (jaPassouMeioDiaHoje && ultimoResetFoiAntesDeHoje) {
    // Reset dos tiros
    tirosDiarios = await prisma.tirosDiarios.update({
      where: { userId },
      data: {
        tirosUsados: 0,
        tirosComprados: 0,
        ultimoReset: agora
      }
    })
  }

  return tirosDiarios
}

// Obtém a quantidade de tiros disponíveis
export async function getTirosDisponiveis(userId: string): Promise<number> {
  const tirosDiarios = await verificarResetTiros(userId)
  
  // Verifica se tem passe de temporada ativo
  const passe = await prisma.passeTemporada.findUnique({
    where: { userId },
    include: { user: true }
  })

  const agora = new Date()
  const temPasseAtivo = passe && 
                        passe.ativo && 
                        isAfter(agora, new Date(passe.dataInicio)) && 
                        isBefore(agora, new Date(passe.dataFim))

  const tirosBase = temPasseAtivo ? 10 : 5
  const tirosTotais = tirosBase + tirosDiarios.tirosComprados
  const tirosDisponiveis = tirosTotais - tirosDiarios.tirosUsados

  return Math.max(0, tirosDisponiveis)
}

// Usa um ou múltiplos tiros
export async function usarTiro(userId: string, quantidade: number = 1): Promise<boolean> {
  const tirosDisponiveis = await getTirosDisponiveis(userId)
  
  if (tirosDisponiveis < quantidade) {
    return false
  }

  const tirosDiarios = await verificarResetTiros(userId)
  
  await prisma.tirosDiarios.update({
    where: { userId },
    data: {
      tirosUsados: tirosDiarios.tirosUsados + quantidade
    }
  })

  return true
}

// Adiciona tiros comprados
export async function adicionarTirosComprados(userId: string, quantidade: number) {
  // Garante que o registro existe
  await verificarResetTiros(userId)
  
  // Atualiza os tiros comprados
  const tirosDiarios = await prisma.tirosDiarios.findUnique({
    where: { userId }
  })

  if (!tirosDiarios) {
    // Se ainda não existe, cria
    await prisma.tirosDiarios.create({
      data: {
        userId,
        tirosUsados: 0,
        tirosComprados: quantidade,
        ultimoReset: new Date()
      }
    })
  } else {
    // Atualiza
    await prisma.tirosDiarios.update({
      where: { userId },
      data: {
        tirosComprados: tirosDiarios.tirosComprados + quantidade
      }
    })
  }
}
