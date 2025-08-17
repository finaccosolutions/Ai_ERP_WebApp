// src/components/Project/TimeLoggedByEmployeeChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../UI/Card';

interface TimeLoggedByEmployeeChartProps {
  data: { name: string; duration: number }[]; // duration in minutes
  height?: number;
}

const COLORS = ['#5DBF99', '#60A5FA', '#FACC15', '#9CA3AF', '#FF6B6B'];

function TimeLoggedByEmployeeChart({ data, height = 250 }: TimeLoggedByEmployeeChartProps) {
  const { theme } = useTheme();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`
          ${theme.cardBg} border ${theme.borderColor} rounded-lg p-3 shadow-lg
        `}>
          <p className={`${theme.textPrimary} font-medium mb-1`}>{label}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            {payload[0].name}: {payload[0].value} minutes
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-4">
      <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Time Logged by Employee</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.borderColor} />
          <XAxis dataKey="name" stroke={theme.textMuted} />
          <YAxis stroke={theme.textMuted} label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="duration" name="Duration" fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default TimeLoggedByEmployeeChart;
