import { FlashcardRepository, Deck, CardState, ReviewLog, Card } from 'ofc-ts';
import fs from 'fs/promises';
import path from 'path';

// Determine where flashcard data (uploaded decks + activity files) should live.
// - In local/dev we default to the Next.js project cwd (so files are committed alongside the repo)
// - On Vercel and other serverless environments, the code directory (/var/task) is read‑only,
//   so we fall back to /tmp, which is writable but ephemeral.
export function getFlashcardDataBasePath(): string {
    if (process.env.FLASHCARD_DATA_DIR) {
        return process.env.FLASHCARD_DATA_DIR;
    }

    if (process.env.VERCEL === '1') {
        // Writable scratch space for Vercel serverless functions
        return '/tmp/ofs-data';
    }

    return process.cwd();
}

export class NextFSFlashcardRepository implements FlashcardRepository {
    private basePath: string;

    constructor(basePath: string = getFlashcardDataBasePath()) {
        this.basePath = basePath;
    }

    private getDeckPath(id: string): string {
        // If id is absolute or relative path, use it, otherwise assume it's in base path
        if (path.isAbsolute(id)) return id;
        return path.join(this.basePath, id);
    }

    private getActivityPath(deckPath: string): string {
        const dir = path.dirname(deckPath);
        const ext = path.extname(deckPath);
        const basename = path.basename(deckPath, ext);
        return path.join(dir, `${basename}.review.json`);
    }

    async getDeck(id: string): Promise<Deck | undefined> {
        try {
            const filePath = this.getDeckPath(id);

            // Auto-load activity for this deck since we are about to return it
            // This sets the context for subsequent getCardState calls
            await this.loadDeckActivity(filePath);

            const data = await fs.readFile(filePath, 'utf-8');
            const deck = JSON.parse(data) as Deck;
            // Ensure ID matches or is set? 
            // ideally we trust the file content, or override id with filename if needed
            return deck;
        } catch (e) {
            console.error(`Failed to load deck ${id}:`, e);
            return undefined;
        }
    }

    async getCardState(cardId: string): Promise<CardState | undefined> {
        // This is tricky because the interface assumes we know the deck context or can find it just by cardId.
        // However, in a file-based system, states are stored per deck (in activity file).
        // For this implementation, we might need to assume the Repository instance is scoped to a Deck, 
        // OR we change the storage strategy to a central DB/file for all states.

        // STARTUP SIMPLIFICATION:
        // To implement the global `getCardState(cardId)` without scanning all files, 
        // we would need a global index. 
        // BUT, the PracticeEngine typically works on a specific DECK.
        // Maybe we can change the usage pattern: The Engine is initialized with a Repo.
        // If we want to support multiple decks, the Repo needs to know where to look.

        // LET'S REFINE: The user said "for each deck file we need a new json file to track user activity".
        // So activity is coupled to the deck file.

        // We can't implement `getCardState(cardId)` efficiently effectively without knowing the deck IF cardIds aren't globally unique or indexed.
        // However, for this task, let's assume we load the ACTIVITY file into memory when needed?
        // No, `getCardState` is atomic.

        // Better approach for FS-based:
        // We need to know which DECK the card belongs to.
        // LIMITATION: `ofc-ts` interface `getCardState(cardId)` doesn't take deckId.
        // FIX: We will store ALL activity in a central `user-activity.json` or similar for simplicity in this MVP?
        // OR, we assume the user only actively practices ONE deck at a time, and we set up the repo for that deck?

        // User request: "for each deck file we need a new json file"
        // So: `deck.json` -> `deck.activity.json`.

        // Problem: `getCardState(cardId)` doesn't tell us which `deck.activity.json` to look in.
        // Hack for MVP: We will scan known decks? No, too slow.
        // Hack for MVP: We require the Repo to be instantiated FOR A SPECIFIC DECK context if we want to read its activity?
        // OR, we just implement a "current deck" concept.

        // WAIT! `PracticeEngine` calls `repo.getDeck(deckId)` then `repo.getCardState(cardId)`.
        // It iterates cards in the deck. 
        // So when we are practicing, we ARE in the context of a deck.
        // But `getCardState` is naked.

        // Refined Plan:
        // Since this is a server-side repo for Next.js, maybe we instantiate it per-request?
        // Or we keep an in-memory index of [CardId -> DeckPath].

        // For now, let's implement a workaround: 
        // We will implement `scoping` the repository to a specific deck path for the session.
        // `new NextFSFlashcardRepository(deckPath)`?

        // But the interface `getDeck(id)` implies it can fetch any deck.

        // Let's go with a simple hybrid:
        // We will store activity in `userdata/activity.json` (ONE BIG FILE) for now? 
        // User explicitly said "for each deck file we need a new json file".

        // Okay, to satisfy "deck.activity.json" AND "getCardState(cardId)":
        // We need a map of CardID -> DeckPath.
        // OR, we are lazy and we assume the Repository is mostly used by `PracticeEngine` which calls `getDeck` first.
        // Actually `PracticeEngine` just calls `getCardState`.

        // Let's add a `setContext(deckId)` method? No, strictly typed interface.

        // Let's try to infer it. 
        // WE WILL LOAD ALL Activity files on startup? No.

        // Let's implement `loadActivity(deckId)` to cache it in the repo instance.
        // When `getDeck(id)` is called, we load the corresponding activity file into memory map.

        return this.cardStates.get(cardId);
    }

    // Activity cache
    private cardStates: Map<string, CardState> = new Map();
    private logs: Map<string, ReviewLog[]> = new Map();
    private currentDeckPath: string | null = null;

    async loadDeckActivity(id: string) {
        const deckPath = this.getDeckPath(id);
        this.currentDeckPath = deckPath;
        const activityPath = this.getActivityPath(deckPath);

        try {
            const data = await fs.readFile(activityPath, 'utf-8');
            const activity = JSON.parse(data) as { states: Record<string, any>, logs: Record<string, any[]> };

            // Merge into cache and hydrate dates
            if (activity.states) {
                for (const [cid, state] of Object.entries(activity.states)) {
                    // Hydrate dates
                    const cardState = { ...state } as CardState;
                    if (typeof state.due === 'string') cardState.due = new Date(state.due);
                    if (typeof state.last_review === 'string') cardState.last_review = new Date(state.last_review);

                    this.cardStates.set(cid, cardState);
                }
            }
            if (activity.logs) {
                for (const [cid, logs] of Object.entries(activity.logs)) {
                    const hydratedLogs = logs.map((log: any) => {
                        const newLog = { ...log } as ReviewLog;
                        if (typeof log.review === 'string') newLog.review = new Date(log.review);
                        if (typeof log.due === 'string') newLog.due = new Date(log.due);
                        return newLog;
                    });
                    this.logs.set(cid, hydratedLogs);
                }
            }
        } catch (e) {
            // No activity file yet, that's fine
        }
    }

    async saveDeckActivity() {
        if (!this.currentDeckPath) return;
        const activityPath = this.getActivityPath(this.currentDeckPath);

        // Ensure directory exists before writing (especially important on fresh /tmp in serverless)
        const activityDir = path.dirname(activityPath);
        await fs.mkdir(activityDir, { recursive: true });

        // Construct persistable object from cache (filtering only for this deck? 
        // For now dump everything if we assume 1 deck per repo instance usage)
        const states: Record<string, CardState> = {};
        const logs: Record<string, ReviewLog[]> = {};

        for (const [k, v] of this.cardStates) states[k] = v;
        for (const [k, v] of this.logs) logs[k] = v;

        await fs.writeFile(activityPath, JSON.stringify({ states, logs }, null, 2));
    }

    async saveCardState(cardId: string, state: CardState): Promise<void> {
        this.cardStates.set(cardId, state);
        await this.saveDeckActivity(); // Auto-save on every update? Or debounce?
    }

    async getReviewLog(cardId: string): Promise<ReviewLog[]> {
        return this.logs.get(cardId) || [];
    }

    async saveReviewLog(cardId: string, log: ReviewLog): Promise<void> {
        const existing = this.logs.get(cardId) || [];
        existing.push(log);
        this.logs.set(cardId, existing);
        await this.saveDeckActivity();
    }
}
