// /api/data.js - COMPLETE VERSION
let storage = {
    symbols: {},    // Data utama dari EA
    charts: {},     // Chart data
    positions: {}   // Positions data
};

export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    console.log(`📞 ${req.method} ${req.url}`);
    
    // === GET: Untuk frontend mengambil semua data ===
    if (req.method === 'GET') {
        try {
            // Clean old data (> 3 minutes)
            const now = Date.now();
            const CLEANUP_TIME = 180000; // 3 menit
            
            let cleanedSymbols = 0;
            let cleanedCharts = 0;
            
            // Clean symbols
            for (const symbol in storage.symbols) {
                const lastUpdate = storage.symbols[symbol]?.last_update || 0;
                if (now - lastUpdate > CLEANUP_TIME) {
                    delete storage.symbols[symbol];
                    cleanedSymbols++;
                }
            }
            
            // Clean charts
            for (const symbol in storage.charts) {
                const lastUpdate = storage.charts[symbol]?.last_update || 0;
                if (now - lastUpdate > CLEANUP_TIME) {
                    delete storage.charts[symbol];
                    cleanedCharts++;
                }
            }
            
            if (cleanedSymbols > 0 || cleanedCharts > 0) {
                console.log(`🧹 Cleaned: ${cleanedSymbols} symbols, ${cleanedCharts} charts`);
            }
            
            const symbols = storage.symbols;
            const symbolCount = Object.keys(symbols).length;
            
            console.log(`📊 Returning ${symbolCount} symbol(s):`, Object.keys(symbols));
            
            return res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                symbols: symbols,
                active_count: symbolCount,
                charts_count: Object.keys(storage.charts).length,
                debug: {
                    storage_type: 'shared_memory',
                    cleaned: { symbols: cleanedSymbols, charts: cleanedCharts }
                }
            });
            
        } catch (error) {
            console.error('❌ GET Error:', error);
            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
    
    // === POST: Dari EA (simbol data atau chart data) ===
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (!data || typeof data !== 'object') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid data'
                });
            }
            
            // Tentukan tipe data berdasarkan field yang ada
            const hasChartData = data.data && Array.isArray(data.data);  // Chart data
            const hasSymbolData = data.symbol && !hasChartData;          // Symbol data
            
            if (hasChartData) {
                // ========== CHART DATA ==========
                console.log('📈 Receiving CHART data for:', data.symbol);
                
                if (!data.symbol) {
                    return res.status(400).json({
                        status: 'error',
                        message: 'No symbol in chart data'
                    });
                }
                
                const symbol = data.symbol;
                data.last_update = Date.now();
                
                storage.charts[symbol] = data;
                
                console.log(`💾 Chart saved: ${symbol}, points: ${data.data.length}`);
                
                return res.status(200).json({
                    status: 'ok',
                    type: 'chart',
                    symbol: symbol,
                    data_points: data.data.length,
                    message: 'Chart data saved'
                });
                
            } else if (hasSymbolData) {
                // ========== SYMBOL DATA ==========
                console.log('📊 Receiving SYMBOL data for:', data.symbol);
                
                const symbol = data.symbol;
                
                // Add required timestamps
                data.last_update = Date.now();
                data.server_time = new Date().toISOString();
                
                // Ensure all required fields exist
                const requiredFields = [
                    'total_trades', 'wins', 'losses', 'win_rate',
                    'ml_confidence', 'sharpe', 'profit_factor', 'expectancy',
                    'tier1', 'tier2', 'tier3', 'commission',
                    'confluence', 'pattern', 'volatility'
                ];
                
                // Set default values if missing
                requiredFields.forEach(field => {
                    if (data[field] === undefined) {
                        data[field] = field.includes('tier') ? 0 : 
                                     field === 'pattern' ? 'NONE' : 
                                     field === 'volatility' ? 'MEDIUM' : 0;
                    }
                });
                
                // Save to storage
                storage.symbols[symbol] = data;
                
                console.log(`💾 Symbol saved: ${symbol}`);
                console.log(`📈 Stats: Trades=${data.total_trades || 0}, WR=${data.win_rate || 0}%, ML=${data.ml_confidence || 0}%`);
                
                return res.status(200).json({
                    status: 'ok',
                    type: 'symbol',
                    symbol: symbol,
                    active_symbols: Object.keys(storage.symbols).length,
                    fields_received: Object.keys(data).length,
                    message: 'Symbol data saved'
                });
                
            } else {
                return res.status(400).json({
                    status: 'error',
                    message: 'Unknown data type. Need symbol or chart data.'
                });
            }
            
        } catch (error) {
            console.error('❌ POST Error:', error);
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
