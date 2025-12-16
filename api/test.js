// /api/test.js
export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    res.status(200).json({
        status: 'ok',
        message: 'Test endpoint working',
        time: new Date().toISOString(),
        global_data_exists: !!global.bbData,
        global_keys: global.bbData ? Object.keys(global.bbData) : 'none',
        symbols_count: global.bbData?.symbols ? Object.keys(global.bbData.symbols).length : 0
    });
}
