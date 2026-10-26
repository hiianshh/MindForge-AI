import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './HistoryTrend.css';

export default function HistoryTrend({ sessions }) {
  const data = sessions.slice(0, 12).slice().reverse().map((session) => ({
    label: new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: session.score ?? session.evaluation?.overallScore ?? 0,
    concept: session.concept,
  }));

  return <section className="trend-panel">
    <div className="trend-heading"><div><span className="panel-caption">THE LONG VIEW</span><h2>Your score, over time</h2></div><span className="trend-count">{sessions.length} SESSION{sessions.length === 1 ? '' : 'S'}</span></div>
    <div className="trend-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 16, left: -18, bottom: 0 }}>
      <CartesianGrid stroke="rgba(157,171,198,.1)" vertical={false} />
      <XAxis dataKey="label" tick={{ fill: '#7f8a9f', fontSize: 9 }} axisLine={false} tickLine={false} />
      <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: '#748096', fontSize: 9 }} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={{ background: '#161d2b', border: '1px solid rgba(157,171,198,.2)', borderRadius: 3, color: '#e7eaf2', fontSize: 10 }} formatter={(value) => [`${value} / 100`, 'Score']} labelFormatter={(label, payload) => payload?.[0]?.payload?.concept || label} />
      <Line type="monotone" dataKey="score" stroke="#8e8aff" strokeWidth={2} dot={{ r: 3, fill: '#81d9c0', stroke: '#0d1420', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#b3a4ff' }} />
    </LineChart></ResponsiveContainer></div>
  </section>;
}