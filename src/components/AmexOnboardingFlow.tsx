import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Eye, RefreshCw } from 'lucide-react';
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

const TOTAL_STEPS = 5;

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
  const [fade, setFade] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Step 1 state — About You (intent + spend range combined)
  const [intents, setIntents] = useState<string[]>([]);
  const [spendRange, setSpendRange] = useState<string | null>(null);

  // Step 2 state — Your Budget (categories + editable budgets)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Groceries', 'Transport', 'Bills', 'Eating Out', 'Personal',
  ]);
  const [budgets, setBudgets] = useState<Omit<Budget, 'id' | 'spent'>[]>([]);
  const [showBudgets, setShowBudgets] = useState(false);

  const spendMidpoint = SPEND_RANGES.find(r => r.id === spendRange)?.midpoint || 7500;

  // Scroll content to top on step change
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0);
  }, [step]);

  const toggleIntent = (id: string) => {
    setIntents(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 2 ? [...prev, id] : prev
    );
  };

  const toggleCategory = (name: string) => {
    setSelectedCategories(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
    setShowBudgets(false);
  };

  const genBudgets = () => {
    setBudgets(generateBudgets(selectedCategories, spendMidpoint));
    setShowBudgets(true);
  };

  const animateTo = (next: number) => {
    setFade(false);
    setTimeout(() => {
      setStep(next);
      setFade(true);
    }, 150);
  };

  const handleNext = () => {
    // Persist intent + range to localStorage before leaving step 1
    if (step === 1) {
      try {
        localStorage.setItem('balance_onboarding_intent', JSON.stringify(intents));
        localStorage.setItem('balance_onboarding_spend_range', spendRange || '');
      } catch { /* localStorage unavailable */ }
    }
    // Generate budgets when entering step 2 if not yet generated
    if (step === 1 && !showBudgets) {
      setBudgets(generateBudgets(selectedCategories, spendMidpoint));
      setShowBudgets(true);
    }
    if (step < TOTAL_STEPS - 1) {
      animateTo(step + 1);
    } else {
      onComplete(budgets);
    }
  };

  const handleBack = () => {
    if (step > 0) animateTo(step - 1);
  };

  const handleSkip = () => {
    // Skip directly to completion with default budgets
    const defaults = generateBudgets(selectedCategories, spendMidpoint);
    setBudgets(defaults);
    onComplete(defaults);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return intents.length > 0 && spendRange !== null;
      case 2: return selectedCategories.length >= 3 && budgets.length > 0;
      default: return true;
    }
  };

  const ctaLabel = (): string => {
    switch (step) {
      case 0: return 'Get started';
      case 1: return 'Continue';
      case 2: return showBudgets ? 'Looks good' : 'Generate my budget';
      case 3: return 'I\u2019m ready';
      case 4: return 'Start using Balance';
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
    <div style={{ textAlign: 'center', marginBottom: 'var(--amex-space-6)' }}>
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

      // 1 — About You (intent + spend range on one screen)
      case 1:
        return (
          <div style={{ flex: 1 }}>
            {heading('Tell us about you')}
            <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)', fontFamily: 'var(--amex-font-family)', marginBottom: 'var(--amex-space-3)' }}>
              What do you want help with? <span style={{ color: 'var(--amex-gray-400)' }}>(pick 1\u20132)</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-2)', marginBottom: 'var(--amex-space-6)' }}>
              {INTENT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => toggleIntent(opt.id)} style={chip(intents.includes(opt.id))}>{opt.label}</button>
              ))}
            </div>
            <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)', fontFamily: 'var(--amex-font-family)', marginBottom: 'var(--amex-space-3)' }}>
              Rough monthly spending?
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--amex-space-2)' }}>
              {SPEND_RANGES.map(r => (
                <button key={r.id} onClick={() => setSpendRange(r.id)} style={chip(spendRange === r.id)}>{r.label}</button>
              ))}
            </div>
          </div>
        );

      // 2 — Your Budget (categories + auto-generated editable budgets)
      case 2:
        return (
          <div style={{ flex: 1 }}>
            {heading('Set up your budget', 'Pick categories, then review your plan')}
            <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)', fontFamily: 'var(--amex-font-family)', marginBottom: 'var(--amex-space-3)' }}>
              Where does most of your money go? <span style={{ color: 'var(--amex-gray-400)' }}>(3\u20135)</span>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--amex-space-2)', marginBottom: 'var(--amex-space-2)' }}>
              {ALL_CATEGORIES.map(c => (
                <button key={c.name} onClick={() => toggleCategory(c.name)} style={chip(selectedCategories.includes(c.name))}>{c.name}</button>
              ))}
            </div>
            <p style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-400)', marginBottom: 'var(--amex-space-4)', fontFamily: 'var(--amex-font-family)' }}>
              {selectedCategories.length} selected
            </p>

            {!showBudgets && selectedCategories.length >= 3 && (
              <button onClick={genBudgets} className="amex-btn amex-btn-secondary" style={{ width: '100%', marginBottom: 'var(--amex-space-4)' }}>
                Generate my budget
              </button>
            )}

            {showBudgets && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-3)' }}>
                  {budgets.map((b, i) => (
                    <div key={i} className="amex-card" style={{ padding: 'var(--amex-space-3) var(--amex-space-4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 'var(--amex-font-size-sm)', fontWeight: 600, color: 'var(--amex-gray-900)', fontFamily: 'var(--amex-font-family)' }}>{b.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-2)' }}>
                          <span style={{ color: 'var(--amex-gray-500)', fontFamily: 'var(--amex-font-family)', fontSize: 'var(--amex-font-size-sm)' }}>R</span>
                          <input
                            type="number"
                            value={b.budget}
                            onChange={(e) => {
                              const u = [...budgets];
                              u[i] = { ...u[i], budget: parseInt(e.target.value) || 0 };
                              setBudgets(u);
                            }}
                            className="amex-input"
                            style={{ width: '90px', textAlign: 'right', padding: 'var(--amex-space-2)' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 'var(--amex-space-3)', padding: 'var(--amex-space-2)', background: 'var(--amex-blue-light)', borderRadius: 'var(--amex-radius-lg)', textAlign: 'center' }}>
                  <span style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-blue)', fontWeight: 600, fontFamily: 'var(--amex-font-family)' }}>
                    Total: R{budgets.reduce((s, b) => s + b.budget, 0).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        );

      // 3 — How It Works
      case 3:
        return (
          <div style={{ flex: 1 }}>
            {heading('How Balance works')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-5)' }}>
              {[
                { icon: <Eye style={{ width: 24, height: 24, color: 'var(--amex-blue)' }} />, title: 'Check in daily', desc: 'One tap each morning to see where you stand.' },
                { icon: <CheckCircle style={{ width: 24, height: 24, color: 'var(--amex-blue)' }} />, title: 'Log what you spend', desc: 'Add purchases in seconds throughout the day.' },
                { icon: <RefreshCw style={{ width: 24, height: 24, color: 'var(--amex-blue)' }} />, title: 'Restore balance', desc: 'When you overspend, shift budget between categories.' },
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

      // 4 — You're All Set
      case 4:
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0fdf4', border: '3px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--amex-space-6)' }}>
              <CheckCircle style={{ width: 40, height: 40, color: '#16a34a' }} />
            </div>
            <h1 style={{ fontSize: 'var(--amex-font-size-2xl)', fontWeight: 700, color: 'var(--amex-gray-900)', fontFamily: 'var(--amex-font-family)', marginBottom: 'var(--amex-space-3)' }}>
              You&rsquo;re all set
            </h1>
            <p style={{ fontSize: 'var(--amex-font-size-base)', color: 'var(--amex-gray-500)', fontFamily: 'var(--amex-font-family)', lineHeight: 1.6, maxWidth: 300, marginBottom: 'var(--amex-space-6)' }}>
              Your first daily check-in is waiting. It takes less than a minute.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--amex-space-2)', width: '100%', maxWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-3)' }}>
                <CheckCircle style={{ width: 18, height: 18, color: '#16a34a', flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)', fontFamily: 'var(--amex-font-family)' }}>
                  {budgets.length} categories budgeted
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-3)' }}>
                <CheckCircle style={{ width: 18, height: 18, color: '#16a34a', flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)', fontFamily: 'var(--amex-font-family)' }}>
                  R{budgets.reduce((s, b) => s + b.budget, 0).toLocaleString()} monthly plan
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-3)' }}>
                <CheckCircle style={{ width: 18, height: 18, color: '#16a34a', flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-gray-600)', fontFamily: 'var(--amex-font-family)' }}>
                  Daily check-ins ready
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Layout ───

  return (
    <div style={{ minHeight: '100vh', maxHeight: '100vh', background: 'var(--amex-gray-50)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--amex-gray-200)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${(step / (TOTAL_STEPS - 1)) * 100}%`, background: 'var(--amex-blue)', transition: 'width 300ms ease' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--amex-space-6)', maxWidth: 480, width: '100%', margin: '0 auto', overflow: 'hidden' }}>
        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--amex-space-2)', marginBottom: 'var(--amex-space-4)', flexShrink: 0 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i === step ? 'var(--amex-blue)' : i < step ? 'var(--amex-blue-light)' : 'var(--amex-gray-300)',
              transition: 'all 200ms ease',
            }} />
          ))}
        </div>

        {/* Content — scrollable with fade transition */}
        <div
          ref={contentRef}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            opacity: fade ? 1 : 0,
            transition: 'opacity 150ms ease',
          }}
        >
          {renderStep()}
        </div>

        {/* Navigation */}
        <div style={{ flexShrink: 0, marginTop: 'var(--amex-space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--amex-space-4)' }}>
            {step > 0 && (
              <button onClick={handleBack} className="amex-btn amex-btn-secondary" style={{ flex: 1 }}>
                Back
              </button>
            )}
            <button
              onClick={step === 2 && !showBudgets && selectedCategories.length >= 3 ? genBudgets : handleNext}
              disabled={step === 2 && !showBudgets ? selectedCategories.length < 3 : !canProceed()}
              className="amex-btn amex-btn-primary"
              style={{
                flex: step > 0 ? 2 : 1,
                background: 'linear-gradient(135deg, var(--amex-blue) 0%, var(--amex-blue-dark) 100%)',
                opacity: (step === 2 && !showBudgets ? selectedCategories.length >= 3 : canProceed()) ? 1 : 0.5,
                cursor: (step === 2 && !showBudgets ? selectedCategories.length >= 3 : canProceed()) ? 'pointer' : 'not-allowed',
              }}
            >
              {ctaLabel()}
            </button>
          </div>
          {/* Skip link */}
          {step > 0 && step < TOTAL_STEPS - 1 && (
            <button
              onClick={handleSkip}
              style={{
                display: 'block', width: '100%', marginTop: 'var(--amex-space-3)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-400)',
                fontFamily: 'var(--amex-font-family)', textAlign: 'center',
              }}
            >
              Skip setup &amp; use defaults
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
