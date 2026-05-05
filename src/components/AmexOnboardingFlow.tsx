import React, { useState } from 'react';
import { CheckCircle, Eye, RefreshCw, Flame, Bell } from 'lucide-react';
import { Budget } from '../types';
import BalanceLogo from '../assets/BalanceLogo';

interface AmexOnboardingFlowProps {
  onComplete: (budgets: Omit<Budget, 'id' | 'spent'>[]) => void;
}

const INTENT_OPTIONS = [
  { id: 'overspend', label: 'I overspend without noticing' },
  { id: 'whereItGoes', label: "I don't know where my money goes" },
  { id: 'save', label: 'I want to save more consistently' },
  { id: 'discipline', label: 'I want better daily discipline' },
];

const SPEND_RANGES = [
  { id: 'under5k', label: '< R5,000', midpoint: 4000 },
  { id: '5to10k', label: 'R5k \u2013 R10k', midpoint: 7500 },
  { id: '10to20k', label: 'R10k \u2013 R20k', midpoint: 15000 },
  { id: 'over20k', label: 'R20k+', midpoint: 25000 },
];

const ALL_CATEGORIES = [
  { name: 'Groceries', weight: 0.28 },
  { name: 'Transport', weight: 0.14 },
  { name: 'Bills', weight: 0.18 },
  { name: 'Eating Out', weight: 0.10 },
  { name: 'Personal', weight: 0.08 },
  { name: 'Shopping', weight: 0.08 },
  { name: 'Airtime & Data', weight: 0.05 },
  { name: 'Entertainment', weight: 0.05 },
  { name: 'Health & Fitness', weight: 0.04 },
];

const MOOD_EMOJIS = [
  { emoji: '\uD83D\uDE30', label: 'Stressed' },
  { emoji: '\uD83D\uDE10', label: 'Unsure' },
  { emoji: '\uD83D\uDE42', label: 'Okay' },
  { emoji: '\uD83D\uDE0A', label: 'Good' },
  { emoji: '\uD83D\uDCAA', label: 'In control' },
];

const TOTAL_STEPS = 9;

function generateBudgets(
  selectedCategories: string[],
  spendMidpoint: number
): Omit<Budget, 'id' | 'spent'>[] {
  const chosen = ALL_CATEGORIES.filter(c => selectedCategories.includes(c.name));
  const totalWeight = chosen.reduce((sum, c) => sum + c.weight, 0);
  return chosen.map(c => ({
    name: c.name,
    budget: Math.round((c.weight / totalWeight) * spendMidpoint / 100) * 100,
  }));
}

export default function AmexOnboardingFlow({ onComplete }: AmexOnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [intents, setIntents] = useState<string[]>([]);
  const [spendRange, setSpendRange] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Groceries', 'Transport', 'Bills', 'Eating Out', 'Personal',
  ]);
  const [budgets, setBudgets] = useState<Omit<Budget, 'id' | 'spent'>[]>([]);
  const [mood, setMood] = useState<number | null>(null);
  const [spentToday, setSpentToday] = useState<boolean | null>(null);
  const [firstAmount, setFirstAmount] = useState('');
  const [firstCategory, setFirstCategory] = useState('');

  const spendMidpoint = SPEND_RANGES.find(r => r.id === spendRange)?.midpoint || 7500;

  const toggleIntent = (id: string) => {
    setIntents(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 2 ? [...prev, id] : prev
    );
  };

  const toggleCategory = (name: string) => {
    setSelectedCategories(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const handleNext = () => {
    if (step === 3) {
      setBudgets(generateBudgets(selectedCategories, spendMidpoint));
    }
    if (step === 4 && budgets.length > 0 && !firstCategory) {
      setFirstCategory(budgets[0].name);
    }
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      onComplete(budgets);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return intents.length > 0;
      case 2: return spendRange !== null;
      case 3: return selectedCategories.length >= 3;
      case 4: return budgets.length > 0;
      case 6: return mood !== null && spentToday !== null;
      default: return true;
    }
  };

  const ctaLabel = (): string => {
    switch (step) {
      case 0: return 'Start in 60 seconds';
      case 4: return 'Looks good';
      case 5: return 'Start my first check-in';
      case 7: return 'Done for today';
      case 8: return "Let's go";
      default: return 'Continue';
    }
  };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: 'var(--amex-space-3) var(--amex-space-5)',
    borderRadius: 'var(--amex-radius-full)',
    border: active ? '2px solid var(--amex-blue)' : '2px solid var(--amex-gray-200)',
    background: active ? 'var(--amex-blue-light)' : 'var(--amex-white)',
    color: active ? 'var(--amex-blue)' : 'var(--amex-gray-700)',
    fontWeight: active ? 600 : 400,
    fontSize: 'var(--amex-font-size-sm)',
    fontFamily: 'var(--amex-font-family)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    textAlign: 'left' as const,
  });

  const heading = (title: string, sub?: string) => (
    <div style={{ textAlign: 'center', marginBottom: 'var(--amex-space-8)' }}>
      <h1 style={{ fontSize: 'var(--amex-font-size-2xl)', fontWeight: 700, color: 'var(--amex-gray-900)', fontFamily: 'var(--amex-font-family)', marginBottom: sub ? 'var(--amex-space-2)' : '0', lineHeight: 1.3 }}>
        {title}
      </h1>
      {sub && <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-500)', fontFamily: 'var(--amex-font-family)', lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );

  // ─── Step renderers ───

  const renderStep = () => {
    switch (step) {
      // 0 — Welcome
      case 0:
        return (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <BalanceLogo size={80} />
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--amex-gray-900)', fontFamily: 'var(--amex-font-family)', marginTop: 'var(--amex-space-6)', lineHeight: 1.3 }}>
              Stay in control of your money&mdash;every single day.
            </h1>
            <p style={{ fontSize: 'var(--amex-font-size-base)', color: 'var(--amex-gray-500)', fontFamily: 'var(--amex-font-family)', marginTop: 'var(--amex-space-4)', lineHeight: 1.6, maxWidth: '320px' }}>
              Not budgets you forget. Small daily decisions that add up.
            </p>
          </div>
        );

      // 1 — Identity + Intent
      case 1:
        return (
          <div style={{ flex: 1 }}>
            {heading('What do you want help with?', 'Select 1\u20132 that resonate most')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-3)' }}>
              {INTENT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => toggleIntent(opt.id)} style={chip(intents.includes(opt.id))}>{opt.label}</button>
              ))}
            </div>
          </div>
        );

      // 2 — Monthly Spend Range
      case 2:
        return (
          <div style={{ flex: 1 }}>
            {heading("What\u2019s your monthly spend range?", 'A rough estimate is perfect')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-3)' }}>
              {SPEND_RANGES.map(r => (
                <button key={r.id} onClick={() => setSpendRange(r.id)} style={chip(spendRange === r.id)}>{r.label}</button>
              ))}
            </div>
          </div>
        );

      // 3 — Core Categories
      case 3:
        return (
          <div style={{ flex: 1 }}>
            {heading('Where does most of your money go?', 'Pick your top 3\u20135 categories')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--amex-space-2)' }}>
              {ALL_CATEGORIES.map(c => (
                <button key={c.name} onClick={() => toggleCategory(c.name)} style={chip(selectedCategories.includes(c.name))}>{c.name}</button>
              ))}
            </div>
            <p style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-400)', marginTop: 'var(--amex-space-4)', textAlign: 'center', fontFamily: 'var(--amex-font-family)' }}>
              {selectedCategories.length} selected
            </p>
          </div>
        );

      // 4 — Budget Suggestion
      case 4:
        return (
          <div style={{ flex: 1 }}>
            {heading("Here\u2019s your starting plan", "This doesn\u2019t need to be perfect. You\u2019ll adjust as you go.")}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-3)' }}>
              {budgets.map((b, i) => (
                <div key={i} className="amex-card" style={{ padding: 'var(--amex-space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--amex-font-size-base)', fontWeight: 600, color: 'var(--amex-gray-900)', fontFamily: 'var(--amex-font-family)' }}>{b.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-2)' }}>
                      <span style={{ color: 'var(--amex-gray-500)', fontFamily: 'var(--amex-font-family)' }}>R</span>
                      <input
                        type="number"
                        value={b.budget}
                        onChange={(e) => {
                          const u = [...budgets];
                          u[i] = { ...u[i], budget: parseInt(e.target.value) || 0 };
                          setBudgets(u);
                        }}
                        className="amex-input"
                        style={{ width: '100px', textAlign: 'right', padding: 'var(--amex-space-2) var(--amex-space-3)' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 'var(--amex-space-4)', padding: 'var(--amex-space-3)', background: 'var(--amex-blue-light)', borderRadius: 'var(--amex-radius-lg)', textAlign: 'center' }}>
              <span style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-blue)', fontWeight: 600, fontFamily: 'var(--amex-font-family)' }}>
                Total: R{budgets.reduce((s, b) => s + b.budget, 0).toLocaleString()}
              </span>
            </div>
          </div>
        );

      // 5 — Behavior Introduction
      case 5:
        return (
          <div style={{ flex: 1 }}>
            {heading('How Balance works')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-5)' }}>
              {[
                { icon: <Eye style={{ width: 24, height: 24, color: 'var(--amex-blue)' }} />, title: 'Check in daily', desc: 'One tap to see where you stand.' },
                { icon: <CheckCircle style={{ width: 24, height: 24, color: 'var(--amex-blue)' }} />, title: 'Track what you spend', desc: 'Log purchases in seconds.' },
                { icon: <RefreshCw style={{ width: 24, height: 24, color: 'var(--amex-blue)' }} />, title: 'Adjust as you go', desc: 'Restore balance when you overspend.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--amex-space-4)' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--amex-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <h4 style={{ fontSize: 'var(--amex-font-size-base)', fontWeight: 600, color: 'var(--amex-gray-900)', fontFamily: 'var(--amex-font-family)', marginBottom: 4 }}>{item.title}</h4>
                    <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-500)', fontFamily: 'var(--amex-font-family)', lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 'var(--amex-space-8)', textAlign: 'center', padding: 'var(--amex-space-4)', background: '#f0fdf4', borderRadius: 'var(--amex-radius-lg)', border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: 'var(--amex-font-size-sm)', color: '#15803d', fontFamily: 'var(--amex-font-family)', fontWeight: 600 }}>
                You don&rsquo;t need to be perfect. Just stay aware.
              </p>
            </div>
          </div>
        );

      // 6 — First Daily Check-In
      case 6:
        return (
          <div style={{ flex: 1 }}>
            {heading("Today\u2019s Check-In", 'Your very first one \u2014 here we go')}
            <div style={{ marginBottom: 'var(--amex-space-6)' }}>
              <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)', fontFamily: 'var(--amex-font-family)', marginBottom: 'var(--amex-space-3)', textAlign: 'center' }}>
                How are you feeling about your money today?
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--amex-space-3)' }}>
                {MOOD_EMOJIS.map((m, i) => (
                  <button key={i} onClick={() => setMood(i)} title={m.label} style={{
                    width: 52, height: 52, borderRadius: '50%', fontSize: 24, cursor: 'pointer',
                    border: mood === i ? '2px solid var(--amex-blue)' : '2px solid var(--amex-gray-200)',
                    background: mood === i ? 'var(--amex-blue-light)' : 'var(--amex-white)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease',
                  }}>{m.emoji}</button>
                ))}
              </div>
              {mood !== null && (
                <p style={{ textAlign: 'center', fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-500)', marginTop: 'var(--amex-space-2)', fontFamily: 'var(--amex-font-family)' }}>
                  {MOOD_EMOJIS[mood].label}
                </p>
              )}
            </div>
            <div style={{ marginBottom: 'var(--amex-space-5)' }}>
              <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)', fontFamily: 'var(--amex-font-family)', marginBottom: 'var(--amex-space-3)', textAlign: 'center' }}>
                Did you spend anything today?
              </p>
              <div style={{ display: 'flex', gap: 'var(--amex-space-3)', justifyContent: 'center' }}>
                <button onClick={() => setSpentToday(true)} style={chip(spentToday === true)}>Yes</button>
                <button onClick={() => setSpentToday(false)} style={chip(spentToday === false)}>No</button>
              </div>
            </div>
            {spentToday && (
              <div className="amex-card" style={{ padding: 'var(--amex-space-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-3)' }}>
                  <div>
                    <label style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-500)', fontFamily: 'var(--amex-font-family)', marginBottom: 4, display: 'block' }}>Amount</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-2)' }}>
                      <span style={{ color: 'var(--amex-gray-500)', fontFamily: 'var(--amex-font-family)' }}>R</span>
                      <input type="number" value={firstAmount} onChange={e => setFirstAmount(e.target.value)} placeholder="0" className="amex-input" style={{ flex: 1 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-500)', fontFamily: 'var(--amex-font-family)', marginBottom: 4, display: 'block' }}>Category</label>
                    <select value={firstCategory} onChange={e => setFirstCategory(e.target.value)} className="amex-input" style={{ width: '100%' }}>
                      {budgets.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // 7 — Instant Feedback
      case 7: {
        const amt = parseFloat(firstAmount) || 0;
        const catBudget = budgets.find(b => b.name === firstCategory);
        const pct = catBudget && catBudget.budget > 0 ? Math.round((amt / catBudget.budget) * 100) : 0;
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0fdf4', border: '3px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--amex-space-6)' }}>
              <CheckCircle style={{ width: 40, height: 40, color: '#16a34a' }} />
            </div>
            <h1 style={{ fontSize: 'var(--amex-font-size-2xl)', fontWeight: 700, color: 'var(--amex-gray-900)', fontFamily: 'var(--amex-font-family)', marginBottom: 'var(--amex-space-3)' }}>
              You&rsquo;re on track
            </h1>
            {spentToday && amt > 0 && catBudget && (
              <div className="amex-card" style={{ padding: 'var(--amex-space-4)', marginBottom: 'var(--amex-space-4)', width: '100%', maxWidth: 300 }}>
                <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)', fontFamily: 'var(--amex-font-family)' }}>
                  You&rsquo;ve used <strong style={{ color: 'var(--amex-blue)' }}>{pct}%</strong> of {firstCategory}
                </p>
                <div style={{ width: '100%', height: 6, background: 'var(--amex-gray-100)', borderRadius: 3, marginTop: 'var(--amex-space-2)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: pct > 80 ? 'var(--amex-red)' : 'var(--amex-blue)', borderRadius: 3, transition: 'width 600ms ease' }} />
                </div>
              </div>
            )}
            <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-500)', fontFamily: 'var(--amex-font-family)', lineHeight: 1.6, maxWidth: 300, marginBottom: 'var(--amex-space-5)' }}>
              Small awareness like this is how control builds.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--amex-space-2)', padding: 'var(--amex-space-2) var(--amex-space-4)', background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)', borderRadius: 'var(--amex-radius-full)', color: 'white' }}>
              <Flame style={{ width: 16, height: 16 }} />
              <span style={{ fontWeight: 700, fontSize: 'var(--amex-font-size-sm)', fontFamily: 'var(--amex-font-family)' }}>Streak: Day 1</span>
            </div>
          </div>
        );
      }

      // 8 — Habit Hook
      case 8:
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--amex-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--amex-space-6)' }}>
              <Bell style={{ width: 32, height: 32, color: 'var(--amex-blue)' }} />
            </div>
            <h1 style={{ fontSize: 'var(--amex-font-size-2xl)', fontWeight: 700, color: 'var(--amex-gray-900)', fontFamily: 'var(--amex-font-family)', marginBottom: 'var(--amex-space-3)' }}>
              Come back tomorrow
            </h1>
            <p style={{ fontSize: 'var(--amex-font-size-base)', color: 'var(--amex-gray-500)', fontFamily: 'var(--amex-font-family)', lineHeight: 1.6, maxWidth: 300, marginBottom: 'var(--amex-space-8)' }}>
              This works if you show up daily. It takes less than a minute.
            </p>
            <button
              onClick={() => {
                if ('Notification' in window && Notification.permission === 'default') {
                  Notification.requestPermission();
                }
              }}
              className="amex-btn amex-btn-secondary"
              style={{ marginBottom: 'var(--amex-space-4)' }}
            >
              <Bell style={{ width: 16, height: 16, display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
              Remind me daily
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Layout ───

  const showBackButton = step > 0 && step <= 5;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--amex-gray-50)', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      {step > 0 && (
        <div style={{ height: 3, background: 'var(--amex-gray-200)' }}>
          <div style={{ height: '100%', width: `${(step / (TOTAL_STEPS - 1)) * 100}%`, background: 'var(--amex-blue)', transition: 'width 300ms ease' }} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--amex-space-6)', maxWidth: 480, width: '100%', margin: '0 auto' }}>
        {/* Step dots */}
        {step > 0 && step <= 5 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--amex-space-2)', marginBottom: 'var(--amex-space-6)' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i + 1 === step ? 'var(--amex-blue)' : i + 1 < step ? 'var(--amex-blue-light)' : 'var(--amex-gray-300)',
                transition: 'all 200ms ease',
              }} />
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {renderStep()}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 'var(--amex-space-4)', marginTop: 'var(--amex-space-6)' }}>
          {showBackButton && (
            <button onClick={handleBack} className="amex-btn amex-btn-secondary" style={{ flex: 1 }}>
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="amex-btn amex-btn-primary"
            style={{
              flex: showBackButton ? 2 : 1,
              background: 'linear-gradient(135deg, var(--amex-blue) 0%, var(--amex-blue-dark) 100%)',
              opacity: canProceed() ? 1 : 0.5,
              cursor: canProceed() ? 'pointer' : 'not-allowed',
            }}
          >
            {ctaLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}
