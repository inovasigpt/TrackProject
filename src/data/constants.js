// Theme colors
export const THEME = {
    primary: "#26b9f7",
    emerald: "#10b981",
    background: "#020617",
    card: "#0f172a",
    border: "#1e293b",
    today: "#f87171", // Red-400
};

// Today's date (using system date)
export const TODAY = new Date();

// Timeline configuration
export const TIMELINE_START_DATE = new Date('2026-01-01');
export const WEEK_WIDTH = 120; // pixels per week
export const PIXELS_PER_DAY = WEEK_WIDTH / 7;

// Project phases with styling
export const PROJECT_PHASES = [
    {
        id: 'design',
        label: 'Design',
        color: 'bg-emerald-500/20',
        accent: 'bg-emerald-500',
        text: 'text-emerald-400',
        borderColor: 'border-emerald-500/30'
    },
    {
        id: 'dev',
        label: 'Development',
        color: 'bg-blue-500/20',
        accent: 'bg-blue-500',
        text: 'text-blue-400',
        borderColor: 'border-blue-500/30'
    },
    {
        id: 'unit_test',
        label: 'Unit Test',
        color: 'bg-indigo-500/20',
        accent: 'bg-indigo-500',
        text: 'text-indigo-400',
        borderColor: 'border-indigo-500/30'
    },
    {
        id: 'sit',
        label: 'SIT',
        color: 'bg-amber-500/20',
        accent: 'bg-amber-500',
        text: 'text-amber-400',
        borderColor: 'border-amber-500/30'
    },
    {
        id: 'uat',
        label: 'UAT',
        color: 'bg-rose-500/20',
        accent: 'bg-rose-500',
        text: 'text-rose-400',
        borderColor: 'border-rose-500/30'
    },
    {
        id: 'implementation',
        label: 'Deployment',
        color: 'bg-purple-500/20',
        accent: 'bg-purple-500',
        text: 'text-purple-400',
        borderColor: 'border-purple-500/30'
    },
];
