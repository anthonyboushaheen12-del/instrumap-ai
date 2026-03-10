import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

const STEPS = {
  reading:    { icon: '📄', label: 'Reading PDF...' },
  converting: { icon: '🖼️', label: 'Converting to images...' },
  analyzing:  { icon: '🤖', label: 'Claude is analyzing your P&ID...' },
  processing: { icon: '✅', label: 'Processing results...' },
};

const STEP_ORDER = ['reading', 'converting', 'analyzing', 'processing'];

export default function LoadingOverlay({ step }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const current = STEPS[step] || STEPS.reading;
  const currentIdx = STEP_ORDER.indexOf(step || 'reading');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Loader2 className="w-14 h-14 text-[#22c55e] animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center text-lg">
              {current.icon}
            </span>
          </div>
        </div>

        {/* Current step label */}
        <h3 className="text-lg font-semibold text-white mb-1 font-mono">
          {current.label}
        </h3>

        {/* Elapsed timer (shown during analyzing step) */}
        {step === 'analyzing' && (
          <p className="text-[#22c55e] text-sm font-mono mb-3">
            Analyzing... {elapsed}s
          </p>
        )}

        {/* Step progress dots */}
        <div className="flex items-center justify-center gap-2 mt-4 mb-4">
          {STEP_ORDER.map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${
                i < currentIdx
                  ? 'bg-[#22c55e]'
                  : i === currentIdx
                  ? 'bg-[#22c55e] animate-pulse w-3 h-3'
                  : 'bg-[#30363d]'
              }`}
            />
          ))}
        </div>

        {/* Timeout warning */}
        {elapsed >= 30 && (
          <p className="text-[#7d8590] text-xs font-mono mt-2">
            Large drawings take 30–60 seconds
          </p>
        )}
      </div>
    </div>
  );
}
