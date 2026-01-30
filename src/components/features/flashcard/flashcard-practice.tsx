import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFlashcardPractice } from "@/hooks/use-flashcard-practice";
import type { QuizCard } from "@/types/ui";
import { FlashcardMode } from "./practice/flashcard-mode";
import { PracticeFooter } from "./practice/practice-footer";
import { PracticeHeader } from "./practice/practice-header";
import { QuizMode } from "./practice/quiz-mode";


interface FlashcardPracticeProps {
    cards?: QuizCard[];
    deckId?: string; // If provided, fetches from API
    deckName: string;
    practiceMode?: 'mixed' | 'new' | 'review';
    practiceOrder?: 'standard' | 'random';
    onComplete: (answers: Record<string, string | string[]>) => void;
    onExit?: () => void;
}

export function FlashcardPractice({
    cards,
    deckId,
    deckName,
    practiceMode,
    practiceOrder,
    onComplete,
    onExit
}: FlashcardPracticeProps) {
    const {
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
        handlers
    } = useFlashcardPractice({
        initialCards: cards,
        deckId,
        practiceMode,
        practiceOrder,
        onComplete
    });

    // If loading or no cards
    if (loading) return <div className="text-center p-8">Loading due cards...</div>;
    if (!currentCard) return (
        <Card className="w-full max-w-2xl text-center p-8">
            <h3 className="text-xl font-bold mb-2">All Done!</h3>
            <p className="text-muted-foreground mb-4">No cards due for practice right now.</p>
            <Button onClick={onExit}>Exit</Button>
        </Card>
    );

    return (
        <Card className="w-full max-w-2xl">
            <PracticeHeader
                deckName={deckName}
                currentIndex={currentIndex}
                totalCards={practiceCards.length}
                progress={progress}
                isCopied={isCopied}
                onExit={onExit || (() => { })}
                onCopy={handlers.handleCopyForLLM}
            />

            <CardContent className="space-y-6">
                {isQuizMode ? (
                    <QuizMode
                        card={currentCard}
                        selectedAnswer={selectedAnswer}
                        isRevealed={isRevealed}
                        isCorrect={isCorrect}
                        isMultiSelect={isMultiSelect}
                        correctIds={correctIds}
                        isHintShown={isHintShown}
                        onOptionSelect={handlers.handleOptionSelect}
                        onShowAnswer={handlers.handleShowAnswer}
                        onShowHint={handlers.handleShowHint}
                    />
                ) : (
                    <FlashcardMode card={currentCard} />
                )}
            </CardContent>

            <PracticeFooter
                isRevealed={isRevealed}
                showGrading={!!deckId && isRevealed}
                currentIndex={currentIndex}
                totalCards={practiceCards.length}
                onPrevious={handlers.goToPrevious}
                onNext={handlers.goToNext}
                onGrade={handlers.handleGrade}
            />
        </Card>
    );
}
