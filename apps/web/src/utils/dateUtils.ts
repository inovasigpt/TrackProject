import { TIMELINE_START_DATE, PIXELS_PER_DAY, WEEK_WIDTH } from '../data/constants';

/**
 * Convert a date to X position in pixels relative to timeline start
 */
export const getXFromDate = (dateObj: Date | number) => {
    const timelineStart = new Date(TIMELINE_START_DATE).getTime();
    const diffTime = (dateObj instanceof Date ? dateObj.getTime() : dateObj) - timelineStart;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays * PIXELS_PER_DAY;
};

/**
 * Generate header data for months and weeks
 */
export const getHeaderData = () => {
    const months = [];
    const weeks = [];
    const start = new Date(TIMELINE_START_DATE);

    // Generate 6 months of data
    for (let i = 0; i < 6; i++) {
        const monthDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const monthName = monthDate.toLocaleString('default', { month: 'long' });
        const year = monthDate.getFullYear();
        const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();

        months.push({
            label: `${monthName} / ${year}`,
            width: daysInMonth * PIXELS_PER_DAY
        });
    }

    // Find first Monday from timeline start
    let current = new Date(TIMELINE_START_DATE);
    while (current.getDay() !== 1) {
        current.setDate(current.getDate() + 1);
    }

    // Generate 26 weeks of data
    for (let i = 0; i < 26; i++) {
        weeks.push({
            date: current.getDate(),
            full: current.toDateString(),
            x: getXFromDate(new Date(current))
        });
        current.setDate(current.getDate() + 7);
    }

    return { months, weeks };
};

/**
 * Format date to YYYY-MM-DD string
 */
export const formatDateToString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};
