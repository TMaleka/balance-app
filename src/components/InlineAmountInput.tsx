import React, { useState } from 'react';
import { X } from 'lucide-react';

interface InlineAmountInputProps {
  title: string;
  currentValue: number;
  onSave: (amount: number) => void;
  onClose: () => void;
}

export default function InlineAmountInput({ title, currentValue, onSave, onClose }: InlineAmountInputProps) {
  const [value, setValue] = useState(currentValue > 0 ? String(currentValue) : '');

  const handleSubmit = () => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    onSave(num);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          animation: 'fadeIn 200ms ease',
        }}
      />
      <div
        style={{
          position: 'relative',
          background: 'var(--amex-white)',
          borderRadius: 'var(--amex-radius-2xl) var(--amex-radius-2xl) 0 0',
          padding: 'var(--amex-space-6)',
          animation: 'slideUp 250ms ease',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--amex-space-4)' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--amex-gray-300)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--amex-space-5)' }}>
          <h2 style={{ fontSize: 'var(--amex-font-size-xl)', fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-gray-900)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--amex-gray-100)', border: 'none', cursor: 'pointer' }}
          >
            <X style={{ width: '18px', height: '18px', color: 'var(--amex-gray-600)' }} />
          </button>
        </div>

        {/* Amount Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--amex-space-6) 0',
        }}>
          <span style={{ fontSize: 'var(--amex-font-size-3xl)', fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-gray-400)', marginRight: 'var(--amex-space-2)' }}>R</span>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0.00"
            autoFocus
            step="0.01"
            min="0"
            style={{
              fontSize: '3rem',
              fontWeight: 'var(--amex-font-weight-bold)',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              width: '200px',
              textAlign: 'center',
              fontFamily: 'var(--amex-font-family)',
              color: 'var(--amex-gray-900)',
            }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!value || parseFloat(value) < 0}
          className="amex-btn amex-btn-primary"
          style={{
            width: '100%',
            opacity: (!value || parseFloat(value) < 0) ? 0.5 : 1,
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
