import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

interface PracticeFooterProps {
    isRevealed: boolean;
    showGrading: boolean; // deckId && isRevealed
    currentIndex: number;
    totalCards: number;
    onPrevious: () => void;
    onNext: () => void;
    onGrade: (rating: number) => void;
}

export function PracticeFooter({
    isRevealed,
    showGrading,
    currentIndex,
    totalCards,
    onPrevious,
    onNext,
    onGrade
}: PracticeFooterProps) {
    return (
        <CardFooter className="flex flex-col gap-4">
            {showGrading && (
                <div className="grid grid-cols-4 gap-2 w-full">
                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => onGrade(1)}
                    >
                        Again
                    </Button>
                    <Button
                        variant="secondary"
                        className="bg-orange-100 text-orange-900 border-orange-200 hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-100 dark:border-orange-900"
                        onClick={() => onGrade(2)}
                    >
                        Hard
                    </Button>
                    <Button
                        variant="secondary"
                        className="bg-green-100 text-green-900 border-green-200 hover:bg-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-900"
                        onClick={() => onGrade(3)}
                    >
                        Good
                    </Button>
                    <Button
                        variant="secondary"
                        className="bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-900"
                        onClick={() => onGrade(4)}
                    >
                        Easy
                    </Button>
                </div>
            )}

            <div className="flex justify-between gap-2 w-full">
                <Button
                    variant="outline"
                    onClick={onPrevious}
                    disabled={currentIndex === 0}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                </Button>
                <div className="flex-1" />
                <Button
                    onClick={onNext}
                >
                    {currentIndex === totalCards - 1 ? "Finish" : "Next"}
                    {currentIndex < totalCards - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
            </div>
        </CardFooter>
    );
}
