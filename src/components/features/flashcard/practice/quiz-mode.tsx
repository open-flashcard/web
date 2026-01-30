import { Eye, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ContentRenderer } from "@/components/shared/content-renderer";
import type { QuizCard } from "@/types/ui";
import { CardContentList } from "./card-content-list";

interface QuizModeProps {
    card: QuizCard;
    selectedAnswer?: string | string[];
    isRevealed: boolean;
    isCorrect: boolean;
    isMultiSelect: boolean;
    correctIds: string[];
    isHintShown: boolean;
    onOptionSelect: (id: string) => void;
    onShowAnswer: () => void;
    onShowHint: () => void;
}

export function QuizMode({
    card,
    selectedAnswer,
    isRevealed,
    isCorrect,
    isMultiSelect,
    correctIds,
    isHintShown,
    onOptionSelect,
    onShowAnswer,
    onShowHint
}: QuizModeProps) {

    const isOptionSelected = (optionId: string): boolean => {
        if (Array.isArray(selectedAnswer)) {
            return selectedAnswer.includes(optionId);
        }
        return selectedAnswer === optionId;
    };

    const getOptionStyle = (optionId: string) => {
        const isSelected = isOptionSelected(optionId);
        const isOptionCorrect = correctIds.includes(optionId);

        if (!isRevealed) {
            return isSelected
                ? "border-primary bg-primary/5"
                : "hover:border-primary/50";
        }

        // After reveal
        if (isOptionCorrect) {
            if (isMultiSelect && !isCorrect) {
                return "border-orange-500 bg-orange-50 dark:bg-orange-950/30";
            }
            return "border-green-500 bg-green-50 dark:bg-green-950/30";
        }
        if (isSelected && !isCorrect) {
            return "border-red-500 bg-red-50 dark:bg-red-950/30";
        }
        return "opacity-50";
    };

    const getOptionLabel = (index: number) => {
        return String.fromCharCode(65 + index); // A, B, C, D
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <CardContentList content={card.questionContent} />
            </div>

            {/* Multi-select hint */}
            {isMultiSelect && !isRevealed && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        Select ALL correct answers ({correctIds.length} options)
                    </p>
                </div>
            )}

            {/* Hint section */}
            {card.hint && !isRevealed && (
                <div>
                    {!isHintShown ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onShowHint}
                            className="text-muted-foreground"
                        >
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Show Hint
                        </Button>
                    ) : (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                <Lightbulb className="h-4 w-4 inline mr-2" />
                                {card.hint}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Quiz Options */}
            <div className="space-y-3">
                {card.options?.map((option, index) => {
                    const isOptionCorrect = correctIds.includes(option.id);
                    const isSelected = isOptionSelected(option.id);
                    return (
                        <div key={option.id} className="space-y-1">
                            <button
                                onClick={() => onOptionSelect(option.id)}
                                disabled={isRevealed}
                                className={cn(
                                    "w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-colors",
                                    getOptionStyle(option.id),
                                    !isRevealed && "cursor-pointer"
                                )}
                            >
                                <span className="flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center font-medium text-sm">
                                    {isMultiSelect ? (
                                        <span className={cn(
                                            "w-5 h-5 rounded border-2 flex items-center justify-center",
                                            isSelected && "bg-primary border-primary"
                                        )}>
                                            {isSelected && <span className="text-white text-xs">✓</span>}
                                        </span>
                                    ) : (
                                        getOptionLabel(index)
                                    )}
                                </span>
                                <span className="flex-1">
                                    <ContentRenderer
                                        content={option.content}
                                        format={option.format}
                                        className="inline"
                                    />
                                </span>
                                {isRevealed && isOptionCorrect && isCorrect && (
                                    <span className="text-green-600 dark:text-green-400 font-medium">Correct</span>
                                )}
                                {isRevealed && isOptionCorrect && !isCorrect && (
                                    <span className="text-orange-600 dark:text-orange-400 font-medium">Missed</span>
                                )}
                                {isRevealed && isSelected && !isCorrect && !isOptionCorrect && (
                                    <span className="text-red-600 dark:text-red-400 font-medium">Incorrect</span>
                                )}
                            </button>
                            {isRevealed && option.description && (
                                <div className={cn(
                                    "text-sm ml-11 pl-3 border-l-2",
                                    isOptionCorrect
                                        ? "border-green-500 text-green-700 dark:text-green-400"
                                        : "border-muted text-muted-foreground"
                                )}>
                                    <ContentRenderer
                                        content={option.description}
                                        format={option.format}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Show Answer Button Action */}
            {!isRevealed && (
                <Button
                    onClick={onShowAnswer}
                    className="w-full"
                    size="lg"
                    variant={!selectedAnswer ? "outline" : "default"}
                    disabled={!selectedAnswer}
                >
                    <Eye className="h-4 w-4 mr-2" />
                    Show Answer
                </Button>
            )}

            {isRevealed && card.explanation && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                    <p className="text-sm font-medium mb-1">Explanation</p>
                    <ContentRenderer
                        content={card.explanation}
                        format={card.explanationFormat}
                        className="text-sm text-muted-foreground"
                    />
                </div>
            )}
        </div>
    );
}
