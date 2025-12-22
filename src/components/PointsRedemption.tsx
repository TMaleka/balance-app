import { useState, useEffect } from 'react';
import { Gift, DollarSign, ArrowRight, CheckCircle, XCircle, Loader2, History } from 'lucide-react';
import { 
  processRedemption, 
  getUserRedemptionHistory, 
  getRedemptionOptions,
  calculateCashValue,
  calculatePointsNeeded,
  REDEMPTION_CONFIG,
  RedemptionResponse,
  RedemptionHistory
} from '../api/pointsRedemption';
import { supabase } from '../supabaseClient';

interface PointsRedemptionProps {
  userId: string;
  currentPoints: number;
  onPointsUpdated: (newBalance: number) => void;
}

export default function PointsRedemption({ userId, currentPoints, onPointsUpdated }: PointsRedemptionProps) {
  const [activeTab, setActiveTab] = useState<'redeem' | 'history'>('redeem');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RedemptionResponse | null>(null);
  const [redemptionHistory, setRedemptionHistory] = useState<RedemptionHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const redemptionOptions = getRedemptionOptions(currentPoints);
  const minCashback = calculateCashValue(REDEMPTION_CONFIG.MIN_REDEMPTION_POINTS);
  const maxCashback = calculateCashValue(Math.min(currentPoints, REDEMPTION_CONFIG.MAX_REDEMPTION_POINTS));

  useEffect(() => {
    if (activeTab === 'history') {
      loadRedemptionHistory();
    }
  }, [activeTab, userId]);

  const loadRedemptionHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await getUserRedemptionHistory(userId);
      setRedemptionHistory(history);
    } catch (error) {
      console.error('Error loading redemption history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRedemption = async () => {
    let pointsToRedeem = 0;

    if (selectedOption === 'custom') {
      const cashAmount = parseFloat(customAmount);
      if (!cashAmount || cashAmount < minCashback || cashAmount > maxCashback) {
        nedbank-alert(`Please enter an amount between R${minCashback} and R${maxCashback.toFixed(2)}`);
        return;
      }
      pointsToRedeem = calculatePointsNeeded(cashAmount);
    } else {
      const option = redemptionOptions.find(opt => opt.title === selectedOption);
      if (!option) {
        nedbank-alert('Please select a redemption option');
        return;
      }
      pointsToRedeem = option.pointsRequired;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const response = await processRedemption({
        userId,
        pointsToRedeem,
        redemptionType: 'cashback',
        metadata: {
          selectedOption,
          customAmount: selectedOption === 'custom' ? customAmount : undefined
        }
      });

      setResult(response);

      if (response.success && response.newBalance !== undefined) {
        // Update parent component with new balance
        onPointsUpdated(response.newBalance);
        
        // Clear form
        setSelectedOption('');
        setCustomAmount('');
        
        // Refresh history if it's loaded
        if (activeTab === 'history') {
          setTimeout(() => loadRedemptionHistory(), 1000);
        }
      }

    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Redemption failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (currentPoints < REDEMPTION_CONFIG.MIN_REDEMPTION_POINTS) {
    return (
      <div className="amex-card" style={{ padding: 'var(--amex-space-8)' }}>
        <div className="amex-text-center">
          <div style={{ width: '64px', height: '64px', background: 'var(--amex-gray-100)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--amex-space-4)' }}>
            <Gift style={{ width: '32px', height: '32px', color: 'var(--amex-gray-400)' }} />
          </div>
          <h3 className="amex-card-title" style={{ marginBottom: 'var(--amex-space-2)' }}>Not Enough Points</h3>
          <p className="amex-card-subtitle" style={{ marginBottom: 'var(--amex-space-4)' }}>
            You need at least {REDEMPTION_CONFIG.MIN_REDEMPTION_POINTS} points (R{minCashback}) to redeem cashback
          </p>
          <div style={{ padding: 'var(--amex-space-4)', background: 'var(--amex-blue-light)', borderRadius: 'var(--amex-radius-md)' }}>
            <p style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-blue)' }}>
              <strong>Current Balance:</strong> {currentPoints} points<br/>
              <strong>Need:</strong> {REDEMPTION_CONFIG.MIN_REDEMPTION_POINTS - currentPoints} more points
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="amex-card">
        <div className="amex-text-center">
          <div style={{ width: '64px', height: '64px', background: 'var(--amex-green-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--amex-space-4)' }}>
            <Gift style={{ width: '32px', height: '32px', color: 'var(--amex-green)' }} />
          </div>
          <h3 className="amex-card-title" style={{ marginBottom: 'var(--amex-space-2)' }}>Redeem Points</h3>
          <p className="amex-card-subtitle">Convert your points to cashback</p>
        </div>

        {/* Balance Display */}
        <div style={{ marginTop: 'var(--amex-space-6)', padding: 'var(--amex-space-4)', background: 'var(--amex-gray-50)', borderRadius: 'var(--amex-radius-md)' }}>
          <div className="amex-text-center">
            <p className="amex-label" style={{ marginBottom: 'var(--amex-space-1)' }}>Available Balance</p>
            <p style={{ fontSize: 'var(--amex-font-size-2xl)', fontWeight: 'var(--amex-font-weight-bold)', color: 'var(--amex-blue)', marginBottom: 'var(--amex-space-1)' }}>{currentPoints.toLocaleString()} points</p>
            <p className="amex-card-subtitle">≈ R{calculateCashValue(currentPoints).toFixed(2)} cashback</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 'var(--amex-space-2)', marginTop: 'var(--amex-space-6)', padding: 'var(--amex-space-1)', background: 'var(--amex-gray-100)', borderRadius: 'var(--amex-radius-md)' }}>
          <button
            onClick={() => setActiveTab('redeem')}
            style={{
              flex: 1,
              padding: 'var(--amex-space-2) var(--amex-space-4)',
              borderRadius: 'var(--amex-radius-md)',
              fontSize: 'var(--amex-font-size-sm)',
              fontWeight: 'var(--amex-font-weight-medium)',
              transition: 'all var(--amex-transition-base)',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'redeem' ? 'var(--amex-white)' : 'transparent',
              color: activeTab === 'redeem' ? 'var(--amex-gray-900)' : 'var(--amex-gray-600)',
              boxShadow: activeTab === 'redeem' ? 'var(--amex-shadow-sm)' : 'none'
            }}
          >
            Redeem
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: 'var(--amex-space-2) var(--amex-space-4)',
              borderRadius: 'var(--amex-radius-md)',
              fontSize: 'var(--amex-font-size-sm)',
              fontWeight: 'var(--amex-font-weight-medium)',
              transition: 'all var(--amex-transition-base)',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'history' ? 'var(--amex-white)' : 'transparent',
              color: activeTab === 'history' ? 'var(--amex-gray-900)' : 'var(--amex-gray-600)',
              boxShadow: activeTab === 'history' ? 'var(--amex-shadow-sm)' : 'none'
            }}
          >
            History
          </button>
        </div>
      </div>

      {/* Redemption Tab */}
      {activeTab === 'redeem' && (
        <div className="amex-card">
          {/* Preset Options */}
          <div style={{ marginBottom: 'var(--amex-space-6)' }}>
            <label className="amex-label" style={{ marginBottom: 'var(--amex-space-3)', display: 'block' }}>
              Quick Cashback
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--amex-space-3)' }}>
              {redemptionOptions.filter(opt => opt.type === 'cashback').slice(0, 4).map((option) => (
                <button
                  key={option.title}
                  onClick={() => {
                    setSelectedOption(option.title);
                    setCustomAmount('');
                  }}
                  style={{
                    padding: 'var(--amex-space-4)',
                    borderRadius: 'var(--amex-radius-lg)',
                    border: `2px solid ${selectedOption === option.title ? 'var(--amex-blue)' : 'var(--amex-gray-300)'}`,
                    background: selectedOption === option.title ? 'var(--amex-blue-light)' : 'var(--amex-white)',
                    transition: 'all var(--amex-transition-base)',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <p style={{ fontSize: 'var(--amex-font-size-base)', fontWeight: 'var(--amex-font-weight-semibold)', color: 'var(--amex-gray-900)', marginBottom: 'var(--amex-space-1)' }}>{option.title}</p>
                  <p style={{ fontSize: 'var(--amex-font-size-xs)', color: 'var(--amex-gray-600)' }}>{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div style={{ marginBottom: 'var(--amex-space-6)' }}>
            <label className="amex-label" style={{ marginBottom: 'var(--amex-space-3)', display: 'block' }}>
              Custom Amount
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 'var(--amex-space-4)', top: '50%', transform: 'translateY(-50%)', color: 'var(--amex-gray-600)', fontSize: 'var(--amex-font-size-lg)', fontWeight: 'var(--amex-font-weight-semibold)' }}>R</span>
              <input
                type="number"
                step="0.01"
                min={minCashback}
                max={maxCashback}
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedOption('custom');
                }}
                placeholder={`${minCashback} - ${maxCashback.toFixed(2)}`}
                className="amex-input"
                style={{ paddingLeft: 'calc(var(--amex-space-4) + 20px)', fontSize: 'var(--amex-font-size-lg)' }}
              />
            </div>
            {customAmount && (
              <p className="amex-card-subtitle" style={{ marginTop: 'var(--amex-space-2)' }}>
                Requires {calculatePointsNeeded(parseFloat(customAmount)).toLocaleString()} points
              </p>
            )}
          </div>

          {/* Redeem Button */}
          <button
            onClick={handleRedemption}
            disabled={isProcessing || (!selectedOption && !customAmount)}
            className="amex-btn amex-btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--amex-space-2)', marginBottom: 'var(--amex-space-6)' }}
          >
            {isProcessing ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <DollarSign style={{ width: '16px', height: '16px' }} />
                <span>Redeem Points</span>
              </>
            )}
          </button>

          {/* Redemption Info */}
          <div style={{ padding: 'var(--amex-space-4)', background: 'var(--amex-blue-light)', borderRadius: 'var(--amex-radius-md)', border: `1px solid var(--amex-blue)` }}>
            <h4 style={{ fontSize: 'var(--amex-font-size-base)', fontWeight: 'var(--amex-font-weight-semibold)', color: 'var(--amex-blue)', marginBottom: 'var(--amex-space-2)' }}>How it works:</h4>
            <ul style={{ fontSize: 'var(--amex-font-size-sm)', color: 'var(--amex-blue)', listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: 'var(--amex-space-1)' }}>• {REDEMPTION_CONFIG.POINTS_PER_RAND} points = R1.00 cashback</li>
              <li style={{ marginBottom: 'var(--amex-space-1)' }}>• Minimum redemption: R{minCashback}</li>
              <li style={{ marginBottom: 'var(--amex-space-1)' }}>• Cashback processed instantly</li>
              <li>• No processing fees</li>
            </ul>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="amex-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--amex-space-2)', marginBottom: 'var(--amex-space-4)' }}>
            <History style={{ width: '20px', height: '20px', color: 'var(--amex-blue)' }} />
            <h4 className="amex-card-title">Redemption History</h4>
          </div>

          {isLoadingHistory ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Loading history...</p>
            </div>
          ) : redemptionHistory.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No redemptions yet</p>
              <p className="text-xs text-gray-400">Your cashback history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {redemptionHistory.map((redemption) => (
                <div key={redemption.id} className="p-3">
                  <div className="-1">
                    <div className="space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium">
                        R{redemption.redemptionValue.toFixed(2)} Cashback
                      </span>
                    </div>
                    <p className="nedbank-text-small">
                      {redemption.pointsRedeemed.toLocaleString()} points • {formatDate(redemption.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      redemption.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {redemption.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className={`rounded-2xl p-6 shadow-sm border ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="space-x-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <h3 className={`text-lg font-medium ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {result.success ? 'Redemption Successful!' : 'Redemption Failed'}
            </h3>
          </div>

          {result.success ? (
            <div className="space-y-2">
              <p className="text-green-700">
                <strong>Cashback:</strong> R{result.cashValue?.toFixed(2)}
              </p>
              <p className="text-green-700">
                <strong>Points Used:</strong> {result.pointsRedeemed?.toLocaleString()}
              </p>
              <p className="text-green-700">
                <strong>New Balance:</strong> {result.newBalance?.toLocaleString()} points
              </p>
              {result.details && (
                <p className="text-sm text-green-600">{result.details}</p>
              )}
            </div>
          ) : (
            <p className="text-red-700">{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}

