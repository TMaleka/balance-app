import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';

interface DataTestProps {
  session: Session | null;
}

const DataTest: React.FC<DataTestProps> = ({ session }) => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!session) {
        setError("No session found. Please log in.");
        return;
      }

      setError(null);
      setData("Loading...");

      try {
        // The most basic query possible: Get the 10 most recent expenses.
        const { data: expenses, error: fetchError } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (fetchError) {
          console.error('Supabase error:', fetchError);
          setError(`Database Error: ${fetchError.message}`);
        } else {
          setData(expenses);
        }
      } catch (e: any) {
        console.error('Unexpected error:', e);
        setError(`Unexpected Error: ${e.message}`);
      }
    };

    fetchData();
  }, [session]);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
      <h2>Database Connection Test</h2>
      <p>This component attempts to fetch the 10 most recent expenses for your user.</p>
      <hr />
      <h3>Result:</h3>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {data && <div>{JSON.stringify(data, null, 2)}</div>}
    </div>
  );
};

export default DataTest;

