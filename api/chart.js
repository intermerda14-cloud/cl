// /api/chart.js - FOR EA CHART DATA
let chartStorage = {};

export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // POST - Save chart data from EA
    if (req.method === 'POST') {
        try {
            const data = req.body;
            console.log('📈 Receiving chart data from EA');
            
            if (!data || !data.symbol) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No symbol in chart data'
                });
            }
            
            const symbol = data.symbol;
            
            // Add timestamp
            data.last_update = Date.now();
            data.received_at = new Date().toISOString();
            
            // Save to storage
            chartStorage[symbol] = data;
            
            console.log(`💾 Chart saved: ${symbol}, points: ${data.data?.length || 0}`);
            
            return res.status(200).json({
                status: 'ok',
                symbol: symbol,
                data_points: data.data?.length || 0,
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
    
    // GET - Return chart data for frontend
    if (req.method === 'GET') {
        try {
            const symbol = req.query.symbol || '';
            
            console.log('📊 Requesting chart for:', symbol || 'any');
            
            // Clean old data (> 5 minutes)
            const now = Date.now();
            let cleaned = 0;
            
            for (const sym in chartStorage) {
                const lastUpdate = chartStorage[sym]?.last_update || 0;
                if (now - lastUpdate > 300000) { // 5 minutes
                    delete chartStorage[sym];
                    cleaned++;
                }
            }
            
            if (cleaned > 0) {
                console.log(`🧹 Cleaned ${cleaned} old chart(s)`);
            }
            
            // Find chart data
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
                console.log(`✅ Returning chart for: ${targetSymbol}, points: ${chartData.data?.length || 0}`);
                
                return res.status(200).json({
                    status: 'ok',
                    symbol: targetSymbol,
                    data: chartData.data || [],
                    last_update: chartData.last_update,
                    age_seconds: Math.floor((now - chartData.last_update) / 1000)
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
