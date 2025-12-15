const store = require('./_store');

module.exports = (req, res) => {
    // Enable CORS
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
            return res.status(400).json({ status: 'error', message: 'No symbol provided' });
        }
        
        const symbol = data.symbol.replace(/[^A-Za-z0-9]/g, '');
        data.server_time = new Date().toISOString();
        
        store.setSymbol(symbol, data);
        
        const allData = store.getData();
        
        res.json({
            status: 'ok',
            symbol: symbol,
            message: 'Data updated',
            active_symbols: Object.keys(allData.symbols).length
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
