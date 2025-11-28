// Replacement for Next.js Link component in Electron
import React from 'react';

interface LinkProps {
    href?: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export default function Link({ href, children, className, onClick }: LinkProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onClick) {
            onClick();
        }
        // In Electron, we handle navigation through state, not routing
    };

    return (
        <a href={href || '#'} className={className} onClick={handleClick}>
            {children}
        </a>
    );
}
