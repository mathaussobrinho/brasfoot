import { prisma } from './prisma'

// Preços base por raridade (em R$)
const PRECOS_BASE = {
  normal: 10.0,
  raro: 50.0,
  epico: 200.0,
  lendario: 1000.0
}

// Calcula o preço de venda direta baseado na raridade e quantas pessoas têm o jogador
export async function calcularPrecoVendaDireta(jogadorNome: string, raridade: string): Promise<number> {
  // Conta quantas pessoas têm esse jogador
  const quantidade = await prisma.jogador.count({
    where: {
      nome: jogadorNome,
      raridade: raridade
    }
  })

  const precoBase = PRECOS_BASE[raridade as keyof typeof PRECOS_BASE] || PRECOS_BASE.normal

  // Quanto mais pessoas têm, mais barato fica (máximo 50% de desconto)
  // Mas sempre respeitando a hierarquia de raridade
  const desconto = Math.min(quantidade * 0.05, 0.5) // 5% por pessoa, máximo 50%
  const precoFinal = precoBase * (1 - desconto)

  // Garante que o preço nunca seja menor que o da raridade abaixo
  const raridades = ['normal', 'raro', 'epico', 'lendario']
  const indexAtual = raridades.indexOf(raridade)
  
  if (indexAtual > 0) {
    const raridadeAnterior = raridades[indexAtual - 1]
    const precoMinimo = PRECOS_BASE[raridadeAnterior as keyof typeof PRECOS_BASE] * 1.1 // 10% acima da raridade anterior
    return Math.max(precoFinal, precoMinimo)
  }

  return Math.max(precoFinal, precoBase * 0.5) // Mínimo 50% do preço base
}

// Atualiza o preço de venda direta de um jogador
export async function atualizarPrecoVendaDireta(jogadorId: string) {
  const jogador = await prisma.jogador.findUnique({
    where: { id: jogadorId }
  })

  if (!jogador) return

  const preco = await calcularPrecoVendaDireta(jogador.nome, jogador.raridade)

  await prisma.jogador.update({
    where: { id: jogadorId },
    data: { precoVendaDireta: preco }
  })

  return preco
}
