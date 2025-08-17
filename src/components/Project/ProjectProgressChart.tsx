// src/components/Project/ProjectProgressChart.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../UI/Card';

interface ProjectProgressChartProps {
  completedPercentage: number;
  height?: number;
}

const COLORS = ['#5DBF99', '#FF6B6B']; // Green for completed, Red for remaining

function ProjectProgressChart({ completedPercentage, height = 200 }: ProjectProgressChartProps) {
  const { theme } = useTheme();

  const data = [
    { name: 'Completed', value: completedPercentage },
    { name: 'Remaining', value: 100 - completedPercentage },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`
          ${theme.cardBg} border ${theme.borderColor} rounded-lg p-3 shadow-lg
        `}>
          <p className={`${theme.textPrimary} font-medium mb-1`}>{payload[0].name}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-4">
      <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>Project Progress</h3>
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
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default ProjectProgressChart;
