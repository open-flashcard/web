
import { NextRequest, NextResponse } from 'next/server';
import { NextFSFlashcardRepository } from '@/lib/repos/fs-repo';
import { PracticeEngine } from 'ofc-ts';

// Helper to get repo and engine
async function getEngine(deckId: string) {
    // Initialize repo at project root so we can access public/samples or other dirs
    const repo = new NextFSFlashcardRepository(process.cwd());

    // Let's assume deckId passed in URL is URL-encoded path relative to basePath.
    const decodedId = decodeURIComponent(deckId);
    const engine = new PracticeEngine(repo);

    return { engine, repo, decodedId };
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ deckId: string }> }
) {
    const { deckId } = await params;

    try {
        const { engine, repo, decodedId } = await getEngine(deckId);

        // Ensure activity is loaded for this deck
        await (repo as NextFSFlashcardRepository).loadDeckActivity(decodedId);

        const body = await request.json();
        const { cardId, rating } = body; // Rating: 1|2|3|4

        if (!cardId || undefined === rating) {
            return NextResponse.json({ error: 'Missing cardId or rating' }, { status: 400 });
        }

        // Record practice
        await engine.gradeCard(cardId, rating);

        // Fetch updated state to return to client
        const newState = await repo.getCardState(cardId);

        return NextResponse.json(newState || {});
    } catch (error) {
        console.error("Error submitting review:", error);
        return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }
}
