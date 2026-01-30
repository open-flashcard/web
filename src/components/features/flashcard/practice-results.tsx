"use client";

import { RotateCcw, FolderOpen } from "lucide-react";
import type { QuizCard } from "@/types/ui";
import { getCorrectIds } from "@/types/ui";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PracticeResultsProps {
    cards: QuizCard[];
    answers: Record<string, string | string[]>;
    onRestart: () => void;
    onLoadNew: () => void;
}

export function PracticeResults({ cards, answers, onRestart, onLoadNew }: PracticeResultsProps) {
    const correctCount = cards.filter((card) => {
        const correctIds = getCorrectIds(card.correct || []);
        const userAnswer = answers[card.id];

        // For multiple correct answers, user must select ALL correct answers
        if (Array.isArray(correctIds) && correctIds.length > 1) {
            if (!Array.isArray(userAnswer)) return false;
            // Check if arrays have same length and same elements
            return correctIds.length === userAnswer.length &&
                correctIds.every(id => userAnswer.includes(id));
        }

        // For single correct answer
        const userAnswerStr = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
        return correctIds.includes(userAnswerStr);
    }).length;
    const percentage = Math.round((correctCount / cards.length) * 100);

    const getMessage = () => {
        if (percentage === 100) return "Perfect!";
        if (percentage >= 80) return "Great job!";
        if (percentage >= 60) return "Good effort!";
        if (percentage >= 40) return "Keep practicing!";
        return "Don't give up!";
    };

    return (
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle className="text-2xl">{getMessage()}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-6xl font-bold">
                    {correctCount}/{cards.length}
                </div>
                <p className="text-xl text-muted-foreground">
                    {percentage}% correct
                </p>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </CardContent>
            <CardFooter className="flex gap-3 justify-center">
                <Button variant="outline" onClick={onRestart}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                </Button>
                <Button onClick={onLoadNew}>
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Load New Deck
                </Button>
            </CardFooter>
        </Card>
    );
}
