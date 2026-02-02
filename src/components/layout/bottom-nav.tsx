"use client";

import { ReactNode } from "react";

interface BottomNavProps {
    leftContent?: ReactNode;
    rightContent?: ReactNode;
}

/**
 * BottomNav - Fixed bottom navigation bar for action buttons
 * 
 * Similar to TopNav, this component is fixed at the bottom of the screen
 * and contains action buttons that can change based on the current step/process.
 * 
 * @example
 * <BottomNav
 *   leftContent={<Button variant="outline"><ArrowLeft /> Kembali</Button>}
 *   rightContent={<Button>Ajukan Surat</Button>}
 * />
 */
export default function BottomNav({ leftContent, rightContent }: BottomNavProps) {
    return (
        <footer className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-gray-200 bg-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <div className="mx-auto max-w-[1440px] px-8 py-4">
                <div className="flex items-center justify-between">
                    {/* Left Side */}
                    <div className="flex items-center gap-3">
                        {leftContent}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3">
                        {rightContent}
                    </div>
                </div>
            </div>
        </footer>
    );
}
