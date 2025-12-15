// In-memory storage
if (!global.bbData) {
    global.bbData = { symbols: {}, charts: {}, positions: {} };
}

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Method not allowed' });
    }
    
    try {
        const data = req.body;
        
        if (!data || !data.symbol) {
            return res.status(400).json({ status: 'error', message: 'No symbol' });
        }
        
        const symbol = data.symbol.replace(/[^A-Za-z0-9]/g, '');
        data.last_update = Date.now();
        data.server_time = new Date().toISOString();
        
        global.bbData.symbols[symbol] = data;
        
        // Clean old data (older than 2 minutes)
        const now = Date.now();
        for (const s in global.bbData.symbols) {
            if (now - (global.bbData.symbols[s].last_update || 0) > 120000) {
                delete global.bbData.symbols[s];
                delete global.bbData.charts[s];
                delete global.bbData.positions[s];
            }
        }
        
        res.status(200).json({
            status: 'ok',
            symbol: symbol,
            active_symbols: Object.keys(global.bbData.symbols).length
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
}
