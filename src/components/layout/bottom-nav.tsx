"use client";

import { ReactNode } from "react";

interface BottomNavProps {
    leftContent?: ReactNode;
    rightContent?: ReactNode;
}

/**
 * BottomNav - In-flow bottom navigation bar for action buttons
 * 
 * Rendered inside the white card with a top border separator.
 * Contains action buttons that can change based on the current step/process.
 * 
 * @example
 * <BottomNav
 *   leftContent={<Button variant="outline"><ArrowLeft /> Kembali</Button>}
 *   rightContent={<Button>Ajukan Surat</Button>}
 * />
 */
export default function BottomNav({ leftContent, rightContent }: BottomNavProps) {
    return (
        <footer
            className="sticky bottom-0 z-10 mt-6 -mx-6 -mb-6 border-t border-gray-200 bg-white rounded-b-2xl"
        >
            <div className="px-6 py-2">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 w-full">{leftContent}</div>
                    <div className="flex items-center gap-3 shrink-0">{rightContent}</div>
                </div>
            </div>
        </footer>
    );
}
