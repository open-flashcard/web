import { useState, useEffect, useCallback } from "react";
import { Card as OFSCard } from "ofc-ts";
import type { QuizCard } from "@/types/ui";
import { getCorrectIds, extractQuizCard } from "@/types/ui";

interface UseFlashcardPracticeProps {
    initialCards?: QuizCard[];
    deckId?: string;
    practiceMode?: 'mixed' | 'new' | 'review';
    practiceOrder?: 'standard' | 'random';
    onComplete: (answers: Record<string, string | string[]>) => void;
}

export function useFlashcardPractice({
    initialCards,
    deckId,
    practiceMode = 'mixed',
    practiceOrder = 'standard',
    onComplete
}: UseFlashcardPracticeProps) {
    const [practiceCards, setPracticeCards] = useState<QuizCard[]>(initialCards || []);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [revealed, setRevealed] = useState<Record<string, boolean>>({});
    const [hintsShown, setHintsShown] = useState<Record<string, boolean>>({});
    const [isCopied, setIsCopied] = useState(false);
    const [loading, setLoading] = useState(!!deckId && !initialCards);

    // Fetch due cards if deckId is provided
    useEffect(() => {
        if (!deckId) return;

        async function fetchDue() {
            try {
                if (!deckId) return;
                setLoading(true);
                const res = await fetch(`/api/practice/${encodeURIComponent(deckId)}/due?mode=${practiceMode}&order=${practiceOrder}`);
                if (!res.ok) throw new Error("Failed to fetch due cards");
                const dueOfsCards: OFSCard[] = await res.json();

                // Convert to QuizCard format
                const quizCards = dueOfsCards
                    .map(c => extractQuizCard(c))
                    .filter((c): c is QuizCard => c !== null);

                setPracticeCards(quizCards);
                setCurrentIndex(0); // Reset index on refetch
                setAnswers({}); // Reset answers
                setRevealed({}); // Reset revealed state
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchDue();
    }, [deckId, practiceMode, practiceOrder]);

    const currentCard = practiceCards[currentIndex];

    // Computed properties
    const selectedAnswer = currentCard ? answers[currentCard.id] : undefined;
    const isRevealed = currentCard ? (revealed[currentCard.id] ?? false) : false;
    const isHintShown = currentCard ? (hintsShown[currentCard.id] ?? false) : false;
    const correctIds = currentCard ? getCorrectIds(currentCard.correct || []) : [];
    const isQuizMode = currentCard ? !!(currentCard.options && currentCard.options.length > 0) : false;
    const isMultiSelect = correctIds.length > 1;

    // Check if answer is correct
    const isCorrect = (() => {
        if (!currentCard) return false;
        if (isMultiSelect) {
            if (!Array.isArray(selectedAnswer)) return false;
            return correctIds.length === selectedAnswer.length &&
                correctIds.every(id => selectedAnswer.includes(id));
        }
        const userAnswerStr = Array.isArray(selectedAnswer) ? selectedAnswer[0] : selectedAnswer;
        return correctIds.includes(userAnswerStr || "");
    })();

    const progress = practiceCards.length > 0 ? ((currentIndex + 1) / practiceCards.length) * 100 : 0;

    // Handlers
    const goToNext = useCallback(() => {
        if (currentIndex < practiceCards.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        } else {
            onComplete(answers);
        }
    }, [currentIndex, practiceCards.length, onComplete, answers]);

    const goToPrevious = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    }, [currentIndex]);

    const handleGrade = async (rating: number) => {
        if (!deckId || !currentCard) {
            goToNext();
            return;
        }

        try {
            await fetch(`/api/practice/${encodeURIComponent(deckId)}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId: currentCard.id, rating })
            });
            goToNext();
        } catch (e) {
            console.error("Failed to submit review", e);
        }
    };

    const handleOptionSelect = (optionId: string) => {
        if (isRevealed || !currentCard) return;

        if (isMultiSelect) {
            setAnswers((prev) => {
                const current = prev[currentCard.id];
                const currentArray = Array.isArray(current) ? current : [];

                if (currentArray.includes(optionId)) {
                    // Remove from selection
                    const newSelection = currentArray.filter(id => id !== optionId);
                    return { ...prev, [currentCard.id]: newSelection };
                } else {
                    // Add to selection
                    return { ...prev, [currentCard.id]: [...currentArray, optionId] };
                }
            });
        } else {
            setAnswers((prev) => ({ ...prev, [currentCard.id]: optionId }));
        }
    };

    const handleShowAnswer = () => {
        if ((selectedAnswer || !isQuizMode) && currentCard) {
            setRevealed((prev) => ({ ...prev, [currentCard.id]: true }));
        }
    };

    const handleShowHint = () => {
        if (currentCard) {
            setHintsShown((prev) => ({ ...prev, [currentCard.id]: true }));
        }
    };

    const handleCopyForLLM = () => {
        if (!currentCard) return;
        const cardJson = JSON.stringify(currentCard, null, 2);
        navigator.clipboard.writeText(cardJson).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return {
        practiceCards,
        currentCard,
        currentIndex,
        loading,
        progress,
        isMultiSelect,
        isQuizMode,
        isCorrect,
        isRevealed,
        isHintShown,
        isCopied,
        selectedAnswer,
        correctIds,
        handlers: {
            handleGrade,
            handleOptionSelect,
            handleShowAnswer,
            handleShowHint,
            handleCopyForLLM,
            goToNext,
            goToPrevious
        }
    };
}
