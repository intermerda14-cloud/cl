// In-memory storage
if (!global.bbData) {
    global.bbData = { symbols: {}, charts: {}, positions: {} };
}

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Origin, Accept');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            status: 'error', 
            message: 'Method not allowed. Use POST.',
            required_format: {
                symbol: 'string (required)',
                bid: 'number',
                equity: 'number',
                balance: 'number',
                daily_pnl: 'number'
            },
            example: {
                symbol: 'EURUSD',
                bid: 1.08542,
                equity: 10000,
                balance: 9950,
                daily_pnl: 50
            }
        });
    }
    
    try {
        let data;
        
        // Handle both raw string and JSON body
        if (typeof req.body === 'string') {
            try {
                data = JSON.parse(req.body);
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError.message, 'Raw:', req.body.substring(0, 100));
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Invalid JSON format',
                    hint: 'Send as {"symbol":"EURUSD", "bid":1.08542}'
                });
            }
        } else {
            data = req.body;
        }
        
        console.log('📨 Received from EA at', new Date().toISOString());
        console.log('📊 Data:', JSON.stringify(data).substring(0, 300));
        
        if (!data || typeof data !== 'object') {
            console.log('❌ Invalid data object');
            return res.status(400).json({ 
                status: 'error', 
                message: 'Invalid data format. Must be JSON object.' 
            });
        }
        
        if (!data.symbol || data.symbol.trim() === '') {
            console.log('❌ Missing symbol field');
            return res.status(400).json({ 
                status: 'error', 
                message: 'No symbol provided',
                received_fields: Object.keys(data)
            });
        }
        
        const symbol = data.symbol.replace(/[^A-Za-z0-9]/g, '');
        
        // Add metadata
        data.last_update = Date.now();
        data.server_time = new Date().toISOString();
        data.received_at = data.server_time;
        
        // Ensure required fields exist
        if (!data.bid && data.bid !== 0) data.bid = 0;
        if (!data.equity && data.equity !== 0) data.equity = 0;
        if (!data.balance && data.balance !== 0) data.balance = 0;
        if (!data.daily_pnl && data.daily_pnl !== 0) data.daily_pnl = 0;
        
        // Store data
        global.bbData.symbols[symbol] = data;
        
        // Clean old data (older than 2 minutes)
        const now = Date.now();
        const CLEANUP_MS = 120000; // 2 minutes
        
        for (const s in global.bbData.symbols) {
            const lastUpdate = global.bbData.symbols[s].last_update || 0;
            if (now - lastUpdate > CLEANUP_MS) {
                console.log('🧹 Cleaning old symbol:', s, 'Age:', Math.round((now - lastUpdate)/1000), 'sec');
                delete global.bbData.symbols[s];
                delete global.bbData.charts[s];
                delete global.bbData.positions[s];
            }
        }
        
        const activeCount = Object.keys(global.bbData.symbols).length;
        console.log('✅ Stored:', symbol, 'Total active:', activeCount);
        
        res.status(200).json({
            status: 'ok',
            symbol: symbol,
            active_symbols: activeCount,
            server_time: data.server_time,
            message: 'Data received successfully',
            next_steps: [
                'Data will appear on dashboard automatically',
                'EA should also send to /api/chart for chart data',
                'EA should also send to /api/positions for positions'
            ]
        });
        
    } catch (err) {
        console.error('❌ Server Error:', err.message);
        console.error('Stack:', err.stack);
        
        res.status(500).json({ 
            status: 'error', 
            message: 'Server error: ' + err.message,
            timestamp: new Date().toISOString()
        });
    }
}
