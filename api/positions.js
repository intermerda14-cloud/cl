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
    
    // POST - Save positions
    if (req.method === 'POST') {
        try {
            const data = req.body;
            if (!data || !data.symbol) {
                return res.status(400).json({ status: 'error' });
            }
            
            const symbol = data.symbol.replace(/[^A-Za-z0-9]/g, '');
            data.last_update = Date.now();
            global.bbData.positions[symbol] = data;
            
            res.status(200).json({ status: 'ok', symbol: symbol });
        } catch (err) {
            res.status(500).json({ status: 'error' });
        }
        return;
    }
    
    // GET - Return all positions
    if (req.method === 'GET') {
        const allPositions = [];
        for (const symbol in global.bbData.positions) {
            const positions = global.bbData.positions[symbol].positions || [];
            allPositions.push(...positions);
        }
        
        res.status(200).json({
            status: 'ok',
            count: allPositions.length,
            positions: allPositions
        });
        return;
    }
    
    res.status(405).json({ status: 'error' });
}
