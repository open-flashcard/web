"use client";

import { useState, useCallback } from "react";
import { extractQuizCard, type ExtendedDeck as OFSDeck, type QuizCard } from "@/types/ui";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { FlashcardLoader } from "@/components/features/flashcard/flashcard-loader";
import { FlashcardPractice } from "@/components/features/flashcard/flashcard-practice";
import { PracticeResults } from "@/components/features/flashcard/practice-results";

type View = "load" | "practice" | "results";

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export default function Home() {
    const [view, setView] = useState<View>("load");
    const [deck, setDeck] = useState<OFSDeck | null>(null);
    const [deckId, setDeckId] = useState<string | undefined>(undefined);
    const [cards, setCards] = useState<QuizCard[]>([]);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [practiceMode, setPracticeMode] = useState<'mixed' | 'new' | 'review'>('mixed');
    const [practiceOrder, setPracticeOrder] = useState<'standard' | 'random'>('standard');

    const handleDeckLoaded = useCallback((loadedDeck: OFSDeck, shuffle: boolean, methodId?: string, loadedDeckId?: string, mode?: 'mixed' | 'new' | 'review', order?: 'standard' | 'random') => {
        setDeck(loadedDeck);
        setDeckId(loadedDeckId);
        if (mode) setPracticeMode(mode);
        if (order) setPracticeOrder(order);

        // If a method is selected, we might want to apply its logic.
        // For now, we just respect the shuffle flag, which might be overridden by the method logic in the future.
        if (methodId) {
            console.log(`Method selected: ${methodId}`);
            // TODO: Implement method-specific card sorting/filtering here
        }

        // Extract quiz cards from OFS cards
        const quizCards = loadedDeck.cards
            .map(extractQuizCard)
            .filter((card): card is QuizCard => card !== null);

        setCards(shuffle ? shuffleArray(quizCards) : quizCards);
        setAnswers({});
        setView("practice");
    }, []);

    const handlePracticeComplete = useCallback((practiceAnswers: Record<string, string | string[]>) => {
        setAnswers(practiceAnswers);
        setView("results");
    }, []);

    const handleRestart = useCallback(() => {
        setAnswers({});
        setView("practice");
    }, []);

    const handleLoadNew = useCallback(() => {
        setDeck(null);
        setDeckId(undefined);
        setCards([]);
        setAnswers({});
        setView("load");
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            {/* Theme toggle in top-right corner */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            {view === "load" && (
                <FlashcardLoader onDeckLoaded={handleDeckLoaded} />
            )}
            {view === "practice" && deck && cards.length > 0 && (
                <FlashcardPractice
                    cards={cards} // Initial cards (shuffled, full deck)
                    deckId={deckId} // If present, enables practice mode (due cards only)
                    deckName={deck.name}
                    practiceMode={practiceMode}
                    practiceOrder={practiceOrder}
                    onComplete={handlePracticeComplete}
                    onExit={handleLoadNew}
                />
            )}
            {view === "results" && (
                <PracticeResults
                    cards={cards}
                    answers={answers}
                    onRestart={handleRestart}
                    onLoadNew={handleLoadNew}
                />
            )}
        </div>
    );
}
