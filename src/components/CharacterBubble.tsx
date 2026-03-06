'use client';

interface CharacterBubbleProps {
  character: 'gabu' | 'koyama';
  message: string;
}

export default function CharacterBubble({ character, message }: CharacterBubbleProps) {
  const isGabu = character === 'gabu';

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl animate-fade-in ${
      isGabu ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50 border border-slate-200'
    }`}>
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        isGabu ? 'bg-amber-400 text-white' : 'bg-slate-700 text-white'
      }`}>
        {isGabu ? 'G' : 'K'}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold mb-1 ${
          isGabu ? 'text-amber-700' : 'text-slate-600'
        }`}>
          {isGabu ? 'ガブ' : '師匠小山'}
        </p>
        <p className={`text-sm leading-relaxed ${
          isGabu ? 'text-amber-900' : 'text-slate-800'
        }`}>
          {message}
        </p>
      </div>
    </div>
  );
}
