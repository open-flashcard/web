import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Read file content
        const buffer = Buffer.from(await file.arrayBuffer());
        const content = buffer.toString('utf-8');

        // Validate JSON
        let deck;
        try {
            deck = JSON.parse(content);
            if (!deck.id || !Array.isArray(deck.cards)) {
                throw new Error("Invalid OFS Deck");
            }
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
        }

        // Determine save path
        // We'll use the original filename if possible, otherwise UUID
        // Sanitize filename to prevent directory traversal
        const originalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const fileName = originalName.endsWith('.json') ? originalName : `${originalName}.json`;

        const saveDir = path.join(process.cwd(), 'flashcards');
        await fs.mkdir(saveDir, { recursive: true });

        const savePath = path.join(saveDir, fileName);

        // Check if file exists to prevent unintentional overwrite? 
        // User said "upload json manually", overwrite is probably expected or acceptable for simple flow.
        await fs.writeFile(savePath, content, 'utf-8');

        // Return the deckId (filename relative to repo base) required by the practice API
        // Practice API repo uses process.cwd() as base.
        // So deckId should be 'flashcards/fileName' if repo base is CWD.
        // Wait, in practice API `getEngine`:
        // `const repo = new NextFSFlashcardRepository(process.cwd());`
        // `repo.getDeck(id)` -> `path.join(basePath, id)`
        // `path.join(cwd, 'flashcards/foo.json')`

        const deckId = `flashcards/${fileName}`;

        return NextResponse.json({
            success: true,
            deckId: deckId,
            deck: deck
        });

    } catch (e) {
        console.error("Upload error", e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
