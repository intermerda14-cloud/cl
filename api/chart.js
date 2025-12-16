// /api/chart.js - FOR CANDLESTICK CHART DATA
let chartStorage = {};

export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
            const timeframe = data.timeframe || 'M1';
            
            // Add metadata
            data.last_update = Date.now();
            data.received_at = new Date().toISOString();
            data.timeframe = timeframe;
            
            // Save to storage
            chartStorage[symbol] = data;
            
            const candleCount = data.data?.length || 0;
            console.log(`📈 Chart saved: ${symbol} (${timeframe}), ${candleCount} candles`);
            
            return res.status(200).json({
                status: 'ok',
                symbol: symbol,
                timeframe: timeframe,
                data_points: candleCount,
                message: 'Chart data saved successfully'
            });
            
        } catch (error) {
            console.error('❌ Chart POST error:', error);
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
            const timeframe = req.query.timeframe || 'M1';
            
            console.log(`📊 Requesting chart: ${symbol || 'any'}, TF: ${timeframe}`);
            
            // Clean old data (> 10 minutes)
            const now = Date.now();
            let cleaned = 0;
            
            for (const sym in chartStorage) {
                const lastUpdate = chartStorage[sym]?.last_update || 0;
                if (now - lastUpdate > 600000) { // 10 minutes
                    delete chartStorage[sym];
                    cleaned++;
                }
            }
            
            if (cleaned > 0) {
                console.log(`🧹 Cleaned ${cleaned} old chart(s)`);
            }
            
            // Find matching chart
            let targetSymbol = symbol;
            let chartData = null;
            
            if (targetSymbol && chartStorage[targetSymbol]) {
                chartData = chartStorage[targetSymbol];
            } else if (Object.keys(chartStorage).length > 0) {
                // Get first available chart
                targetSymbol = Object.keys(chartStorage)[0];
                chartData = chartStorage[targetSymbol];
            }
            
            if (chartData) {
                const candleCount = chartData.data?.length || 0;
                console.log(`✅ Returning chart: ${targetSymbol}, ${candleCount} candles`);
                
                return res.status(200).json({
                    status: 'ok',
                    symbol: targetSymbol,
                    timeframe: chartData.timeframe || 'M1',
                    data: chartData.data || [],
                    last_update: chartData.last_update,
                    candle_count: candleCount
                });
            } else {
                console.log('⚠️ No chart data available');
                return res.status(200).json({
                    status: 'error',
                    message: 'No chart data available from EA'
                });
            }
            
        } catch (error) {
            console.error('❌ Chart GET error:', error);
            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
    
    return res.status(405).json({
        status: 'error',
        message: 'Method not allowed'
    });
}
