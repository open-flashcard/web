import { cn } from "@/lib/utils";
import { ContentRenderer } from "@/components/shared/content-renderer";
import type { QuizCard } from "@/types/ui";

interface CardContentListProps {
    content: QuizCard['questionContent'] | QuizCard['answerContent'];
    className?: string;
    textSizeClass?: string;
}

export function CardContentList({ content, className, textSizeClass = "text-xl font-medium leading-relaxed" }: CardContentListProps) {
    if (!content) return null;

    return (
        <div className={className}>
            {content.map((block, index) => {
                // Handle audio content separately
                if (block.type === 'audio') {
                    return (
                        <div key={index}>
                            <ContentRenderer
                                content={block.content}
                                format="audio"
                                className="my-2"
                            />
                        </div>
                    );
                }

                // Handle text/html/markdown content
                return (
                    <div
                        key={index}
                        dir={'direction' in block ? block.direction : undefined}
                        lang={'language' in block ? block.language : undefined}
                        className={cn(
                            'font' in block && block.font === "Noto Sans Arabic" && "font-arabic"
                        )}
                        style={{
                            fontFamily: 'font' in block && block.font === "Noto Sans Arabic" ? "var(--font-noto-sans-arabic)" : undefined
                        }}
                    >
                        <ContentRenderer
                            content={block.content}
                            format={block.type === 'text' ? 'plain' : block.type}
                            className={cn(
                                textSizeClass,
                                'direction' in block && block.direction === 'rtl' ? 'text-right' : 'text-left'
                            )}
                        />
                    </div>
                );
            })}
        </div>
    );
}
