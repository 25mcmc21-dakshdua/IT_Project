import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

const COLORS = ['#8C82FC', '#4DB6AC', '#FF8A65', '#9575CD', '#F06292', '#81C784', '#64B5F6'];

interface PieChartProps {
  userId: number;
  refreshKey?: number;
}

const ExpensePieChart: React.FC<PieChartProps> = ({ userId, refreshKey }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [userId, refreshKey]);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`/api/analytics/${userId}`);
      setData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  if (!data) return null;

  const chartData = Object.keys(data.categoryBreakdown).map(key => ({
    name: key,
    value: data.categoryBreakdown[key]
  }));

  return (
    <div className="glass-panel" style={{ padding: '24px', minHeight: '350px' }}>
      <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendingUp size={18} /> Expense Breakdown
      </h3>
      {chartData.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>Log some expenses to see your chart.</p>
      ) : (
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [`₹${value}`, 'Amount']}
                contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ExpensePieChart;
