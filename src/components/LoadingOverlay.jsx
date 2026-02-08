import { Loader2 } from 'lucide-react';

export default function LoadingOverlay({ message, subMessage }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {message || 'Analyzing Your P&ID'}
        </h3>
        <p className="text-slate-600">
          {subMessage || 'Extracting instruments and classifying signal types...'}
        </p>
        <p className="text-sm text-slate-500 mt-4">
          This usually takes 1-2 minutes
        </p>
      </div>
    </div>
  );
}
