// src/components/Project/TaskStatusChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../UI/Card';

interface TaskStatusChartProps {
  data: { name: string; count: number }[];
  height?: number;
}

const COLORS = {
  'To-Do': '#60A5FA', // blue-400
  'Working': '#FACC15', // yellow-400
  'On Hold': '#9CA3AF', // gray-400
  'Done': '#34D399', // emerald-400
};

function TaskStatusChart({ data, height = 250 }: TaskStatusChartProps) {
  const { theme } = useTheme();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`
          ${theme.cardBg} border ${theme.borderColor} rounded-lg p-3 shadow-lg
        `}>
          <p className={`${theme.textPrimary} font-medium mb-1`}>{label}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            {payload[0].name}: {payload[0].value} tasks
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-4">
      <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Task Status Breakdown</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.borderColor} />
          <XAxis dataKey="name" stroke={theme.textMuted} />
          <YAxis stroke={theme.textMuted} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="count" name="Tasks" fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default TaskStatusChart;
