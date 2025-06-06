'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CallDataProps {
  clientId: number;
  startDate: string;
  endDate: string;
}

const CallData: React.FC<CallDataProps> = ({ clientId, startDate, endDate }) => {
  const [engageRate, setEngageRate] = useState<string>('Loading...');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEngageRate = async () => {
      setLoading(true);
      try {
        const { data: rows, error } = await supabase
          .from('hmstr_ai_data')
          .select('human_engaged')
          .eq('client_id', clientId)
          .gte('action_date', startDate)
          .lte('action_date', endDate);

        if (error) {
          console.error('Error fetching engage rate:', error);
          setEngageRate('Error');
          return;
        }

        if (!rows || rows.length === 0) {
          setEngageRate('No data');
          return;
        }

        const total = rows.length;
        const engaged = rows.filter((row) => row.human_engaged === true).length;
        const rate = ((engaged / total) * 100).toFixed(2);
        setEngageRate(`${rate}%`);
      } catch (err) {
        console.error('Unexpected error:', err);
        setEngageRate('Error');
      } finally {
        setLoading(false);
      }
    };

    fetchEngageRate();
  }, [clientId, startDate, endDate]);

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <h2 className="text-xl font-semibold mb-2">Call Data</h2>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <p>
          <strong>Human Engage Rate:</strong>{' '}
          <span className="font-bold text-blue-700">{engageRate}</span>
        </p>
      )}
    </div>
  );
};

export default CallData;
