// src/components/Project/MilestoneStatusChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../UI/Card';

interface MilestoneStatusChartProps {
  data: { name: string; count: number }[];
  height?: number;
}

const COLORS = {
  'Planned': '#60A5FA', // blue-400
  'Achieved': '#34D399', // emerald-400
  'Delayed': '#FACC15', // yellow-400
  'Cancelled': '#9CA3AF', // gray-400
};

function MilestoneStatusChart({ data, height = 250 }: MilestoneStatusChartProps) {
  const { theme } = useTheme();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`
          ${theme.cardBg} border ${theme.borderColor} rounded-lg p-3 shadow-lg
        `}>
          <p className={`${theme.textPrimary} font-medium mb-1`}>{payload[0].name}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            {payload[0].value} milestones
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-4">
      <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Milestone Status Breakdown</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default MilestoneStatusChart;
