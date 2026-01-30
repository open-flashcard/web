import type { Components } from 'react-markdown';

/**
 * Custom component renderers for react-markdown
 * Provides styled versions of all markdown elements
 */
export const markdownComponents: Components = {
    // Tables - styled as card-like elements
    table: ({ ...props }) => (
        <div className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse border border-border rounded-lg overflow-hidden" {...props} />
        </div>
    ),
    thead: ({ ...props }) => (
        <thead className="bg-muted" {...props} />
    ),
    th: ({ ...props }) => (
        <th className="border border-border px-4 py-2 text-left font-semibold" {...props} />
    ),
    td: ({ ...props }) => (
        <td className="border border-border px-4 py-2" {...props} />
    ),
    tr: ({ ...props }) => (
        <tr className="hover:bg-muted/50 transition-colors" {...props} />
    ),

    // Text elements
    p: ({ ...props }) => (
        <p className="mb-2 last:mb-0" {...props} />
    ),

    // Lists
    ul: ({ ...props }) => (
        <ul className="list-disc list-inside space-y-1 my-2" {...props} />
    ),
    ol: ({ ...props }) => (
        <ol className="list-decimal list-inside space-y-1 my-2" {...props} />
    ),
    li: ({ ...props }) => (
        <li className="ml-2" {...props} />
    ),

    // Code
    code: ({ className: codeClassName, children, ...props }) => {
        const isInline = !codeClassName?.includes('language-');
        return isInline ? (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
            </code>
        ) : (
            <code className="block bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto my-2" {...props}>
                {children}
            </code>
        );
    },

    // Blockquotes
    blockquote: ({ ...props }) => (
        <blockquote className="border-l-4 border-primary pl-4 italic my-2 text-muted-foreground" {...props} />
    ),

    // Headings
    h1: ({ ...props }) => (
        <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />
    ),
    h2: ({ ...props }) => (
        <h2 className="text-xl font-bold mt-3 mb-2" {...props} />
    ),
    h3: ({ ...props }) => (
        <h3 className="text-lg font-semibold mt-2 mb-1" {...props} />
    ),

    // Text formatting
    strong: ({ ...props }) => (
        <strong className="font-semibold" {...props} />
    ),
    em: ({ ...props }) => (
        <em className="italic" {...props} />
    ),
};
