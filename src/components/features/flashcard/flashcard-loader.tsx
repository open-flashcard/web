"use client";

import { useRef, useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { Card as OFSCard } from "ofc-ts";
import type { ExtendedDeck as OFSDeck } from "@/types/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface FlashcardLoaderProps {
    onDeckLoaded: (deck: OFSDeck, shuffle: boolean, methodId?: string, deckId?: string, mode?: 'mixed' | 'new' | 'review', order?: 'standard' | 'random') => void;
}

export function FlashcardLoader({ onDeckLoaded }: FlashcardLoaderProps) {
    const [shuffle, setShuffle] = useState(false);
    const [deck, setDeck] = useState<OFSDeck | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedMethodId, setSelectedMethodId] = useState<string>("");
    const [uploadedDeckId, setUploadedDeckId] = useState<string | undefined>(undefined);
    const [practiceMode, setPracticeMode] = useState<'mixed' | 'new' | 'review'>('mixed');
    const [practiceOrder, setPracticeOrder] = useState<'standard' | 'random'>('standard');


    useEffect(() => {
        // No samples to load
    }, []);

    const validateDeck = (data: unknown): data is OFSDeck => {
        if (typeof data !== "object" || data === null) return false;
        const obj = data as Record<string, unknown>;

        // Required OFS fields
        if (typeof obj.id !== "string") return false;
        if (typeof obj.version !== "string") return false;
        if (typeof obj.name !== "string") return false;
        // Allow empty cards if extending
        if (!Array.isArray(obj.cards)) return false;
        if (obj.cards.length === 0 && !obj.extends) return false;

        // Validate each card has sides with multiple-choice content
        for (const card of obj.cards) {
            if (typeof card !== "object" || card === null) return false;
            const c = card as Record<string, unknown>;
            if (typeof c.id !== "string") return false;
            if (!Array.isArray(c.sides)) return false;

            // Find term side with multiple-choice
            const sides = c.sides as Array<Record<string, unknown>>;
            const termSide = sides.find((s) => s.type === "term");
            if (!termSide || !Array.isArray(termSide.content)) return false;
            // Check if there's any recognized content type, assuming validation is generous for now
            // Detailed schema validation would go here
        }

        return true;
    };

    const loadDeckWithExtensions = async (initialDeck: OFSDeck, baseUrl: string = ""): Promise<OFSDeck> => {
        let baseCards: OFSCard[] = [];

        if (initialDeck.extends && Array.isArray(initialDeck.extends)) {
            for (const uri of initialDeck.extends) {
                try {
                    // simple absolute/relative check
                    let fetchUrl = uri;
                    if (!uri.match(/^https?:\/\//)) {
                        // clean up baseUrl to ensure it ends with / if not empty
                        const prefix = baseUrl && !baseUrl.endsWith('/') ? baseUrl + '/' : baseUrl;
                        // handle ./
                        const cleanUri = uri.startsWith("./") ? uri.slice(2) : uri;
                        fetchUrl = prefix + cleanUri;
                    }

                    const res = await fetch(fetchUrl);
                    if (!res.ok) {
                        console.warn(`Failed to fetch extension: ${fetchUrl}`);
                        continue;
                    }
                    const data = await res.json();
                    if (validateDeck(data)) {
                        // Recursively load
                        const parentBaseUrl = fetchUrl.substring(0, fetchUrl.lastIndexOf('/'));
                        const extendedData = await loadDeckWithExtensions(data, parentBaseUrl);
                        baseCards = [...baseCards, ...extendedData.cards];
                    }
                } catch (err) {
                    console.warn(`Error loading extension ${uri}`, err);
                }
            }
        }

        // Merge: base + current (current overrides)
        const cardMap = new Map<string, OFSCard>();
        baseCards.forEach(c => cardMap.set(c.id, c));
        initialDeck.cards.forEach(c => cardMap.set(c.id, c));

        return {
            ...initialDeck,
            cards: Array.from(cardMap.values())
        };
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset
        setError(null);
        setDeck(null);
        setUploadedDeckId(undefined); // Reset uploadedDeckId

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/practice/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Upload failed');
            }

            const data = await res.json();
            const uploadedDeck = data.deck as OFSDeck;
            const serverDeckId = data.deckId as string;

            setDeck(uploadedDeck);
            if (uploadedDeck.settings?.shuffle !== undefined) {
                setShuffle(uploadedDeck.settings.shuffle);
            }
            setSelectedMethodId("");

            // We store the deckId for when the user clicks Start
            // Using a ref or just closure in startPractice?
            // Better to state it.
            // But we can just use a hidden state or pass it now?
            // The Start button uses `deck` state. We need `deckId` state too.
            // Let's add `uploadedDeckId` state.
            setUploadedDeckId(serverDeckId);

        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Failed to upload deck");
        }
    };

    // loadSampleDeck function removed

    const startPractice = () => {
        if (deck) {
            // Find the sample to get its fsPath if applicable - no longer relevant
            // const sample = samples.find(s => s.path === selectedSample);
            // If it's a file upload, we don't have a server path yet.
            // For now, practice mode via API only works for server-side files (samples).
            // Uploaded files will just work in-memory (no API calls).
            // const deckId = sample ? sample.fsPath : undefined; // Replaced by uploadedDeckId

            onDeckLoaded(deck, shuffle, selectedMethodId || undefined, uploadedDeckId, practiceMode, practiceOrder);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Load Flashcards</CardTitle>
                <CardDescription>Upload an OFS JSON file to begin practice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json"
                    className="hidden"
                />

                <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="h-4 w-4" />
                    Upload OFS JSON File
                </Button>

                {/* Sample loading UI removed */}
                {/* <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or try a sample
                        </span>
                    </div>
                </div>

                {isLoadingSamples ? (
                    <div className="flex justify-center p-2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : samples.length > 0 ? (
                    <div className="flex gap-2">
                        <Select value={selectedSample} onValueChange={(val) => {
                            setSelectedSample(val);
                            loadSampleDeck(val);
                        }}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a sample" />
                            </SelectTrigger>
                            <SelectContent>
                                {samples.map((sample) => (
                                    <SelectItem key={sample.path} value={sample.path}>
                                        {sample.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="secondary"
                            onClick={() => loadSampleDeck()}
                            disabled={!selectedSample}
                        >
                            <FileText className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <p className="text-sm text-center text-muted-foreground">No samples available</p>
                )} */}

                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}

                {deck && (
                    <div className="space-y-4 pt-2 border-t mt-4">
                        <div className="rounded-lg border p-3 bg-muted/50">
                            <p className="font-medium">{deck.name}</p>
                            {deck.description && (
                                <p className="text-sm text-muted-foreground">{deck.description}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                                {deck.cards.length} cards · v{deck.version}
                            </p>
                            {deck.author && (
                                <p className="text-sm text-muted-foreground">by {deck.author}</p>
                            )}
                        </div>

                        {deck.methods && deck.methods.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Learning Method</label>
                                <select
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                    value={selectedMethodId}
                                    onChange={(e) => setSelectedMethodId(e.target.value)}
                                >
                                    <option value="">Standard Practice</option>
                                    {deck.methods.map((method) => (
                                        <option key={method.id} value={method.id}>
                                            {method.name} ({method.type})
                                        </option>
                                    ))}
                                </select>
                                {selectedMethodId && (
                                    <p className="text-xs text-muted-foreground">
                                        {deck.methods.find(m => m.id === selectedMethodId)?.description}
                                    </p>
                                )}
                            </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={shuffle}
                                onChange={(e) => setShuffle(e.target.checked)}
                                className="h-4 w-4 rounded border-input"
                            />
                            <span className="text-sm">Shuffle cards randomly (Client-side)</span>
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Practice Mode</label>
                                <Select value={practiceMode} onValueChange={(v: any) => setPracticeMode(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mixed">Mixed (Due + New)</SelectItem>
                                        <SelectItem value="new">New Only</SelectItem>
                                        <SelectItem value="review">Review Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Sort Order</label>
                                <Select value={practiceOrder} onValueChange={(v: any) => setPracticeOrder(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select order" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="standard">Standard (Due Date)</SelectItem>
                                        <SelectItem value="random">Randomized</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                <Button
                    className="w-full"
                    disabled={!deck}
                    onClick={startPractice}
                >
                    Start Practice
                </Button>
            </CardContent>
        </Card>
    );
}
