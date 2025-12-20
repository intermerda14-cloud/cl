// /api/close_all.js - Send close all command to EA
let closeAllCommand = { active: false, created: 0, executed: false };

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // GET - EA polls for close all command
    if (req.method === 'GET') {
        // Auto-expire after 30 seconds
        if (closeAllCommand.active && Date.now() - closeAllCommand.created > 30000) {
            closeAllCommand.active = false;
        }
        
        return res.status(200).json({
            status: 'ok',
            close_all: closeAllCommand.active && !closeAllCommand.executed,
            created: closeAllCommand.created
        });
    }
    
    // POST - Website sends close all OR EA confirms
    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            // EA confirming execution
            if (data.executed) {
                closeAllCommand.executed = true;
                closeAllCommand.active = false;
                
                return res.status(200).json({
                    status: 'ok',
                    message: 'Close all confirmed'
                });
            }
            
            // Website sending close all command
            closeAllCommand = {
                active: true,
                created: Date.now(),
                executed: false
            };
            
            return res.status(200).json({
                status: 'ok',
                message: 'Close all command sent'
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
