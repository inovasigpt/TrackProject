import { PROJECT_PHASES } from '../data/constants';
import { getXFromDate } from '../utils/dateUtils';
import {
    DraftingCompass,
    Terminal,
    ListChecks,
    UserCheck,
    Rocket
} from 'lucide-react';

// Icon mapping for phases
const PHASE_ICONS = {
    design: DraftingCompass,
    dev: Terminal,
    unit_test: ListChecks,
    sit: ListChecks,
    uat: UserCheck,
    implementation: Rocket,
};

const PhaseBar = ({ phase, onClick, topOffset = 30, barHeight = 40 }) => {
    const phaseInfo = PROJECT_PHASES.find(p => p.id === phase.id);

    if (!phaseInfo) return null;

    const left = getXFromDate(new Date(phase.startDate));
    const right = getXFromDate(new Date(phase.endDate));
    const width = Math.max(right - left, 10);
    const Icon = PHASE_ICONS[phase.id] || DraftingCompass;

    return (
        <div
            className="absolute flex items-center group cursor-pointer transition-all duration-300 z-10"
            style={{ left: `${left}px`, width: `${width}px`, top: `${topOffset}px`, height: `${barHeight}px` }}
            onClick={(e) => {
                e.stopPropagation();
                onClick(phase, phaseInfo);
            }}
        >
            <div
                className={`
          w-full ${phaseInfo.color} ${phaseInfo.borderColor} border
          rounded-md relative flex items-center px-3 
          group-hover:brightness-125 phase-bar-glow
          transition-all overflow-hidden
        `}
                style={{ height: `${barHeight}px` }}
            >
                {/* Left accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${phaseInfo.accent}`}></div>

                {/* Progress fill */}
                {phase.progress > 0 && (
                    <div
                        className={`absolute left-0 top-0 bottom-0 ${phaseInfo.accent} opacity-20`}
                        style={{ width: `${phase.progress}%` }}
                    ></div>
                )}

                {/* Content */}
                <div className="flex items-center gap-2 truncate relative z-10">
                    <Icon size={12} className={phaseInfo.text} />
                    {width > 60 && (
                        <span className="text-[9px] font-black text-white uppercase tracking-tighter truncate">
                            {phase.progress > 0 ? `${phase.progress}% ${phaseInfo.label}` : phaseInfo.label}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PhaseBar;
