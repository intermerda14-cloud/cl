// /api/simple_test.js
let myData = { symbols: {} };

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    // Simpan data test
    myData.symbols['TESTING'] = {
        symbol: 'TESTING',
        bid: 99.99,
        equity: 9999,
        time: new Date().toISOString()
    };
    
    res.status(200).json({
        status: 'ok',
        message: 'Test data saved directly',
        data: myData.symbols,
        count: Object.keys(myData.symbols).length
    });
}
