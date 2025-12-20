// /api/update.js - EA sends main data here
// Uses same global storage as data.js

if (!global.bbStorage) {
    global.bbStorage = {
        symbols: {},
        charts: {},
        positions: [],
        lastUpdate: 0
    };
}

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const storage = global.bbStorage;
    
    // GET - Show current data (for testing)
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'ok',
            message: 'BB Scalper V4.3 Update Endpoint',
            active_symbols: Object.keys(storage.symbols).length,
            symbols: Object.keys(storage.symbols)
        });
    }
    
    // POST - EA sends data
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (!data || !data.symbol) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing symbol in data'
                });
            }
            
            const symbol = data.symbol.replace(/[^A-Za-z0-9]/g, '');
            
            // Add timestamps
            data.last_update = Date.now();
            data.server_time = new Date().toISOString();
            
            // Save to global storage
            storage.symbols[symbol] = data;
            storage.lastUpdate = Date.now();
            
            // Clean old data (> 2 minutes)
            const now = Date.now();
            for (const s in storage.symbols) {
                if (now - (storage.symbols[s].last_update || 0) > 120000) {
                    delete storage.symbols[s];
                }
            }
            
            return res.status(200).json({
                status: 'ok',
                symbol: symbol,
                active_symbols: Object.keys(storage.symbols).length,
                message: 'Data saved successfully'
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
