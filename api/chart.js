// /api/chart.js - FOR CANDLESTICK CHART DATA
let chartStorage = {};

export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // === POST: Save chart data from EA ===
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (!data || !data.symbol) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No symbol in chart data'
                });
            }
            
            const symbol = data.symbol;
            const timeframe = data.timeframe || 1;
            const key = `${symbol}_${timeframe}`;
            
            // Add metadata
            data.last_update = Date.now();
            data.received_at = new Date().toISOString();
            
            // Save to storage with timeframe key
            chartStorage[key] = data;
            
            // Also save as default for symbol
            chartStorage[symbol] = data;
            
            const candleCount = data.candles?.length || data.data?.length || 0;
            
            return res.status(200).json({
                status: 'ok',
                symbol: symbol,
                timeframe: timeframe,
                candle_count: candleCount,
                message: 'Chart data saved'
            });
            
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
    
    // === GET: Return chart data for frontend ===
    if (req.method === 'GET') {
        try {
            const symbol = req.query.symbol || '';
            const timeframe = parseInt(req.query.timeframe) || 1;
            
            // Clean old data (> 5 minutes)
            const now = Date.now();
            for (const key in chartStorage) {
                if (now - (chartStorage[key]?.last_update || 0) > 300000) {
                    delete chartStorage[key];
                }
            }
            
            // Find matching chart
            const key = `${symbol}_${timeframe}`;
            let chartData = chartStorage[key] || chartStorage[symbol];
            
            // If no specific symbol, get first available
            if (!chartData && Object.keys(chartStorage).length > 0) {
                chartData = Object.values(chartStorage)[0];
            }
            
            if (chartData) {
                // Normalize candle format
                let candles = chartData.candles || chartData.data || [];
                
                // Ensure candles have correct format { o, h, l, c, t, v }
                candles = candles.map(c => ({
                    o: parseFloat(c.o || c.open || 0),
                    h: parseFloat(c.h || c.high || 0),
                    l: parseFloat(c.l || c.low || 0),
                    c: parseFloat(c.c || c.close || 0),
                    t: c.t || c.time || 0,
                    v: c.v || c.volume || 0
                }));
                
                return res.status(200).json({
                    status: 'ok',
                    symbol: chartData.symbol,
                    broker: chartData.broker || '',
                    digits: chartData.digits || 2,
                    timeframe: timeframe,
                    candles: candles,
                    last_update: chartData.last_update
                });
            } else {
                return res.status(200).json({
                    status: 'waiting',
                    message: 'No chart data available',
                    candles: []
                });
            }
            
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: error.message,
                candles: []
            });
        }
    }
    
    return res.status(405).json({
        status: 'error',
        message: 'Method not allowed'
    });
}
