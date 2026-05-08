import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, MessageSquare, Code2, AlertTriangle, BarChart2, Table } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { devicesApi } from '../../api/devices';
import type { ChartRecommendResponse, DatabaseConnection, NaturalLanguageQueryResult, QueryResult } from '../../types';
import QueryChart from '../../components/ui/QueryChart';
import toast from 'react-hot-toast';
import './Query.css';

export default function Query() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'nl' | 'sql'>('nl');
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [selectedDb, setSelectedDb] = useState('');
  const [question, setQuestion] = useState('');
  const [sql, setSql] = useState('SELECT * FROM ');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | NaturalLanguageQueryResult | null>(null);
  const [agentError, setAgentError] = useState(false);
  const [chartView, setChartView] = useState(false);
  const [chartRec, setChartRec] = useState<ChartRecommendResponse | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    devicesApi.getDatabases()
      .then(res => {
        const dbs = (res.data.data ?? []).filter(d => d.status === 'VERIFIED');
        setDatabases(dbs);
        if (dbs.length > 0) setSelectedDb(dbs[0].id);
      })
      .catch(() => {});
  }, []);

  const visualize = async () => {
    if (!result?.data || result.data.length === 0) return;
    setChartLoading(true);
    try {
      const cols = Object.keys(result.data[0]);
      const questionText = tab === 'nl' ? question : sql;
      const res = await devicesApi.recommendChart({
        question: questionText,
        columns: cols,
        sampleRows: result.data.slice(0, 5) as Record<string, unknown>[],
      });
      if (res.data.data) {
        setChartRec(res.data.data);
        setChartView(true);
      }
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setChartLoading(false);
    }
  };

  const runNL = async () => {
    if (!selectedDb || !question.trim()) return;
    setLoading(true); setResult(null); setAgentError(false); setChartView(false); setChartRec(null);
    try {
      const res = await devicesApi.naturalLanguageQuery(selectedDb, { question });
      const data = res.data.data;
      if (data?.errorCode === 'AGENT_DISCONNECTED') { setAgentError(true); }
      setResult(data);
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setLoading(false);
    }
  };

  const runSQL = async () => {
    if (!selectedDb || !sql.trim()) return;
    setLoading(true); setResult(null); setAgentError(false); setChartView(false); setChartRec(null);
    try {
      const res = await devicesApi.executeQuery(selectedDb, sql);
      const data = res.data.data;
      if (data?.errorCode === 'AGENT_DISCONNECTED') { setAgentError(true); }
      setResult(data);
    } catch {
      toast.error(t('errors.server_error'));
    } finally {
      setLoading(false);
    }
  };

  const columns = result?.data && result.data.length > 0 ? Object.keys(result.data[0]) : [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('nav.query')}</h1>
      </div>

      {/* DB Selector */}
      <div className="query-toolbar">
        <select
          className="input select"
          style={{ maxWidth: '280px' }}
          value={selectedDb}
          onChange={e => setSelectedDb(e.target.value)}
        >
          <option value="">{t('app.select_db')}</option>
          {databases.map(db => (
            <option key={db.id} value={db.id}>{db.displayName || db.databaseName}</option>
          ))}
        </select>

        <div className="tabs" style={{ flex: 1, maxWidth: '260px' }}>
          <button className={`tab ${tab === 'nl' ? 'active' : ''}`} onClick={() => setTab('nl')}>
            <MessageSquare size={14} /> {t('app.natural_language')}
          </button>
          <button className={`tab ${tab === 'sql' ? 'active' : ''}`} onClick={() => setTab('sql')}>
            <Code2 size={14} /> {t('app.raw_sql')}
          </button>
        </div>
      </div>

      {/* Agent Disconnected Banner */}
      {agentError && (
        <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
          <AlertTriangle size={16} />
          {t('app.agent_disconnected')}
        </div>
      )}

      {/* Editor */}
      <div className="card" style={{ marginBottom: '20px', overflow: 'hidden', padding: 0 }}>
        {tab === 'nl' ? (
          <div style={{ padding: '20px' }}>
            <textarea
              className="nl-input"
              placeholder={t('app.query_placeholder_nl')}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) runNL(); }}
              rows={3}
            />
          </div>
        ) : (
          <div style={{ height: '200px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <Editor
              height="200px"
              language="sql"
              value={sql}
              onChange={(v) => setSql(v ?? '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              }}
            />
          </div>
        )}
      </div>

      <button
        className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
        disabled={loading || !selectedDb}
        onClick={tab === 'nl' ? runNL : runSQL}
        style={{ marginBottom: '24px' }}
      >
        {!loading && <><Play size={15} /> {tab === 'nl' ? t('app.ask_query') : t('app.run_query')}</>}
      </button>

      {/* NL: Generated SQL (only for sql-type responses) */}
      {tab === 'nl' && result && 'generatedSql' in result && result.generatedSql &&
        (result as NaturalLanguageQueryResult).responseType !== 'unavailable' &&
        (result as NaturalLanguageQueryResult).responseType !== 'general' && (
        <div style={{ marginBottom: '20px' }}>
          <p className="result-label">{t('app.generated_sql')}</p>
          <div className="code-block">{result.generatedSql}</div>
        </div>
      )}

      {/* NL: Analyzer message for unavailable / general cases */}
      {tab === 'nl' && result && 'responseType' in result &&
        ((result as NaturalLanguageQueryResult).responseType === 'unavailable' ||
         (result as NaturalLanguageQueryResult).responseType === 'general') && (
        <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ marginBottom: '12px', color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {(result as NaturalLanguageQueryResult).aiMessage}
          </div>
          {(result as NaturalLanguageQueryResult).responseType === 'unavailable' &&
            (result as NaturalLanguageQueryResult).suggestedQuestion && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: '13px', marginTop: '8px' }}
              onClick={() => setQuestion((result as NaturalLanguageQueryResult).suggestedQuestion!)}
            >
              {(result as NaturalLanguageQueryResult).suggestedQuestion}
            </button>
          )}
        </div>
      )}

      {/* Results (SQL execution results only) */}
      {result && !(
        'responseType' in result &&
        ((result as NaturalLanguageQueryResult).responseType === 'unavailable' ||
         (result as NaturalLanguageQueryResult).responseType === 'general')
      ) && (
        <div>
          <div className="result-meta">
            <p className="result-label">{t('app.results')}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {result.success && (
                <span className="badge badge-info">
                  {result.rowCount} {t('app.rows')} · {result.executionTimeMs}{t('app.ms')}
                </span>
              )}
              {result.success && result.data && result.data.length > 0 && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className={`btn btn-sm ${!chartView ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setChartView(false)}
                    style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Table size={12} /> Tablo
                  </button>
                  {chartRec ? (
                    <button
                      className={`btn btn-sm ${chartView ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setChartView(true)}
                      style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <BarChart2 size={12} /> Grafik
                    </button>
                  ) : (
                    <button
                      className={`btn btn-sm btn-secondary ${chartLoading ? 'btn-loading' : ''}`}
                      disabled={chartLoading}
                      onClick={visualize}
                      style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {!chartLoading && <><BarChart2 size={12} /> Görselleştir</>}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {!result.success ? (
            <div className="alert alert-error">
              <AlertTriangle size={16} />
              {result.error ?? t('errors.server_error')}
            </div>
          ) : result.data && result.data.length > 0 ? (
            chartView && chartRec ? (
              <div className="card" style={{ padding: '20px' }}>
                <QueryChart recommendation={chartRec} data={result.data} />
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>{columns.map(col => <th key={col}>{col}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.data.map((row, i) => (
                      <tr key={i}>{columns.map(col => <td key={col}>{String(row[col] ?? '')}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('app.no_results')}</p>
          )}
        </div>
      )}
    </div>
  );
}
