import React from 'react';

interface CircularProgressProps {
    progress: number; // 0-100
    size?: number;
    strokeWidth?: number;
    className?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
    progress,
    size = 20,
    strokeWidth = 2,
    className = ''
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg
            width={size}
            height={size}
            className={className}
            style={{ transform: 'rotate(-90deg)' }}
        >
            {/* Background circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
        </svg>
    );
};

export default CircularProgress;
