import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/features/markdown/markdown-renderer';
import { LatexContent } from '@/components/features/markdown/latex-content';
import { AudioContent } from '@/components/shared/audio-content';

interface ContentRendererProps {
    content: string | Record<string, any>;
    format?: "plain" | "markdown" | "html" | "latex" | "audio";
    className?: string;
}

/**
 * Universal content renderer that handles multiple formats:
 * - plain: Simple text with preserved line breaks
 * - markdown: GitHub-flavored markdown with LaTeX math support
 * - html: Raw HTML rendering (use with caution!)
 * - latex: Pure LaTeX mathematical content
 * - audio: Audio player for pronunciation and audio content
 */
export function ContentRenderer({ content, format = "plain", className }: ContentRendererProps) {
    // Audio - render audio player
    if (format === "audio") {
        const audioProps = typeof content === 'object' ? content : { url: content };
        return <AudioContent {...audioProps} className={className} />;
    }

    // Ensure content is a string for other formats
    const stringContent = typeof content === 'string' ? content : String(content);

    // Plain text - preserve line breaks
    if (format === "plain") {
        return <div className={cn("whitespace-pre-line", className)}>{stringContent}</div>;
    }

    // HTML - render as raw HTML (sanitize user content!)
    if (format === "html") {
        return <div className={className} dangerouslySetInnerHTML={{ __html: stringContent }} />;
    }

    // LaTeX - render as mathematical content using KaTeX
    if (format === "latex") {
        return <LatexContent content={stringContent} className={className} displayMode />;
    }

    // Markdown - render with GFM and math support
    return <MarkdownRenderer content={stringContent} className={className} />;
}
