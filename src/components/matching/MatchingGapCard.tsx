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
      className={`border rounded-2xl p-5 bg-white dark:bg-slate-900 transition-all duration-200 shadow-xs hover:shadow-md ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{candidate.fullName}</h4>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">({candidate.id})</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Asal: <span className="font-medium text-slate-700 dark:text-slate-300">{candidate.institutionName} ({candidate.provinsi})</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
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

      <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
        <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
          <Award className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Catatan matching: </span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {result.explanation || 'Belum ada uraian matching pada data tersimpan.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-xl mt-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold leading-relaxed">
            Program terkait: <span className="font-bold underline">{result.programName || 'Belum ditetapkan'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
