// /api/get_all_symbols.js - SIMPLE WORKING VERSION
export default function handler(req, res) {
    // Initialize jika belum ada
    if (!global.bbData) {
        global.bbData = { symbols: {}, charts: {}, positions: {} };
    }
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            status: 'error', 
            message: 'Method not allowed. Use GET.' 
        });
    }
    
    try {
        console.log('🔍 get_all_symbols called');
        
        // Ambil data
        const symbols = global.bbData.symbols || {};
        const symbolKeys = Object.keys(symbols);
        
        console.log('📊 Found symbols:', symbolKeys.length, symbolKeys);
        
        // Bersihkan data yang expired (lebih dari 2 menit)
        const now = Date.now();
        const expiredSymbols = [];
        
        for (const symbol in symbols) {
            const lastUpdate = symbols[symbol]?.last_update || 0;
            if (now - lastUpdate > 120000) { // 2 menit
                expiredSymbols.push(symbol);
            }
        }
        
        // Hapus expired symbols
        if (expiredSymbols.length > 0) {
            console.log('🧹 Cleaning expired:', expiredSymbols);
            expiredSymbols.forEach(sym => {
                delete symbols[sym];
            });
        }
        
        // Update keys setelah cleaning
        const activeKeys = Object.keys(symbols);
        
        // Prepare response
        const response = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            active_count: activeKeys.length,
            symbols: symbols
        };
        
        console.log('✅ Sending response with', activeKeys.length, 'symbol(s)');
        
        return res.status(200).json(response);
        
    } catch (error) {
        console.error('❌ Error in get_all_symbols:', error);
        console.error('Stack:', error.stack);
        
        // Error response
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error: ' + error.message,
            timestamp: new Date().toISOString()
        });
    }
}
