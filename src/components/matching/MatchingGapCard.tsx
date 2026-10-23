import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import { CandidateParticipant, PersistedCandidateMatch } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface MatchingGapCardProps {
  candidate: CandidateParticipant;
  result: PersistedCandidateMatch;
}

export const MatchingGapCard: React.FC<MatchingGapCardProps> = ({
  candidate,
  result,
}) => {
  const { selectedCandidateIds, toggleCandidateSelection } = useAppStore();

  const isSelected = selectedCandidateIds.includes(candidate.id);

  return (
    <div
      className={`border rounded-2xl p-5 bg-white transition-all duration-200 shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/20'
          : 'border-slate-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-base text-slate-900">{candidate.fullName}</h4>
            <span className="text-[11px] font-mono text-slate-400">({candidate.id})</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Asal: <span className="font-medium text-slate-700">{candidate.institutionName} ({candidate.provinsi})</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200"
          >
            <span>{result.matchScore}% · {result.matchStatus}</span>
          </div>

          <button
            type="button"
            onClick={() => toggleCandidateSelection(candidate.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              isSelected
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSelected ? 'Batal Pilih' : 'Pilih ke Alokasi'}
          </button>
        </div>
      </div>

      <div className="space-y-2.5 border-t border-slate-100 pt-3 text-xs">
        <div className="flex items-start gap-2 text-slate-700">
          <Award className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-500 font-semibold">Catatan matching: </span>
            <span className="font-medium text-slate-700">
              {result.explanation || 'Belum ada uraian matching pada data tersimpan.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl mt-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold leading-relaxed">
            Program terkait: <span className="font-bold underline">{result.programName || 'Belum ditetapkan'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
