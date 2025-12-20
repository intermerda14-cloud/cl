// /api/positions.js - Positions endpoint
// Uses global storage

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
    
    // GET - Return current positions
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'ok',
            positions: storage.positions || [],
            count: (storage.positions || []).length
        });
    }
    
    // POST - Update positions from EA
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (data.positions && Array.isArray(data.positions)) {
                storage.positions = data.positions;
                
                return res.status(200).json({
                    status: 'ok',
                    message: 'Positions updated',
                    count: storage.positions.length
                });
            }
            
            return res.status(400).json({ status: 'error', message: 'Invalid positions data' });
            
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    }
    
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
}
