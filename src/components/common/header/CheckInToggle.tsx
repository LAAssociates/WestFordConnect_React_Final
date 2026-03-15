import React from 'react';
import { cn } from '../../../lib/utils/cn';
import { dashboardService } from '../../../services/dashboardService';
import { presenceService } from '../../../services/presenceService';
import type { DashboardTodayInfo } from '../../../types/dashboard';
import { Loader2 } from 'lucide-react';

type TimerState = {
    isActive: boolean;
    workedSeconds: number;
    anchorTimestamp: number | null;
};

const DEFAULT_TIMER_STATE: TimerState = {
    isActive: false,
    workedSeconds: 0,
    anchorTimestamp: null
};

const computeElapsedSeconds = (state: TimerState, referenceTime = Date.now()): number => {
    if (!state.isActive || !state.anchorTimestamp) {
        return state.workedSeconds;
    }

    const delta = Math.max(0, Math.floor((referenceTime - state.anchorTimestamp) / 1000));
    return state.workedSeconds + delta;
};

const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
};

const TODAY_UPDATED_EVENT = 'dashboard:today-updated';
const PRESENCE_STATUS_UPDATED_EVENT = 'presence:status-updated';

const applyTodaySnapshot = (snapshot?: DashboardTodayInfo | null): TimerState => {
    const isCheckedIn = Boolean(snapshot?.isCheckedIn);
    const workedSecondsRaw = Number(snapshot?.workedSeconds ?? 0);
    const workedSeconds = Number.isFinite(workedSecondsRaw) ? Math.max(0, Math.floor(workedSecondsRaw)) : 0;

    return {
        isActive: isCheckedIn,
        workedSeconds,
        anchorTimestamp: isCheckedIn ? Date.now() : null
    };
};

const CheckInToggle: React.FC = () => {
    const [timerState, setTimerState] = React.useState<TimerState>(DEFAULT_TIMER_STATE);
    const [displaySeconds, setDisplaySeconds] = React.useState(0);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        const loadToday = async () => {
            try {
                const response = await dashboardService.getToday();
                if (!mounted || !response.success) return;

                const nextState = applyTodaySnapshot(response.result);
                setTimerState(nextState);
                setDisplaySeconds(computeElapsedSeconds(nextState));
            } catch (error) {
                console.error('Failed to load today info for check-in toggle:', error);
            }
        };

        void loadToday();

        return () => {
            mounted = false;
        };
    }, []);

    // Drive the ticking display while the timer is active
    React.useEffect(() => {
        if (!timerState.isActive || !timerState.anchorTimestamp) {
            setDisplaySeconds(timerState.workedSeconds);
            return;
        }

        const updateDisplay = () => {
            setDisplaySeconds(computeElapsedSeconds(timerState));
        };

        updateDisplay();

        const intervalId = setInterval(updateDisplay, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, [timerState]);

    const toggleTimer = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = timerState.isActive
                ? await dashboardService.checkOut()
                : await dashboardService.checkIn();

            if (!response.success) {
                return;
            }

            const nextState = applyTodaySnapshot(response.result);
            setTimerState(nextState);
            setDisplaySeconds(computeElapsedSeconds(nextState));

            window.dispatchEvent(new CustomEvent(TODAY_UPDATED_EVENT, {
                detail: response.result
            }));

            // Update user status: Active (2) when checked in, Away (3) when checked out
            try {
                const statusCode = nextState.isActive ? 2 : 3;
                await presenceService.setStatus(statusCode);
                window.dispatchEvent(new CustomEvent(PRESENCE_STATUS_UPDATED_EVENT, {
                    detail: { statusCode }
                }));
            } catch (statusError) {
                console.error('Failed to update presence status after toggle:', statusError);
            }
        } catch (error) {
            console.error('Failed to update check-in state:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                id="check-in-toggle"
                onClick={toggleTimer}
                disabled={isSubmitting}
                className={cn(
                    'relative w-10 h-6 rounded-full transition-colors duration-300 cursor-pointer',
                    isSubmitting && 'opacity-70 cursor-not-allowed',
                    timerState.isActive ? 'bg-[#008080]' : 'bg-gray-300'
                )}
            >
                <span
                    className={cn(
                        'absolute top-1/2 -translate-y-1/2 left-0 w-3 h-3 bg-white rounded-full transition-transform duration-300 flex items-center justify-center',
                        timerState.isActive ? 'translate-x-5' : 'translate-x-1'
                    )}
                >
                    {isSubmitting && (
                        <Loader2 className="w-2 h-2 animate-spin text-[#008080]" />
                    )}
                </span>
            </button>

            <label htmlFor="check-in-toggle" className="flex items-center gap-2.5 text-base font-semibold cursor-pointer">
                {timerState.isActive ? 'IN' : 'OUT'}
                <div className={cn('flex items-center justify-between min-w-[105px]', timerState.isActive ? 'text-[#008080]' : 'text-black')}>
                    <span>{formatTime(displaySeconds)}</span>
                    <span>Hrs</span>
                </div>
            </label>
        </div>
    );
};

export default CheckInToggle;
