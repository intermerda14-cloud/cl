// /api/chart.js - Chart data endpoint
// Uses global storage for persistence

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
    
    // POST: EA sends chart data
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (!data || !data.symbol) {
                return res.status(400).json({ status: 'error', message: 'No symbol' });
            }
            
            const symbol = data.symbol;
            const timeframe = data.timeframe || 1;
            const key = `${symbol}_${timeframe}`;
            
            data.last_update = Date.now();
            
            // Save chart data
            storage.charts[key] = data;
            storage.charts[symbol] = data; // Also save without timeframe as default
            
            const candleCount = data.data?.length || data.candles?.length || 0;
            
            return res.status(200).json({
                status: 'ok',
                symbol: symbol,
                timeframe: timeframe,
                candle_count: candleCount
            });
            
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    }
    
    // GET: Frontend fetches chart data
    if (req.method === 'GET') {
        const symbol = req.query.symbol || '';
        const timeframe = parseInt(req.query.timeframe) || 1;
        
        // Clean old charts (> 5 minutes)
        const now = Date.now();
        for (const key in storage.charts) {
            if (now - (storage.charts[key]?.last_update || 0) > 300000) {
                delete storage.charts[key];
            }
        }
        
        // Find chart data
        const key = `${symbol}_${timeframe}`;
        let chartData = storage.charts[key] || storage.charts[symbol];
        
        // If no specific symbol, get first available
        if (!chartData && Object.keys(storage.charts).length > 0) {
            chartData = Object.values(storage.charts)[0];
        }
        
        if (chartData) {
            // Normalize candle format
            let candles = chartData.candles || chartData.data || [];
            candles = candles.map(c => ({
                o: parseFloat(c.o || c.open || 0),
                h: parseFloat(c.h || c.high || 0),
                l: parseFloat(c.l || c.low || 0),
                c: parseFloat(c.c || c.close || 0),
                t: c.t || c.time || 0
            }));
            
            return res.status(200).json({
                status: 'ok',
                symbol: chartData.symbol,
                digits: chartData.digits || 2,
                timeframe: timeframe,
                candles: candles,
                last_update: chartData.last_update
            });
        }
        
        return res.status(200).json({
            status: 'waiting',
            message: 'No chart data',
            candles: []
        });
    }
    
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
}
