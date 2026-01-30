import type {Metadata} from "next";
import {Geist, Geist_Mono, Noto_Sans_Arabic} from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "@/components/shared/theme-provider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const notoSansArabic = Noto_Sans_Arabic({
    variable: "--font-noto-sans-arabic",
    subsets: ["arabic"],
});

export const metadata: Metadata = {
    title: "Flashcard Practice",
    description: "Practice with multiple choice flashcards",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} ${notoSansArabic.variable} antialiased`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
        </body>
        </html>
    );
}
