import { useMemo, useEffect } from 'react';
import { TODAY, THEME, WEEK_WIDTH } from '../data/constants';
import { getXFromDate, getHeaderData } from '../utils/dateUtils';
import PhaseBar from './PhaseBar';
import { Project, Phase } from '../types';

interface TimelineProps {
    projects: Project[];
    onPhaseClick: (data: { project: Project; phase: Phase; info: any }) => void;
    scrollRef?: React.RefObject<HTMLDivElement | null>;
}

interface PhaseRows {
    phaseRows: Record<string, number>;
    totalRows: number;
}

// Calculate row assignments for overlapping phases
const calculatePhaseRows = (phases: Phase[]): PhaseRows => {
    // Sort phases by start date
    const sortedPhases = [...phases].sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const phaseRows: Record<string, number> = {};
    const rowEndDates: Date[] = []; // Track the end date of each row

    sortedPhases.forEach(phase => {
        const phaseStart = new Date(phase.startDate);
        const phaseEnd = new Date(phase.endDate);

        // Find a row where this phase doesn't overlap
        let assignedRow = -1;
        for (let i = 0; i < rowEndDates.length; i++) {
            if (rowEndDates[i] < phaseStart) {
                // This row is free (previous phase ended before this one starts)
                assignedRow = i;
                rowEndDates[i] = phaseEnd;
                break;
            }
        }

        // If no free row found, create a new one
        if (assignedRow === -1) {
            assignedRow = rowEndDates.length;
            rowEndDates.push(phaseEnd);
        }

        phaseRows[phase.id] = assignedRow;
    });

    return {
        phaseRows,
        totalRows: Math.max(rowEndDates.length, 1)
    };
};

const Timeline: React.FC<TimelineProps> = ({ projects, onPhaseClick, scrollRef }) => {
    const { months, weeks } = useMemo(() => getHeaderData(), []);
    const timelineWidth = months.reduce((acc, m) => acc + m.width, 0);
    const todayX = useMemo(() => getXFromDate(TODAY), []);

    const BAR_HEIGHT = 36; // Height of each phase bar
    const ROW_PADDING = 12; // Padding between rows
    const BASE_TOP_OFFSET = 10; // Top offset for first row

    // Calculate row assignments for each project
    const projectRowData = useMemo(() => {
        const data: Record<string, PhaseRows> = {};
        projects.forEach(project => {
            data[project.id] = calculatePhaseRows(project.phases);
        });
        return data;
    }, [projects]);

    // Calculate dynamic row height for each project
    const getProjectRowHeight = (projectId: string) => {
        const rowData = projectRowData[projectId];
        if (!rowData) return 100;
        const totalRows = rowData.totalRows;
        return BASE_TOP_OFFSET + (totalRows * (BAR_HEIGHT + ROW_PADDING)) + ROW_PADDING;
    };

    // Auto-scroll to Today on mount
    useEffect(() => {
        if (scrollRef?.current) {
            const container = scrollRef.current;
            const containerWidth = container.clientWidth;
            const targetScroll = Math.max(0, todayX - (containerWidth / 2));

            // Allow layout to settle before scrolling
            setTimeout(() => {
                container.scrollTo({ left: targetScroll, behavior: 'smooth' });
            }, 100);
        }
    }, [scrollRef, todayX]);

    return (
        <div ref={scrollRef} className="flex-1 overflow-auto custom-scrollbar bg-[#020617] relative">
            <div style={{ width: `${timelineWidth}px` }} className="min-h-full relative">

                {/* Sticky Header */}
                <div className="sticky top-0 z-30 flex flex-col bg-[#020617] border-b border-[#1e293b] h-16">
                    {/* Month Row */}
                    <div className="flex h-1/2 border-b border-[#1e293b]/50">
                        {months.map((month, i) => (
                            <div
                                key={i}
                                className="h-full border-r border-[#1e293b] flex items-center px-4 shrink-0 bg-[#020617]"
                                style={{ width: `${month.width}px` }}
                            >
                                <span className="text-[11px] font-bold text-slate-100">{month.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Week Row */}
                    <div className="flex h-1/2 relative">
                        {weeks.map((week, i) => (
                            <div
                                key={i}
                                className="h-full border-r border-[#1e293b]/30 flex items-center px-4 shrink-0 bg-[#020617]/50"
                                style={{ width: `${WEEK_WIDTH}px`, position: 'absolute', left: `${week.x}px` }}
                            >
                                <span className="text-[10px] font-mono text-slate-500">{week.date}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline Content */}
                <div className="relative">
                    {/* Today Indicator */}
                    <div
                        className="absolute top-0 bottom-0 z-20 pointer-events-none"
                        style={{ left: `${todayX}px`, width: '1px' }}
                    >
                        <div className="sticky top-12 -translate-x-1/2 flex flex-col items-center">
                            <div className="bg-[#f87171] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.5)]">
                                {TODAY.getDate()}
                            </div>
                            <div className="w-[1px] h-[2000px] bg-[#f87171]/60"></div>
                        </div>
                    </div>

                    {/* Week Grid Lines */}
                    <div className="absolute top-0 bottom-0 pointer-events-none flex w-full h-full">
                        {weeks.map((week, i) => (
                            <div
                                key={i}
                                className="h-full border-r border-[#1e293b]/10 shrink-0"
                                style={{ width: `${WEEK_WIDTH}px`, position: 'absolute', left: `${week.x}px` }}
                            />
                        ))}
                    </div>

                    {/* Project Rows */}
                    {projects.map((project) => {
                        const rowData = projectRowData[project.id];
                        const rowHeight = getProjectRowHeight(project.id);

                        return (
                            <div
                                key={project.id}
                                className="border-b border-[#1e293b]/20 relative group transition-colors hover:bg-white/[0.02]"
                                style={{ height: `${rowHeight}px` }}
                            >
                                <div className="absolute inset-0 border-b border-[#1e293b]/10 pointer-events-none"></div>

                                {/* Connection Lines between phases (only for non-overlapping sequential phases) */}
                                <svg className="absolute inset-0 pointer-events-none opacity-20" style={{ height: `${rowHeight}px` }}>
                                    {project.phases.map((phase, idx) => {
                                        if (idx === project.phases.length - 1) return null;
                                        const next = project.phases[idx + 1];
                                        if (!next) return null;

                                        // Only draw connection if phases are on the same row and sequential
                                        const phaseRow = rowData?.phaseRows[phase.id] || 0;
                                        const nextRow = rowData?.phaseRows[next.id] || 0;
                                        if (phaseRow !== nextRow) return null;

                                        const startX = getXFromDate(new Date(phase.endDate));
                                        const endX = getXFromDate(new Date(next.startDate));

                                        // Don't draw if phases overlap
                                        if (endX <= startX) return null;

                                        const rowY = BASE_TOP_OFFSET + (phaseRow * (BAR_HEIGHT + ROW_PADDING)) + (BAR_HEIGHT / 2);

                                        return (
                                            <path
                                                key={`link-${idx}`}
                                                d={`M ${startX} ${rowY} C ${startX + 20} ${rowY}, ${endX - 20} ${rowY}, ${endX} ${rowY}`}
                                                stroke={THEME.primary}
                                                strokeWidth="1.5"
                                                strokeDasharray="4 2"
                                                fill="none"
                                            />
                                        );
                                    })}
                                </svg>

                                {/* Phase Bars */}
                                {project.phases.map((phase) => {
                                    const rowIndex = rowData?.phaseRows[phase.id] || 0;
                                    const topOffset = BASE_TOP_OFFSET + (rowIndex * (BAR_HEIGHT + ROW_PADDING));

                                    return (
                                        <PhaseBar
                                            key={phase.id}
                                            phase={phase}
                                            topOffset={topOffset}
                                            barHeight={BAR_HEIGHT}
                                            onClick={(p: any, info: any) => onPhaseClick({ project, phase: p, info })}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Timeline;
