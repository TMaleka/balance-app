import React, { useState } from 'react';
import { CheckCircle, XCircle, Play } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { generateCardId } from '../utils/loyaltyCardUtils';

export default function QuickTest() {
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
  };

  const runQuickTests = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: Card ID Generation
    addResult('✅ Testing nedbank-card ID generation...');
    const cardId = generateCardId();
    addResult(`✅ Generated nedbank-card ID: ${cardId}`);

    // Test 2: Supabase Configuration
    addResult('🔍 Checking Supabase configuration...');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'Not set';
    const hasAnonKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    addResult(`📍 Supabase URL: ${supabaseUrl}`);
    addResult(`🔑 Anon Key: ${hasAnonKey ? 'Set' : 'Missing'}`);

    // Test 3: Authentication Status
    addResult('🔍 Checking authentication...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        addResult(`✅ User authenticated: ${user.email}`);
      } else {
        addResult('⚠️ No authenticated user');
      }
    } catch (err) {
      addResult(`❌ Auth check failed: ${err}`);
    }

    // Test 4: Database Connection
    addResult('🔍 Testing database connection...');
    try {
      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (error) {
        addResult(`❌ Database error: ${error.message}`);
        addResult('💡 Tip: Run QUICK_SETUP.sql in Supabase SQL Editor');
      } else {
        addResult('✅ Database connection working');
      }
    } catch (err) {
      addResult(`❌ Connection failed: ${err}`);
    }

    // Test 3: Check if loyalty tables exist
    addResult('🔍 Checking loyalty tables...');
    
    // Check partners table
    try {
      const { error } = await supabase.from('partners').select('id').limit(1);
      if (error) {
        addResult(`❌ Partners table missing: ${error.message}`);
      } else {
        addResult('✅ Partners table exists');
      }
    } catch (err) {
      addResult('❌ Partners table not found');
    }

    // Check users table for loyalty columns
    try {
      const { error } = await supabase.from('users').select('card_id, points_balance').limit(1);
      if (error) {
        addResult(`❌ User loyalty columns missing: ${error.message}`);
      } else {
        addResult('✅ User loyalty columns exist');
      }
    } catch (err) {
      addResult('❌ User loyalty columns not found');
    }

    addResult('🎉 Quick test completed!');
    setTesting(false);
  };

  return (
    <div className="max-w-sm mx-autocard">
      <h2 className="nedbank-text-base">Database Quick Test</h2>
      
      <button
        onClick={runQuickTests}
        disabled={testing}
        className="w-full bg-blue-600py-3font-medium hover:bg-blue-700 transition-colors disabled:opacity-50space-x-2"
      >
        <Play className="w-4 h-4" />
        <span>{testing ? 'Testing...' : 'Run Quick Test'}</span>
      </button>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {results.map((result, index) => (
          <div key={index} className="text-sm font-monop-2 rounded">
            {result}
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <p className="text-gray-500 text-sm text-center">
          Click "Run Quick Test" to check database setup
        </p>
      )}
    </div>
  );
}

