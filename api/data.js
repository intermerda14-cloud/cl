// /api/data.js - ALL IN ONE
let appData = { symbols: {} };

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    // GET - Untuk frontend
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'ok',
            symbols: appData.symbols,
            active_count: Object.keys(appData.symbols).length
        });
    }
    
    // POST - Dari EA
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (!data.symbol) {
                return res.status(400).json({ status: 'error', message: 'No symbol' });
            }
            
            const symbol = data.symbol;
            
            // Simpan
            appData.symbols[symbol] = {
                ...data,
                saved_at: new Date().toISOString()
            };
            
            return res.status(200).json({
                status: 'ok',
                symbol: symbol,
                active_count: Object.keys(appData.symbols).length
            });
            
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    }
    
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
}
