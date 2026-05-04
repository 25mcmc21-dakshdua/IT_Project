import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ArrowLeft, Download, BarChart2, Users, BookOpen,
  Home, IndianRupee, TrendingUp, TrendingDown, Info, Calendar, Activity, ChevronDown, ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, ReferenceLine
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API = '/api/reports';

const HOSTEL_COLORS: Record<string, string> = { NRS: '#7C3AED', MH: '#2563EB', LH: '#D97706' };
const BAR_COLOR = '#7C3AED';
const PEER_BAR = '#22C55E';

// ─── Tooltip for Recharts ──────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.85rem' }}>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color, margin: '2px 0' }}>
            {p.name}: ₹{Number(p.value).toFixed(0)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Insight Badge ─────────────────────────────────────────────
const InsightBadge: React.FC<{ text: string; type?: 'warn' | 'good' | 'info' }> = ({ text, type = 'info' }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    warn: { bg: 'rgba(239,68,68,0.12)', text: '#F87171' },
    good: { bg: 'rgba(34,197,94,0.12)', text: '#4ADE80' },
    info: { bg: 'rgba(124,58,237,0.12)', text: '#A78BFA' },
  };
  const c = colors[type];
  return (
    <div style={{ background: c.bg, color: c.text, borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.88rem', display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
      <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />
      <span>{text}</span>
    </div>
  );
};

// ─── Tab Button ────────────────────────────────────────────────
const TabBtn: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '10px 18px', borderRadius: 'var(--radius-md)',
      border: active ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
      background: active ? 'rgba(124,58,237,0.18)' : 'var(--bg-secondary)',
      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
      cursor: 'pointer', fontWeight: active ? 600 : 400,
      fontSize: '0.88rem', transition: 'all 0.2s ease',
      flexShrink: 0, whiteSpace: 'nowrap',
    }}
  >
    {icon} {label}
  </button>
);

// ═══════════════════════════════ MAIN ═══════════════════════════
const Reports: React.FC = () => {
  const [userId, setUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'category' | 'type' | 'semester' | 'hostel' | 'time' | 'trend'>('category');
  const [showTabs, setShowTabs] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data states
  const [catData, setCatData] = useState<{ expenses: any[], incomes: any[] }>({ expenses: [], incomes: [] });
  const [typeData, setTypeData] = useState<any>(null);
  const [semData, setSemData] = useState<any>(null);
  const [hostelData, setHostelData] = useState<any>(null);
  const [timeSummary, setTimeSummary] = useState<any>(null);
  const [balanceTrend, setBalanceTrend] = useState<any[]>([]);
  const [timeView, setTimeView] = useState<'weekly' | 'monthly'>('monthly');

  // ── Bootstrap user ──────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      setUserId(u.id);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadTab(activeTab);
    // eslint-disable-next-line
  }, [userId, activeTab]);

  const loadTab = async (tab: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      if (tab === 'category' && (!catData.expenses || catData.expenses.length === 0) && (!catData.incomes || catData.incomes.length === 0)) {
        const r = await axios.get(`${API}/${userId}/category-breakdown`);
        setCatData(r.data);
      }
      if (tab === 'type' && !typeData) {
        const r = await axios.get(`${API}/${userId}/vs-student-type`);
        setTypeData(r.data);
      }
      if (tab === 'semester' && !semData) {
        const r = await axios.get(`${API}/${userId}/vs-semester`);
        setSemData(r.data);
      }
      if (tab === 'hostel' && !hostelData) {
        const r = await axios.get(`${API}/${userId}/vs-hostel`);
        setHostelData(r.data);
      }
      if (tab === 'time' && !timeSummary) {
        const r = await axios.get(`${API}/${userId}/time-summary`);
        setTimeSummary(r.data);
      }
      if (tab === 'trend' && balanceTrend.length === 0) {
        const r = await axios.get(`${API}/${userId}/balance-trend`);
        setBalanceTrend(r.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'category': return 'My Categories';
      case 'type': return 'vs Student Type';
      case 'semester': return 'vs My Semester';
      case 'hostel': return 'Hostel Comparison';
      case 'time': return 'Weekly / Monthly';
      case 'trend': return 'Balance Trend';
      default: return 'Reports';
    }
  };

  // ── Export helpers (active tab) ───────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    if (activeTab === 'category') {
      doc.setFontSize(16);
      doc.text('UoH Analytics — My Category Breakdown', 14, 18);
      doc.setFontSize(10);
      doc.text(`Generated: ${date}`, 14, 26);
      const expenses = catData.expenses || [];
      const incomes = catData.incomes || [];
      const grandTotalExp = expenses.reduce((s: number, c: any) => s + Number(c.total), 0);
      autoTable(doc, {
        startY: 32,
        head: [['Expense Category', 'Total Spent (₹)', 'Transactions', '% of Expenses']],
        body: expenses.map((c: any) => [
          c.category,
          `₹${Number(c.total).toFixed(2)}`,
          c.txn_count,
          `${grandTotalExp > 0 ? ((Number(c.total) / grandTotalExp) * 100).toFixed(1) : '0'}%`
        ]),
      });

      if (incomes.length > 0) {
        const grandTotalInc = incomes.reduce((s: number, c: any) => s + Number(c.total), 0);
        doc.text("Income Breakdown", 14, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Income Category', 'Total Received (₹)', 'Transactions', '% of Income']],
          body: incomes.map((c: any) => [
            c.category,
            `₹${Number(c.total).toFixed(2)}`,
            c.txn_count,
            `${grandTotalInc > 0 ? ((Number(c.total) / grandTotalInc) * 100).toFixed(1) : '0'}%`
          ]),
        });
      }
      doc.save('UoH_Category_Report.pdf');

    } else if (activeTab === 'type' && typeData) {
      const typeLabel = typeData.user.student_type === 'hosteller' ? 'Hosteller' : 'Day Scholar';
      doc.setFontSize(16);
      doc.text(`UoH Analytics — My Spending vs ${typeLabel} Peers`, 14, 18);
      doc.setFontSize(10);
      doc.text(`Generated: ${date}  |  Peers: ${typeData.peer_count}`, 14, 26);
      const rows = buildTypeComparisonData();
      autoTable(doc, {
        startY: 32,
        head: [['Category', 'My Spending (₹)', 'Peer Average (₹)', 'Difference (₹)', 'Status']],
        body: rows.map(r => {
          const diff = r['My Spending'] - r['Peer Average'];
          return [
            r.category,
            `₹${r['My Spending'].toFixed(0)}`,
            r['Peer Average'] > 0 ? `₹${r['Peer Average'].toFixed(0)}` : 'No peer data',
            r['Peer Average'] > 0 ? `${diff >= 0 ? '+' : ''}₹${Math.abs(diff).toFixed(0)}` : '—',
            r['Peer Average'] === 0 ? 'No peer data' : diff > 0 ? 'Over Average' : 'Under Average'
          ];
        }),
      });
      doc.save('UoH_StudentType_Report.pdf');

    } else if (activeTab === 'semester' && semData) {
      doc.setFontSize(16);
      doc.text(`UoH Analytics — Semester ${semData.user.semester} Comparison`, 14, 18);
      doc.setFontSize(10);
      doc.text(`Generated: ${date}  |  My expense this month: ₹${Number(semData.my_stats?.my_expense || 0).toFixed(0)}`, 14, 26);
      autoTable(doc, {
        startY: 32,
        head: [['Student', 'Student Type', 'Monthly Expense (₹)', 'Monthly Income (₹)']],
        body: semData.semester_peers.map((p: any) => [
          p.name,
          p.student_type.replace('_', ' '),
          `₹${Number(p.total_expense).toFixed(0)}`,
          `₹${Number(p.total_income).toFixed(0)}`
        ]),
      });
      if (semData.sem_category_avg && semData.sem_category_avg.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY + 12;
        doc.setFontSize(13);
        doc.text('Semester Peer — Avg Category Spend', 14, finalY);
        autoTable(doc, {
          startY: finalY + 6,
          head: [['Category', 'Peer Avg Spend (₹)']],
          body: semData.sem_category_avg.map((r: any) => [r.category, `₹${Number(r.sem_avg).toFixed(0)}`]),
        });
      }
      doc.save('UoH_Semester_Report.pdf');

    } else if (activeTab === 'hostel' && hostelData && !hostelData.not_applicable) {
      doc.setFontSize(16);
      doc.text('UoH Analytics — Hostel Spending Comparison', 14, 18);
      doc.setFontSize(10);
      doc.text(`Generated: ${date}  |  Your hostel: ${hostelData.user.hostel_name}`, 14, 26);
      autoTable(doc, {
        startY: 32,
        head: [['Hostel', 'Students', 'Avg Expense (₹)', 'Min Expense (₹)', 'Max Expense (₹)']],
        body: hostelData.hostel_stats.map((h: any) => [
          h.hostel_name + (h.hostel_name === hostelData.user.hostel_name ? ' (You)' : ''),
          h.student_count,
          `₹${Number(h.avg_expense).toFixed(0)}`,
          `₹${Number(h.min_expense).toFixed(0)}`,
          `₹${Number(h.max_expense).toFixed(0)}`
        ]),
      });
      doc.save('UoH_Hostel_Report.pdf');
    } else if (activeTab === 'time' && timeSummary) {
      const data = timeView === 'monthly' ? timeSummary.monthly : timeSummary.weekly;
      doc.setFontSize(16);
      doc.text(`UoH Analytics — ${timeView === 'monthly' ? 'Monthly' : 'Weekly'} Summary`, 14, 18);
      doc.setFontSize(10);
      doc.text(`Generated: ${date}`, 14, 26);
      autoTable(doc, {
        startY: 32,
        head: [['Period', 'Income (₹)', 'Expense (₹)', 'Net (₹)']],
        body: data.map((d: any) => [
          d.label,
          `+₹${Number(d.income).toFixed(0)}`,
          `-₹${Number(d.expense).toFixed(0)}`,
          `${d.net >= 0 ? '+' : ''}₹${Number(d.net).toFixed(0)}`
        ]),
      });
      doc.save(`UoH_${timeView === 'monthly' ? 'Monthly' : 'Weekly'}_Report.pdf`);
    } else if (activeTab === 'trend' && balanceTrend.length > 0) {
      doc.setFontSize(16);
      doc.text('UoH Analytics — Balance Trend', 14, 18);
      doc.setFontSize(10);
      doc.text(`Generated: ${date}`, 14, 26);
      autoTable(doc, {
        startY: 32,
        head: [['Date', 'Income (₹)', 'Expense (₹)', 'Running Balance (₹)']],
        body: balanceTrend.map((d: any) => [
          d.label,
          `+₹${Number(d.income).toFixed(0)}`,
          `-₹${Number(d.expense).toFixed(0)}`,
          `₹${Number(d.balance).toFixed(0)}`
        ]),
      });
      doc.save('UoH_Balance_Trend_Report.pdf');
    }
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    if (activeTab === 'category') {
      const expenses = catData.expenses || [];
      const incomes = catData.incomes || [];
      const grandTotalExp = expenses.reduce((s: number, c: any) => s + Number(c.total), 0);
      const wsExp = XLSX.utils.json_to_sheet(expenses.map((c: any) => ({
        Category: c.category,
        'Total Spent (₹)': Number(c.total).toFixed(2),
        Transactions: c.txn_count,
        '% of Expenses': `${grandTotalExp > 0 ? ((Number(c.total) / grandTotalExp) * 100).toFixed(1) : '0'}%`
      })));
      XLSX.utils.book_append_sheet(wb, wsExp, 'Expense Breakdown');

      if (incomes.length > 0) {
        const grandTotalInc = incomes.reduce((s: number, c: any) => s + Number(c.total), 0);
        const wsInc = XLSX.utils.json_to_sheet(incomes.map((c: any) => ({
          Category: c.category,
          'Total Received (₹)': Number(c.total).toFixed(2),
          Transactions: c.txn_count,
          '% of Income': `${grandTotalInc > 0 ? ((Number(c.total) / grandTotalInc) * 100).toFixed(1) : '0'}%`
        })));
        XLSX.utils.book_append_sheet(wb, wsInc, 'Income Breakdown');
      }
      XLSX.writeFile(wb, 'UoH_Category_Report.xlsx');

    } else if (activeTab === 'type' && typeData) {
      const ws = XLSX.utils.json_to_sheet(buildTypeComparisonData().map(r => {
        const diff = r['My Spending'] - r['Peer Average'];
        return {
          Category: r.category,
          'My Spending (₹)': r['My Spending'].toFixed(0),
          'Peer Average (₹)': r['Peer Average'] > 0 ? r['Peer Average'].toFixed(0) : 'No data',
          'Difference (₹)': r['Peer Average'] > 0 ? `${diff >= 0 ? '+' : ''}${Math.abs(diff).toFixed(0)}` : '—',
          Status: r['Peer Average'] === 0 ? 'No peer data' : diff > 0 ? 'Over Average' : 'Under Average'
        };
      }));
      XLSX.utils.book_append_sheet(wb, ws, 'vs Student Type');
      XLSX.writeFile(wb, 'UoH_StudentType_Report.xlsx');

    } else if (activeTab === 'semester' && semData) {
      const ws1 = XLSX.utils.json_to_sheet(semData.semester_peers.map((p: any) => ({
        Name: p.name,
        'Student Type': p.student_type.replace('_', ' '),
        'Monthly Expense (₹)': Number(p.total_expense).toFixed(0),
        'Monthly Income (₹)': Number(p.total_income).toFixed(0)
      })));
      XLSX.utils.book_append_sheet(wb, ws1, `Semester ${semData.user.semester} Peers`);
      if (semData.sem_category_avg?.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(semData.sem_category_avg.map((r: any) => ({
          Category: r.category,
          'Peer Avg Spend (₹)': Number(r.sem_avg).toFixed(0)
        })));
        XLSX.utils.book_append_sheet(wb, ws2, 'Category Avg');
      }
      XLSX.writeFile(wb, 'UoH_Semester_Report.xlsx');

    } else if (activeTab === 'hostel' && hostelData && !hostelData.not_applicable) {
      const ws = XLSX.utils.json_to_sheet(hostelData.hostel_stats.map((h: any) => ({
        Hostel: h.hostel_name,
        Students: h.student_count,
        'Avg Expense (₹)': Number(h.avg_expense).toFixed(0),
        'Min Expense (₹)': Number(h.min_expense).toFixed(0),
        'Max Expense (₹)': Number(h.max_expense).toFixed(0)
      })));
      XLSX.utils.book_append_sheet(wb, ws, 'Hostel Stats');
      XLSX.writeFile(wb, 'UoH_Hostel_Report.xlsx');
    } else if (activeTab === 'time' && timeSummary) {
      const data = timeView === 'monthly' ? timeSummary.monthly : timeSummary.weekly;
      const ws = XLSX.utils.json_to_sheet(data.map((d: any) => ({
        Period: d.label,
        'Income (₹)': Number(d.income).toFixed(0),
        'Expense (₹)': Number(d.expense).toFixed(0),
        'Net (₹)': Number(d.net).toFixed(0)
      })));
      XLSX.utils.book_append_sheet(wb, ws, `${timeView === 'monthly' ? 'Monthly' : 'Weekly'} Summary`);
      XLSX.writeFile(wb, `UoH_${timeView === 'monthly' ? 'Monthly' : 'Weekly'}_Report.xlsx`);
    } else if (activeTab === 'trend' && balanceTrend.length > 0) {
      const ws = XLSX.utils.json_to_sheet(balanceTrend.map((d: any) => ({
        Date: d.label,
        'Income (₹)': Number(d.income).toFixed(0),
        'Expense (₹)': Number(d.expense).toFixed(0),
        'Running Balance (₹)': Number(d.balance).toFixed(0)
      })));
      XLSX.utils.book_append_sheet(wb, ws, 'Balance Trend');
      XLSX.writeFile(wb, 'UoH_Balance_Trend_Report.xlsx');
    }
  };

  // ── Build comparison chart data ──────────────────────────────
  const buildTypeComparisonData = () => {
    if (!typeData) return [];
    const myMap: Record<string, number> = {};
    typeData.my_spending.forEach((r: any) => { myMap[r.category] = Number(r.my_total); });
    const peerMap: Record<string, number> = {};
    typeData.peer_avg.forEach((r: any) => { peerMap[r.category] = Number(r.peer_avg); });

    const cats = new Set([...Object.keys(myMap), ...Object.keys(peerMap)]);
    return Array.from(cats).map(cat => ({
      category: cat,
      'My Spending': myMap[cat] || 0,
      'Peer Average': peerMap[cat] || 0,
    })).sort((a, b) => b['My Spending'] - a['My Spending']);
  };

  const buildSemPeerData = () => {
    if (!semData) return [];
    return semData.semester_peers.map((p: any) => ({
      name: p.name.split(' ')[0],
      expense: Number(p.total_expense),
      income: Number(p.total_income),
      type: p.student_type,
    }));
  };

  const buildHostelData = () => {
    if (!hostelData || hostelData.not_applicable) return [];
    return hostelData.hostel_stats.map((h: any) => ({
      hostel: h.hostel_name,
      'Avg Expense': Number(h.avg_expense).toFixed(0),
      'Max Expense': Number(h.max_expense).toFixed(0),
      students: h.student_count,
    }));
  };

  // ── Generate auto insights from type data ────────────────────
  const getTypeInsights = (): Array<{ text: string; type: 'warn' | 'good' | 'info' }> => {
    if (!typeData) return [];
    const insights: Array<{ text: string; type: 'warn' | 'good' | 'info' }> = [];
    const myMap: Record<string, number> = {};
    typeData.my_spending.forEach((r: any) => { myMap[r.category] = Number(r.my_total); });
    const peerMap: Record<string, number> = {};
    typeData.peer_avg.forEach((r: any) => { peerMap[r.category] = Number(r.peer_avg); });

    const typeLabel = typeData.user.student_type === 'hosteller' ? 'Hosteller' : 'Day Scholar';
    insights.push({ text: `You are compared against ${typeData.peer_count} other ${typeLabel}s at UoH.`, type: 'info' });

    Object.keys(myMap).forEach(cat => {
      const mine = myMap[cat] || 0;
      const peer = peerMap[cat] || 0;
      if (peer === 0) return;
      const pct = ((mine - peer) / peer) * 100;
      if (pct > 30) {
        insights.push({ text: `Your "${cat}" spending (₹${mine.toFixed(0)}) is ${pct.toFixed(0)}% above the ${typeLabel} average (₹${peer.toFixed(0)}).`, type: 'warn' });
      } else if (pct < -20) {
        insights.push({ text: `Great! Your "${cat}" spending (₹${mine.toFixed(0)}) is ${Math.abs(pct).toFixed(0)}% below the ${typeLabel} average (₹${peer.toFixed(0)}).`, type: 'good' });
      }
    });
    if (insights.length === 1) insights.push({ text: 'Your spending is in line with the UoH average for your peer group!', type: 'good' });
    return insights;
  };

  const getSemInsights = (): Array<{ text: string; type: 'warn' | 'good' | 'info' }> => {
    if (!semData) return [];
    const peers = semData.semester_peers;
    const me = peers.find((p: any) => p.id === userId);
    if (!me) return [{ text: `Comparing with Semester ${semData.user.semester} peers.`, type: 'info' }];
    const allExpenses = peers.map((p: any) => Number(p.total_expense)).filter((v: number) => v > 0);
    const avg = allExpenses.reduce((a: number, b: number) => a + b, 0) / (allExpenses.length || 1);
    const mine = Number(me.total_expense);
    const insights: Array<{ text: string; type: 'warn' | 'good' | 'info' }> = [];
    insights.push({ text: `Semester ${semData.user.semester} has ${peers.length} students in the database.`, type: 'info' });
    if (mine > avg * 1.25) {
      insights.push({ text: `This month you spent ₹${mine.toFixed(0)}, which is ${(((mine - avg) / avg) * 100).toFixed(0)}% above your semester average (₹${avg.toFixed(0)}).`, type: 'warn' });
    } else if (mine <= avg) {
      insights.push({ text: `Well done! You're spending ₹${mine.toFixed(0)} this month, ${(((avg - mine) / avg) * 100).toFixed(0)}% below the semester average (₹${avg.toFixed(0)}).`, type: 'good' });
    }
    return insights;
  };

  const myHostelName = hostelData?.user?.hostel_name;

  // ═══════════════════ RENDER ════════════════════════════════
  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px', maxWidth: '1100px' }}>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-gradient">UoH Analytics & Reports</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Institution-specific insights powered by real UoH student data
          </p>
        </div>
      </header>

      {/* Tab Bar */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setShowTabs(!showTabs)} 
          className="glass-panel" 
          style={{ width: '100%', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600, transition: 'all 0.2s' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart2 size={18} color="var(--accent-primary)" /> 
            {getTabLabel(activeTab)}
          </span>
          {showTabs ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        
        {showTabs && (
          <div className="animate-fade-in" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
            <TabBtn icon={<BarChart2 size={15} />} label="My Categories" active={activeTab === 'category'} onClick={() => { setActiveTab('category'); setShowTabs(false); }} />
            <TabBtn icon={<Users size={15} />} label="vs Student Type" active={activeTab === 'type'} onClick={() => { setActiveTab('type'); setShowTabs(false); }} />
            <TabBtn icon={<BookOpen size={15} />} label="vs My Semester" active={activeTab === 'semester'} onClick={() => { setActiveTab('semester'); setShowTabs(false); }} />
            <TabBtn icon={<Home size={15} />} label="Hostel Comparison" active={activeTab === 'hostel'} onClick={() => { setActiveTab('hostel'); setShowTabs(false); }} />
            <TabBtn icon={<Calendar size={15} />} label="Weekly / Monthly" active={activeTab === 'time'} onClick={() => { setActiveTab('time'); setShowTabs(false); }} />
            <TabBtn icon={<Activity size={15} />} label="Balance Trend" active={activeTab === 'trend'} onClick={() => { setActiveTab('trend'); setShowTabs(false); }} />
          </div>
        )}
      </div>


      {loading && (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading UoH analytics...
        </div>
      )}

      {/* ── Export Buttons (always visible) ────────────────── */}
      {!loading && (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginBottom: '4px' }}>
          <button onClick={exportPDF} className="btn-primary" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '0.85rem', padding: '8px 16px' }}>
            <Download size={14} /> Export PDF
          </button>
          <button onClick={exportExcel} className="btn-primary" style={{ background: 'var(--success-bg)', color: 'var(--success)', fontSize: '0.85rem', padding: '8px 16px' }}>
            <Download size={14} /> Export Excel
          </button>
        </div>
      )}

      {/* ── TAB 1: My Category Breakdown ─────────────────────── */}
      {!loading && activeTab === 'category' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {(!catData.expenses || catData.expenses.length === 0) && (!catData.incomes || catData.incomes.length === 0) ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No expense data yet. Add some transactions to see your breakdown!
            </div>
          ) : (
            <>
              {/* Expenses Breakdown */}
              {catData.expenses && catData.expenses.length > 0 && (
                <>
                  <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '1rem' }}>Expense Share</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={(catData.expenses || []).map((c: any) => ({ ...c, total: Number(c.total) }))} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={(props: any) => `${props.name} (${((props.percent || 0) * 100).toFixed(0)}%)`} labelLine={true}>
                          {(catData.expenses || []).map((c: any, i: number) => <Cell key={i} fill={c.color || `hsl(${i * 37}, 70%, 55%)`} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => `₹${Number(v).toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1rem' }}>Expense Categories</h3>
                    <div className="table-container">
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          {['Category', 'Total Spent', 'Transactions', '% of Expenses'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const expenses = catData.expenses || [];
                          const grandTotal = expenses.reduce((s: number, c: any) => s + Number(c.total), 0);
                          return expenses.map((c: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                              <td style={{ padding: '12px 12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c.color || BAR_COLOR }} />
                                {c.category}
                              </td>
                              <td style={{ padding: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>₹{Number(c.total).toFixed(2)}</td>
                              <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{c.txn_count}</td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 99 }}>
                                    <div style={{ width: `${((Number(c.total) / grandTotal) * 100).toFixed(0)}%`, height: '100%', background: c.color || BAR_COLOR, borderRadius: 99 }} />
                                  </div>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: 36 }}>
                                    {grandTotal > 0 ? ((Number(c.total) / grandTotal) * 100).toFixed(1) : 0}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Incomes Breakdown */}
              {catData.incomes && catData.incomes.length > 0 && (
                <>
                  <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '1rem' }}>Income Share</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={(catData.incomes || []).map((c: any) => ({ ...c, total: Number(c.total) }))} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={(props: any) => `${props.name} (${((props.percent || 0) * 100).toFixed(0)}%)`} labelLine={true}>
                          {(catData.incomes || []).map((c: any, i: number) => <Cell key={i} fill={c.color || `hsl(${120 + i * 37}, 70%, 50%)`} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => `₹${Number(v).toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1rem' }}>Income Categories</h3>
                    <div className="table-container">
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          {['Category', 'Total Received', 'Transactions', '% of Income'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const incomes = catData.incomes || [];
                          const grandTotal = incomes.reduce((s: number, c: any) => s + Number(c.total), 0);
                          return incomes.map((c: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                              <td style={{ padding: '12px 12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c.color || `hsl(${120 + i * 37}, 70%, 50%)` }} />
                                {c.category}
                              </td>
                              <td style={{ padding: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>₹{Number(c.total).toFixed(2)}</td>
                              <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{c.txn_count}</td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 99 }}>
                                    <div style={{ width: `${((Number(c.total) / grandTotal) * 100).toFixed(0)}%`, height: '100%', background: c.color || `hsl(${120 + i * 37}, 70%, 50%)`, borderRadius: 99 }} />
                                  </div>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: 36 }}>
                                    {grandTotal > 0 ? ((Number(c.total) / grandTotal) * 100).toFixed(1) : 0}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB 2: vs Student Type ────────────────────────────── */}
      {!loading && activeTab === 'type' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {!typeData ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No data.</div>
          ) : (
            <>
              {/* Info Header */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={20} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Your Type</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {typeData.user.student_type.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <IndianRupee size={20} style={{ color: '#22C55E' }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Peers Compared</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{typeData.peer_count} students</div>
                  </div>
                </div>
              </div>

              {/* Auto Insights */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1rem' }}>🧠 UoH Insights for You</h3>
                {getTypeInsights().map((ins, i) => <InsightBadge key={i} text={ins.text} type={ins.type} />)}
              </div>

              {/* Side-by-side bar chart */}
              {buildTypeComparisonData().length > 0 && (
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '1rem' }}>
                    Your Spending vs {typeData.user.student_type === 'hosteller' ? 'Hosteller' : 'Day Scholar'} Average
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={buildTypeComparisonData()} margin={{ top: 0, right: 10, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                      <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: 'var(--text-secondary)', paddingTop: '16px' }} />
                      <Bar dataKey="My Spending" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Peer Average" fill={PEER_BAR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Table */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1rem' }}>Detailed Comparison Table</h3>
                <div className="table-container">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      {['Category', 'My Spending', 'Peer Avg', 'Difference', 'Status'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {buildTypeComparisonData().map((row, i) => {
                      const diff = row['My Spending'] - row['Peer Average'];
                      const isOver = diff > 0;
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{row.category}</td>
                          <td style={{ padding: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>₹{row['My Spending'].toFixed(0)}</td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>₹{row['Peer Average'].toFixed(0)}</td>
                          <td style={{ padding: '12px', color: isOver ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                            {isOver ? '+' : ''}₹{Math.abs(diff).toFixed(0)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {row['Peer Average'] === 0 ? (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No peer data</span>
                            ) : isOver ? (
                              <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}><TrendingUp size={13} /> Over Average</span>
                            ) : (
                              <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}><TrendingDown size={13} /> Under Average</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB 3: vs Semester ───────────────────────────────────── */}
      {!loading && activeTab === 'semester' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {!semData ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No data.</div>
          ) : (
            <>
              {/* Info header */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <BookOpen size={20} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Your Semester</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Semester {semData.user.semester}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={20} style={{ color: '#22C55E' }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Students in Semester</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{semData.semester_peers.length}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <IndianRupee size={20} style={{ color: '#F59E0B' }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>My Expense This Month</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{Number(semData.my_stats?.my_expense || 0).toFixed(0)}</div>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1rem' }}>🧠 Semester Insights</h3>
                {getSemInsights().map((ins, i) => <InsightBadge key={i} text={ins.text} type={ins.type} />)}
              </div>

              {/* Semester peer bar chart — expense per person */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '1rem' }}>
                  Monthly Expense — All Semester {semData.user.semester} Students
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={buildSemPeerData()} margin={{ top: 0, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: 'var(--text-secondary)', paddingTop: '12px' }} />
                    <Bar dataKey="expense" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="income" name="Income" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category avg for semester */}
              {semData.sem_category_avg && semData.sem_category_avg.length > 0 && (
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1rem' }}>
                    Semester {semData.user.semester} — Average Spending by Category (Peers)
                  </h3>
                  <div className="table-container">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        {['Category', 'Peer Avg Spend', 'Bar'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const max = Math.max(...semData.sem_category_avg.map((r: any) => Number(r.sem_avg)));
                        return semData.sem_category_avg.map((r: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{r.category}</td>
                            <td style={{ padding: '12px', color: '#A78BFA', fontWeight: 600 }}>₹{Number(r.sem_avg).toFixed(0)}</td>
                            <td style={{ padding: '12px', minWidth: '120px' }}>
                              <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ width: `${(Number(r.sem_avg) / max) * 100}%`, height: '100%', background: BAR_COLOR, borderRadius: 99 }} />
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB 4: Hostel Comparison ──────────────────────────── */}
      {!loading && activeTab === 'hostel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {!hostelData ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
          ) : hostelData.not_applicable ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <Home size={40} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Hostel comparison is only available for hosteliers.</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>
                As a Day Scholar, check the "vs Student Type" tab for relevant peer comparisons.
              </p>
            </div>
          ) : (
            <>
              {/* Your hostel badge */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Home size={20} style={{ color: HOSTEL_COLORS[myHostelName] || BAR_COLOR }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Your Hostel</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{myHostelName || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Hostel avg expense bar chart */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '1rem' }}>Average Expense by Hostel</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={buildHostelData()} margin={{ top: 0, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="hostel" tick={{ fill: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: 'var(--text-secondary)', paddingTop: '12px' }} />
                    <Bar dataKey="Avg Expense" radius={[4, 4, 0, 0]}>
                      {buildHostelData().map((h: any, i: number) => (
                        <Cell key={i} fill={HOSTEL_COLORS[h.hostel] || BAR_COLOR} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Hostel stats table */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1rem' }}>Hostel Spending Stats</h3>
                <div className="table-container">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      {['Hostel', 'Students', 'Avg Expense', 'Min Expense', 'Max Expense'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hostelData.hostel_stats.map((h: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)', background: h.hostel_name === myHostelName ? 'rgba(124,58,237,0.07)' : 'transparent' }}>
                        <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: HOSTEL_COLORS[h.hostel_name] || BAR_COLOR }} />
                          <span style={{ color: 'var(--text-primary)', fontWeight: h.hostel_name === myHostelName ? 700 : 400 }}>{h.hostel_name}</span>
                          {h.hostel_name === myHostelName && <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', background: 'rgba(124,58,237,0.15)', borderRadius: '20px', padding: '1px 8px' }}>You</span>}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{h.student_count}</td>
                        <td style={{ padding: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>₹{Number(h.avg_expense).toFixed(0)}</td>
                        <td style={{ padding: '12px', color: 'var(--success)' }}>₹{Number(h.min_expense).toFixed(0)}</td>
                        <td style={{ padding: '12px', color: 'var(--danger)' }}>₹{Number(h.max_expense).toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Hostel Category Breakdown */}
              {hostelData.hostel_category_breakdown && hostelData.hostel_category_breakdown.length > 0 && (
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '1rem' }}>Category Spending — Avg per Hostel</h3>
                  {(() => {
                    // Group by hostel
                    const grouped: Record<string, any[]> = {};
                    hostelData.hostel_category_breakdown.forEach((r: any) => {
                      if (!grouped[r.hostel_name]) grouped[r.hostel_name] = [];
                      grouped[r.hostel_name].push(r);
                    });

                    // Build recharts-friendly data
                    const categories = Array.from(new Set(hostelData.hostel_category_breakdown.map((r: any) => r.category as string)));
                    const hostels = Object.keys(grouped);
                    const chartData = categories.map(cat => {
                      const row: any = { category: cat };
                      hostels.forEach(h => {
                        const match = grouped[h].find((r: any) => r.category === cat);
                        row[h] = match ? Number(match.avg_category_spend).toFixed(0) : 0;
                      });
                      return row;
                    });

                    return (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                          <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ color: 'var(--text-secondary)', paddingTop: '12px' }} />
                          {hostels.map(h => (
                            <Bar key={h} dataKey={h} name={`${h} Avg`} fill={HOSTEL_COLORS[h] || BAR_COLOR} radius={[4, 4, 0, 0]} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      )}
      {/* ── TAB 5: Weekly / Monthly Summary ──────────────────────── */}
      {!loading && activeTab === 'time' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Sub-toggle */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setTimeView('monthly')}
              className="btn-primary"
              style={{ background: timeView === 'monthly' ? 'var(--accent-gradient)' : 'var(--bg-secondary)', fontSize: '0.85rem', padding: '7px 16px' }}
            >Monthly (last 6 months)</button>
            <button
              onClick={() => setTimeView('weekly')}
              className="btn-primary"
              style={{ background: timeView === 'weekly' ? 'var(--accent-gradient)' : 'var(--bg-secondary)', fontSize: '0.85rem', padding: '7px 16px' }}
            >Weekly (last 12 weeks)</button>
          </div>

          {!timeSummary ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No data available.</div>
          ) : (() => {
            const data = timeView === 'monthly' ? timeSummary.monthly : timeSummary.weekly;
            if (!data || data.length === 0)
              return <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions found for this period.</div>;

            const totalExpense = data.reduce((s: number, d: any) => s + d.expense, 0);
            const totalIncome  = data.reduce((s: number, d: any) => s + d.income, 0);
            const bestPeriod   = [...data].sort((a: any, b: any) => a.expense - b.expense)[0];
            const worstPeriod  = [...data].sort((a: any, b: any) => b.expense - a.expense)[0];

            return (
              <>
                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  {[
                    { label: 'Total Income', val: `₹${totalIncome.toFixed(0)}`, color: 'var(--success)', bg: 'var(--success-bg)' },
                    { label: 'Total Expenses', val: `₹${totalExpense.toFixed(0)}`, color: 'var(--danger)', bg: 'var(--danger-bg)' },
                    { label: 'Net Savings', val: `₹${(totalIncome-totalExpense).toFixed(0)}`, color: totalIncome>totalExpense?'var(--success)':'var(--danger)', bg: totalIncome>totalExpense?'var(--success-bg)':'var(--danger-bg)' },
                    { label: 'Lowest Expense Period', val: bestPeriod?.label || '—', color: 'var(--accent-primary)', bg: 'rgba(124,58,237,0.1)' },
                    { label: 'Highest Expense Period', val: worstPeriod?.label || '—', color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' },
                  ].map(c => (
                    <div key={c.label} className="glass-panel" style={{ padding: '18px', background: c.bg }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>{c.label}</div>
                      <div style={{ fontWeight: 700, color: c.color, fontSize: '1.1rem' }}>{c.val}</div>
                    </div>
                  ))}
                </div>

                {/* Bar chart */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={18} /> {timeView === 'monthly' ? 'Monthly' : 'Weekly'} Income vs Expense
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data} margin={{ top: 5, right: 20, bottom: 30, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                      <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} angle={-30} textAnchor="end" />
                      <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={(v: number) => `₹${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '0.82rem', color: 'var(--text-secondary)', paddingTop: '20px' }} />
                      <Bar dataKey="income"  name="Income"  fill="#22C55E" radius={[4,4,0,0]} maxBarSize={40} />
                      <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4,4,0,0]} maxBarSize={40} />
                      <Bar dataKey="net"     name="Net"     fill="#7C3AED" radius={[4,4,0,0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Data table */}
                <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Detailed Breakdown</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        {['Period', 'Income (₹)', 'Expense (₹)', 'Net (₹)'].map(h =>
                          <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)' }}>{h}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((d: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)', opacity: 0.9 }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>{d.label}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--success)' }}>+₹{d.income.toFixed(0)}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--danger)' }}>-₹{d.expense.toFixed(0)}</td>
                          <td style={{ padding: '10px 12px', color: d.net >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                            {d.net >= 0 ? '+' : ''}₹{d.net.toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ── TAB 6: Balance Trend ──────────────────────────────────── */}
      {!loading && activeTab === 'trend' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {balanceTrend.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No transaction data to show trend.</div>
          ) : (() => {
            const latest = balanceTrend[balanceTrend.length - 1];
            const first = balanceTrend[0];
            const peak = [...balanceTrend].sort((a, b) => b.balance - a.balance)[0];
            const lowest = [...balanceTrend].sort((a, b) => a.balance - b.balance)[0];

            return (
              <>
                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  {[
                    { label: 'Current Balance', val: `₹${latest.balance.toFixed(0)}`, color: 'var(--accent-primary)', bg: 'rgba(124,58,237,0.1)' },
                    { label: 'Peak Balance', val: `₹${peak.balance.toFixed(0)} on ${peak.label}`, color: 'var(--success)', bg: 'var(--success-bg)' },
                    { label: 'Lowest Balance', val: `₹${lowest.balance.toFixed(0)} on ${lowest.label}`, color: 'var(--danger)', bg: 'var(--danger-bg)' },
                    { label: 'First Entry', val: first.label, color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' },
                  ].map(c => (
                    <div key={c.label} className="glass-panel" style={{ padding: '18px', background: c.bg }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>{c.label}</div>
                      <div style={{ fontWeight: 700, color: c.color, fontSize: '1rem' }}>{c.val}</div>
                    </div>
                  ))}
                </div>

                {/* Line chart */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} /> Running Balance Over Time
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={balanceTrend} margin={{ top: 5, right: 30, bottom: 30, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                      <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} angle={-40} textAnchor="end" interval={Math.ceil(balanceTrend.length / 12)} />
                      <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={(v: number) => `₹${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={0} stroke="rgba(239,68,68,0.5)" strokeDasharray="4 4" />
                      <Line
                        type="monotone" dataKey="balance" name="Balance"
                        stroke="#7C3AED" strokeWidth={2.5} dot={false}
                        activeDot={{ r: 5, stroke: '#7C3AED', fill: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Last 10 entries table */}
                <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Recent Daily Activity</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        {['Date', 'Income', 'Expense', 'Running Balance'].map(h =>
                          <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)' }}>{h}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {[...balanceTrend].reverse().slice(0, 15).map((d: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>{d.label}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--success)' }}>+₹{d.income.toFixed(0)}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--danger)' }}>-₹{d.expense.toFixed(0)}</td>
                          <td style={{ padding: '10px 12px', color: d.balance >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>₹{d.balance.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default Reports;
