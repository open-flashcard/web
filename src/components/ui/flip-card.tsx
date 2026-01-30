
import * as React from "react"
import { cn } from "@/lib/utils"

interface FlipCardProps extends React.HTMLAttributes<HTMLDivElement> {
    frontContent: React.ReactNode
    backContent: React.ReactNode
    rotate?: "x" | "y"
}

export function FlipCard({
    frontContent,
    backContent,
    rotate = "y",
    className,
    ...props
}: FlipCardProps) {
    const [isFlipped, setIsFlipped] = React.useState(false)

    const rotationClass = {
        x: [
            "rotate-x-180",
            "rotate-x-180"
        ],
        y: [
            "rotate-y-180",
            "rotate-y-180"
        ],
    }

    const handleFlip = () => {
        setIsFlipped(!isFlipped)
    }

    return (
        <div
            className={cn("group h-96 w-full [perspective:1000px] cursor-pointer", className)}
            onClick={handleFlip}
            {...props}
        >
            <div
                className={cn(
                    "relative h-full w-full rounded-xl transition-all duration-500 [transform-style:preserve-3d]",
                    isFlipped ? rotationClass[rotate][0] : ""
                )}
            >
                {/* Front */}
                <div className="absolute h-full w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm [backface-visibility:hidden]">
                    <div className="flex h-full flex-col justify-between p-6">
                        {frontContent}
                    </div>
                </div>

                {/* Back */}
                <div
                    className={cn(
                        "absolute h-full w-full overflow-hidden rounded-xl border bg-muted text-muted-foreground shadow-sm [backface-visibility:hidden]",
                        rotationClass[rotate][1]
                    )}
                >
                    <div className="flex h-full flex-col justify-between p-6">
                        {backContent}
                    </div>
                </div>
            </div>
        </div>
    )
}
