import { prisma } from './prisma'

// Atualiza o overall do técnico baseado em vitória/derrota
export async function atualizarOverallTecnico(userId: string, venceu: boolean) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw new Error('Usuário não encontrado')
  }

  let novoOverall = user.tecnicoOverall

  if (venceu) {
    // Ganha 1 ponto por vitória (máximo 100)
    novoOverall = Math.min(user.tecnicoOverall + 1, 100)
  } else {
    // Perde 1 ponto por derrota (mínimo 0)
    novoOverall = Math.max(user.tecnicoOverall - 1, 0)
  }

  await prisma.user.update({
    where: { id: userId },
    data: { tecnicoOverall: novoOverall }
  })

  return novoOverall
}

// Obtém o overall do técnico
export async function obterOverallTecnico(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tecnicoOverall: true }
  })

  return user?.tecnicoOverall || 50
}
