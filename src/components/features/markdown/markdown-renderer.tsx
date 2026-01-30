import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';
import { markdownComponents } from './markdown-components';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * Renders GitHub-flavored markdown with LaTeX math support
 * Includes custom styling for tables, lists, code blocks, etc.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div className={cn("markdown-content", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={markdownComponents}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
