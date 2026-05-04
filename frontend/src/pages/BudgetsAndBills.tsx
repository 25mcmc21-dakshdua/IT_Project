import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, RefreshCw, Trash2, ArrowLeft, IndianRupee, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const BudgetsAndBills: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'budgets' | 'bills'>('budgets');
  const [budgets, setBudgets] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category_id: '', period_type: 'monthly', amount_limit: '', start_date: '', end_date: '' });
  
  const [showAddBill, setShowAddBill] = useState(false);
  const [billForm, setBillForm] = useState({ category_id: '', title: '', amount: '', due_date: '', is_auto_post: false });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchData(parsedUser.id);
    }
  }, []);

  const fetchData = async (userId: number) => {
    try {
      const [bdgRes, billsRes, catRes] = await Promise.all([
        axios.get(`/api/budgets/${userId}`),
        axios.get(`/api/recurring-bills/${userId}`),
        axios.get(`/api/categories/${userId}`)
      ]);
      setBudgets(bdgRes.data);
      setBills(billsRes.data);
      setCategories(catRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteBudget = async (id: number) => {
    if(window.confirm('Delete this budget limit?')) {
      await axios.delete(`/api/budgets/${id}`);
      fetchData(user.id);
    }
  };

  const deleteBill = async (id: number) => {
    if(window.confirm('Delete this recurring bill?')) {
      await axios.delete(`/api/recurring-bills/${id}`);
      fetchData(user.id);
    }
  };

  const toggleBill = async (id: number) => {
    await axios.put(`/api/recurring-bills/${id}/toggle`);
    fetchData(user.id);
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/budgets', { ...budgetForm, user_id: user.id, category_id: budgetForm.category_id || null });
      setShowAddBudget(false);
      fetchData(user.id);
    } catch (e) { alert('Error adding budget'); }
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/recurring-bills', { ...billForm, user_id: user.id });
      setShowAddBill(false);
      fetchData(user.id);
    } catch (e) { alert('Error adding bill. Pick a category!'); }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Limits...</div>;

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px', maxWidth: '1000px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-gradient">Controls & Automation</h1>
      </header>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          className="btn-primary" 
          onClick={() => setActiveTab('budgets')}
          style={{ background: activeTab === 'budgets' ? 'var(--accent-gradient)' : 'var(--bg-secondary)', flex: 1 }}>
          <Shield size={18}/> Budgets
        </button>
        <button 
          className="btn-primary" 
          onClick={() => setActiveTab('bills')}
          style={{ background: activeTab === 'bills' ? 'var(--accent-gradient)' : 'var(--bg-secondary)', flex: 1 }}>
          <RefreshCw size={18}/> Recurring Bills
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '30px' }}>
        {activeTab === 'budgets' ? (
          <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: 'var(--text-primary)' }}>Active Budgets</h3>
                <button onClick={() => setShowAddBudget(!showAddBudget)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}><Plus size={14}/> Add Budget</button>
             </div>

             {showAddBudget && (
               <form onSubmit={handleAddBudget} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
                 <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                   <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category</label>
                      <select className="input-base" style={{ padding: '8px' }} value={budgetForm.category_id} onChange={e => setBudgetForm({...budgetForm, category_id: e.target.value})}>
                        <option value="">Overall Limit</option>
                        {categories.filter(c => c.transaction_type === 'expense' || c.transaction_type === 'both').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                   </div>
                   <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Period Type</label>
                     <select className="input-base" style={{ padding: '8px' }} value={budgetForm.period_type} onChange={e => setBudgetForm({...budgetForm, period_type: e.target.value})}>
                       <option value="weekly">Weekly</option>
                       <option value="monthly">Monthly</option>
                     </select>
                   </div>
                   <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Limit Amount</label>
                     <input type="number" step="0.01" className="input-base" style={{ padding: '8px' }} required value={budgetForm.amount_limit} onChange={e => setBudgetForm({...budgetForm, amount_limit: e.target.value})} />
                   </div>
                 </div>
                 <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                   <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Start Date</label>
                     <input type="date" className="input-base" style={{ padding: '8px' }} required value={budgetForm.start_date} onChange={e => setBudgetForm({...budgetForm, start_date: e.target.value})} />
                   </div>
                   <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>End Date</label>
                     <input type="date" className="input-base" style={{ padding: '8px' }} required value={budgetForm.end_date} onChange={e => setBudgetForm({...budgetForm, end_date: e.target.value})} />
                   </div>
                 </div>
                 <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>Save Budget</button>
               </form>
             )}

             {budgets.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No active budgets found.</p> : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {budgets.map(b => (
                   <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                     <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.category ? b.category.name : 'Overall'} Limit</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {b.period_type.charAt(0).toUpperCase() + b.period_type.slice(1)} • Expires: {b.end_date}
                        </div>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                       <div style={{ fontWeight: 600, color: 'var(--warning)', display: 'flex', alignItems: 'center' }}>
                         <IndianRupee size={14}/> {b.amount_limit}
                       </div>
                       <button onClick={() => deleteBudget(b.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: 'var(--text-primary)' }}>Recurring Bills</h3>
                <button onClick={() => setShowAddBill(!showAddBill)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}><Plus size={14}/> Add Bill</button>
             </div>

             {showAddBill && (
               <form onSubmit={handleAddBill} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
                 <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                   <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Title</label>
                     <input type="text" className="input-base" style={{ padding: '8px' }} required value={billForm.title} onChange={e => setBillForm({...billForm, title: e.target.value})} />
                   </div>
                   <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount</label>
                     <input type="number" step="0.01" className="input-base" style={{ padding: '8px' }} required value={billForm.amount} onChange={e => setBillForm({...billForm, amount: e.target.value})} />
                   </div>
                   <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category</label>
                      <select className="input-base" style={{ padding: '8px' }} required value={billForm.category_id} onChange={e => setBillForm({...billForm, category_id: e.target.value})}>
                        <option value="">Select...</option>
                        {categories.filter(c => c.transaction_type === 'expense' || c.transaction_type === 'both').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                   </div>
                 </div>
                 <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                   <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Next Due Date</label>
                     <input type="date" className="input-base" style={{ padding: '8px' }} required value={billForm.due_date} onChange={e => setBillForm({...billForm, due_date: e.target.value})} />
                   </div>
                   <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                     <input type="checkbox" checked={billForm.is_auto_post} onChange={e => setBillForm({...billForm, is_auto_post: e.target.checked})} />
                     <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Auto-Pay Transaction?</label>
                   </div>
                 </div>
                 <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>Save Bill</button>
               </form>
             )}

             {bills.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No recurring bills setup.</p> : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {bills.map(b => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                      <div>
                         <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                           {b.title}
                           <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', background: b.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: b.is_active ? 'var(--success)' : 'var(--danger)' }}>
                             {b.is_active ? 'Active' : 'Paused'}
                           </span>
                         </div>
                         <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                           {b.category?.name || 'General'} • Next Due: {b.due_date} • Autopay: {b.is_auto_post ? 'ON' : 'OFF'}
                         </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--danger)', display: 'flex', alignItems: 'center' }}>
                          - <IndianRupee size={14}/> {b.amount}
                        </div>
                        <button
                          onClick={() => toggleBill(b.id)}
                          title={b.is_active ? 'Pause' : 'Resume'}
                          style={{ background: 'none', border: 'none', color: b.is_active ? 'var(--warning)' : 'var(--success)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                          <RefreshCw size={16} />
                        </button>
                        <button
                          onClick={() => deleteBill(b.id)}
                          title="Delete bill"
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                 ))}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetsAndBills;
