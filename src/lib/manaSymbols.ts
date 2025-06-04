export function processManaSymbols(text: string): string {
  // Define mana symbol mappings for Scryfall API
  const manaSymbolMap: { [key: string]: string } = {
    'W': 'w',
    'U': 'u', 
    'B': 'b',
    'R': 'r',
    'G': 'g',
    'C': 'c',
    'X': 'x',
    'Y': 'y',
    'Z': 'z',
    'S': 's', // Snow
    'T': 't', // Tap
    'Q': 'q', // Untap
    'E': 'e', // Energy
  };

  // Handle numbers 0-20
  for (let i = 0; i <= 20; i++) {
    manaSymbolMap[i.toString()] = i.toString();
  }

  // Handle hybrid mana symbols
  const hybridSymbols = ['W/U', 'W/B', 'U/B', 'U/R', 'B/R', 'B/G', 'R/G', 'R/W', 'G/W', 'G/U'];
  hybridSymbols.forEach(symbol => {
    manaSymbolMap[symbol] = symbol.toLowerCase().replace('/', '');
  });

  // Handle Phyrexian mana symbols
  const phyrexianSymbols = ['W/P', 'U/P', 'B/P', 'R/P', 'G/P'];
  phyrexianSymbols.forEach(symbol => {
    manaSymbolMap[symbol] = symbol.toLowerCase().replace('/', 'p');
  });

  // Replace mana symbols with img tags
  return text.replace(/\{([^}]+)\}/g, (match, symbol) => {
    const symbolKey = manaSymbolMap[symbol.toUpperCase()];
    if (symbolKey) {
      return `<img src="https://svgs.scryfall.io/card-symbols/${symbolKey}.svg" alt="{${symbol}}" class="mana" />`;
    }
    return match; // Return original if no mapping found
  });
} 