// /api/data.js - Unified data endpoint (GET for frontend, POST for EA)
// Using global variable for in-memory storage (works per serverless instance)

// Global storage - persists across requests to the SAME instance
if (!global.bbStorage) {
    global.bbStorage = {
        symbols: {},
        charts: {},
        positions: [],
        lastUpdate: 0
    };
}

export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const storage = global.bbStorage;
    
    // === GET: Frontend fetches data ===
    if (req.method === 'GET') {
        // Clean old data (> 2 minutes)
        const now = Date.now();
        for (const sym in storage.symbols) {
            if (now - (storage.symbols[sym]?.last_update || 0) > 120000) {
                delete storage.symbols[sym];
            }
        }
        
        return res.status(200).json({
            status: 'ok',
            symbols: storage.symbols,
            active_count: Object.keys(storage.symbols).length,
            timestamp: new Date().toISOString()
        });
    }
    
    // === POST: EA sends data ===
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (!data || !data.symbol) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing symbol'
                });
            }
            
            const symbol = data.symbol;
            data.last_update = Date.now();
            data.server_time = new Date().toISOString();
            
            // Save to global storage
            storage.symbols[symbol] = data;
            storage.lastUpdate = Date.now();
            
            return res.status(200).json({
                status: 'ok',
                symbol: symbol,
                active_symbols: Object.keys(storage.symbols).length,
                message: 'Data saved'
            });
            
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
    
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
}
