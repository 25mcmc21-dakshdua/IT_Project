import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Save, ArrowLeft, Plus, Trash2, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
  const [formData, setFormData] = useState({
    id: '', name: '', course: '', student_type: 'hosteller',
    hostel_name: '', semester: '', phone_number: '',
    email: '', registration_number: '', scholarship_amount: '',
    profile_image: '', profile_image_base64: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [newExpName, setNewExpName] = useState('');
  const [newIncName, setNewIncName] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUserId(parsedUser.id);
      
      // 1. Initial Load from LocalStorage (Fallback)
      setFormData(prev => ({
        ...prev,
        id: parsedUser.id,
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        student_type: parsedUser.student_type || 'hosteller',
        registration_number: parsedUser.registration_number || ''
      }));

      // 2. Fetch fresh, detailed data from backend
      axios.get(`/api/users/${parsedUser.id}`)
        .then(res => {
          const u = res.data;
          setFormData({
            id: u.id,
            name: u.name || '',
            course: u.course || '',
            student_type: u.student_type || 'hosteller',
            hostel_name: u.hostel_name || '',
            semester: u.semester || '',
            phone_number: u.phone_number || '',
            email: u.email || '',
            registration_number: u.registration_number || '',
            scholarship_amount: u.scholarship_amount || '',
            profile_image: u.profile_image || '',
            profile_image_base64: ''
          });
        })
        .catch(err => console.error("Failed to fetch user profile", err));

      axios.get(`/api/categories/${parsedUser.id}`)
        .then(res => setCategories(res.data))
        .catch(err => console.error("Failed to fetch categories", err));
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    // Validation
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(formData.name)) {
      setError('Name can only contain alphabets and spaces');
      setLoading(false);
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (formData.phone_number && !phoneRegex.test(formData.phone_number)) {
      setError('enter valid phone number');
      setLoading(false);
      return;
    }

    if (formData.semester && parseInt(formData.semester) < 1) {
      setError('Semester must be a positive number starting from 1');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.put(`/api/users/${userId}`, formData);
      localStorage.setItem('user', JSON.stringify(res.data));
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profile_image_base64: reader.result as string, profile_image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateIncomeCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newIncName.trim()) return;
    try {
      await axios.post('/api/categories', {
        name: newIncName,
        type: 'custom',
        transaction_type: 'income',
        user_id: userId
      });
      setNewIncName('');
      const res = await axios.get(`/api/categories/${userId}`);
      setCategories(res.data);
    } catch (e) { alert('Error creating category'); }
  };

  const handleCreateExpenseCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newExpName.trim()) return;
    try {
      await axios.post('/api/categories', {
        name: newExpName,
        type: 'custom',
        transaction_type: 'expense',
        user_id: userId
      });
      setNewExpName('');
      const res = await axios.get(`/api/categories/${userId}`);
      setCategories(res.data);
    } catch (e) { alert('Error creating category'); }
  };

  const handleDeleteCategory = async (catId: number) => {
    if(!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`/api/categories/${catId}`);
      const res = await axios.get(`/api/categories/${userId}`);
      setCategories(res.data);
    } catch (e) { alert('Failed to delete category'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '40px 24px', maxWidth: '800px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-gradient">My Profile</h1>
        </div>
        <button onClick={handleLogout} className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--danger)' }}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="glass-panel" style={{ padding: '30px' }}>
        {message && <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', textAlign: 'center' }}>{message}</div>}
        {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
        {/* Profile image preview + Local Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '8px' }}>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
              width: 80, height: 80, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              border: '2px solid var(--glass-border)',
              background: 'var(--bg-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative'
            }}>
              {formData.profile_image
                ? <img src={formData.profile_image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '2rem' }}>👤</span>
              }
              <div style={{ position: 'absolute', bottom: 0, background: 'rgba(0,0,0,0.5)', width: '100%', textAlign: 'center', fontSize: '0.6rem', padding: '2px 0', color: 'white' }}>Edit</div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Profile Photo</label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-primary" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>
                Choose Image
              </button>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Select a local photo to upload as your profile picture.</p>
            </div>
          </div>

          <div className="flex-responsive">
            <div className="flex-1">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</label>
              <input 
                type="text" 
                className="input-base" 
                required 
                value={formData.name} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || /^[A-Za-z\s]+$/.test(val)) {
                    setFormData({...formData, name: val});
                  }
                }} 
              />
            </div>
            <div className="flex-1">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Phone Number</label>
              <input 
                type="text" 
                className="input-base" 
                value={formData.phone_number} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || /^\d{0,10}$/.test(val)) {
                    setFormData({...formData, phone_number: val});
                  }
                }} 
              />
            </div>
          </div>

          <div className="flex-responsive">
            <div className="flex-1">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Course</label>
              <input 
                type="text" 
                className="input-base" 
                value={formData.course} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || /^[A-Za-z\s]+$/.test(val)) {
                    setFormData({...formData, course: val});
                  }
                }} 
              />
            </div>
            <div className="flex-1">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Semester</label>
              <input 
                type="number" 
                className="input-base" 
                value={formData.semester} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 12)) {
                    setFormData({...formData, semester: val});
                  }
                }} 
              />
            </div>
            <div className="flex-1">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Scholarship / Monthly Aid Amount (₹)</label>
              <input type="number" className="input-base" value={formData.scholarship_amount} onChange={e => setFormData({...formData, scholarship_amount: e.target.value})} placeholder="0.00" />
            </div>
          </div>

          <div className="flex-responsive">
            <div className="flex-1">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Student Type</label>
              <select className="input-base" value={formData.student_type} onChange={e => setFormData({...formData, student_type: e.target.value})}>
                <option value="hosteller">Hosteller</option>
                <option value="day_scholar">Day Scholar</option>
              </select>
            </div>
            <div className="flex-1">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Hostel Name</label>
              <input type="text" className="input-base" disabled={formData.student_type !== 'hosteller'} value={formData.student_type === 'hosteller' ? formData.hostel_name : ''} onChange={e => setFormData({...formData, hostel_name: e.target.value})} />
            </div>
          </div>

          <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
             <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Account Details (Read Only)</h4>
             <div className="flex-responsive">
               <div className="flex-1">
                 <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
                 <input type="text" className="input-base" disabled value={formData.email} />
               </div>
               <div className="flex-1">
                 <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Reg. Number</label>
                 <input type="text" className="input-base" disabled value={formData.registration_number} />
               </div>
             </div>
          </div>

          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }} disabled={loading}>
            <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '30px', marginTop: '30px' }}>
          <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Custom Categories</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px' }}>Create your own personalized categories to track spending dynamically across the app.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {/* Income Section */}
            <div className="glass-panel" style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
              <h4 style={{ color: 'var(--success)', marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 Income Categories
              </h4>
              
              <form onSubmit={handleCreateIncomeCategory} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input type="text" className="input-base" placeholder="New income category..." required value={newIncName} onChange={e => setNewIncName(e.target.value)} style={{ flex: 1 }} />
                <button type="submit" className="btn-primary" style={{ background: 'var(--success)' }}><Plus size={16}/> Add</button>
              </form>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {categories.filter(c => c.transaction_type === 'income' || c.transaction_type === 'both').map(c => (
                  <div key={c.id} style={{ padding: '6px 14px', background: c.type === 'custom' ? 'var(--accent-gradient)' : 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{c.name} {c.type === 'predefined' && <small style={{opacity:0.6}}>(Default)</small>}</span>
                    <button onClick={() => handleDeleteCategory(c.id)} style={{background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', padding: 0, display:'flex'}}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Section */}
            <div className="glass-panel" style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
              <h4 style={{ color: 'var(--danger)', marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 Expense Categories
              </h4>

              <form onSubmit={handleCreateExpenseCategory} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input type="text" className="input-base" placeholder="New expense category..." required value={newExpName} onChange={e => setNewExpName(e.target.value)} style={{ flex: 1 }} />
                <button type="submit" className="btn-primary" style={{ background: 'var(--danger)' }}><Plus size={16}/> Add</button>
              </form>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {categories.filter(c => c.transaction_type === 'expense' || c.transaction_type === 'both').map(c => (
                  <div key={c.id} style={{ padding: '6px 14px', background: c.type === 'custom' ? 'var(--accent-gradient)' : 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{c.name} {c.type === 'predefined' && <small style={{opacity:0.6}}>(Default)</small>}</span>
                    <button onClick={() => handleDeleteCategory(c.id)} style={{background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer', padding: 0, display:'flex'}}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Profile;
