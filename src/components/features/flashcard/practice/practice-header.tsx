import { X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PracticeHeaderProps {
    deckName: string;
    currentIndex: number;
    totalCards: number;
    progress: number;
    isCopied: boolean;
    onExit: () => void;
    onCopy: () => void;
}

export function PracticeHeader({
    deckName,
    currentIndex,
    totalCards,
    progress,
    isCopied,
    onExit,
    onCopy
}: PracticeHeaderProps) {
    return (
        <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -ml-2"
                            onClick={onExit}
                            title="Exit Practice"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold text-foreground">{deckName}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between mt-2">
                <div className="text-sm text-muted-foreground">
                    <span>Question {currentIndex + 1} of {totalCards}</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    onClick={onCopy}
                    title="Copy card JSON for LLM context"
                >
                    {isCopied ? (
                        <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                        </>
                    ) : (
                        <>
                            <Copy className="h-3 w-3 mr-1" />
                        </>
                    )}
                </Button>
            </div>
            <Progress value={progress} className="h-2" />
        </CardHeader>
    );
}
