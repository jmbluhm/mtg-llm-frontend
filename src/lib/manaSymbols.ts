// Map of mana symbols to local PNG image paths
const localManaSymbols: { [key: string]: string } = {
  // Basic mana colors
  'W': '/mana-symbols/w.png',
  'U': '/mana-symbols/u.png',
  'B': '/mana-symbols/b.png',
  'R': '/mana-symbols/r.png',
  'G': '/mana-symbols/g.png',
  'C': '/mana-symbols/c.png',
  
  // Numbers
  '0': '/mana-symbols/0.png',
  '1': '/mana-symbols/1.png',
  '2': '/mana-symbols/2.png',
  '3': '/mana-symbols/3.png',
  '4': '/mana-symbols/4.png',
  '5': '/mana-symbols/5.png',
  '6': '/mana-symbols/6.png',
  '7': '/mana-symbols/7.png',
  '8': '/mana-symbols/8.png',
  '9': '/mana-symbols/9.png',
  '10': '/mana-symbols/10.png',
  '11': '/mana-symbols/11.png',
  '12': '/mana-symbols/12.png',
  '13': '/mana-symbols/13.png',
  '14': '/mana-symbols/14.png',
  '15': '/mana-symbols/15.png',
  '16': '/mana-symbols/16.png',
  '17': '/mana-symbols/17.png',
  '18': '/mana-symbols/18.png',
  '19': '/mana-symbols/19.png',
  '20': '/mana-symbols/20.png',
  'X': '/mana-symbols/x.png',
  
  // Hybrid mana (commonly used ones)
  'RW': '/mana-symbols/rw.png',
  'WU': '/mana-symbols/wu.png',
  'UB': '/mana-symbols/ub.png',
  'BR': '/mana-symbols/br.png',
  'RG': '/mana-symbols/rg.png',
  'GW': '/mana-symbols/gw.png',
  'WB': '/mana-symbols/wb.png',
  'UR': '/mana-symbols/ur.png',
  'BG': '/mana-symbols/bg.png',
  'GU': '/mana-symbols/gu.png',
  
  // Phyrexian mana
  'PW': '/mana-symbols/pw.png',
  'PU': '/mana-symbols/pu.png',
  'PB': '/mana-symbols/pb.png',
  'PR': '/mana-symbols/pr.png',
  'PG': '/mana-symbols/pg.png',
};

// Function to create a fallback mana symbol for missing images
function createFallbackManaSymbol(symbol: string): string {
  // Color mapping for fallback styling
  const colorMap: { [key: string]: { bg: string; color: string } } = {
    'W': { bg: '#FFFBD5', color: '#8B4513' },
    'U': { bg: '#0E68AB', color: 'white' },
    'B': { bg: '#150B00', color: 'white' },
    'R': { bg: '#D3202A', color: 'white' },
    'G': { bg: '#00733E', color: 'white' },
    'C': { bg: '#CCCCCC', color: '#333' },
  };

  const upperSymbol = symbol.toUpperCase();
  const colors = colorMap[upperSymbol] || { bg: '#ddd', color: '#333' };

  return `<span class="mana mana-fallback" style="
    display: inline-block;
    width: 1.2em;
    height: 1.2em;
    background: ${colors.bg};
    border-radius: 50%;
    text-align: center;
    line-height: 1.2em;
    font-size: 0.8em;
    font-weight: bold;
    margin: 0 0.1em;
    vertical-align: middle;
    border: 2px solid ${colors.bg === '#FFFBD5' ? '#8B4513' : '#666'};
    color: ${colors.color};
  ">${symbol}</span>`;
}

export function processManaSymbols(text: string): string {
  // Replace mana symbols in curly braces with local PNG images
  return text.replace(/\{([^}]+)\}/g, (match, symbol) => {
    const upperSymbol = symbol.toUpperCase();
    
    // Check if we have a local image for this symbol
    if (localManaSymbols[upperSymbol]) {
      return `<img 
        src="${localManaSymbols[upperSymbol]}" 
        alt="{${symbol}}" 
        class="mana" 
        style="height: 1.2em; width: 1.2em; vertical-align: middle; margin: 0 0.1em; display: inline-block;"
        onError="this.style.display='none'; this.nextSibling.style.display='inline-block';"
      /><span class="mana mana-fallback" style="
        display: none;
        width: 1.2em;
        height: 1.2em;
        background: #ddd;
        border-radius: 50%;
        text-align: center;
        line-height: 1.2em;
        font-size: 0.8em;
        font-weight: bold;
        margin: 0 0.1em;
        vertical-align: middle;
        border: 1px solid #999;
        color: #333;
      ">${symbol}</span>`;
    }
    
    // For numbers not in our predefined list, create a generic numbered symbol
    if (/^\d+$/.test(upperSymbol)) {
      const num = parseInt(upperSymbol);
      if (num >= 0 && num <= 99) {
        return `<span class="mana mana-number" style="
          display: inline-block;
          width: 1.2em;
          height: 1.2em;
          background: #CCCCCC;
          border: 2px solid #666666;
          border-radius: 50%;
          text-align: center;
          line-height: 1em;
          font-size: 0.7em;
          font-weight: bold;
          margin: 0 0.1em;
          vertical-align: middle;
          color: #333;
        ">${num}</span>`;
      }
    }
    
    // For unknown symbols, create a fallback
    return createFallbackManaSymbol(symbol);
  });
} 