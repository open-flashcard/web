import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

interface LatexContentProps {
    content: string;
    className?: string;
    displayMode?: boolean;
}

/**
 * Renders LaTeX mathematical content using KaTeX
 * Supports both inline and display modes
 */
export function LatexContent({ content, className, displayMode = true }: LatexContentProps) {
    // Wrap in $$ for display math or $ for inline math
    const wrappedContent = displayMode ? `$$${content}$$` : `$${content}$`;

    return (
        <div className={cn("latex-content", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
            >
                {wrappedContent}
            </ReactMarkdown>
        </div>
    );
}
