// /api/get_all_symbols.js
let bbData = { symbols: {}, charts: {}, positions: {} };

export default function handler(req, res) {
    // Set headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({
            status: 'error',
            message: 'Method not allowed. Use GET.'
        });
    }
    
    try {
        // Clean old data (older than 2 minutes)
        const now = Date.now();
        for (const symbol in bbData.symbols) {
            if (now - (bbData.symbols[symbol].last_update || 0) > 120000) {
                delete bbData.symbols[symbol];
            }
        }
        
        const symbols = bbData.symbols;
        const symbolCount = Object.keys(symbols).length;
        
        return res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            symbols: symbols,
            active_count: symbolCount
        });
        
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}
