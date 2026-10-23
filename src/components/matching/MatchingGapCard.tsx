import React from 'react';
import { Award, AlertTriangle, CheckCircle2, User, Globe2 } from 'lucide-react';
import { CandidateParticipant, GlobalDemand, MatchingResult } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface MatchingGapCardProps {
  candidate: CandidateParticipant;
  demand: GlobalDemand;
  result: MatchingResult;
  recommendedProgramTitle: string;
}

export const MatchingGapCard: React.FC<MatchingGapCardProps> = ({
  candidate,
  demand,
  result,
  recommendedProgramTitle,
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
            className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${
              result.matchScore >= 80
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            <span>{result.matchScore}% Match Score</span>
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
        {/* Language Gap */}
        <div className="flex items-start gap-2 text-slate-700">
          <Award className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-500 font-semibold">Analisis Kesiapan Bahasa: </span>
            <span
              className={`font-bold ${
                result.languageMatch ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {result.languageGapDescription}
            </span>
          </div>
        </div>

        {/* Skill Gap */}
        <div className="flex items-start gap-2 text-slate-700">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="w-full">
            <span className="text-slate-500 font-semibold">Kesesuaian Keterampilan ({result.skillsMatchPercentage}%): </span>
            {result.skillGaps.length === 0 ? (
              <span className="text-emerald-700 font-bold ml-1">
                Semua keterampilan wajib terpenuhi
              </span>
            ) : (
              <div className="mt-1">
                <span className="text-[11px] text-slate-400 block mb-1">Gap Keterampilan yang Harus Ditingkatkan:</span>
                <div className="flex flex-wrap gap-1">
                  {result.skillGaps.map((sk, i) => (
                    <span
                      key={i}
                      className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] px-2 py-0.5 rounded font-medium"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommended Modul B Program */}
        <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl mt-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold leading-relaxed">
            Rekomendasi Modul B: <span className="font-bold underline">{recommendedProgramTitle}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
