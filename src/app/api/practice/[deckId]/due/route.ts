
import { NextRequest, NextResponse } from 'next/server';
import { NextFSFlashcardRepository } from '@/lib/repos/fs-repo';
import { PracticeEngine } from 'ofc-ts';

// Helper to get repo and engine
async function getEngine(deckId: string) {
    // Initialize repo with default base path (handles local dev vs Vercel serverless)
    const repo = new NextFSFlashcardRepository();

    // Let's assume deckId passed in URL is URL-encoded path relative to basePath.
    const decodedId = decodeURIComponent(deckId);
    const engine = new PracticeEngine(repo);

    return { engine, repo, decodedId };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const { deckId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode') as 'mixed' | 'review' | 'new' | null || 'mixed';
    const order = searchParams.get('order') as 'standard' | 'random' | null || 'standard';

    try {
        const { engine, repo, decodedId } = await getEngine(deckId);

        // Ensure activity is loaded for this deck
        await (repo as NextFSFlashcardRepository).loadDeckActivity(decodedId);

        const dueCards = await engine.getDueCards(decodedId, mode, order);

        return NextResponse.json(dueCards);
    } catch (error) {
        console.error("Error fetching due cards:", error);
        return NextResponse.json({ error: 'Failed to fetch due cards' }, { status: 500 });
    }
}
