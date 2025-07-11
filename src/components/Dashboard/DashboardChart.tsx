import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  ResponsiveContainer 
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

interface DashboardChartProps {
  data: any[];
  type: 'bar' | 'pie' | 'line';
  height?: number;
}

const COLORS = ['#5DBF99', '#6AC8A3', '#7AD4B0', '#FF8042', '#FFBB28', '#00C49F', '#0088FE'];

function DashboardChart({ data, type, height = 300 }: DashboardChartProps) {
  const { theme } = useTheme();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`
          ${theme.cardBg} border ${theme.borderColor} rounded-lg p-3 shadow-lg
        `}>
          {label && <p className={`${theme.textPrimary} font-medium mb-1`}>{label}</p>}
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' 
                ? new Intl.NumberFormat('en-IN', { 
                    style: 'currency', 
                    currency: 'INR' 
                  }).format(entry.value)
                : entry.value
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="month" 
            stroke={theme.isDark ? '#94a3b8' : '#64748b'}
            fontSize={12}
          />
          <YAxis 
            stroke={theme.isDark ? '#94a3b8' : '#64748b'}
            fontSize={12}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="income" 
            fill="#5DBF99" 
            name="Income"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="expenses" 
            fill="#FF6B6B" 
            name="Expenses"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="month" 
            stroke={theme.isDark ? '#94a3b8' : '#64748b'}
            fontSize={12}
          />
          <YAxis 
            stroke={theme.isDark ? '#94a3b8' : '#64748b'}
            fontSize={12}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="profit" 
            stroke="#5DBF99" 
            strokeWidth={3}
            dot={{ fill: '#5DBF99', strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8, stroke: '#5DBF99', strokeWidth: 2 }}
            name="Profit"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return null;
}

export default DashboardChart;