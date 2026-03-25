import { Appointment } from '../types';

export const AVG_SERVICE_MIN = 15;

export const parseTimeToMinutes = (t: any) => {
    if (!t || typeof t !== 'string') return 0;
    const trimmed = t.trim();
    const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (ampmMatch) {
        let hh = parseInt(ampmMatch[1], 10);
        const mm = parseInt(ampmMatch[2], 10);
        const meridiem = ampmMatch[3].toUpperCase();
        if (meridiem === 'PM' && hh !== 12) hh += 12;
        if (meridiem === 'AM' && hh === 12) hh = 0;
        return hh * 60 + mm;
    }
    const parts = trimmed.split(':');
    if (parts.length < 2) return 0;
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    return (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);
};

export const getNowMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
};

export const parseISOToMinutes = (iso: string) => {
    try {
        const date = new Date(iso);
        return date.getHours() * 60 + date.getMinutes();
    } catch {
        return 0;
    }
};

/**
 * Safely parses any date-like input (ISO string, Firestore Timestamp, or Date object)
 */
export const safeParseDate = (d: any): Date | null => {
    if (!d) return null;
    if (d instanceof Date) return d;
    if (typeof d.toDate === 'function') return d.toDate();
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
};

export const parseDateTime = (dateStr: string, timeStr: string): Date => {
    const [hoursStr, minutesStr, meridiem] = timeStr.match(/(\d+):(\d+)\s*([AP]M)/i)?.slice(1) || [];
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    if (meridiem?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (meridiem?.toUpperCase() === 'AM' && hours === 12) hours = 0;
    
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
};

/**
 * Calculates the REAL-TIME wait time for an appointment using absolute timestamps.
 * - If it's a future appointment (on a future date or future time today), 
 *   it doesn't decay from the creation time.
 * - Decay should only start once the appointment time is reached OR if a manual override exists.
 */
export const getDecayedWaitTime = (app: Appointment, now: Date) => {
    const baseWait = (app.receptionistWaitTimeOverride !== undefined && app.receptionistWaitTimeOverride !== null)
        ? app.receptionistWaitTimeOverride
        : app.predictedWaitTimeMin;

    if (baseWait === undefined || baseWait === null) return 0;

    const appointmentDate = parseDateTime(app.date, app.appointmentTime);
    
    // If it's a future appointment and NO manual override has been set yet,
    // we don't start any decay. We assume wait time is "Upcoming".
    if (now < appointmentDate && (app.receptionistWaitTimeOverride === undefined || app.receptionistWaitTimeOverride === null)) {
        return baseWait;
    }

    // Baseline for decay:
    // 1. If receptionist updated it, use that update time.
    // 2. Otherwise, use the appointment start time as the baseline (decay starts when appt starts).
    const baselineDate = safeParseDate(app.waitTimeUpdatedAt) || appointmentDate;
    
    const elapsedMs = now.getTime() - baselineDate.getTime();
    
    // Convert elapsed ms to full minutes
    const elapsedMins = Math.floor(elapsedMs / 60000);
    
    // Only decay if we have actually passed the baseline
    const decayAmount = Math.max(0, elapsedMins);
    
    return Math.max(0, baseWait - decayAmount);
};

export const calculateWaitTimesForQueue = (appointments: Appointment[], targetDate: string, doctorId: number | string, nowDate: Date): Map<string, number> => {
    const nowMins = nowDate.getHours() * 60 + nowDate.getMinutes();
    const queue = appointments
        .filter(a => a.date === targetDate && String(a.doctorId) === String(doctorId))
        .sort((a, b) => {
            if (a.status === 'In-Progress' && b.status !== 'In-Progress') return -1;
            if (b.status === 'In-Progress' && a.status !== 'In-Progress') return 1;

            const aIsEmergency = a.visitType === 'Emergency';
            const bIsEmergency = b.visitType === 'Emergency';
            if (aIsEmergency && !bIsEmergency) return -1;
            if (bIsEmergency && !aIsEmergency) return 1;

            return parseTimeToMinutes(a.appointmentTime) - parseTimeToMinutes(b.appointmentTime);
        });

    const results = new Map<string, number>();
    let cursor = nowMins;

    for (const a of queue) {
        if (['Completed', 'Cancelled', 'No-show'].includes(a.status)) continue;

        if (a.status === 'In-Progress') {
            const startMins = a.startedAtISO ? parseISOToMinutes(a.startedAtISO) : parseTimeToMinutes(a.appointmentTime);
            cursor = Math.max(cursor, startMins + AVG_SERVICE_MIN);
            results.set(a.id, 0);
            continue;
        }

        const effectiveWait = getDecayedWaitTime(a, nowDate);
        results.set(a.id, effectiveWait);
        cursor = Math.max(cursor, nowMins + effectiveWait + AVG_SERVICE_MIN);
    }

    return results;
};
