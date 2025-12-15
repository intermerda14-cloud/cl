const store = require('./_store');

module.exports = (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const allData = store.getData();
    
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        symbols: allData.symbols,
        active_count: Object.keys(allData.symbols).length
    });
};
