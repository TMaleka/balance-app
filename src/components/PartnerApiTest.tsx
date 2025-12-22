import { useState, useEffect, useCallback, useMemo } from 'react';
import { ShoppingCart, CreditCard, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { processPartnerTransaction, PartnerTransactionRequest, TransactionResponse } from '../api/partnerTransactions';
import { supabase } from '../supabaseClient';
import { PartnerListItem } from './PartnerCard';
import { getPartnerApiKey } from '../config/environment';
import { useNotificationHelpers } from './NotificationSystem';
import { safeAsync } from '../utils/errorHandling';
import { cachePartnerData, getCachedPartnerData, cacheUserData, getCachedUserData } from '../utils/caching';
import { usePerformanceMonitor, useDebounce } from '../utils/performance';

interface Partner {
  partner_id: string;
  display_name: string;
  points_rate: number;
  category: string;
}

export default function PartnerApiTest() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [cardId, setCardId] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [saleAmount, setSaleAmount] = useState<string>('100.00');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TransactionResponse | null>(null);
  const { showSuccess, showError, showWarning } = useNotificationHelpers();
  const { measure } = usePerformanceMonitor('PartnerApiTest');
  
  // Debounce sale amount nedbank-input for better UX
  const debouncedSaleAmount = useDebounce(saleAmount, 300);

  useEffect(() => {
    loadPartners();
    loadUserCardId();
  }, []);

  const loadPartners = useCallback(async () => {
    return measure(async () => {
      // Check cache first
      const cachedPartners = getCachedPartnerData<Partner[]>();
      if (cachedPartners) {
        console.log('🚀 Using cached partner data');
        setPartners(cachedPartners);
        return;
      }

      const result = await safeAsync(async () => {
        const { data, error } = await supabase
          .from('partners')
          .select('partner_id, display_name, points_rate, category')
          .eq('is_active', true)
          .order('display_name');

        if (error) {
          throw new Error(`Failed to load partners: ${error.message}`);
        }

        return data || [];
      }, [], 'loadPartners');

      if (result) {
        // Cache partners for 30 minutes
        cachePartnerData(result, 30 * 60 * 1000);
        setPartners(result);
        if (result.length > 0) {
          setSelectedPartner(result[0].partner_id);
        }
      } else {
        showError('Failed to Load Partners', 'Unable to load partner nedbank-list. Please refresh the page.');
      }
    });
  }, [measure, showError]);

  const loadUserCardId = useCallback(async () => {
    const result = await safeAsync(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check cache first
      const cachedUserData = getCachedUserData<{card_id: string, phone_number: string}>(user.id);
      if (cachedUserData) {
        console.log('🚀 Using cached user data');
        return cachedUserData;
      }

      const { data, error } = await supabase
        .from('users')
        .select('card_id, phone_number')
        .eq('id', user.id)
        .single();

      if (error || !data) return null;

      // Cache user data for 10 minutes
      cacheUserData(user.id, data, 10 * 60 * 1000);
      
      return data;
    }, null, 'loadUserCardId');

    if (result) {
      if (result.card_id) {
        setCardId(result.card_id);
      }
      if (result.phone_number) {
        setPhoneNumber(result.phone_number);
      }
    }
  }, []);

  const simulateTransaction = async () => {
    // Validation
    if (!selectedPartner || !saleAmount || (!cardId && !phoneNumber)) {
      showWarning('Missing Information', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(saleAmount);
    if (isNaN(amount) || amount <= 0) {
      showWarning('Invalid Amount', 'Please enter a valid sale amount');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    const transactionResult = await safeAsync(async () => {
      // Generate a unique transaction ID
      const transactionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const request: PartnerTransactionRequest = {
        partnerId: selectedPartner,
        apiKey: getPartnerApiKey(selectedPartner),
        cardId: cardId || undefined,
        phoneNumber: phoneNumber || undefined,
        saleAmount: amount,
        transactionId,
        timestamp: new Date().toISOString(),
        metadata: {
          test: true,
          simulator: 'Balance App Test Interface'
        }
      };

      return await processPartnerTransaction(request);
    }, undefined, 'simulateTransaction');

    setIsProcessing(false);

    if (transactionResult) {
      setResult(transactionResult);
      
      if (transactionResult.success) {
        const partnerName = selectedPartnerInfo?.display_name || 'partner';
        showSuccess(
          'Transaction Successful!', 
          `Earned ${transactionResult.pointsEarned} points from ${partnerName}`
        );
        
        // Refresh loyalty nedbank-card data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showError('Transaction Failed', transactionResult.error || 'Unknown error occurred');
      }
    } else {
      const errorResult: TransactionResponse = {
        success: false,
        error: 'Transaction failed'
      };
      setResult(errorResult);
      showError('Transaction Failed', 'Unable to process transaction. Please try again.');
    }
  };

  const selectedPartnerInfo = partners.find(p => p.partner_id === selectedPartner);

  return (
    <div className="max-w-sm mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="nedbank-card">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-fullmx-auto">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-lightmb-2">Partner Transaction Simulator</h3>
          <p className="text-sm text-gray-500">Test earning points at partner stores</p>
        </div>
      </div>

      {/* Transaction Form */}
      <div className="nedbank-card">
        <div className="">
          {/* Partner Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Select Partner Store
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {partners.map(partner => (
                <PartnerListItem
                  key={partner.partner_id}
                  partnerId={partner.partner_id}
                  displayName={partner.display_name}
                  category={partner.category}
                  pointsRate={partner.points_rate}
                  isSelected={selectedPartner === partner.partner_id}
                  onClick={() => setSelectedPartner(partner.partner_id)}
                />
              ))}
            </div>
          </div>

          {/* Sale Amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Sale Amount (ZAR)
            </label>
            <nedbank-input
              type="number"
              step="0.01"
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
              placeholder="100.00"
              className="w-fulltext-lg font-light-none focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* User Identification */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Card ID
            </label>
            <nedbank-input
              type="text"
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              placeholder="bal_usr_XXXXXXXX"
              className="w-fullfont-mono-none focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="text-center nedbank-text-small">OR</div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Phone Number
            </label>
            <nedbank-input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="082 123 4567"
              className="w-full-none focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {/* Points Preview */}
          {selectedPartnerInfo && saleAmount && (
            <div className="bg-green-50border-green-200">
              <div className="">
                <span className="text-sm text-green-700">Points to earn:</span>
                <span className="font-medium text-green-900">
                  {Math.floor(parseFloat(saleAmount) * selectedPartnerInfo.points_rate)} points
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={simulateTransaction}
            disabled={isProcessing || !selectedPartner || !saleAmount || (!cardId && !phoneNumber)}
            className="w-fullpy-3 px-4font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowedspace-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Process Transaction</span>
              </>
            )}
          </button>
        </div>
      </div>

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
              {result.success ? 'Transaction Successful!' : 'Transaction Failed'}
            </h3>
          </div>

          {result.success ? (
            <div className="space-y-2">
              <p className="text-green-700">
                <strong>Points Earned:</strong> {result.pointsEarned}
              </p>
              <p className="text-green-700">
                <strong>New Balance:</strong> {result.newBalance} points
              </p>
              {result.details && (
                <p className="text-sm text-green-600">{result.details}</p>
              )}
              <p className="text-xs text-green-600">
                Your loyalty nedbank-card will refresh automatically...
              </p>
            </div>
          ) : (
            <p className="text-red-700">{result.error}</p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">How to Test:</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Select a partner store</li>
          <li>2. Enter a sale amount (e.g., 100.00)</li>
          <li>3. Your nedbank-card ID should auto-fill</li>
          <li>4. Click "Process Transaction"</li>
          <li>5. Watch your points increase!</li>
        </ol>
      </div>
    </div>
  );
}

