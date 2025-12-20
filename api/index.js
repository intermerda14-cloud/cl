// /api/index.js - UNIFIED API WITH MONGODB
// Persistent storage using MongoDB Atlas

import { MongoClient } from 'mongodb';

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin_cg:merda1897@cluster0.pelcczd.mongodb.net/?appName=Cluster0';
const DB_NAME = 'bb_scalper';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const action = req.query.action || 'status';
    
    try {
        const { db } = await connectToDatabase();
        
        switch (action) {
            case 'ping':
                return handlePing(req, res, db);
            case 'update':
                return handleUpdate(req, res, db);
            case 'get':
            case 'get_all_symbols':
                return handleGetSymbols(req, res, db);
            case 'chart':
                return handleChart(req, res, db);
            case 'positions':
                return handlePositions(req, res, db);
            case 'close_trade':
                return handleCloseTrade(req, res, db);
            case 'close_all':
                return handleCloseAll(req, res, db);
            default:
                return res.status(200).json({
                    status: 'ok',
                    message: 'BB Scalper V4.3 API with MongoDB',
                    endpoints: ['ping', 'update', 'get', 'chart', 'positions', 'close_trade', 'close_all'],
                    usage: '/api?action=ping'
                });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

// === PING ===
async function handlePing(req, res, db) {
    const symbols = await db.collection('symbols').find({}).toArray();
    return res.status(200).json({
        status: 'ok',
        message: 'BB Scalper V4.3 Dashboard Online',
        version: '4.3-mongodb',
        time: new Date().toISOString(),
        active_symbols: symbols.length,
        database: 'connected'
    });
}

// === UPDATE (POST from EA) ===
async function handleUpdate(req, res, db) {
    if (req.method === 'GET') {
        const symbols = await db.collection('symbols').find({}).toArray();
        return res.status(200).json({
            status: 'ok',
            message: 'Update endpoint ready',
            active_symbols: symbols.length
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
        data._id = symbol; // Use symbol as unique ID
        
        // Upsert to MongoDB
        await db.collection('symbols').updateOne(
            { _id: symbol },
            { $set: data },
            { upsert: true }
        );
        
        // Clean old data (> 2 min)
        const cutoff = Date.now() - 120000;
        await db.collection('symbols').deleteMany({ last_update: { $lt: cutoff } });
        
        const count = await db.collection('symbols').countDocuments();
        
        return res.status(200).json({
            status: 'ok',
            symbol: symbol,
            active_symbols: count,
            message: 'Data saved to MongoDB'
        });
        
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}

// === GET ALL SYMBOLS ===
async function handleGetSymbols(req, res, db) {
    // Clean old data
    const cutoff = Date.now() - 120000;
    await db.collection('symbols').deleteMany({ last_update: { $lt: cutoff } });
    
    // Get all symbols
    const symbolsArray = await db.collection('symbols').find({}).toArray();
    
    // Convert to object format
    const symbols = {};
    symbolsArray.forEach(doc => {
        const sym = doc._id || doc.symbol;
        symbols[sym] = doc;
    });
    
    return res.status(200).json({
        status: 'ok',
        symbols: symbols,
        active_count: Object.keys(symbols).length,
        timestamp: new Date().toISOString()
    });
}

// === CHART ===
async function handleChart(req, res, db) {
    if (req.method === 'POST') {
        try {
            const data = req.body;
            if (!data || !data.symbol) {
                return res.status(400).json({ status: 'error', message: 'Missing symbol' });
            }
            
            const symbol = data.symbol;
            const timeframe = data.timeframe || 'M1';
            data.last_update = Date.now();
            
            // Store by symbol_timeframe
            const chartId = symbol + '_' + timeframe;
            data._id = chartId;
            
            await db.collection('charts').updateOne(
                { _id: chartId },
                { $set: data },
                { upsert: true }
            );
            
            return res.status(200).json({
                status: 'ok',
                symbol: symbol,
                timeframe: timeframe,
                candle_count: data.data?.length || 0
            });
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    }
    
    // GET - Support timeframe parameter
    const symbol = req.query.symbol || '';
    const timeframe = req.query.timeframe || 'M1';
    let chartData = null;
    
    // Try to find exact symbol_timeframe
    if (symbol) {
        const chartId = symbol + '_' + timeframe;
        chartData = await db.collection('charts').findOne({ _id: chartId });
    }
    
    // Fallback: find any chart with this timeframe
    if (!chartData) {
        chartData = await db.collection('charts').findOne({ timeframe: timeframe });
    }
    
    // Final fallback: any chart
    if (!chartData) {
        chartData = await db.collection('charts').findOne({});
    }
    
    if (chartData) {
        let candles = chartData.data || chartData.candles || [];
        candles = candles.map(c => ({
            o: parseFloat(c.o || c.open || 0),
            h: parseFloat(c.h || c.high || 0),
            l: parseFloat(c.l || c.low || 0),
            c: parseFloat(c.c || c.close || 0),
            t: c.t || c.time || 0
        }));
        
        // Get digits from symbols collection
        const sym = chartData.symbol || symbol;
        const symbolData = await db.collection('symbols').findOne({ _id: sym });
        
        return res.status(200).json({
            status: 'ok',
            symbol: chartData.symbol || chartData._id?.split('_')[0] || '',
            timeframe: chartData.timeframe || timeframe,
            digits: symbolData?.digits || chartData.digits || 2,
            candles: candles
        });
    }
    
    return res.status(200).json({ status: 'waiting', timeframe: timeframe, candles: [] });
}

// === POSITIONS ===
async function handlePositions(req, res, db) {
    if (req.method === 'POST') {
        try {
            const data = req.body;
            if (data.positions && Array.isArray(data.positions)) {
                // Clear old positions and insert new
                await db.collection('positions').deleteMany({});
                if (data.positions.length > 0) {
                    await db.collection('positions').insertMany(data.positions);
                }
                return res.status(200).json({ status: 'ok', count: data.positions.length });
            }
            return res.status(400).json({ status: 'error', message: 'Invalid data' });
        } catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    }
    
    const positions = await db.collection('positions').find({}).toArray();
    return res.status(200).json({
        status: 'ok',
        positions: positions,
        count: positions.length
    });
}

// === CLOSE TRADE ===
async function handleCloseTrade(req, res, db) {
    if (req.method === 'GET') {
        const pending = await db.collection('commands').find({ type: 'close', executed: false }).toArray();
        return res.status(200).json({ status: 'ok', commands: pending });
    }
    
    if (req.method === 'POST') {
        const data = req.body;
        
        if (data.executed_ticket) {
            await db.collection('commands').updateOne(
                { ticket: parseInt(data.executed_ticket) },
                { $set: { executed: true } }
            );
            return res.status(200).json({ status: 'ok', message: 'Confirmed' });
        }
        
        if (data.ticket) {
            await db.collection('commands').insertOne({
                type: 'close',
                ticket: parseInt(data.ticket),
                created: Date.now(),
                executed: false
            });
            
            // Clean old commands (> 5 min)
            const cutoff = Date.now() - 300000;
            await db.collection('commands').deleteMany({ created: { $lt: cutoff } });
            
            return res.status(200).json({ status: 'ok', message: 'Command queued' });
        }
        
        return res.status(400).json({ status: 'error', message: 'Missing ticket' });
    }
    
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
}

// === CLOSE ALL ===
async function handleCloseAll(req, res, db) {
    if (req.method === 'GET') {
        const cmd = await db.collection('commands').findOne({ type: 'close_all', executed: false });
        return res.status(200).json({ status: 'ok', close_all: !!cmd });
    }
    
    if (req.method === 'POST') {
        const data = req.body;
        if (data.executed) {
            await db.collection('commands').updateMany(
                { type: 'close_all' },
                { $set: { executed: true } }
            );
            return res.status(200).json({ status: 'ok', message: 'Confirmed' });
        }
        
        await db.collection('commands').insertOne({
            type: 'close_all',
            created: Date.now(),
            executed: false
        });
        return res.status(200).json({ status: 'ok', message: 'Close all triggered' });
    }
    
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
}
