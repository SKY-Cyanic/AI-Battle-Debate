import React from 'react';
import { X, FileText } from 'lucide-react';
import { Language } from '../types';
import { UI_TEXT } from '../constants';

interface DebateSummaryProps {
  summary: string;
  onClose: () => void;
  language: Language;
}

const DebateSummary: React.FC<DebateSummaryProps> = ({ summary, onClose, language }) => {
  const t = UI_TEXT[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl shadow-blue-500/10">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-400" />
            <h2 className="text-xl font-bold text-white">{t.summaryTitle}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-300 space-y-4">
           {summary.split('\n').map((line, i) => {
             if (line.startsWith('###')) return <h3 key={i} className="text-lg font-bold text-blue-300 mt-4 mb-2">{line.replace('###', '')}</h3>;
             if (line.startsWith('**')) return <h4 key={i} className="font-bold text-white mt-2">{line.replace(/\*\*/g, '')}</h4>;
             if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc marker:text-blue-500 mb-1">{line.replace('- ', '')}</li>;
             if (line.trim().length === 0) return <br key={i}/>;
             return <p key={i} className="leading-relaxed">{line}</p>;
           })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-800/30 rounded-b-2xl text-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebateSummary;