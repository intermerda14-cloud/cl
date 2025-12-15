// /api/update.js - FIXED VERSION
if (!global.bbData) {
    global.bbData = { symbols: {}, charts: {}, positions: {} };
}

export default function handler(req, res) {
    // Set CORS headers - HARUS DI AWAL
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Content-Type', 'application/json');
    
    // Handle OPTIONS (CORS preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    console.log('=== INCOMING REQUEST ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // DEBUG: Accept GET for testing from browser
    if (req.method === 'GET') {
        console.log('📱 GET request from browser detected');
        
        return res.status(200).json({
            status: 'info',
            message: 'EA Dashboard API is running',
            current_status: {
                total_symbols: Object.keys(global.bbData.symbols).length,
                symbols: Object.keys(global.bbData.symbols),
                last_update: global.bbData.symbols[Object.keys(global.bbData.symbols)[0]]?.server_time || 'none'
            },
            instructions_for_ea: {
                method: 'POST',
                url: 'https://cl-ten-woad.vercel.app/api/update',
                headers: 'Content-Type: application/json',
                body_example: {
                    symbol: 'EURUSD',
                    bid: 1.08542,
                    equity: 10000,
                    balance: 9950,
                    daily_pnl: 50
                }
            },
            test_with_curl: 'curl -X POST https://cl-ten-woad.vercel.app/api/update -H "Content-Type: application/json" -d \'{"symbol":"TEST","bid":1.0,"equity":1000}\''
        });
    }
    
    // Handle POST request (from EA)
    if (req.method === 'POST') {
        console.log('📨 POST request received (from EA)');
        
        try {
            let data;
            let rawBody = '';
            
            // Get raw body
            if (req.body) {
                if (typeof req.body === 'string') {
                    rawBody = req.body;
                } else if (Buffer.isBuffer(req.body)) {
                    rawBody = req.body.toString('utf8');
                } else if (typeof req.body === 'object') {
                    // Jika body sudah di-parse oleh Vercel
                    data = req.body;
                    rawBody = JSON.stringify(req.body);
                }
            }
            
            console.log('Raw body (first 500 chars):', rawBody.substring(0, 500));
            
            // Parse JSON jika belum
            if (!data && rawBody) {
                try {
                    data = JSON.parse(rawBody);
                } catch (parseError) {
                    console.log('JSON parse error:', parseError.message);
                    return res.status(400).json({
                        status: 'error',
                        message: 'Invalid JSON: ' + parseError.message,
                        received: rawBody.substring(0, 200)
                    });
                }
            }
            
            if (!data) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No data received'
                });
            }
            
            // Validate required field
            if (!data.symbol) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing symbol field',
                    received_fields: Object.keys(data)
                });
            }
            
            const symbol = data.symbol.replace(/[^A-Za-z0-9]/g, '');
            
            // Add timestamp
            data.last_update = Date.now();
            data.server_time = new Date().toISOString();
            
            // Store data
            global.bbData.symbols[symbol] = data;
            
            console.log('✅ Data stored for symbol:', symbol);
            console.log('📊 Data sample:', {
                symbol: data.symbol,
                bid: data.bid,
                equity: data.equity,
                time: data.server_time
            });
            
            // Success response
            return res.status(200).json({
                status: 'ok',
                symbol: symbol,
                received_at: data.server_time,
                active_symbols: Object.keys(global.bbData.symbols).length,
                message: 'Data received successfully from EA'
            });
            
        } catch (error) {
            console.error('❌ Server error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Server error: ' + error.message
            });
        }
    }
    
    // Jika method lain
    return res.status(405).json({
        status: 'error',
        message: `Method ${req.method} not allowed. Only GET and POST are supported.`
    });
}
