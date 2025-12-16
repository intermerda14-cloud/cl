// /api/update.js
let bbData = { symbols: {}, charts: {}, positions: {} };

export default function handler(req, res) {
    // Set headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // GET - For testing from browser
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'ok',
            message: 'EA Dashboard API - Update Endpoint',
            current_data: bbData.symbols,
            total_symbols: Object.keys(bbData.symbols).length
        });
    }
    
    // POST - From EA
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (!data || !data.symbol) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No symbol in data'
                });
            }
            
            const symbol = data.symbol.replace(/[^A-Za-z0-9]/g, '');
            
            // Add time
            data.last_update = Date.now();
            data.server_time = new Date().toISOString();
            
            // Save data
            bbData.symbols[symbol] = data;
            
            // Clean old data (older than 2 minutes)
            const now = Date.now();
            for (const s in bbData.symbols) {
                if (now - (bbData.symbols[s].last_update || 0) > 120000) {
                    delete bbData.symbols[s];
                }
            }
            
            return res.status(200).json({
                status: 'ok',
                symbol: symbol,
                active_symbols: Object.keys(bbData.symbols).length,
                message: 'Data saved successfully'
            });
            
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
    
    // Other methods
    return res.status(405).json({
        status: 'error',
        message: 'Method not allowed'
    });
}
