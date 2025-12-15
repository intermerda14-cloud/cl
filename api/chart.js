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
    
    // POST - Save chart data from EA
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (!data || !data.symbol) {
                return res.status(400).json({ status: 'error', message: 'No symbol' });
            }
            
            const symbol = data.symbol.replace(/[^A-Za-z0-9]/g, '');
            store.setChart(symbol, data);
            
            res.json({
                status: 'ok',
                symbol: symbol,
                bars: (data.data || []).length
            });
        } catch (err) {
            res.status(500).json({ status: 'error', message: err.message });
        }
        return;
    }
    
    // GET - Return chart data
    if (req.method === 'GET') {
        const symbol = (req.query.symbol || '').replace(/[^A-Za-z0-9]/g, '');
        const allData = store.getData();
        
        // If no symbol specified, return first available
        let targetSymbol = symbol;
        if (!targetSymbol || !allData.charts[targetSymbol]) {
            targetSymbol = Object.keys(allData.charts)[0];
        }
        
        if (!targetSymbol || !allData.charts[targetSymbol]) {
            return res.json({ status: 'error', message: 'No chart data available' });
        }
        
        res.json({
            status: 'ok',
            symbol: targetSymbol,
            data: allData.charts[targetSymbol].data || [],
            last_update: allData.charts[targetSymbol].last_update
        });
        return;
    }
    
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
};
