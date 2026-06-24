const jwt = require('jsonwebtoken');
const JWT_SECRET = "super_secret_silent_meeting_key";

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) return res.status(401).json({ error: "Access Denied. No token provided." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid or expired token." });
        
        req.user = user; 
        
        next(); 
    });
}

module.exports = authenticateToken;