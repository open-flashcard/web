"use client";

import { cn } from "@/lib/utils";
import { Volume2 } from "lucide-react";

interface AudioContentProps {
    url?: string;
    file?: string;
    base64?: string;
    mimeType?: string;
    controls?: boolean;
    autoplay?: boolean;
    className?: string;
}

/**
 * Audio content renderer for pronunciation and audio playback
 * Supports URL, local file paths, and base64 encoded audio
 */
export function AudioContent({
    url,
    file,
    base64,
    mimeType = "audio/mpeg",
    controls = true,
    autoplay = false,
    className
}: AudioContentProps) {
    // Determine the audio source
    const audioSrc = url || (base64 ? `data:${mimeType};base64,${base64}` : file);

    if (!audioSrc) {
        return (
            <div className={cn("text-sm text-muted-foreground italic", className)}>
                No audio source provided
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <audio
                src={audioSrc}
                controls={controls}
                autoPlay={autoplay}
                className="flex-1 h-8"
                preload="metadata"
            >
                Your browser does not support the audio element.
            </audio>
        </div>
    );
}
