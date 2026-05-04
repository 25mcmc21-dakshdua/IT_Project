import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  LogOut, Plus, IndianRupee, Edit2, Trash2, User, 
  Settings, Bell, FileText, X, Filter, Download, 
  Eye, EyeOff, TrendingUp, TrendingDown, Menu 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TransactionModal from '../components/TransactionModal';
import AnalyticsCharts from '../components/AnalyticsCharts';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [initialType, setInitialType] = useState<'income' | 'expense'>('expense');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // History States
  const [showDeleted, setShowDeleted] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData && userData !== 'undefined') {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchInitialData(parsedUser.id);
        fetchNotifications(parsedUser.id);
      } catch (e) {
        handleLogout();
      }
    } else {
      handleLogout();
    }
  }, []);

  const fetchInitialData = async (userId: number) => {
    setLoading(true);
    await fetchData(userId, showDeleted);
    setLoading(false);
  };

  const fetchData = async (userId: number, includeDeleted: boolean) => {
    try {
      setLoadingHistory(true);
      const [txRes, catRes] = await Promise.all([
        includeDeleted
          ? axios.get(`/api/reports/${userId}`)
          : axios.get(`/api/transactions/${userId}`),
        axios.get(`/api/categories/${userId}`)
      ]);
      setTransactions(txRes.data);
      setCategories(catRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchNotifications = async (userId: number) => {
    try {
      const res = await axios.get(`/api/notifications/${userId}`);
      setNotifications(res.data);
    } catch(e) {}
  };

  const handleMarkAsRead = async (e: any, id: number) => {
    e.stopPropagation();
    try {
      await axios.put(`/api/notifications/${id}/read`);
      fetchNotifications(user.id);
    } catch (e) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleDelete = async (id: number) => {
    if(window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`/api/transactions/${id}`);
        fetchData(user.id, showDeleted);
        setRefreshKey(k => k + 1);
      } catch(e) {
        alert('Failed to delete');
      }
    }
  };

  const openModal = (type: 'income' | 'expense') => {
    setInitialType(type);
    setSelectedTx(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tx: any) => {
    setSelectedTx(tx);
    setInitialType(tx.transaction_type);
    setIsModalOpen(true);
  };

  // History Logic
  const handleToggleDeleted = () => {
    const next = !showDeleted;
    setShowDeleted(next);
    if (user) fetchData(user.id, next);
  };

  const getFilteredAndSortedTransactions = () => {
    let result = [...transactions];
    if (filterType !== 'all') result = result.filter(t => t.transaction_type === filterType);
    if (filterCategory !== 'all') result = result.filter(t => t.category_id?.toString() === filterCategory);
    if (startDate) result = result.filter(t => new Date(t.date) >= new Date(startDate));
    if (endDate) result = result.filter(t => new Date(t.date) <= new Date(endDate));

    result.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount_desc') return Number(b.amount) - Number(a.amount);
      if (sortBy === 'amount_asc') return Number(a.amount) - Number(b.amount);
      if (sortBy === 'income_high') {
        if (a.transaction_type === 'income' && b.transaction_type !== 'income') return -1;
        if (a.transaction_type !== 'income' && b.transaction_type === 'income') return 1;
        return Number(b.amount) - Number(a.amount);
      }
      if (sortBy === 'expense_high') {
        if (a.transaction_type === 'expense' && b.transaction_type !== 'expense') return -1;
        if (a.transaction_type !== 'expense' && b.transaction_type === 'expense') return 1;
        return Number(b.amount) - Number(a.amount);
      }
      return 0;
    });
    return result;
  };

  const displayedTransactions = getFilteredAndSortedTransactions();

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Transaction Report", 14, 15);
    autoTable(doc, {
      head: [["Date", "Description", "Category", "Type", "Amount"]],
      body: displayedTransactions.map(t => [
        new Date(t.date).toLocaleString(),
        t.source_or_description || '',
        t.category?.name || 'General',
        t.transaction_type,
        `₹${Number(t.amount).toFixed(2)}`
      ]),
    });
    doc.save("Transactions.pdf");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(displayedTransactions.map(t => ({
      Date: new Date(t.date).toLocaleString(),
      Description: t.source_or_description,
      Category: t.category?.name || 'General',
      Type: t.transaction_type,
      Amount: Number(t.amount).toFixed(2)
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "Transactions.xlsx");
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Dashboard...</div>;

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', position: 'relative' }}>
        <div>
          <h1 className="text-gradient">Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Welcome back, {user?.name}</p>
        </div>
        
        {/* Desktop Navigation */}
        <div className="mobile-nav-hidden" style={{ gap: '12px' }}>
          <button onClick={() => setShowNotifs(!showNotifs)} className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', position: 'relative' }}>
            <Bell size={16} />
            {notifications.filter(n => !n.is_read).length > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--danger)', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifications.filter(n => !n.is_read).length}</span>}
          </button>
          <button onClick={() => navigate('/reports')} className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
            <FileText size={16} /> Reports
          </button>
          <button onClick={() => navigate('/controls')} className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
            <Settings size={16} /> Controls
          </button>
          <button onClick={() => navigate('/profile')} className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
            <User size={16} /> Profile
          </button>
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="mobile-nav-visible" style={{ gap: '12px' }}>
          <button onClick={() => setShowNotifs(!showNotifs)} className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', position: 'relative', padding: '10px' }}>
            <Bell size={18} />
            {notifications.filter(n => !n.is_read).length > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--danger)', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifications.filter(n => !n.is_read).length}</span>}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '10px' }}>
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="glass-panel animate-fade-in mobile-nav-visible" style={{ position: 'absolute', top: '100%', right: '0', width: '200px', zIndex: 100, padding: '16px', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <button onClick={() => navigate('/reports')} className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', width: '100%', justifyContent: 'flex-start' }}>
              <FileText size={16} /> Reports
            </button>
            <button onClick={() => navigate('/controls')} className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', width: '100%', justifyContent: 'flex-start' }}>
              <Settings size={16} /> Controls
            </button>
            <button onClick={() => navigate('/profile')} className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', width: '100%', justifyContent: 'flex-start' }}>
              <User size={16} /> Profile
            </button>
          </div>
        )}

        {/* Notifications Dropdown (Desktop & Mobile) */}
        {showNotifs && (
          <div className="glass-panel animate-fade-in" style={{ position: 'absolute', top: '110%', right: '0', width: '300px', zIndex: 101, padding: '16px' }}>
             <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Notifications</h4>
             {notifications.filter(n => !n.is_read).length === 0 ? <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You're all caught up!</p> : (
               <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {notifications.filter(n => !n.is_read).map(n => (
                   <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: n.is_read ? 'transparent' : 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', borderLeft: n.is_read ? 'none' : '3px solid var(--accent-primary)', fontSize: '0.85rem', color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                     <div>
                       <div style={{fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px'}}>{n.title}</div>
                       <div style={{opacity: 0.8}}>{n.message}</div>
                     </div>
                     {!n.is_read && (
                       <button onClick={(e) => handleMarkAsRead(e, n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                         <X size={14} />
                       </button>
                     )}
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}
      </header>

      {/* Balance & Quick Actions */}
      <div className="grid-dashboard-main" style={{ marginBottom: '32px' }}>
        <AnalyticsCharts userId={user.id} refreshKey={refreshKey} />
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px', height: '100%' }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '8px' }}>Quick Actions</h3>
          <button onClick={() => openModal('income')} className="btn-primary" style={{ background: 'var(--success)', width: '100%', padding: '14px 0' }}>
            <Plus size={20} /> Add Income
          </button>
          <button onClick={() => openModal('expense')} className="btn-primary" style={{ background: 'var(--danger)', width: '100%', padding: '14px 0' }}>
            <Plus size={20} /> Add Expense
          </button>
        </div>
      </div>

      {/* Integrated History Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <h2 className="text-gradient">Transaction History</h2>
          <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
             <button onClick={() => setShowFilters(!showFilters)} className="btn-primary" style={{ background: showFilters ? 'rgba(124,58,237,0.15)' : 'var(--bg-secondary)', color: showFilters ? 'var(--accent-primary)' : 'var(--text-secondary)', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                <Filter size={14}/> Filters
             </button>
             <button onClick={handleToggleDeleted} className="btn-primary" style={{ background: showDeleted ? 'rgba(239,68,68,0.15)' : 'var(--bg-secondary)', color: showDeleted ? 'var(--danger)' : 'var(--text-secondary)', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                {showDeleted ? <EyeOff size={14} /> : <Eye size={14} />} {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
             </button>
             <button onClick={exportPDF} className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}><Download size={14}/> PDF</button>
             <button onClick={exportExcel} className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}><Download size={14}/> Excel</button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="glass-panel animate-fade-in" style={{ padding: '16px', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Type</label>
              <select className="input-base" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={filterType} onChange={e => {
                setFilterType(e.target.value);
                setFilterCategory('all');
              }}>
                <option value="all">All</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Category</label>
              <select className="input-base" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {categories
                  .filter(c => filterType === 'all' || String(c.transaction_type || 'expense').toLowerCase() === String(filterType).toLowerCase() || c.transaction_type === 'both')
                  .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Sort</label>
              <select className="input-base" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="date_desc">Newest</option>
                <option value="date_asc">Oldest</option>
                <option value="amount_desc">High Amount</option>
                <option value="amount_asc">Low Amount</option>
                <option value="income_high">Highest Income</option>
                <option value="expense_high">Highest Expense</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>From</label>
              <input type="date" className="input-base" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>To</label>
              <input type="date" className="input-base" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        )}

        {/* List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {loadingHistory ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading transactions...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {displayedTransactions.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions found.</p> : (
                <>
                  {(showAllTransactions ? displayedTransactions : displayedTransactions.slice(0, 5)).map(tx => {
                    const isDeleted = tx.deleted_at !== null;
                    return (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', paddingBottom: '14px', borderBottom: '1px solid var(--glass-border)', opacity: isDeleted ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: tx.transaction_type === 'income' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: tx.transaction_type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                            <IndianRupee size={16} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.95rem' }}>{tx.category?.name || 'General'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {new Date(tx.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {tx.source_or_description || 'No description'} · {tx.payment_method}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                          <div style={{ color: tx.transaction_type === 'income' ? 'var(--success)' : 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>
                            {tx.transaction_type === 'income' ? '+' : '-'} ₹{tx.amount}
                          </div>
                          {!isDeleted && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => openEditModal(tx)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                              <button onClick={() => handleDelete(tx.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                          )}
                          {isDeleted && <span style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700 }}>DELETED</span>}
                        </div>
                      </div>
                    );
                  })}
                  {displayedTransactions.length > 5 && (
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <button onClick={() => setShowAllTransactions(!showAllTransactions)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', color: 'var(--accent-primary)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
                        {showAllTransactions ? 'Show Less' : 'Show More'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {user && (
        <TransactionModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          userId={user.id} 
          transactionToEdit={selectedTx}
          initialType={initialType}
          onSuccess={() => { fetchData(user.id, showDeleted); fetchNotifications(user.id); setRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
};

export default Dashboard;
