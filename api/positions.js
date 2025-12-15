const store = require('./_store');

module.exports = (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const allData = store.getData();
    
    // POST - Save positions from EA
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (!data || !data.symbol) {
                return res.status(400).json({ status: 'error' });
            }
            
            const symbol = data.symbol.replace(/[^A-Za-z0-9]/g, '');
            store.setPositions(symbol, data);
            
            res.json({
                status: 'ok',
                symbol: symbol,
                positions: (data.positions || []).length
            });
        } catch (err) {
            res.status(500).json({ status: 'error', message: err.message });
        }
        return;
    }
    
    // GET - Return all positions
    if (req.method === 'GET') {
        const allPositions = [];
        
        for (const symbol in allData.positions) {
            const positions = allData.positions[symbol].positions || [];
            allPositions.push(...positions);
        }
        
        res.json({
            status: 'ok',
            count: allPositions.length,
            positions: allPositions
        });
        return;
    }
    
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
};
