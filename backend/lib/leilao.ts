import { prisma } from './prisma'
import { addMinutes } from 'date-fns'

// Cria um leilão para um jogador
export async function criarLeilao(jogadorId: string, userId: string, lanceInicial: number) {
  // Verifica se o jogador já está em leilão
  const jogador = await prisma.jogador.findUnique({
    where: { id: jogadorId },
    include: { leilao: true }
  })

  if (!jogador) {
    throw new Error('Jogador não encontrado')
  }

  if (jogador.userId !== userId) {
    throw new Error('Você não é o dono deste jogador')
  }

  if (jogador.emLeilao) {
    throw new Error('Jogador já está em leilão')
  }

  // Cria o leilão (1 minuto após criação)
  const dataFim = addMinutes(new Date(), 1)

  const leilao = await prisma.leilao.create({
    data: {
      jogadorId,
      userId,
      lanceAtual: lanceInicial,
      dataFim
    }
  })

  // Marca o jogador como em leilão
  await prisma.jogador.update({
    where: { id: jogadorId },
    data: { emLeilao: true }
  })

  return leilao
}

// Dá um lance em um leilão
export async function darLance(leilaoId: string, userId: string, valor: number) {
  const leilao = await prisma.leilao.findUnique({
    where: { id: leilaoId },
    include: { jogador: true }
  })

  if (!leilao) {
    throw new Error('Leilão não encontrado')
  }

  if (leilao.vendido) {
    throw new Error('Leilão já foi finalizado')
  }

  if (leilao.userId === userId) {
    throw new Error('Você não pode dar lance no seu próprio leilão')
  }

  if (valor <= leilao.lanceAtual) {
    throw new Error('Lance deve ser maior que o lance atual')
  }

  // Atualiza o leilão
  const dataFim = addMinutes(new Date(), 1) // Reseta o timer para mais 1 minuto

  await prisma.leilao.update({
    where: { id: leilaoId },
    data: {
      lanceAtual: valor,
      userIdLanceAtual: userId,
      dataFim: dataFim
    }
  })

  // Cria o registro do lance
  await prisma.lance.create({
    data: {
      leilaoId,
      userId,
      valor
    }
  })

  return leilao
}

// Finaliza leilões expirados
export async function finalizarLeiloesExpirados() {
  const agora = new Date()

  const leiloesExpirados = await prisma.leilao.findMany({
    where: {
      vendido: false,
      dataFim: {
        lte: agora
      }
    },
    include: {
      jogador: true
    }
  })

  for (const leilao of leiloesExpirados) {
    if (leilao.userIdLanceAtual) {
      // Vende o jogador para quem deu o lance
      await prisma.jogador.update({
        where: { id: leilao.jogadorId },
        data: {
          userId: leilao.userIdLanceAtual,
          emLeilao: false
        }
      })

      // Marca o leilão como vendido
      await prisma.leilao.update({
        where: { id: leilao.id },
        data: { vendido: true }
      })
    } else {
      // Ninguém deu lance, apenas remove do leilão
      await prisma.jogador.update({
        where: { id: leilao.jogadorId },
        data: { emLeilao: false }
      })

      await prisma.leilao.update({
        where: { id: leilao.id },
        data: { vendido: true }
      })
    }
  }

  return leiloesExpirados.length
}

// Remove um jogador do leilão
export async function removerDoLeilao(jogadorId: string, userId: string) {
  const jogador = await prisma.jogador.findUnique({
    where: { id: jogadorId },
    include: { leilao: true }
  })

  if (!jogador) {
    throw new Error('Jogador não encontrado')
  }

  if (jogador.userId !== userId) {
    throw new Error('Você não é o dono deste jogador')
  }

  if (!jogador.emLeilao || !jogador.leilao) {
    throw new Error('Jogador não está em leilão')
  }

  // Remove o leilão
  await prisma.leilao.delete({
    where: { id: jogador.leilao.id }
  })

  // Marca o jogador como não em leilão
  await prisma.jogador.update({
    where: { id: jogadorId },
    data: { emLeilao: false }
  })
}
