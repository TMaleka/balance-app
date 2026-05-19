/**
 * Beta Event Tracking — writes key behavioral events to Supabase
 * so we can query them across users/devices after the beta.
 *
 * Also stores locally as a fallback if Supabase is unreachable.
 */

import { supabase } from '../supabaseClient';

// ─── Types ───

type BetaEvent =
  | 'onboarding_started'
  | 'onboarding_step'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  | 'first_expense'
  | 'expense_added'
  | 'first_checkin'
  | 'checkin_completed'
  | 'overspend_triggered'
  | 'fixit_shown'
  | 'fixit_completed'
  | 'fixit_dismissed'
  | 'rebalance_completed'
  | 'session_start'
  | 'session_end'
  | 'churn_risk'
  | 'app_crash'
  | 'reset_account';

interface TrackOptions {
  properties?: Record<string, any>;
  userId?: string;
}

// ─── Internal state ───

let _userId: string | undefined;
let _sessionId: string = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
let _sessionStart: number = Date.now();

// ─── Public API ───

export function setBetaUserId(id: string) {
  _userId = id;
}

export function startBetaSession() {
  _sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  _sessionStart = Date.now();
  track('session_start');
}

export function endBetaSession() {
  track('session_end', {
    properties: { duration_sec: Math.round((Date.now() - _sessionStart) / 1000) },
  });
}

/**
 * Main tracking function — fire and forget.
 * Writes to Supabase `beta_events` table; falls back to localStorage.
 */
export function track(event: BetaEvent, opts?: TrackOptions) {
  const row = {
    user_id: opts?.userId || _userId || null,
    session_id: _sessionId,
    event,
    properties: opts?.properties || {},
    created_at: new Date().toISOString(),
  };

  // Fire to Supabase (non-blocking)
  supabase
    .from('beta_events')
    .insert(row)
    .then(({ error }) => {
      if (error) {
        console.warn('[BetaTrack] Supabase insert failed, storing locally:', error.message);
        storeLocally(row);
      }
    })
    .catch(() => {
      storeLocally(row);
    });
}

// ─── Convenience helpers ───

export function trackOnboardingStep(step: number, stepName: string) {
  track('onboarding_step', { properties: { step, step_name: stepName } });
}

export function trackOnboardingComplete(budgetCount: number, totalBudget: number) {
  track('onboarding_completed', {
    properties: { budget_count: budgetCount, total_budget: totalBudget },
  });
}

export function trackExpense(amount: number, category: string, isFirst: boolean) {
  track(isFirst ? 'first_expense' : 'expense_added', {
    properties: { amount, category },
  });
}

export function trackCheckIn(status: 'green' | 'amber' | 'red', streak: number, isFirst: boolean) {
  track(isFirst ? 'first_checkin' : 'checkin_completed', {
    properties: { status, streak },
  });
}

export function trackOverspend(category: string, overAmount: number) {
  track('overspend_triggered', {
    properties: { category, over_amount: overAmount },
  });
}

export function trackFixIt(action: 'shown' | 'completed' | 'dismissed') {
  const eventMap = { shown: 'fixit_shown', completed: 'fixit_completed', dismissed: 'fixit_dismissed' } as const;
  track(eventMap[action]);
}

export function trackChurnRisk(reason: string, daysSinceLastSession?: number) {
  track('churn_risk', { properties: { reason, days_since_last: daysSinceLastSession } });
}

// ─── Local fallback ───

function storeLocally(row: Record<string, any>) {
  try {
    const key = 'balance_beta_events';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(row);
    // Cap at 500 events
    if (existing.length > 500) existing.splice(0, existing.length - 500);
    localStorage.setItem(key, JSON.stringify(existing));
  } catch { /* silent */ }
}

// ─── Flush local events to Supabase (call on reconnect) ───

export async function flushLocalEvents() {
  try {
    const key = 'balance_beta_events';
    const events = JSON.parse(localStorage.getItem(key) || '[]');
    if (events.length === 0) return;

    const { error } = await supabase.from('beta_events').insert(events);
    if (!error) {
      localStorage.removeItem(key);
      console.log(`[BetaTrack] Flushed ${events.length} local events to Supabase`);
    }
  } catch { /* silent */ }
}

// ─── Churn detection (call on session start) ───

export function detectChurnRisk() {
  try {
    const lastSessionKey = 'balance_last_session';
    const lastStr = localStorage.getItem(lastSessionKey);
    const now = Date.now();
    localStorage.setItem(lastSessionKey, String(now));

    if (lastStr) {
      const daysSince = Math.floor((now - Number(lastStr)) / (1000 * 60 * 60 * 24));
      if (daysSince >= 3) {
        trackChurnRisk('inactive', daysSince);
      }
    }
  } catch { /* silent */ }
}
