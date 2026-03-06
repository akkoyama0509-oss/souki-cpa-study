'use client';

interface CharacterBubbleProps {
  character: 'gabu' | 'koyama';
  message: string;
}

export default function CharacterBubble({ character, message }: CharacterBubbleProps) {
  const isGabu = character === 'gabu';

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl animate-fade-in ${
      isGabu ? 'bg-[#FF9500]/[0.06]' : 'bg-black/[0.025]'
    }`}>
      <div className={`shrink-0 w-8 h-8 rounded-[10px] flex items-center justify-center text-[12px] font-bold ${
        isGabu ? 'bg-gradient-to-br from-[#FF9500] to-[#FF6B00] text-white' : 'bg-gradient-to-br from-[#636366] to-[#48484A] text-white'
      }`}>
        {isGabu ? 'G' : 'K'}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-semibold mb-0.5 ${
          isGabu ? 'text-[#FF9500]' : 'text-[#636366]'
        }`}>
          {isGabu ? 'ガブ' : '師匠小山'}
        </p>
        <p className="text-[13px] leading-[1.5] text-[#1C1C1E]/80">
          {message}
        </p>
      </div>
    </div>
  );
}
