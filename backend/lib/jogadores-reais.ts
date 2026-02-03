// Lista de jogadores reais com suas raridades, posições, times e overalls

export interface JogadorReal {
  nome: string
  posicao: string
  posicaoCompleta: string
  timeAtual: string
  raridade: 'normal' | 'raro' | 'epico' | 'lendario' | 'prismatico'
  overall: number
}

// Jogadores Prismáticos (Overall 95-99) - 1% de chance
const JOGADORES_PRISMATICOS: JogadorReal[] = [
  { nome: 'Ronaldinho', posicao: 'Meia', posicaoCompleta: 'Meia Ofensivo', timeAtual: 'Aposentado', raridade: 'prismatico', overall: 97 },
  { nome: 'Ronaldo Fenômeno', posicao: 'Atacante', posicaoCompleta: 'Centroavante', timeAtual: 'Aposentado', raridade: 'prismatico', overall: 98 },
  { nome: 'Kaká', posicao: 'Meia', posicaoCompleta: 'Meia Ofensivo', timeAtual: 'Aposentado', raridade: 'prismatico', overall: 96 },
  { nome: 'Zidane', posicao: 'Meia', posicaoCompleta: 'Meia Central', timeAtual: 'Aposentado', raridade: 'prismatico', overall: 98 },
  { nome: 'Lothar Matthäus', posicao: 'Meia', posicaoCompleta: 'Meia Central', timeAtual: 'Aposentado', raridade: 'prismatico', overall: 96 }
]

// Jogadores Lendários (Overall 86-99)
const JOGADORES_LENDARIOS: JogadorReal[] = [
  { nome: 'Neymar', posicao: 'Atacante', posicaoCompleta: 'Ponta Esquerda', timeAtual: 'Al-Hilal', raridade: 'lendario', overall: 91 },
  { nome: 'Lionel Messi', posicao: 'Atacante', posicaoCompleta: 'Ponta Direita', timeAtual: 'Inter Miami', raridade: 'lendario', overall: 93 },
  { nome: 'Cristiano Ronaldo', posicao: 'Atacante', posicaoCompleta: 'Centroavante', timeAtual: 'Al-Nassr', raridade: 'lendario', overall: 92 },
  { nome: 'Kylian Mbappé', posicao: 'Atacante', posicaoCompleta: 'Ponta Esquerda', timeAtual: 'PSG', raridade: 'lendario', overall: 91 },
  { nome: 'Erling Haaland', posicao: 'Atacante', posicaoCompleta: 'Centroavante', timeAtual: 'Manchester City', raridade: 'lendario', overall: 91 },
  { nome: 'Kevin De Bruyne', posicao: 'Meia', posicaoCompleta: 'Meia Ofensivo', timeAtual: 'Manchester City', raridade: 'lendario', overall: 91 },
  { nome: 'Virgil van Dijk', posicao: 'Zagueiro', posicaoCompleta: 'Zagueiro', timeAtual: 'Liverpool', raridade: 'lendario', overall: 89 },
  { nome: 'Mohamed Salah', posicao: 'Atacante', posicaoCompleta: 'Ponta Direita', timeAtual: 'Liverpool', raridade: 'lendario', overall: 90 },
  { nome: 'Karim Benzema', posicao: 'Atacante', posicaoCompleta: 'Centroavante', timeAtual: 'Al-Ittihad', raridade: 'lendario', overall: 91 },
  { nome: 'Robert Lewandowski', posicao: 'Atacante', posicaoCompleta: 'Centroavante', timeAtual: 'Barcelona', raridade: 'lendario', overall: 91 },
  { nome: 'Luka Modrić', posicao: 'Meia', posicaoCompleta: 'Meia Central', timeAtual: 'Real Madrid', raridade: 'lendario', overall: 88 },
  { nome: 'Manuel Neuer', posicao: 'Goleiro', posicaoCompleta: 'Goleiro', timeAtual: 'Bayern Munich', raridade: 'lendario', overall: 90 },
  { nome: 'Thibaut Courtois', posicao: 'Goleiro', posicaoCompleta: 'Goleiro', timeAtual: 'Real Madrid', raridade: 'lendario', overall: 90 },
  { nome: 'Alisson', posicao: 'Goleiro', posicaoCompleta: 'Goleiro', timeAtual: 'Liverpool', raridade: 'lendario', overall: 89 },
  { nome: 'Casemiro', posicao: 'Volante', posicaoCompleta: 'Volante', timeAtual: 'Manchester United', raridade: 'lendario', overall: 89 },
  { nome: 'Rodri', posicao: 'Volante', posicaoCompleta: 'Volante', timeAtual: 'Manchester City', raridade: 'lendario', overall: 88 },
  { nome: 'Joshua Kimmich', posicao: 'Volante', posicaoCompleta: 'Volante', timeAtual: 'Bayern Munich', raridade: 'lendario', overall: 88 },
  { nome: 'Toni Kroos', posicao: 'Meia', posicaoCompleta: 'Meia Central', timeAtual: 'Real Madrid', raridade: 'lendario', overall: 88 },
  { nome: 'Marquinhos', posicao: 'Zagueiro', posicaoCompleta: 'Zagueiro', timeAtual: 'PSG', raridade: 'lendario', overall: 88 },
  { nome: 'Rúben Dias', posicao: 'Zagueiro', posicaoCompleta: 'Zagueiro', timeAtual: 'Manchester City', raridade: 'lendario', overall: 88 }
]

// Jogadores Épicos (Overall 76-85)
const JOGADORES_EPICOS: JogadorReal[] = [
  { nome: 'Vinicius Jr', posicao: 'Atacante', posicaoCompleta: 'Ponta Esquerda', timeAtual: 'Real Madrid', raridade: 'epico', overall: 86 },
  { nome: 'Phil Foden', posicao: 'Meia', posicaoCompleta: 'Meia Ofensivo', timeAtual: 'Manchester City', raridade: 'epico', overall: 85 },
  { nome: 'Jude Bellingham', posicao: 'Meia', posicaoCompleta: 'Meia Central', timeAtual: 'Real Madrid', raridade: 'epico', overall: 86 },
  { nome: 'Pedri', posicao: 'Meia', posicaoCompleta: 'Meia Central', timeAtual: 'Barcelona', raridade: 'epico', overall: 85 },
  { nome: 'Federico Valverde', posicao: 'Meia', posicaoCompleta: 'Meia Central', timeAtual: 'Real Madrid', raridade: 'epico', overall: 85 },
  { nome: 'Antoine Griezmann', posicao: 'Atacante', posicaoCompleta: 'Segundo Atacante', timeAtual: 'Atlético Madrid', raridade: 'epico', overall: 85 },
  { nome: 'Son Heung-min', posicao: 'Atacante', posicaoCompleta: 'Ponta Esquerda', timeAtual: 'Tottenham', raridade: 'epico', overall: 87 },
  { nome: 'Sadio Mané', posicao: 'Atacante', posicaoCompleta: 'Ponta Esquerda', timeAtual: 'Al-Nassr', raridade: 'epico', overall: 86 },
  { nome: 'Raphael Varane', posicao: 'Zagueiro', posicaoCompleta: 'Zagueiro', timeAtual: 'Manchester United', raridade: 'epico', overall: 84 },
  { nome: 'Aymeric Laporte', posicao: 'Zagueiro', posicaoCompleta: 'Zagueiro', timeAtual: 'Al-Nassr', raridade: 'epico', overall: 85 },
  { nome: 'Achraf Hakimi', posicao: 'Lateral', posicaoCompleta: 'Lateral D', timeAtual: 'PSG', raridade: 'epico', overall: 85 },
  { nome: 'Trent Alexander-Arnold', posicao: 'Lateral', posicaoCompleta: 'Lateral D', timeAtual: 'Liverpool', raridade: 'epico', overall: 86 },
  { nome: 'Andrew Robertson', posicao: 'Lateral', posicaoCompleta: 'Lateral E', timeAtual: 'Liverpool', raridade: 'epico', overall: 85 },
  { nome: 'Ederson', posicao: 'Goleiro', posicaoCompleta: 'Goleiro', timeAtual: 'Manchester City', raridade: 'epico', overall: 89 },
  { nome: 'Marc-André ter Stegen', posicao: 'Goleiro', posicaoCompleta: 'Goleiro', timeAtual: 'Barcelona', raridade: 'epico', overall: 88 },
  { nome: 'Bruno Fernandes', posicao: 'Meia', posicaoCompleta: 'Meia Ofensivo', timeAtual: 'Manchester United', raridade: 'epico', overall: 86 },
  { nome: 'Bernardo Silva', posicao: 'Meia', posicaoCompleta: 'Meia Ofensivo', timeAtual: 'Manchester City', raridade: 'epico', overall: 86 },
  { nome: 'Lautaro Martínez', posicao: 'Atacante', posicaoCompleta: 'Centroavante', timeAtual: 'Inter Milan', raridade: 'epico', overall: 85 },
  { nome: 'Romelu Lukaku', posicao: 'Atacante', posicaoCompleta: 'Centroavante', timeAtual: 'Roma', raridade: 'epico', overall: 84 },
  { nome: 'Harry Kane', posicao: 'Atacante', posicaoCompleta: 'Centroavante', timeAtual: 'Bayern Munich', raridade: 'epico', overall: 90 },
  { nome: 'Gabriel Jesus', posicao: 'Atacante', posicaoCompleta: 'Centroavante', timeAtual: 'Arsenal', raridade: 'epico', overall: 83 },
  { nome: 'Richarlison', posicao: 'Atacante', posicaoCompleta: 'Ponta Esquerda', timeAtual: 'Tottenham', raridade: 'epico', overall: 81 },
  { nome: 'Raphinha', posicao: 'Atacante', posicaoCompleta: 'Ponta Direita', timeAtual: 'Barcelona', raridade: 'epico', overall: 82 },
  { nome: 'Fabinho', posicao: 'Volante', posicaoCompleta: 'Volante', timeAtual: 'Al-Ittihad', raridade: 'epico', overall: 84 }
]

// Jogadores Raros (Overall 66-75)
const JOGADORES_RAROS: JogadorReal[] = [
  { nome: 'Gabriel Martinelli', posicao: 'Atacante', posicaoCompleta: 'Ponta Esquerda', timeAtual: 'Arsenal', raridade: 'raro', overall: 80 },
  { nome: 'Bukayo Saka', posicao: 'Atacante', posicaoCompleta: 'Ponta Direita', timeAtual: 'Arsenal', raridade: 'raro', overall: 82 },
  { nome: 'Martin Ødegaard', posicao: 'Meia', posicaoCompleta: 'Meia Ofensivo', timeAtual: 'Arsenal', raridade: 'raro', overall: 83 },
  { nome: 'Declan Rice', posicao: 'Volante', posicaoCompleta: 'Volante', timeAtual: 'Arsenal', raridade: 'raro', overall: 82 },
  { nome: 'William Saliba', posicao: 'Zagueiro', posicaoCompleta: 'Zagueiro', timeAtual: 'Arsenal', raridade: 'raro', overall: 81 },
  { nome: 'Rafael Leão', posicao: 'Atacante', posicaoCompleta: 'Ponta Esquerda', timeAtual: 'AC Milan', raridade: 'raro', overall: 84 },
  { nome: 'João Félix', posicao: 'Atacante', posicaoCompleta: 'Ponta Esquerda', timeAtual: 'Barcelona', raridade: 'raro', overall: 81 },
  { nome: 'Rúben Neves', posicao: 'Volante', posicaoCompleta: 'Volante', timeAtual: 'Al-Hilal', raridade: 'raro', overall: 82 },
  { nome: 'Diogo Jota', posicao: 'Atacante', posicaoCompleta: 'Ponta Esquerda', timeAtual: 'Liverpool', raridade: 'raro', overall: 82 },
  { nome: 'Darwin Núñez', posicao: 'Atacante', posicaoCompleta: 'Centroavante', timeAtual: 'Liverpool', raridade: 'raro', overall: 81 },
  { nome: 'Luis Díaz', posicao: 'Atacante', posicaoCompleta: 'Ponta Esquerda', timeAtual: 'Liverpool', raridade: 'raro', overall: 82 },
  { nome: 'Rodrygo', posicao: 'Atacante', posicaoCompleta: 'Ponta Direita', timeAtual: 'Real Madrid', raridade: 'raro', overall: 83 },
  { nome: 'Eder Militão', posicao: 'Zagueiro', posicaoCompleta: 'Zagueiro', timeAtual: 'Real Madrid', raridade: 'raro', overall: 84 },
  { nome: 'David Alaba', posicao: 'Zagueiro', posicaoCompleta: 'Zagueiro', timeAtual: 'Real Madrid', raridade: 'raro', overall: 85 },
  { nome: 'Ferland Mendy', posicao: 'Lateral', posicaoCompleta: 'Lateral E', timeAtual: 'Real Madrid', raridade: 'raro', overall: 81 },
  { nome: 'Federico Chiesa', posicao: 'Atacante', posicaoCompleta: 'Ponta Direita', timeAtual: 'Juventus', raridade: 'raro', overall: 81 },
  { nome: 'Nicolò Barella', posicao: 'Meia', posicaoCompleta: 'Meia Central', timeAtual: 'Inter Milan', raridade: 'raro', overall: 84 },
  { nome: 'Sandro Tonali', posicao: 'Volante', posicaoCompleta: 'Volante', timeAtual: 'Newcastle', raridade: 'raro', overall: 80 },
  { nome: 'Theo Hernández', posicao: 'Lateral', posicaoCompleta: 'Lateral E', timeAtual: 'AC Milan', raridade: 'raro', overall: 84 },
  { nome: 'Mike Maignan', posicao: 'Goleiro', posicaoCompleta: 'Goleiro', timeAtual: 'AC Milan', raridade: 'raro', overall: 87 },
  { nome: 'Gianluigi Donnarumma', posicao: 'Goleiro', posicaoCompleta: 'Goleiro', timeAtual: 'PSG', raridade: 'raro', overall: 88 },
  { nome: 'Jules Koundé', posicao: 'Zagueiro', posicaoCompleta: 'Zagueiro', timeAtual: 'Barcelona', raridade: 'raro', overall: 83 },
  { nome: 'Aurélien Tchouaméni', posicao: 'Volante', posicaoCompleta: 'Volante', timeAtual: 'Real Madrid', raridade: 'raro', overall: 83 },
  { nome: 'Eduardo Camavinga', posicao: 'Meia', posicaoCompleta: 'Meia Central', timeAtual: 'Real Madrid', raridade: 'raro', overall: 80 },
  { nome: 'Ousmane Dembélé', posicao: 'Atacante', posicaoCompleta: 'Ponta Direita', timeAtual: 'PSG', raridade: 'raro', overall: 83 }
]

// Jogadores Normais (Overall 50-65)
const JOGADORES_NORMAIS: JogadorReal[] = [
  { nome: 'Gabriel Magalhães', posicao: 'Zagueiro', posicaoCompleta: 'Zagueiro', timeAtual: 'Arsenal', raridade: 'normal', overall: 79 },
  { nome: 'Ben White', posicao: 'Zagueiro', posicaoCompleta: 'Zagueiro', timeAtual: 'Arsenal', raridade: 'normal', overall: 78 },
  { nome: 'Oleksandr Zinchenko', posicao: 'Lateral', posicaoCompleta: 'Lateral E', timeAtual: 'Arsenal', raridade: 'normal', overall: 78 },
  { nome: 'Takehiro Tomiyasu', posicao: 'Lateral', posicaoCompleta: 'Lateral D', timeAtual: 'Arsenal', raridade: 'normal', overall: 76 },
  { nome: 'Thomas Partey', posicao: 'Volante', posicaoCompleta: 'Volante', timeAtual: 'Arsenal', raridade: 'normal', overall: 80 },
  { nome: 'Jorginho', posicao: 'Volante', posicaoCompleta: 'Volante', timeAtual: 'Arsenal', raridade: 'normal', overall: 81 },
  { nome: 'Emile Smith Rowe', posicao: 'Meia', posicaoCompleta: 'Meia Ofensivo', timeAtual: 'Arsenal', raridade: 'normal', overall: 75 },
  { nome: 'Kai Havertz', posicao: 'Meia', posicaoCompleta: 'Meia Ofensivo', timeAtual: 'Arsenal', raridade: 'normal', overall: 81 },
  { nome: 'Eddie Nketiah', posicao: 'Atacante', posicaoCompleta: 'Centroavante', timeAtual: 'Arsenal', raridade: 'normal', overall: 72 },
  { nome: 'Reiss Nelson', posicao: 'Atacante', posicaoCompleta: 'Ponta Direita', timeAtual: 'Arsenal', raridade: 'normal', overall: 73 },
  { nome: 'Aaron Ramsdale', posicao: 'Goleiro', posicaoCompleta: 'Goleiro', timeAtual: 'Arsenal', raridade: 'normal', overall: 80 },
  { nome: 'Matheus Cunha', posicao: 'Atacante', posicaoCompleta: 'Centroavante', timeAtual: 'Wolves', raridade: 'normal', overall: 77 },
  { nome: 'Pablo Sarabia', posicao: 'Atacante', posicaoCompleta: 'Ponta Direita', timeAtual: 'Wolves', raridade: 'normal', overall: 78 },
  { nome: 'João Palhinha', posicao: 'Volante', posicaoCompleta: 'Volante', timeAtual: 'Fulham', raridade: 'normal', overall: 82 },
  { nome: 'Andreas Pereira', posicao: 'Meia', posicaoCompleta: 'Meia Ofensivo', timeAtual: 'Fulham', raridade: 'normal', overall: 76 },
  { nome: 'Willian', posicao: 'Atacante', posicaoCompleta: 'Ponta Esquerda', timeAtual: 'Fulham', raridade: 'normal', overall: 77 },
  { nome: 'Beto', posicao: 'Atacante', posicaoCompleta: 'Centroavante', timeAtual: 'Everton', raridade: 'normal', overall: 75 },
  { nome: 'Bernd Leno', posicao: 'Goleiro', posicaoCompleta: 'Goleiro', timeAtual: 'Fulham', raridade: 'normal', overall: 82 },
  { nome: 'Timothy Castagne', posicao: 'Lateral', posicaoCompleta: 'Lateral D', timeAtual: 'Fulham', raridade: 'normal', overall: 77 },
  { nome: 'Issa Diop', posicao: 'Zagueiro', posicaoCompleta: 'Zagueiro', timeAtual: 'Fulham', raridade: 'normal', overall: 76 },
  { nome: 'Sasa Lukic', posicao: 'Volante', posicaoCompleta: 'Volante', timeAtual: 'Fulham', raridade: 'normal', overall: 75 },
  { nome: 'Harrison Reed', posicao: 'Meia', posicaoCompleta: 'Meia Central', timeAtual: 'Fulham', raridade: 'normal', overall: 74 },
  { nome: 'Tom Cairney', posicao: 'Meia', posicaoCompleta: 'Meia Central', timeAtual: 'Fulham', raridade: 'normal', overall: 73 },
  { nome: 'Harry Wilson', posicao: 'Atacante', posicaoCompleta: 'Ponta Direita', timeAtual: 'Fulham', raridade: 'normal', overall: 75 },
  { nome: 'Bobby De Cordova-Reid', posicao: 'Atacante', posicaoCompleta: 'Ponta Direita', timeAtual: 'Fulham', raridade: 'normal', overall: 74 },
  { nome: 'Rodrigo Muniz', posicao: 'Atacante', posicaoCompleta: 'Centroavante', timeAtual: 'Fulham', raridade: 'normal', overall: 72 },
  { nome: 'Marek Rodák', posicao: 'Goleiro', posicaoCompleta: 'Goleiro', timeAtual: 'Fulham', raridade: 'normal', overall: 73 },
  { nome: 'Kenny Tete', posicao: 'Lateral', posicaoCompleta: 'Lateral D', timeAtual: 'Fulham', raridade: 'normal', overall: 74 },
  { nome: 'Tosin Adarabioyo', posicao: 'Zagueiro', posicaoCompleta: 'Zagueiro', timeAtual: 'Fulham', raridade: 'normal', overall: 75 },
  { nome: 'Calvin Bassey', posicao: 'Zagueiro', posicaoCompleta: 'Zagueiro', timeAtual: 'Fulham', raridade: 'normal', overall: 73 }
]

// Função para obter um jogador aleatório de uma raridade específica
export function obterJogadorReal(raridade: 'normal' | 'raro' | 'epico' | 'lendario' | 'prismatico'): JogadorReal {
  let lista: JogadorReal[] = []

  switch (raridade) {
    case 'prismatico':
      lista = JOGADORES_PRISMATICOS
      break
    case 'lendario':
      lista = JOGADORES_LENDARIOS
      break
    case 'epico':
      lista = JOGADORES_EPICOS
      break
    case 'raro':
      lista = JOGADORES_RAROS
      break
    case 'normal':
      lista = JOGADORES_NORMAIS
      break
  }

  if (lista.length === 0) {
    // Fallback caso não tenha jogadores da raridade
    return {
      nome: 'Jogador Desconhecido',
      posicao: 'Atacante',
      posicaoCompleta: 'Atacante',
      timeAtual: 'Sem Time',
      raridade: 'normal',
      overall: 60
    }
  }

  return lista[Math.floor(Math.random() * lista.length)]
}

// Função para obter todos os jogadores de uma raridade (para jogadores iniciais)
export function obterJogadoresNormais(quantidade: number): JogadorReal[] {
  const jogadores: JogadorReal[] = []
  const listaDisponivel = [...JOGADORES_NORMAIS]
  
  for (let i = 0; i < quantidade; i++) {
    if (listaDisponivel.length === 0) {
      // Se acabaram os jogadores únicos, permite repetição
      jogadores.push(JOGADORES_NORMAIS[Math.floor(Math.random() * JOGADORES_NORMAIS.length)])
    } else {
      const index = Math.floor(Math.random() * listaDisponivel.length)
      jogadores.push(listaDisponivel[index])
      listaDisponivel.splice(index, 1) // Remove para evitar duplicatas quando possível
    }
  }
  
  return jogadores
}
