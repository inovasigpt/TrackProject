import { PROJECT_PHASES } from '../data/constants';
import { getXFromDate } from '../utils/dateUtils';
import {
    DraftingCompass,
    Terminal,
    ListChecks,
    UserCheck,
    Rocket,
    LucideIcon
} from 'lucide-react';
import { Phase } from '../types';

// Icon mapping for phases
const PHASE_ICONS: Record<string, LucideIcon> = {
    design: DraftingCompass,
    dev: Terminal,
    unit_test: ListChecks,
    sit: ListChecks,
    uat: UserCheck,
    implementation: Rocket,
};

interface PhaseBarProps {
    phase: Phase;
    onClick: (phase: Phase, phaseInfo: any) => void;
    topOffset?: number;
    barHeight?: number;
}

const PhaseBar: React.FC<PhaseBarProps> = ({ phase, onClick, topOffset = 30, barHeight = 40 }) => {
    // Use phase.name to find configuration, case insensitive match
    const phaseInfo = PROJECT_PHASES.find(p =>
        p.id.toLowerCase() === phase.name?.toLowerCase() ||
        p.label.toLowerCase() === phase.name?.toLowerCase()
    ) || {
        // Fallback default style
        id: 'default',
        label: phase.name || 'Phase',
        color: 'bg-slate-500/20',
        accent: 'bg-slate-500',
        text: 'text-slate-400',
        borderColor: 'border-slate-500/30'
    };

    const left = getXFromDate(new Date(phase.startDate));
    const right = getXFromDate(new Date(phase.endDate));
    const width = Math.max(right - left, 10);
    // Try to find icon by lowercased name, fallback to DraftingCompass
    const Icon = PHASE_ICONS[phase.name?.toLowerCase()] || PHASE_ICONS[phaseInfo.id.toLowerCase()] || DraftingCompass;

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
                <div className="flex items-center gap-2 truncate relative z-10 w-full px-1">
                    <Icon size={12} className={phaseInfo.text} />
                    {width > 60 && (
                        <div className="flex flex-col leading-none truncate w-full">
                            <div className="flex items-center justify-between text-[10px] font-black text-white uppercase tracking-tighter w-full">
                                <span className="truncate">{phaseInfo.label}</span>
                                <span>{phase.progress || 0}%</span>
                            </div>
                            {width > 100 && (
                                <div className="text-[8px] font-mono text-slate-300 truncate opacity-80">
                                    {new Date(phase.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(phase.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PhaseBar;
