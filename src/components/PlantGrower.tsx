import React from 'react';

interface PlantGrowerProps {
  completionPercentage: number;
}

export const PlantGrower: React.FC<PlantGrowerProps> = ({ completionPercentage }) => {
  // Determine growth stage
  const getStage = (pct: number) => {
    if (pct <= 15) return 0;
    if (pct <= 35) return 1;
    if (pct <= 55) return 2;
    if (pct <= 75) return 3;
    if (pct <= 95) return 4;
    return 5;
  };

  const stage = getStage(completionPercentage);

  // SVG Paths and configurations for animations
  const stemHeight = Math.min(100, Math.max(0, (completionPercentage - 15) * 1.2)); // goes up to ~100px

  // Generate particles for the fully bloomed stage
  const particles = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i * 360) / 8;
    const rad = (angle * Math.PI) / 180;
    const distance = 40 + Math.sin(i) * 10;
    return {
      x: 100 + Math.cos(rad) * distance,
      y: 60 + Math.sin(rad) * distance,
      delay: `${i * 0.2}s`,
    };
  });

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-[#0D4855]/10 shadow-sm relative overflow-hidden transition-all duration-300 group hover:shadow-md">
      {/* Decorative Warm Accent Circles */}
      <div className="absolute -top-12 -left-12 w-24 h-24 bg-[#C5A85C]/5 rounded-full blur-xl group-hover:bg-[#C5A85C]/10 transition-all duration-500" />
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#0D4855]/5 rounded-full blur-xl group-hover:bg-[#0D4855]/10 transition-all duration-500" />

      {/* Title */}
      <div className="text-center mb-4 z-10">
        <h4 className="text-xs uppercase tracking-wider text-[#C5A85C] font-semibold mb-1">Journal Progress</h4>
        <p className="text-lg text-[#0D4855] font-semibold">
          {stage === 0 && "Sowing the Seeds"}
          {stage === 1 && "Sprouting Growth"}
          {stage === 2 && "Budding Potential"}
          {stage === 3 && "Reaching Upward"}
          {stage === 4 && "Preparing to Bloom"}
          {stage === 5 && "Flourishing Progress!"}
        </p>
      </div>

      {/* SVG Canvas */}
      <div className="w-48 h-48 relative flex items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(13,72,85,0.08)]"
        >
          {/* Gradients */}
          <defs>
            {/* Pot Gradient */}
            <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0D4855" />
              <stop offset="100%" stopColor="#062228" />
            </linearGradient>
            {/* Gold Accent for Pot */}
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4B26F" />
              <stop offset="100%" stopColor="#C5A85C" />
            </linearGradient>
            {/* Soil Gradient */}
            <linearGradient id="soilGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5C4033" />
              <stop offset="100%" stopColor="#3D2B1F" />
            </linearGradient>
            {/* Leaf Gradient */}
            <linearGradient id="leafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#81C784" />
              <stop offset="100%" stopColor="#2E7D32" />
            </linearGradient>
            {/* Bloom Petal Gradient */}
            <linearGradient id="petalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5D77F" />
              <stop offset="50%" stopColor="#D4B26F" />
              <stop offset="100%" stopColor="#C5A85C" />
            </linearGradient>
          </defs>

          {/* BACKGROUND AURA (Glow on Bloom) */}
          {stage === 5 && (
            <circle
              cx="100"
              cy="60"
              r="30"
              className="fill-[#C5A85C]/20 animate-pulse"
              style={{ animationDuration: '3s' }}
            />
          )}

          {/* SOIL & POT (Always Visible) */}
          <path d="M 60,150 L 140,150 L 135,185 C 135,188 132,190 128,190 L 72,190 C 68,190 65,188 65,185 Z" fill="url(#potGrad)" />
          <rect x="58" y="150" width="84" height="6" rx="3" fill="url(#goldGrad)" />
          <path d="M 65,150 Q 100,140 135,150 Z" fill="url(#soilGrad)" />

          {/* STAGE 0: Seed inside soil */}
          {stage === 0 && (
            <g className="transition-opacity duration-500">
              <ellipse
                cx="100"
                cy="147"
                rx="6"
                ry="4"
                fill="#C5A85C"
                className="animate-bounce"
                style={{ animationDuration: '2s' }}
              />
              <path d="M 100,143 Q 102,138 99,136" stroke="#81C784" strokeWidth="1.5" fill="none" className="opacity-60" />
            </g>
          )}

          {/* STEM (Stages 1-5) */}
          {stage >= 1 && (
            <g className="transition-all duration-700">
              <path
                d={`M 100,145 Q ${100 + Math.sin(stemHeight / 20) * 8},${145 - stemHeight / 2} 100,${145 - stemHeight}`}
                stroke="url(#leafGrad)"
                strokeWidth={Math.max(2, 5 - (stemHeight / 30))}
                fill="none"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </g>
          )}

          {/* LEAVES (Stage 2-5) */}
          {stage >= 2 && (
            <path
              d={`M 100,120 Q 75,115 78,100 Q 92,105 100,120`}
              fill="url(#leafGrad)"
              className="origin-[100px_120px] animate-[growLeaf_1s_ease-out_forwards]"
              style={{
                transform: `scale(${stage >= 3 ? 1 : 0.7})`,
                transition: 'transform 0.5s ease-in-out',
              }}
            />
          )}
          {stage >= 2 && (
            <path
              d={`M 100,110 Q 125,105 122,90 Q 108,95 100,110`}
              fill="url(#leafGrad)"
              className="origin-[100px_110px] animate-[growLeafRight_1s_ease-out_forwards]"
              style={{
                transform: `scale(${stage >= 3 ? 1.1 : 0.8})`,
                transition: 'transform 0.5s ease-in-out',
              }}
            />
          )}

          {/* UPPER BRANCHES & BUD (Stage 3-4) */}
          {stage >= 3 && stemHeight > 50 && (
            <g className="transition-all duration-500">
              <path
                d={`M 100,${145 - stemHeight * 0.7} Q 85,${145 - stemHeight * 0.8} 82,${145 - stemHeight * 0.9}`}
                stroke="url(#leafGrad)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={`M 82,${145 - stemHeight * 0.9} Q 70,${145 - stemHeight * 0.95} 75,${145 - stemHeight * 1.05} Q 85,${145 - stemHeight * 1.0} 82,${145 - stemHeight * 0.9}`}
                fill="url(#leafGrad)"
              />
            </g>
          )}

          {/* FLOWER BUD (Stage 4) */}
          {stage === 4 && (
            <g transform={`translate(100, ${145 - stemHeight})`} className="animate-pulse">
              <path d="M -8,0 C -5,8 5,8 8,0 C 10,-8 -10,-8 -8,0" fill="#2E7D32" />
              <path d="M -5,-3 C -10,-15 0,-20 0,-20 C 0,-20 10,-15 5,-3 Z" fill="url(#petalGrad)" />
              <path d="M -2,-3 C -5,-12 0,-15 0,-15 C 0,-15 5,-12 2,-3 Z" fill="#0D4855" opacity="0.6" />
            </g>
          )}

          {/* FULLY BLOOMED FLOWER (Stage 5) */}
          {stage === 5 && (
            <g transform={`translate(100, ${145 - stemHeight})`} className="animate-[bloom_1.5s_ease-out_forwards] origin-center">
              <path d="M -12,0 C -6,10 6,10 12,0 Z" fill="#2E7D32" />

              <g className="animate-[spin_40s_linear_infinite]">
                {Array.from({ length: 8 }).map((_, idx) => {
                  const rotation = idx * 45;
                  return (
                    <path
                      key={idx}
                      d="M 0,0 C -12,-15 -8,-32 0,-32 C 8,-32 12,-15 0,0"
                      fill="url(#petalGrad)"
                      transform={`rotate(${rotation})`}
                      className="opacity-95"
                    />
                  );
                })}
              </g>

              <circle cx="0" cy="0" r="10" fill="#0D4855" />
              <circle cx="0" cy="0" r="8" fill="none" stroke="#D4B26F" strokeWidth="1.5" strokeDasharray="3 2" />
              <circle cx="0" cy="0" r="5" fill="#C5A85C" />

              {/* Sparkle lines */}
              {particles.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x - 100}
                  cy={p.y - (145 - stemHeight)}
                  r={1.5 + Math.sin(i) * 0.8}
                  fill="#D4B26F"
                  className="animate-ping"
                  style={{
                    animationDuration: `${1.2 + (i % 3) * 0.4}s`,
                    animationDelay: p.delay,
                  }}
                />
              ))}
            </g>
          )}
        </svg>
      </div>

      {/* Progress Pill */}
      <div className="mt-4 flex items-center gap-2">
        <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0D4855] to-[#C5A85C] transition-all duration-500 rounded-full"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-[#0D4855]">
          {Math.round(completionPercentage)}% Completed
        </span>
      </div>

      {/* Motivator */}
      <span className="text-[10px] text-gray-400 mt-2 text-center max-w-[150px] leading-tight">
        {completionPercentage < 100
          ? "Fill out more fields to help your Tadbeer garden grow!"
          : "Your daily work has blossomed beautifully!"}
      </span>

      {/* Styled inline keyframes for browser render */}
      <style>{`
        @keyframes growLeaf {
          0% { transform: scale(0) rotate(-30deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes growLeafRight {
          0% { transform: scale(0) rotate(30deg); opacity: 0; }
          100% { transform: scale(1.1) rotate(0deg); opacity: 1; }
        }
        @keyframes bloom {
          0% { transform: translate(100px, ${145 - stemHeight}px) scale(0); }
          60% { transform: translate(100px, ${145 - stemHeight}px) scale(1.15); }
          100% { transform: translate(100px, ${145 - stemHeight}px) scale(1); }
        }
      `}</style>
    </div>
  );
};
