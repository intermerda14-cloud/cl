// /api/close_trade.js - Send close trade command to EA
let closeCommands = [];

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // GET - EA polls for pending close commands
    if (req.method === 'GET') {
        const pending = closeCommands.filter(cmd => !cmd.executed);
        
        return res.status(200).json({
            status: 'ok',
            commands: pending,
            count: pending.length
        });
    }
    
    // POST - Website sends close command OR EA confirms execution
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            // Website sending close command
            if (data.ticket) {
                const ticket = parseInt(data.ticket);
                
                // Check if command already exists
                const existing = closeCommands.find(cmd => cmd.ticket === ticket && !cmd.executed);
                if (existing) {
                    return res.status(200).json({
                        status: 'ok',
                        message: 'Close command already pending',
                        ticket: ticket
                    });
                }
                
                // Add new close command
                closeCommands.push({
                    ticket: ticket,
                    created: Date.now(),
                    executed: false,
                    result: null
                });
                
                // Clean old commands (older than 5 minutes)
                const now = Date.now();
                closeCommands = closeCommands.filter(cmd => now - cmd.created < 300000);
                
                return res.status(200).json({
                    status: 'ok',
                    message: 'Close command queued',
                    ticket: ticket
                });
            }
            
            // EA confirming execution
            if (data.executed_ticket) {
                const ticket = parseInt(data.executed_ticket);
                const cmd = closeCommands.find(c => c.ticket === ticket);
                
                if (cmd) {
                    cmd.executed = true;
                    cmd.result = data.result || 'ok';
                }
                
                return res.status(200).json({
                    status: 'ok',
                    message: 'Execution confirmed',
                    ticket: ticket
                });
            }
            
            return res.status(400).json({
                status: 'error',
                message: 'Missing ticket parameter'
            });
            
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
    
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
}
