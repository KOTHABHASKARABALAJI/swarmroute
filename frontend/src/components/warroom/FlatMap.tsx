import React from 'react';

interface FlatMapProps {
    sourceCoords: [number, number];
    destCoords: [number, number];
    progress: number;
}

// Map Lat/Lon to percentages
const getCoordinates = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
};

export const FlatMap: React.FC<FlatMapProps> = ({ sourceCoords, destCoords, progress }) => {
    const start = getCoordinates(sourceCoords[0], sourceCoords[1]);
    const end = getCoordinates(destCoords[0], destCoords[1]);

    // Interpolate current pos
    const currentX = start.x + (end.x - start.x) * (progress / 100);
    const currentY = start.y + (end.y - start.y) * (progress / 100);

    return (
        <div className="relative w-full h-full bg-[#0a0f18] overflow-hidden flex items-center justify-center">
            {/* Grid Pattern Background */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: `
            linear-gradient(to right, #22d3ee 1px, transparent 1px),
            linear-gradient(to bottom, #22d3ee 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Map Aspect Container */}
            <div className="relative w-[90%] max-w-[900px] aspect-[2/1] border border-primary/20 bg-background/50 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.05)] backdrop-blur-sm">

                {/* SVG World Map */}
                <div
                    className="absolute inset-0 opacity-[0.4] invert"
                    style={{
                        backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')",
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                    }}
                />

                {/* Arching Line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                        <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <path
                        d={`M ${start.x}% ${start.y}% Q 50% ${Math.min(start.y, end.y) - 20}%, ${end.x}% ${end.y}%`}
                        fill="none"
                        stroke="url(#route-gradient)"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        className="animate-pulse"
                        filter="url(#glow)"
                    />
                </svg>

                {/* Origin */}
                <div
                    className="absolute w-3 h-3 bg-muted-foreground rounded-full -translate-x-1.5 -translate-y-1.5 z-10 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                    style={{ left: `${start.x}%`, top: `${start.y}%` }}
                >
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap bg-background/90 px-1 rounded font-mono border border-border text-muted-foreground">ORIGIN</div>
                </div>

                {/* Destination */}
                <div
                    className="absolute w-3 h-3 bg-primary rounded-full -translate-x-1.5 -translate-y-1.5 z-10 shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                    style={{ left: `${end.x}%`, top: `${end.y}%` }}
                >
                    <div className="absolute -inset-2 rounded-full border border-primary animate-ping opacity-50" />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap bg-background/90 px-1 rounded font-mono border border-primary/50 text-primary cyber-glow-text">DESTINATION</div>
                </div>

                {/* Live Tracking Blip */}
                {progress >= 0 && progress <= 100 && (
                    <div
                        className="absolute z-20 transition-all duration-1000 ease-linear"
                        style={{ left: `${currentX}%`, top: `${currentY}%`, transform: 'translate(-50%, -50%)' }}
                    >
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-8 h-8 rounded-full bg-primary/20 animate-ping" />
                            <div className="w-4 h-4 bg-background border-2 border-primary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,1)]">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                            </div>
                        </div>

                        {/* Active HUD reading */}
                        <div className="absolute left-6 -top-4 w-28 p-1.5 bg-background/90 border border-primary/50 rounded pointer-events-none shadow-[0_0_10px_rgba(34,211,238,0.2)] backdrop-blur">
                            <div className="text-[9px] text-primary font-mono uppercase mb-0.5 cyber-glow-text">Route Live Tracking</div>
                            <div className="flex justify-between items-center text-[8px] text-muted-foreground font-mono">
                                <span>LAT: {(currentY * 1.8 - 90).toFixed(1)}</span>
                                <span>{Math.round(progress)}% CMP</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
