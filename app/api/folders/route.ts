import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT id, name, created_at FROM folders ORDER BY name ASC');
        return NextResponse.json(Array.isArray(rows) ? rows : []);
    } catch (error: any) {
        console.error('Folders API Error:', error.message);
        return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const [result]: any = await pool.query(
            'INSERT INTO folders (name) VALUES (?)',
            [name]
        );

        return NextResponse.json({
            success: true,
            id: result.insertId,
            name: name
        });
    } catch (error: any) {
        console.error('Create Folder Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
