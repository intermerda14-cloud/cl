// Shared in-memory storage
// Note: In serverless, this resets between cold starts
// For persistent storage, use Vercel KV (free tier available) or external DB

// Using global to persist between function calls (same instance)
if (!global.bbScalperData) {
    global.bbScalperData = {
        symbols: {},
        charts: {},
        positions: {},
        lastCleanup: Date.now()
    };
}

// Cleanup old data (older than 2 minutes)
function cleanupOldData() {
    const now = Date.now();
    if (now - global.bbScalperData.lastCleanup < 30000) return; // Only every 30s
    
    global.bbScalperData.lastCleanup = now;
    
    for (const symbol in global.bbScalperData.symbols) {
        const lastUpdate = global.bbScalperData.symbols[symbol]?.last_update || 0;
        if (now - lastUpdate > 120000) { // 2 minutes
            delete global.bbScalperData.symbols[symbol];
            delete global.bbScalperData.charts[symbol];
            delete global.bbScalperData.positions[symbol];
        }
    }
}

module.exports = {
    getData: () => {
        cleanupOldData();
        return global.bbScalperData;
    },
    setSymbol: (symbol, data) => {
        data.last_update = Date.now();
        global.bbScalperData.symbols[symbol] = data;
    },
    setChart: (symbol, data) => {
        data.last_update = Date.now();
        global.bbScalperData.charts[symbol] = data;
    },
    setPositions: (symbol, data) => {
        data.last_update = Date.now();
        global.bbScalperData.positions[symbol] = data;
    }
};
