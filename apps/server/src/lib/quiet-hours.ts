/**
 * Overnight "quiet hours" for background BullMQ processing (Asia/Kolkata).
 * Between QUIET_START and QUIET_END, workers are paused so no background jobs
 * run overnight; queued work drains in the morning. Single source of truth so
 * the worker scheduler and the attendance enqueue gate stay consistent.
 */
const QUIET_START_HOUR = 21; // 21:00 IST
const QUIET_END_HOUR = 7; // 07:00 IST

function kolkataHour(date: Date = new Date()): number {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getHours();
}

export function isQuietHours(date: Date = new Date()): boolean {
  const hour = kolkataHour(date);
  return hour >= QUIET_START_HOUR || hour < QUIET_END_HOUR;
}

// Fee alerts are held to slightly after the end of quiet hours rather than
// landing the instant the workers resume at 07:00.
const QUIET_PUSH_RESUME_HOUR = 8;

/**
 * Milliseconds to delay a push so it lands after quiet hours. Returns 0 when
 * it is fine to send now. Both operands stay in the same synthetic IST frame so
 * the delta is correct regardless of the host machine's timezone.
 */
export function msUntilQuietEnds(date: Date = new Date()): number {
  if (!isQuietHours(date)) return 0;
  const istNow = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const resumeAt = new Date(istNow);
  if (istNow.getHours() >= QUIET_START_HOUR) resumeAt.setDate(resumeAt.getDate() + 1);
  resumeAt.setHours(QUIET_PUSH_RESUME_HOUR, 0, 0, 0);
  return Math.max(0, resumeAt.getTime() - istNow.getTime());
}
