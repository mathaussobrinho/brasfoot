// Gera escudos SVG únicos e diferentes para cada time

export interface EscudoConfig {
  id: string
  nome: string
  cores: {
    principal: string
    secundaria: string
    detalhe: string
  }
  padrao: 'circulo' | 'retangulo' | 'losango' | 'hexagono'
  simbolo: 'estrela' | 'linhas' | 'x' | 'circulo-central' | 'triangulo'
}

export const ESCUDOS_CONFIG: EscudoConfig[] = [
  { id: 'flamengo', nome: 'Flamengo', cores: { principal: '#C8102E', secundaria: '#000000', detalhe: '#FFD700' }, padrao: 'circulo', simbolo: 'x' },
  { id: 'palmeiras', nome: 'Palmeiras', cores: { principal: '#006847', secundaria: '#FFFFFF', detalhe: '#FFD700' }, padrao: 'retangulo', simbolo: 'estrela' },
  { id: 'corinthians', nome: 'Corinthians', cores: { principal: '#000000', secundaria: '#FFFFFF', detalhe: '#FF0000' }, padrao: 'circulo', simbolo: 'circulo-central' },
  { id: 'santos', nome: 'Santos', cores: { principal: '#FFFFFF', secundaria: '#000000', detalhe: '#FFD700' }, padrao: 'retangulo', simbolo: 'estrela' },
  { id: 'fluminense', nome: 'Fluminense', cores: { principal: '#8B0000', secundaria: '#008000', detalhe: '#FFFFFF' }, padrao: 'losango', simbolo: 'linhas' },
  { id: 'atletico-mg', nome: 'Atlético-MG', cores: { principal: '#000000', secundaria: '#FFFFFF', detalhe: '#FF0000' }, padrao: 'circulo', simbolo: 'x' },
  { id: 'gremio', nome: 'Grêmio', cores: { principal: '#0066CC', secundaria: '#000000', detalhe: '#FFFFFF' }, padrao: 'hexagono', simbolo: 'triangulo' },
  { id: 'internacional', nome: 'Internacional', cores: { principal: '#C8102E', secundaria: '#FFFFFF', detalhe: '#000000' }, padrao: 'circulo', simbolo: 'circulo-central' },
  { id: 'cruzeiro', nome: 'Cruzeiro', cores: { principal: '#0033A0', secundaria: '#FFFFFF', detalhe: '#FFD700' }, padrao: 'losango', simbolo: 'estrela' },
  { id: 'sao-paulo', nome: 'São Paulo', cores: { principal: '#C8102E', secundaria: '#FFFFFF', detalhe: '#000000' }, padrao: 'retangulo', simbolo: 'linhas' },
  { id: 'botafogo', nome: 'Botafogo', cores: { principal: '#000000', secundaria: '#FFFFFF', detalhe: '#FFD700' }, padrao: 'circulo', simbolo: 'estrela' },
  { id: 'vasco', nome: 'Vasco', cores: { principal: '#FFFFFF', secundaria: '#000000', detalhe: '#C8102E' }, padrao: 'retangulo', simbolo: 'x' },
  { id: 'athletico-pr', nome: 'Athletico-PR', cores: { principal: '#C8102E', secundaria: '#000000', detalhe: '#FFFFFF' }, padrao: 'hexagono', simbolo: 'triangulo' },
  { id: 'bahia', nome: 'Bahia', cores: { principal: '#0066CC', secundaria: '#FFD700', detalhe: '#FFFFFF' }, padrao: 'circulo', simbolo: 'estrela' },
  { id: 'fortaleza', nome: 'Fortaleza', cores: { principal: '#C8102E', secundaria: '#FFFFFF', detalhe: '#000000' }, padrao: 'retangulo', simbolo: 'linhas' },
  { id: 'cuiaba', nome: 'Cuiabá', cores: { principal: '#FFD700', secundaria: '#0066CC', detalhe: '#FFFFFF' }, padrao: 'losango', simbolo: 'circulo-central' },
  { id: 'coritiba', nome: 'Coritiba', cores: { principal: '#006847', secundaria: '#FFFFFF', detalhe: '#000000' }, padrao: 'hexagono', simbolo: 'x' },
  { id: 'goias', nome: 'Goiás', cores: { principal: '#0066CC', secundaria: '#FFFFFF', detalhe: '#FFD700' }, padrao: 'circulo', simbolo: 'estrela' },
  { id: 'america-mg', nome: 'América-MG', cores: { principal: '#006847', secundaria: '#FFFFFF', detalhe: '#C8102E' }, padrao: 'retangulo', simbolo: 'triangulo' },
  { id: 'bragantino', nome: 'Bragantino', cores: { principal: '#C8102E', secundaria: '#FFFFFF', detalhe: '#000000' }, padrao: 'losango', simbolo: 'linhas' }
]

// Gera SVG do escudo
export function gerarEscudoSVG(config: EscudoConfig): string {
  const { cores, padrao, simbolo } = config

  let forma = ''
  let clipPath = ''

  switch (padrao) {
    case 'circulo':
      forma = `<circle cx="100" cy="100" r="90" fill="${cores.principal}" stroke="${cores.secundaria}" stroke-width="4"/>`
      clipPath = 'circle(90px at 100px 100px)'
      break
    case 'retangulo':
      forma = `<rect x="20" y="30" width="160" height="140" rx="15" fill="${cores.principal}" stroke="${cores.secundaria}" stroke-width="4"/>`
      clipPath = 'inset(10px round 15px)'
      break
    case 'losango':
      forma = `<polygon points="100,20 180,100 100,180 20,100" fill="${cores.principal}" stroke="${cores.secundaria}" stroke-width="4"/>`
      clipPath = 'polygon(50% 10%, 90% 50%, 50% 90%, 10% 50%)'
      break
    case 'hexagono':
      forma = `<polygon points="100,20 170,60 170,140 100,180 30,140 30,60" fill="${cores.principal}" stroke="${cores.secundaria}" stroke-width="4"/>`
      clipPath = 'polygon(50% 10%, 85% 30%, 85% 70%, 50% 90%, 15% 70%, 15% 30%)'
      break
  }

  let simboloSVG = ''
  switch (simbolo) {
    case 'estrela':
      simboloSVG = `<polygon points="100,40 110,70 140,70 115,90 125,120 100,100 75,120 85,90 60,70 90,70" fill="${cores.detalhe}"/>`
      break
    case 'linhas':
      simboloSVG = `
        <line x1="50" y1="100" x2="150" y2="100" stroke="${cores.detalhe}" stroke-width="6"/>
        <line x1="100" y1="50" x2="100" y2="150" stroke="${cores.detalhe}" stroke-width="6"/>
      `
      break
    case 'x':
      simboloSVG = `
        <line x1="50" y1="50" x2="150" y2="150" stroke="${cores.detalhe}" stroke-width="8"/>
        <line x1="150" y1="50" x2="50" y2="150" stroke="${cores.detalhe}" stroke-width="8"/>
      `
      break
    case 'circulo-central':
      simboloSVG = `<circle cx="100" cy="100" r="40" fill="${cores.detalhe}"/>`
      break
    case 'triangulo':
      simboloSVG = `<polygon points="100,50 150,150 50,150" fill="${cores.detalhe}"/>`
      break
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  ${forma}
  ${simboloSVG}
</svg>`
}

// Obtém configuração do escudo
export function obterEscudoConfig(escudoId: string): EscudoConfig {
  return ESCUDOS_CONFIG.find(e => e.id === escudoId) || ESCUDOS_CONFIG[0]
}
