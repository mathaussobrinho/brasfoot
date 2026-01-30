// Script para gerar imagens temporárias dos jogadores
// Execute com: node scripts/gerar-imagens-temporarias.js
// Requer: npm install canvas

const fs = require('fs')
const path = require('path')

// Cores por raridade
const cores = {
  normal: '#9CA3AF',
  raro: '#3B82F6',
  epico: '#A855F7',
  lendario: '#F59E0B'
}

// Cria o diretório se não existir
const dir = path.join(__dirname, '../public/jogadores')
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

// Gera um SVG simples para cada imagem
function gerarSVG(raridade, numero) {
  const cor = cores[raridade]
  const nomeRaridade = raridade.charAt(0).toUpperCase() + raridade.slice(1)
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="${cor}" opacity="0.3"/>
  <circle cx="100" cy="100" r="60" fill="${cor}"/>
  <text x="100" y="110" font-family="Arial" font-size="60" fill="white" text-anchor="middle">⚽</text>
  <text x="100" y="170" font-family="Arial" font-size="16" fill="white" text-anchor="middle" font-weight="bold">${nomeRaridade}</text>
  <text x="100" y="185" font-family="Arial" font-size="12" fill="white" text-anchor="middle">#${numero}</text>
</svg>`
}

// Gera todas as imagens
const raridades = ['normal', 'raro', 'epico', 'lendario']

raridades.forEach(raridade => {
  for (let i = 1; i <= 5; i++) {
    const svg = gerarSVG(raridade, i)
    const filePath = path.join(dir, `${raridade}-${i}.svg`)
    fs.writeFileSync(filePath, svg)
    console.log(`Criado: ${raridade}-${i}.svg`)
  }
})

console.log('\n✅ Todas as imagens temporárias foram criadas!')
console.log('Nota: As imagens são SVG. Você pode convertê-las para PNG depois ou substituí-las por artes reais.')
