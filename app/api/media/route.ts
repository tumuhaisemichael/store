import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { mkdir, stat, open } from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';

// Helper to convert a Node.js ReadStream to a Web ReadableStream
function nodeToWebStream(nodeStream: any) {
    return new ReadableStream({
        start(controller) {
            nodeStream.on('data', (chunk: any) => controller.enqueue(chunk));
            nodeStream.on('end', () => controller.close());
            nodeStream.on('error', (err: any) => controller.error(err));
        },
        cancel() {
            nodeStream.destroy();
        },
    });
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        if (id) {
            const [rows]: any = await pool.query(
                'SELECT file_path, mime_type FROM uploads WHERE id = ?',
                [id]
            );

            if (!rows || rows.length === 0) return new NextResponse('File Not Found', { status: 404 });

            const item = rows[0];
            const fullPath = item.file_path;
            const fileStats = await stat(fullPath);
            const fileSize = fileStats.size;
            const mimeType = item.mime_type;

            const range = request.headers.get('range');

            if (range && mimeType.startsWith('video/')) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;

                const nodeStream = createReadStream(fullPath, { start, end });

                return new NextResponse(nodeToWebStream(nodeStream) as any, {
                    status: 206,
                    headers: {
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunksize.toString(),
                        'Content-Type': mimeType,
                    },
                });
            }

            const nodeStream = createReadStream(fullPath);
            return new NextResponse(nodeToWebStream(nodeStream) as any, {
                status: 200,
                headers: {
                    'Content-Type': mimeType,
                    'Content-Length': fileSize.toString(),
                    'Cache-Control': 'public, max-age=86400',
                },
            });
        }

        const [rows]: any = await pool.query('SELECT id, name, type, created_at FROM uploads ORDER BY created_at DESC');
        return NextResponse.json((Array.isArray(rows) ? rows : []).map((item: any) => ({
            ...item,
            url: `/api/media?id=${item.id}`
        })));

    } catch (error: any) {
        console.error('Media API Error:', error.message);
        return NextResponse.json({ error: 'File read error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string;

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const uploadDir = path.join(process.cwd(), 'uploads_vault');
        await mkdir(uploadDir, { recursive: true });

        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const filePath = path.join(uploadDir, fileName);

        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        const [result]: any = await pool.query(
            'INSERT INTO uploads (name, type, mime_type, file_path) VALUES (?, ?, ?, ?)',
            [file.name, type, file.type, filePath]
        );

        return NextResponse.json({
            success: true,
            id: result.insertId,
            url: `/api/media?id=${result.insertId}`
        });

    } catch (error: any) {
        console.error('Upload Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
