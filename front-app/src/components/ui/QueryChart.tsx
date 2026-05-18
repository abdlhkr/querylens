import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartRecommendResponse, ChartType } from '../../types';

const CHART_COLORS = ['#b8932a', '#3a6ea5', '#16a34a', '#dc2626', '#7c3aed', '#0891b2'];

const CHART_TYPES: ChartType[] = ['bar', 'line', 'area', 'pie'];

interface QueryChartProps {
  recommendation: ChartRecommendResponse;
  data: Record<string, unknown>[];
}

function coerceNumeric(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

const axisStyle = {
  tick: { fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
} as const;

const tooltipStyle = {
  contentStyle: {
    background: '#fff',
    border: '1px solid var(--border-mid)',
    borderRadius: 'var(--radius-md)',
    fontSize: 12,
    fontFamily: 'var(--font-sans)',
  },
};

export default function QueryChart({ recommendation, data }: QueryChartProps) {
  const { t } = useTranslation();
  const { chartType, keyField, valueFields } = recommendation;

  // Guard against LLM hallucinating column names
  const knownKeys = data.length > 0 ? Object.keys(data[0]) : [];
  const safeValueFields = valueFields.filter(f => knownKeys.includes(f));

  const [activeField, setActiveField] = useState<string>(() => safeValueFields[0]);
  const [activeChartType, setActiveChartType] = useState<ChartType>(() => chartType);

  if (safeValueFields.length === 0) return null;

  const effectiveField = safeValueFields.includes(activeField) ? activeField : safeValueFields[0];

  const chartData = data.map(row => ({
    [keyField]: row[keyField],
    [effectiveField]: coerceNumeric(row[effectiveField]),
  }));

  const commonProps = {
    data: chartData,
    margin: { top: 8, right: 16, left: 0, bottom: 8 },
  };

  const controls = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
      {/* Chart type toggle */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {CHART_TYPES.map(type => (
          <button
            key={type}
            className={`btn btn-sm ${activeChartType === type ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={() => setActiveChartType(type)}
          >
            {t(`app.chart_${type}`)}
          </button>
        ))}
      </div>

      {/* Value field selector — only when multiple fields */}
      {safeValueFields.length > 1 && (
        <select
          className="input select"
          style={{ maxWidth: '220px', fontSize: '13px', padding: '4px 8px' }}
          value={effectiveField}
          onChange={e => setActiveField(e.target.value)}
        >
          {safeValueFields.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      )}
    </div>
  );

  if (activeChartType === 'pie') {
    const pieData = data.map(row => ({
      name: String(row[keyField] ?? ''),
      value: coerceNumeric(row[effectiveField]),
    }));
    return (
      <>
        {controls}
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </>
    );
  }

  if (activeChartType === 'bar') {
    return (
      <>
        {controls}
        <ResponsiveContainer width="100%" height={320}>
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis dataKey={keyField} {...axisStyle} />
            <YAxis {...axisStyle} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey={effectiveField} fill={CHART_COLORS[0]} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </>
    );
  }

  if (activeChartType === 'line') {
    return (
      <>
        {controls}
        <ResponsiveContainer width="100%" height={320}>
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
            <XAxis dataKey={keyField} {...axisStyle} />
            <YAxis {...axisStyle} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey={effectiveField}
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </>
    );
  }

  // area
  return (
    <>
      {controls}
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
          <XAxis dataKey={keyField} {...axisStyle} />
          <YAxis {...axisStyle} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey={effectiveField}
            stroke={CHART_COLORS[0]}
            fill={CHART_COLORS[0]}
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}
