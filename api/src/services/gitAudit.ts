import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs/promises';
import path from 'path';

const AUDIT_DIR = process.env.AUDIT_DIR || './audit-logs';
let git: SimpleGit | null = null;

async function initAuditRepo() {
    try {
        await fs.mkdir(AUDIT_DIR, { recursive: true });
        git = simpleGit(AUDIT_DIR);

        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            await git.init();
            await git.addConfig('user.email', 'audit@campus-system.local');
            await git.addConfig('user.name', 'Campus System Audit');
            console.log('Audit git repository initialized');
        }
    } catch (error) {
        console.error('Failed to initialize audit repo:', error);
    }
}

initAuditRepo();

interface AuditEntry {
    timestamp: string;
    action: string;
    data: any;
}

export async function auditLog(action: string, data: any): Promise<void> {
    try {
        if (!git) {
            await initAuditRepo();
        }

        const timestamp = new Date().toISOString();
        const entry: AuditEntry = { timestamp, action, data };

        const dateStr = timestamp.split('T')[0];
        const logFile = path.join(AUDIT_DIR, `${dateStr}.json`);

        let entries: AuditEntry[] = [];
        try {
            const content = await fs.readFile(logFile, 'utf-8');
            entries = JSON.parse(content);
        } catch {
        }

        entries.push(entry);

        await fs.writeFile(logFile, JSON.stringify(entries, null, 2));

        if (git) {
            await git.add('.');
            await git.commit(`${action}: ${JSON.stringify(data).slice(0, 50)}...`);
        }

        console.log(`Audit: ${action}`);
    } catch (error) {
        console.error('Audit log error:', error);
    }
}

export async function getAuditHistory(days: number = 7): Promise<AuditEntry[]> {
    const entries: AuditEntry[] = [];

    try {
        const files = await fs.readdir(AUDIT_DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, days);

        for (const file of jsonFiles) {
            const content = await fs.readFile(path.join(AUDIT_DIR, file), 'utf-8');
            const fileEntries = JSON.parse(content);
            entries.push(...fileEntries);
        }
    } catch (error) {
        console.error('Failed to read audit history:', error);
    }

    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getCommitHistory(limit: number = 50): Promise<any[]> {
    try {
        if (!git) {
            await initAuditRepo();
        }

        const log = await git?.log({ maxCount: limit });
        return [...(log?.all || [])];
    } catch (error) {
        console.error('Failed to get commit history:', error);
        return [];
    }
}

export async function rollbackToCommit(commitHash: string): Promise<boolean> {
    try {
        if (!git) return false;
        await git.checkout(commitHash);
        return true;
    } catch (error) {
        console.error('Rollback failed:', error);
        return false;
    }
}
