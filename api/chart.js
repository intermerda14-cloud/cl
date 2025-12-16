// /api/chart.js
let storage = { symbols: {}, charts: {}, positions: {} };

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // POST - Save chart data from EA
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (!data || !data.symbol) {
                return res.status(400).json({ status: 'error' });
            }
            
            const symbol = data.symbol;
            data.last_update = Date.now();
            
            storage.charts[symbol] = data;
            
            console.log('📈 Chart data saved for:', symbol);
            
            return res.status(200).json({ 
                status: 'ok', 
                symbol: symbol 
            });
            
        } catch (err) {
            return res.status(500).json({ status: 'error' });
        }
    }
    
    // GET - Return chart data for frontend
    if (req.method === 'GET') {
        const symbol = req.query.symbol || '';
        
        if (symbol && storage.charts[symbol]) {
            return res.status(200).json({
                status: 'ok',
                symbol: symbol,
                data: storage.charts[symbol].data || []
            });
        }
        
        // Return first available chart
        const firstSymbol = Object.keys(storage.charts)[0];
        if (firstSymbol) {
            return res.status(200).json({
                status: 'ok',
                symbol: firstSymbol,
                data: storage.charts[firstSymbol].data || []
            });
        }
        
        return res.status(200).json({
            status: 'error',
            message: 'No chart data'
        });
    }
    
    return res.status(405).json({ status: 'error' });
}
