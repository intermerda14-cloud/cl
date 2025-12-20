// /api/reset.js
let bbData = { symbols: {}, charts: {}, positions: {} };

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    bbData = { symbols: {}, charts: {}, positions: {} };
    
    res.status(200).json({
        status: 'ok',
        message: 'All data cleared',
        time: new Date().toISOString()
    });
}
