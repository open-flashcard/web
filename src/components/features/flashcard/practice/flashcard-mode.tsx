import { FlipCard } from "@/components/ui/flip-card";
import type { QuizCard } from "@/types/ui";
import { CardContentList } from "./card-content-list";

interface FlashcardModeProps {
    card: QuizCard;
}

export function FlashcardMode({ card }: FlashcardModeProps) {
    return (
        <FlipCard
            frontContent={
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Question / Front</div>
                    <div className="w-full">
                        <CardContentList
                            content={card.questionContent}
                            textSizeClass="text-2xl font-semibold leading-relaxed text-center"
                        />
                    </div>
                    <div className="mt-auto pt-4 text-xs text-muted-foreground opacity-50">
                        Click card to flip
                    </div>
                </div>
            }
            backContent={
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Answer / Back</div>
                    <div className="w-full">
                        <CardContentList
                            content={card.answerContent}
                            textSizeClass="text-2xl font-semibold leading-relaxed text-center"
                        />
                    </div>
                </div>
            }
        />
    );
}
