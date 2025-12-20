// /api/positions.js - Get open positions from EA
let positionsData = { positions: [], last_update: 0 };

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // GET - Return current positions
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'ok',
            positions: positionsData.positions,
            count: positionsData.positions.length,
            last_update: positionsData.last_update
        });
    }
    
    // POST - Update positions from EA
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (data.positions && Array.isArray(data.positions)) {
                positionsData.positions = data.positions;
                positionsData.last_update = Date.now();
                
                return res.status(200).json({
                    status: 'ok',
                    message: 'Positions updated',
                    count: positionsData.positions.length
                });
            }
            
            return res.status(400).json({
                status: 'error',
                message: 'Invalid positions data'
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
