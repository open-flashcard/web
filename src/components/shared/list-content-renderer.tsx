import { cn } from '@/lib/utils';
import { ContentList as OFSListContent } from 'ofc-ts';
import { ContentRenderer } from './content-renderer';

interface ListContentRendererProps {
    content: OFSListContent;
    className?: string;
}

/**
 * Renders list content with support for ordered/unordered lists
 * and customizable markers
 */
export function ListContentRenderer({ content, className }: ListContentRendererProps) {
    const { items, listType = 'unordered', marker = '•', startNumber = 1, format = 'plain' } = content as any;

    if (listType === 'ordered') {
        return (
            <ol
                className={cn('list-decimal list-inside space-y-1', className)}
                start={startNumber}
            >
                {items.map((item: any, index: number) => (
                    <li key={index} className="pl-2">
                        <ContentRenderer content={item} format={format} className="inline" />
                    </li>
                ))}
            </ol>
        );
    }

    // Unordered list
    return (
        <ul className={cn('space-y-1', className)}>
            {items.map((item: any, index: number) => (
                <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground select-none mt-0.5 flex-shrink-0">
                        {marker}
                    </span>
                    <ContentRenderer content={item} format={format} className="flex-1" />
                </li>
            ))}
        </ul>
    );
}
