import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const connection = await pool.getConnection();

        // 1. Create table safely if it doesn't exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS uploads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type ENUM('image', 'video') NOT NULL,
                file_path TEXT,
                mime_type VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. Safe Migration: Check for the new Disk-Path columns and add them ONLY if they are missing
        // This ensures nobody's data is wiped during a switch or repair
        const [cols]: any = await connection.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'uploads'
        `);

        const columnNames = (Array.isArray(cols) ? cols : []).map((c: any) => c.COLUMN_NAME.toLowerCase());

        if (!columnNames.includes('file_path')) {
            await connection.query(\`ALTER TABLE uploads ADD COLUMN file_path TEXT AFTER type\`);
            console.log('Migrated: Added file_path column');
        }

        if (!columnNames.includes('mime_type')) {
            await connection.query(\`ALTER TABLE uploads ADD COLUMN mime_type VARCHAR(100) AFTER file_path\`);
            console.log('Migrated: Added mime_type column');
        }

        connection.release();

        return NextResponse.json({ 
            success: true, 
            message: 'Database synced and data is protected.' 
        });

    } catch (error: any) {
        console.error('Database Init Error:', error.message);
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
