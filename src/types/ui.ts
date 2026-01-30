import {
    Card,
    Deck,
    ContentMultipleChoice,
    ContentText,
    ContentMarkdown,
    ContentHtml,
    ContentAudio
} from 'ofc-ts';

export interface ExtendedDeck extends Deck {
    settings?: {
        shuffle?: boolean;
    };
    methods?: {
        id: string;
        name: string;
        type: string;
        description?: string;
    }[];
}



// Re-export utility types if needed by UI
export type { Card };

export interface QuizOption {
    id: string;
    content: string; // The text content to display
    format?: "plain" | "markdown" | "html" | "latex";
    description?: string;
    hint?: string;
}

// Extracted quiz card for practice (simplified view of OFS card)
// Adapting to ofc-ts types where possible
export interface QuizCard {
    id: string;
    questionOriginal?: string;
    questionContent: ({
        type: "text" | "markdown" | "html";
        content: string;
        direction?: "ltr" | "rtl" | "auto";
        language?: string;
        font?: string;
    } | {
        type: "audio";
        content: any; // Keep generic for now as AudioContent in ofc-ts is complex
        url?: string;
        file?: string;
        base64?: string;
        mimeType?: string;
        controls?: boolean;
        autoplay?: boolean;
    })[];
    options?: QuizOption[];
    correct?: string | string[];
    answerContent?: ({
        type: "text" | "markdown" | "html";
        content: string;
        direction?: "ltr" | "rtl" | "auto";
        language?: string;
        font?: string;
    } | {
        type: "audio";
        content: any;
        url?: string;
        file?: string;
        base64?: string;
        mimeType?: string;
        controls?: boolean;
        autoplay?: boolean;
    })[];
    hint?: string;
    explanation?: string;
    explanationFormat?: "plain" | "markdown" | "html" | "latex";
}

// Helper function to extract quiz data from OFS card
export function extractQuizCard(card: Card): QuizCard | null {
    const termSide = card.sides.find((s) => s.type === "term");
    if (!termSide) return null;

    const questionContent: QuizCard['questionContent'] = [];
    let multipleChoice: ContentMultipleChoice | null = null;

    // Helper to get text content from polymorphic content items
    const getTextContent = (content: any): string => {
        if (typeof content === 'string') return content;
        if (content.inline) return content.inline;
        if (content.content) return content.content; // Legacy support
        return "";
    }

    for (const content of termSide.content) {
        // We need to check property existence to determine type in the Union
        // ofc-ts uses Discriminated Unions if possible, but the schema generation might produce loose types
        // The generated types have optional properties for everything in the union if it wasn't strictly discriminated in JSON schema
        // But `ofc-ts` defines Content as a union of specific interfaces.

        // Let's assume we can check properties.
        const c = content as any;

        if (c.inline && !c.type) {
            // Default to text if inline is present and no type/it's generic
            // actually ofc-ts generated types don't distinct by 'type' property property in the interface usually, 
            // checks need to be heuristic or based on known structure if 'type' isn't explicitly there.
            // BUT, the schema usually adds a 'type' const or enum if defined.
            // Looking at `generated.ts`, `ContentText` doesn't seem to have a `type` field forced.
            // The local `flashcard.ts` had explicit `type`.
            // `ofc-ts` `Content` is a union. 
            // Wait, `generated.ts` shows `ContentText` has `inline`, `file`, etc.
            // It does NOT have a `type` discriminator in the generated interface itself unless it was in the schema.
            // However, `ContentMultipleChoice` has `options`.
            // `ContentAudio` has `url`, `base64` etc.

            // In the JSON data we saw: 
            // { "type": "markdown", "inline": "..." }
            // { "type": "text", "inline": "..." }

            // So the `type` property *is* present in the JSON and likely in the types if the schema preserved it.
            // Let's look at `generated.ts` again closely. 
            // It seems `ContentText` etc don't explicitly list `type` in the interface definition in the partial view I saw.
            // But `ContentMultipleChoice` mentions `options`.
            // The `type` property might be allowed via `[k: string]: unknown` index signature if not explicitly defined.
            // But for runtime check, we can trust the `type` field from the JSON.
        }

        if (c.type === "text" || (!c.type && c.inline)) {
            questionContent.push({
                type: "text",
                content: getTextContent(c),
                direction: c.direction,
                language: c.language as string,
                font: c.font
            });
        } else if (c.type === "markdown") {
            questionContent.push({
                type: "markdown",
                content: getTextContent(c),
                direction: c.direction
            });
        } else if (c.type === "html") {
            questionContent.push({
                type: "html",
                content: getTextContent(c),
                direction: c.direction
            });
        } else if (c.type === "audio") {
            questionContent.push({
                type: "audio",
                content: c,
                url: c.url,
                file: c.file,
                base64: c.base64,
                mimeType: c.mime, // mime vs mimeType
                controls: c.controls,
                autoplay: c.autoplay
            });
        } else if (c.type === "multiple-choice" || (c.options && c.correct)) {
            multipleChoice = c as ContentMultipleChoice;
        }
    }

    // Extract definition/answer content
    const answerContent: QuizCard['answerContent'] = [];

    const definitionSide = card.sides.find((s) => s.type === "definition");
    if (definitionSide) {
        for (const content of definitionSide.content) {
            const c = content as any;
            if (c.type === "text" || (!c.type && c.inline)) {
                answerContent.push({
                    type: "text",
                    content: getTextContent(c),
                    direction: c.direction,
                    language: c.language as string,
                    font: c.font
                });
            } else if (c.type === "markdown") {
                answerContent.push({
                    type: "markdown",
                    content: getTextContent(c),
                    direction: c.direction
                });
            } else if (c.type === "html") {
                answerContent.push({
                    type: "html",
                    content: getTextContent(c),
                    direction: c.direction
                });
            }
        }
    }

    if (!multipleChoice && answerContent.length === 0) {
        if (questionContent.length === 0) return null;
        return null; // Strict rule
    }

    // Hint extraction
    // `card.hint` in `ofc-ts` is `Content1` (polymorphic). We need to extract string.
    let cardHint = "";
    if (card.hint) {
        const h = card.hint as any;
        cardHint = getTextContent(h);
    }

    let mcHint = "";
    if (multipleChoice?.hint) {
        const h = multipleChoice.hint as any;
        mcHint = getTextContent(h);
    }

    const hint = mcHint || cardHint;

    // Explanation extraction
    let explanation = "";
    if (multipleChoice?.explanation) {
        const e = multipleChoice.explanation as any;
        explanation = getTextContent(e);
    }


    return {
        id: card.id,
        questionContent,
        options: multipleChoice?.options.map((opt: any) => {
            // Handle definition of options content
            // In schema: opt.content is Content3 (polymorphic)
            let optContent = getTextContent(opt.content);

            // Description
            let optDesc = opt.description ? getTextContent(opt.description) : undefined;

            // Hint
            let optHint = opt.hint ? getTextContent(opt.hint) : undefined;

            return {
                id: opt.id,
                content: optContent,
                description: optDesc,
                hint: optHint,
                format: opt.content?.type === 'markdown' ? 'markdown' : (opt.content?.type === 'html' ? 'html' : 'plain')
            };
        }),
        correct: multipleChoice?.correct,
        answerContent: answerContent.length > 0 ? answerContent : undefined,
        hint: hint || undefined,
        explanation: explanation || undefined,
        explanationFormat: 'plain', // Defaulting to plain for now as ofc-ts doesn't strictly have explanationFormat field in same way
    };
}

export function isAnswerCorrect(selected: string, correct: string | string[]): boolean {
    if (Array.isArray(correct)) {
        return correct.includes(selected);
    }
    return selected === correct;
}

export function getCorrectIds(correct: string | string[]): string[] {
    return Array.isArray(correct) ? correct : [correct];
}
