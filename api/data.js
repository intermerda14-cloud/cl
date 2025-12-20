// /api/data.js - COMPLETE VERSION FOR SYMBOL DATA
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
    
    // === POST: Dari EA (simbol data) ===
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            if (!data || typeof data !== 'object') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid data'
                });
            }
            
            // ========== SYMBOL DATA ==========
            if (data.symbol && !data.data) { // Check jika ini symbol data (bukan chart)
                console.log('📊 Receiving SYMBOL data for:', data.symbol);
                
                const symbol = data.symbol;
                
                // Add required timestamps
                data.last_update = Date.now();
                data.server_time = new Date().toISOString();
                
                // Ensure all required fields exist with defaults
                const defaultValues = {
                    total_trades: 0,
                    wins: 0,
                    losses: 0,
                    win_rate: 0,
                    ml_confidence: 0,
                    sharpe: 0,
                    profit_factor: 0,
                    expectancy: 0,
                    tier1: 0,
                    tier2: 0,
                    tier3: 0,
                    commission: 0,
                    confluence: 0,
                    pattern: 'NONE',
                    volatility: 'MEDIUM',
                    spread: 0,
                    floating: 0,
                    daily_pnl: 0,
                    balance: 0
                };
                
                // Apply defaults jika field tidak ada
                Object.keys(defaultValues).forEach(field => {
                    if (data[field] === undefined || data[field] === null) {
                        data[field] = defaultValues[field];
                    }
                });
                
                // Save to storage
                storage.symbols[symbol] = data;
                
                console.log(`💾 Symbol saved: ${symbol}`);
                console.log(`📈 Stats: Trades=${data.total_trades}, WR=${data.win_rate}%, ML=${data.ml_confidence}%`);
                
                return res.status(200).json({
                    status: 'ok',
                    type: 'symbol',
                    symbol: symbol,
                    active_symbols: Object.keys(storage.symbols).length,
                    fields_received: Object.keys(data).length,
                    message: 'Symbol data saved'
                });
            }
            
            return res.status(400).json({
                status: 'error',
                message: 'Unknown data type. Need symbol data.'
            });
            
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
