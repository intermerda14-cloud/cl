const store = require('./_store');

module.exports = (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const data = store.getData();
    
    res.json({
        status: 'ok',
        message: 'BB Scalper V4.2 Dashboard Online',
        version: '4.2-vercel',
        time: new Date().toISOString(),
        active_symbols: Object.keys(data.symbols).length
    });
};
