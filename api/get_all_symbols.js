// In-memory storage
if (!global.bbData) {
    global.bbData = { symbols: {}, charts: {}, positions: {} };
}

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    res.status(200).json({
        status: 'ok',
        timestamp: Date.now(),
        symbols: global.bbData.symbols,
        active_count: Object.keys(global.bbData.symbols).length
    });
}
