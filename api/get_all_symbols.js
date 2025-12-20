// /api/get_all_symbols.js - Frontend fetches all symbol data
// Uses same global storage as update.js

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ status: 'error', message: 'Use GET' });
    }
    
    const storage = global.bbStorage;
    
    // Clean old data (> 2 minutes)
    const now = Date.now();
    for (const symbol in storage.symbols) {
        if (now - (storage.symbols[symbol]?.last_update || 0) > 120000) {
            delete storage.symbols[symbol];
        }
    }
    
    return res.status(200).json({
        status: 'ok',
        symbols: storage.symbols,
        active_count: Object.keys(storage.symbols).length,
        timestamp: new Date().toISOString(),
        last_update: storage.lastUpdate
    });
}
