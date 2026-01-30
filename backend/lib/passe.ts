import { prisma } from '@/lib/prisma'
import { addDays, isAfter, isBefore } from 'date-fns'

// Cria ou renova um passe de temporada (30 dias)
export async function criarPasseTemporada(userId: string) {
  // Verifica se o usuário existe
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw new Error('Usuário não encontrado')
  }

  const agora = new Date()
  const dataFim = addDays(agora, 30)

  const passeExistente = await prisma.passeTemporada.findUnique({
    where: { userId }
  })

  if (passeExistente) {
    // Se já tem passe, renova ou estende
    const dataFimAtual = new Date(passeExistente.dataFim)
    const novoDataFim = isAfter(agora, dataFimAtual) 
      ? addDays(agora, 30) 
      : addDays(dataFimAtual, 30)

    return await prisma.passeTemporada.update({
      where: { userId },
      data: {
        dataFim: novoDataFim,
        ativo: true
      }
    })
  }

  return await prisma.passeTemporada.create({
    data: {
      userId,
      dataFim,
      ativo: true
    }
  })
}

// Verifica se o passe está ativo
export async function verificarPasseAtivo(userId: string): Promise<boolean> {
  // Verifica se o usuário existe
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    return false
  }

  const passe = await prisma.passeTemporada.findUnique({
    where: { userId }
  })

  if (!passe || !passe.ativo) {
    return false
  }

  const agora = new Date()
  const dataFim = new Date(passe.dataFim)

  if (isAfter(agora, dataFim)) {
    // Passe expirado
    await prisma.passeTemporada.update({
      where: { userId },
      data: { ativo: false }
    })
    return false
  }

  return true
}
