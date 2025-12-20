// /api/index.js - UNIFIED API ENDPOINT
// All requests go through this single file to ensure shared storage
// Usage: /api?action=update, /api?action=get, /api?action=chart, etc.

// Global storage - SINGLE INSTANCE
const storage = {
    symbols: {},
    charts: {},
    positions: [],
    closeCommands: [],
    closeAll: false
};

export default function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Get action from query or path
    const action = req.query.action || 'status';
    
    // Route based on action
    switch (action) {
        case 'ping':
            return handlePing(req, res);
        case 'update':
            return handleUpdate(req, res, storage);
        case 'get':
        case 'get_all_symbols':
            return handleGetSymbols(req, res, storage);
        case 'chart':
            return handleChart(req, res, storage);
        case 'positions':
            return handlePositions(req, res, storage);
        case 'close_trade':
            return handleCloseTrade(req, res, storage);
        case 'close_all':
            return handleCloseAll(req, res, storage);
        default:
            return res.status(200).json({
                status: 'ok',
                message: 'BB Scalper V4.3 API',
                endpoints: ['ping', 'update', 'get', 'chart', 'positions', 'close_trade', 'close_all'],
                usage: '/api?action=ping'
            });
    }
}

// === PING ===
function handlePing(req, res) {
    return res.status(200).json({
        status: 'ok',
        message: 'BB Scalper V4.3 Dashboard Online',
        version: '4.3-unified',
        time: new Date().toISOString(),
        active_symbols: Object.keys(storage.symbols).length
    });
}

// === UPDATE (POST from EA) ===
function handleUpdate(req, res, storage) {
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'ok',
            message: 'Update endpoint ready',
            active_symbols: Object.keys(storage.symbols).length
        });
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Use POST' });
    }
    
    try {
        const data = req.body;
        
        if (!data || !data.symbol) {
            return res.status(400).json({ status: 'error', message: 'Missing symbol' });
        }
        
        const symbol = data.symbol.replace(/[^A-Za-z0-9]/g, '');
        data.last_update = Date.now();
        data.server_time = new Date().toISOString();
        
        // Save to storage
        storage.symbols[symbol] = data;
        
        // Clean old data (> 2 min)
        const now = Date.now();
        for (const s in storage.symbols) {
            if (now - (storage.symbols[s].last_update || 0) > 120000) {
                delete storage.symbols[s];
            }
        }
        
        return res.status(200).json({
            status: 'ok',
            symbol: symbol,
            active_symbols: Object.keys(storage.symbols).length,
            message: 'Data saved'
        });
        
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}

// === GET ALL SYMBOLS ===
function handleGetSymbols(req, res, storage) {
    // Clean old data
    const now = Date.now();
    for (const sym in storage.symbols) {
        if (now - (storage.symbols[sym]?.last_update || 0) > 120000) {
            delete storage.symbols[sym];
        }
    }
    
    return res.status(200).json({
        status: 'ok',
        symbols: storage.symbols,
        active_count: Object.keys(storage.symbols).length,
        timestamp: new Date().toISOString()
    });
}

// === CHART ===
function handleChart(req, res, storage) {
    if (req.method === 'POST') {
        try {
            const data = req.body;
            if (!data || !data.symbol) {
                return res.status(400).json({ status: 'error', message: 'Missing symbol' });
            }
            
            const symbol = data.symbol;
            data.last_update = Date.now();
            storage.charts[symbol] = data;
            
            return res.status(200).json({
                status: 'ok',
                symbol: symbol,
                candle_count: data.data?.length || 0
            });
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    }
    
    // GET
    const symbol = req.query.symbol || Object.keys(storage.charts)[0] || '';
    const chartData = storage.charts[symbol];
    
    if (chartData) {
        let candles = chartData.data || chartData.candles || [];
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
            digits: chartData.digits || storage.symbols[symbol]?.digits || 2,
            candles: candles
        });
    }
    
    return res.status(200).json({ status: 'waiting', candles: [] });
}

// === POSITIONS ===
function handlePositions(req, res, storage) {
    if (req.method === 'POST') {
        try {
            const data = req.body;
            if (data.positions && Array.isArray(data.positions)) {
                storage.positions = data.positions;
                return res.status(200).json({ status: 'ok', count: storage.positions.length });
            }
            return res.status(400).json({ status: 'error', message: 'Invalid data' });
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    }
    
    return res.status(200).json({
        status: 'ok',
        positions: storage.positions,
        count: storage.positions.length
    });
}

// === CLOSE TRADE ===
function handleCloseTrade(req, res, storage) {
    if (req.method === 'GET') {
        const pending = storage.closeCommands.filter(c => !c.executed);
        return res.status(200).json({ status: 'ok', commands: pending });
    }
    
    if (req.method === 'POST') {
        const data = req.body;
        
        if (data.executed_ticket) {
            const cmd = storage.closeCommands.find(c => c.ticket === data.executed_ticket);
            if (cmd) cmd.executed = true;
            return res.status(200).json({ status: 'ok', message: 'Confirmed' });
        }
        
        if (data.ticket) {
            storage.closeCommands.push({
                ticket: parseInt(data.ticket),
                created: Date.now(),
                executed: false
            });
            // Clean old commands
            storage.closeCommands = storage.closeCommands.filter(c => Date.now() - c.created < 300000);
            return res.status(200).json({ status: 'ok', message: 'Command queued' });
        }
        
        return res.status(400).json({ status: 'error', message: 'Missing ticket' });
    }
    
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
}

// === CLOSE ALL ===
function handleCloseAll(req, res, storage) {
    if (req.method === 'GET') {
        return res.status(200).json({ status: 'ok', close_all: storage.closeAll });
    }
    
    if (req.method === 'POST') {
        const data = req.body;
        if (data.executed) {
            storage.closeAll = false;
            return res.status(200).json({ status: 'ok', message: 'Confirmed' });
        }
        storage.closeAll = true;
        return res.status(200).json({ status: 'ok', message: 'Close all triggered' });
    }
    
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
}
