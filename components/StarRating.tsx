"use client";
import React, { useState } from 'react';

interface Props {
  label: string;
  value: number;
  onChange: (val: number) => void;
}

export default function StarRating({ label, value, onChange }: Props) {
  const [hover, setHover] = useState(0);

  const getRatingInfo = (val: number) => {
    switch(val) {
      case 1: return { text: "Juda yomon", color: "text-red-600", emoji: "😞" };
      case 2: return { text: "Qoniqarsiz", color: "text-amber-500", emoji: "🙁" };
      case 3: return { text: "Yaxshi", color: "text-amber-500", emoji: "😐" };
      case 4: return { text: "Juda yaxshi", color: "text-[#0A9C54]", emoji: "🙂" };
      case 5: return { text: "A'lo darajada!", color: "text-[#0A9C54]", emoji: "😊" };
      default: return null;
    }
  };

  const currentInfo = getRatingInfo(value);

  return (
    <div className="py-4 border-b border-slate-100 last:border-0 flex flex-col gap-3">
      {/* Title */}
      <div className="flex items-center justify-center">
        <label className="text-[14.5px] font-semibold text-slate-800">{label}</label>
      </div>

      {/* Stars */}
      <div className="flex items-center justify-between px-2 sm:px-4">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = (hover || value) >= star;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="focus:outline-none transition-transform transform hover:scale-110 active:scale-95"
            >
              <svg 
                className={`w-11 h-11 transition-colors duration-200 ${
                  active ? 'text-[#FFD700] drop-shadow-[0_2px_4px_rgba(255,215,0,0.3)]' : 'text-slate-200'
                }`} 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Description Text */}
      <div className="text-center h-6 flex items-center justify-center gap-1.5">
        {currentInfo ? (
          <>
            <span className="text-[16px]">{currentInfo.emoji}</span>
            <span className={`text-[13.5px] font-extrabold transition-all ${currentInfo.color}`}>
              {currentInfo.text}
            </span>
          </>
        ) : (
          <span className="text-[12px] font-bold text-slate-400 transition-all">
            Bahoni tanlang
          </span>
        )}
      </div>
    </div>
  );
}
