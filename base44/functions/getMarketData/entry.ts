import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Optional: We can skip auth check for this public widget, or require it if we want.
    // The widget is on the front page, so it should be public.
    
    const symbols = ['TSLA', 'NVDA', 'AAPL', 'BTC-USD', 'ETH-USD', 'USDNOK=X'];
    
    const fetchSymbol = async (sym) => {
      try {
        const res = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${sym}`, { 
          headers: { 'User-Agent': 'Mozilla/5.0' } 
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.chart?.result?.[0]?.meta) return null;
        
        const meta = data.chart.result[0].meta;
        return { 
          symbol: sym, 
          price: meta.regularMarketPrice, 
          prevClose: meta.previousClose || meta.chartPreviousClose
        };
      } catch (e) {
        return null;
      }
    };
    
    const results = await Promise.all(symbols.map(fetchSymbol));
    const validResults = results.filter(Boolean);
    
    // Find NOK rate
    const usdNok = validResults.find(r => r.symbol === 'USDNOK=X')?.price || 11.0;
    
    const formatData = (sym, name, logo) => {
      const data = validResults.find(r => r.symbol === sym);
      if (!data) return null;
      
      const priceNok = data.price * usdNok;
      const prevCloseNok = data.prevClose * usdNok;
      const changePercent = ((priceNok - prevCloseNok) / prevCloseNok) * 100;
      
      return {
        id: sym.toLowerCase().replace('-usd', ''),
        name,
        logo,
        price: priceNok,
        change: changePercent
      };
    };
    
    const stocks = [
      formatData('BTC-USD', 'Bitcoin', 'https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=029'),
      formatData('ETH-USD', 'Ethereum', 'https://cryptologos.cc/logos/ethereum-eth-logo.png?v=029'),
      formatData('TSLA', 'Tesla Inc.', 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png'),
      formatData('AAPL', 'Apple', 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg'),
      formatData('NVDA', 'NVIDIA Corp.', 'https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo.svg')
    ].filter(Boolean);

    return Response.json({ stocks });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});