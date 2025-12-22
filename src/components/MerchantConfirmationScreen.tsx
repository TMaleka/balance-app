import React, { useState } from 'react';
import { Search, MapPin, CheckCircle } from 'lucide-react';
import { MerchantCandidate } from '../utils/merchantRecognition';

interface MerchantConfirmationScreenProps {
  candidates: MerchantCandidate[];
  amount: number;
  onConfirm: (merchantName: string, amount: number) => void;
  onCancel: () => void;
}

export default function MerchantConfirmationScreen({ 
  candidates, 
  amount, 
  onConfirm, 
  onCancel 
}: MerchantConfirmationScreenProps) {
  const [selectedMerchant, setSelectedMerchant] = useState<string>('');
  const [customMerchant, setCustomMerchant] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [currentAmount, setCurrentAmount] = useState(amount);

  const handleConfirm = () => {
    const finalMerchant = showCustomInput ? customMerchant : selectedMerchant;
    if (finalMerchant.trim()) {
      onConfirm(finalMerchant.trim(), currentAmount);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'keyword': return '🏪';
      case 'database': return '🗄️';
      case 'geolocation': return '📍';
      default: return '📄';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-mdshadow-xl">
        <h2 className="text-2xl font-bold text-center mb-2">Confirm Merchant</h2>
        <p className="text-center">
          Select the correct merchant or add a custom one
        </p>

        {/* Amount Input */}
        <div className="">
          <label htmlFor="amount" className="block text-sm font-mediummb-2">
            Amount
          </label>
          <nedbank-input
            type="number"
            id="amount"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(parseFloat(e.target.value))}
            className="w-full px-4 py-3border-gray-300focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
            step="0.01"
          />
        </div>

        {/* Merchant Candidates */}
        <div className="space-y-3">
          {candidates.map((candidate, index) => (
            <div
              key={index}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedMerchant === candidate.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                setSelectedMerchant(candidate.name);
                setShowCustomInput(false);
              }}
            >
              <div className="">
                <div className="space-x-3">
                  <span className="text-xl">{getSourceIcon(candidate.source)}</span>
                  <div>
                    <p className="font-semibold">{candidate.name}</p>
                    <p className="nedbank-text-small">
                      {Math.round(candidate.confidence * 100)}% confidence • {candidate.source}
                    </p>
                  </div>
                </div>
                {selectedMerchant === candidate.name && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Merchant Option */}
        <div className="">
          <button
            onClick={() => {
              setShowCustomInput(!showCustomInput);
              setSelectedMerchant('');
            }}
            className={`w-full p-4 border-2 rounded-lg transition-all flex items-center justify-center space-x-2 ${
              showCustomInput
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Search className="w-5 h-5" />
            <span>Enter Custom Merchant</span>
          </button>

          {showCustomInput && (
            <div className="mt-3">
              <nedbank-input
                type="text"
                placeholder="Type merchant name..."
                value={customMerchant}
                onChange={(e) => setCustomMerchant(e.target.value)}
                className="w-full px-4 py-3border-gray-300focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-x-3">
          <button
            onClick={onCancel}
            className="-1 px-4 py-3 bg-gray-200 text-gray-800font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedMerchant && !customMerchant.trim()}
            className="-1 px-4 py-3 bg-blue-600font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Confirm
          </button>
        </div>

        {/* Help Text */}
        <p className="nedbank-text-small text-center">
          💡 Your selection helps improve future recognition accuracy
        </p>
      </div>
    </div>
  );
}

