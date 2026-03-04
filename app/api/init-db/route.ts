import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const connection = await pool.getConnection();

        // 1. Create folders table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS folders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. Create uploads table with document support and folder_id
        await connection.query(`
            CREATE TABLE IF NOT EXISTS uploads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                folder_id INT DEFAULT NULL,
                file_path TEXT,
                mime_type VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Migration Check
        const [cols]: any = await connection.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'uploads'
        `);

        const columnNames = (Array.isArray(cols) ? cols : []).map((c: any) => c.COLUMN_NAME.toLowerCase());

        // Add folder_id if it doesn't exist
        if (!columnNames.includes('folder_id')) {
            await connection.query(`ALTER TABLE uploads ADD COLUMN folder_id INT DEFAULT NULL AFTER type`);
            await connection.query(`ALTER TABLE uploads ADD CONSTRAINT fk_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL`);
            console.log('Migrated: Added folder_id column and foreign key');
        }

        // Change type column from ENUM to VARCHAR to support 'document' and others safely
        await connection.query(`ALTER TABLE uploads MODIFY COLUMN type VARCHAR(50) NOT NULL`);

        connection.release();

        return NextResponse.json({
            success: true,
            message: 'Database synced with folders and documents support.'
        });

    } catch (error: any) {
        console.error('Database Init Error:', error.message);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
