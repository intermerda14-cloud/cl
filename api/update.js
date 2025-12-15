// /api/update.js - VERSION FIXED FOR DEBUGGING
if (!global.bbData) {
    global.bbData = { symbols: {}, charts: {}, positions: {} };
}

export default function handler(req, res) {
    // Set CORS headers FIRST
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Content-Type', 'application/json');
    
    // Handle OPTIONS for CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // DEBUG: Log semua request yang masuk
    console.log('=== REQUEST DEBUG ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Query:', req.query);
    console.log('Body type:', typeof req.body);
    console.log('Body length:', req.body ? req.body.length : 0);
    console.log('Body preview:', req.body ? req.body.toString().substring(0, 200) : 'null');
    console.log('====================');
    
    // Jika bukan POST, tampilkan error yang jelas
    if (req.method !== 'POST') {
        console.log(`❌ WRONG METHOD: ${req.method} but expected POST`);
        return res.status(405).json({ 
            status: 'error', 
            message: `Method ${req.method} not allowed. Use POST.`,
            your_request: {
                method: req.method,
                url: req.url,
                headers: req.headers
            },
            required: {
                method: 'POST',
                url: '/api/update',
                headers: {
                    'Content-Type': 'application/json'
                },
                body_example: {
                    symbol: 'EURUSD',
                    bid: 1.08542,
                    equity: 10000,
                    balance: 9950,
                    daily_pnl: 50
                }
            }
        });
    }
    
    try {
        let data;
        let rawBody = '';
        
        // Get raw body untuk debugging
        if (req.body) {
            if (typeof req.body === 'string') {
                rawBody = req.body;
            } else if (Buffer.isBuffer(req.body)) {
                rawBody = req.body.toString();
            } else if (typeof req.body === 'object') {
                rawBody = JSON.stringify(req.body);
            }
        }
        
        console.log('📥 Raw body received:', rawBody.substring(0, 500));
        
        // Parse JSON
        if (rawBody.trim() === '') {
            console.log('❌ Empty body received');
            return res.status(400).json({ 
                status: 'error', 
                message: 'Empty request body',
                hint: 'EA harus mengirim JSON data, contoh: {"symbol":"EURUSD"}'
            });
        }
        
        try {
            data = JSON.parse(rawBody);
        } catch (parseError) {
            console.log('❌ JSON Parse Error:', parseError.message);
            console.log('❌ Problematic JSON:', rawBody);
            
            // Coba cari masalah di JSON
            const lines = rawBody.split('\n');
            let errorLine = 'Unknown';
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('{') || lines[i].includes('}') || lines[i].includes('"')) {
                    errorLine = `Line ${i+1}: ${lines[i]}`;
                    break;
                }
            }
            
            return res.status(400).json({ 
                status: 'error', 
                message: 'Invalid JSON format: ' + parseError.message,
                error_at: errorLine,
                raw_received: rawBody.substring(0, 200),
                correct_format: '{"symbol":"EURUSD","bid":1.08542,"equity":10000}'
            });
        }
        
        // Validate required fields
        if (!data || typeof data !== 'object') {
            console.log('❌ Data is not an object:', typeof data);
            return res.status(400).json({ 
                status: 'error', 
                message: 'Data must be a JSON object',
                received_type: typeof data
            });
        }
        
        if (!data.symbol || data.symbol.trim() === '') {
            console.log('❌ Missing symbol field');
            return res.status(400).json({ 
                status: 'error', 
                message: 'Missing required field: symbol',
                received_fields: Object.keys(data),
                example: '{"symbol":"EURUSD"}'
            });
        }
        
        const symbol = data.symbol.replace(/[^A-Za-z0-9]/g, '');
        
        // Add metadata
        data.last_update = Date.now();
        data.server_time = new Date().toISOString();
        
        // Store data
        global.bbData.symbols[symbol] = data;
        
        console.log('✅ Data stored for:', symbol);
        console.log('📊 Data fields:', Object.keys(data));
        console.log('💰 Sample data:', {
            symbol: data.symbol,
            bid: data.bid,
            equity: data.equity,
            time: data.server_time
        });
        
        // Clean old data
        const now = Date.now();
        const CLEANUP_MS = 120000;
        
        for (const s in global.bbData.symbols) {
            const lastUpdate = global.bbData.symbols[s].last_update || 0;
            if (now - lastUpdate > CLEANUP_MS) {
                console.log('🧹 Cleaning old:', s);
                delete global.bbData.symbols[s];
            }
        }
        
        const activeCount = Object.keys(global.bbData.symbols).length;
        console.log('📈 Total active symbols:', activeCount);
        
        // Success response
        res.status(200).json({
            status: 'ok',
            symbol: symbol,
            received_at: data.server_time,
            active_symbols: activeCount,
            your_data_received: {
                symbol: data.symbol,
                bid: data.bid,
                equity: data.equity,
                fields_count: Object.keys(data).length
            },
            next_step: 'Data akan muncul di dashboard dalam 3 detik'
        });
        
    } catch (err) {
        console.error('❌ Server Error:', err.message);
        console.error('Stack:', err.stack);
        
        res.status(500).json({ 
            status: 'error', 
            message: 'Server error: ' + err.message,
            timestamp: new Date().toISOString(),
            hint: 'Check Vercel logs for details'
        });
    }
}
