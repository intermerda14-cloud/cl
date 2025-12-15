// In-memory storage
if (!global.bbData) {
    global.bbData = { symbols: {}, charts: {}, positions: {} };
}

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // POST - Save chart data
    if (req.method === 'POST') {
        try {
            const data = req.body;
            if (!data || !data.symbol) {
                return res.status(400).json({ status: 'error' });
            }
            
            const symbol = data.symbol.replace(/[^A-Za-z0-9]/g, '');
            data.last_update = Date.now();
            global.bbData.charts[symbol] = data;
            
            res.status(200).json({ status: 'ok', symbol: symbol });
        } catch (err) {
            res.status(500).json({ status: 'error' });
        }
        return;
    }
    
    // GET - Return chart data
    if (req.method === 'GET') {
        const symbol = (req.query.symbol || '').replace(/[^A-Za-z0-9]/g, '');
        
        let targetSymbol = symbol;
        if (!targetSymbol || !global.bbData.charts[targetSymbol]) {
            targetSymbol = Object.keys(global.bbData.charts)[0];
        }
        
        if (!targetSymbol || !global.bbData.charts[targetSymbol]) {
            return res.status(200).json({ status: 'error', message: 'No chart data' });
        }
        
        res.status(200).json({
            status: 'ok',
            symbol: targetSymbol,
            data: global.bbData.charts[targetSymbol].data || []
        });
        return;
    }
    
    res.status(405).json({ status: 'error' });
}
