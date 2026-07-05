import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'campus-system-secret-key';

export interface AuthRequest extends Request {
    userId?: string;
    userRole?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

export const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

export const generateToken = (userId: string, role: string): string => {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};
