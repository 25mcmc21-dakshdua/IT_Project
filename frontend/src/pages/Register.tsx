import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '', registration_number: '', email: '', password: '', 
    course: '', student_type: 'hosteller', hostel_name: '', semester: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Final Validation Checks
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters long, containing one uppercase letter, one digit, and one special character.');
      setLoading(false);
      return;
    }

    if (formData.semester && parseInt(formData.semester) < 1) {
      setError('Semester must be a positive number starting from 1');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/auth/register', formData);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '40px' }}>
        <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '8px', fontSize: '2rem' }}>Create Account</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px' }}>Join the Expense Tracker</p>
        
        {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Reg. Number</label>
              <input type="text" className="input-base" required value={formData.registration_number} onChange={e => setFormData({...formData, registration_number: e.target.value})} />
            </div>
          </div>

          <div className="flex-responsive">
            <div className="flex-1">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" className="input-base" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="flex-1">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
              <input type="password" className="input-base" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
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
          </div>

          <div className="flex-responsive">
            <div className="flex-1">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Student Type</label>
              <select className="input-base" value={formData.student_type} onChange={e => setFormData({...formData, student_type: e.target.value})}>
                <option value="hosteller">Hosteller</option>
                <option value="day_scholar">Day Scholar</option>
              </select>
            </div>
            {formData.student_type === 'hosteller' && (
              <div className="flex-1">
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Hostel Name</label>
                <input type="text" className="input-base" required value={formData.hostel_name} onChange={e => setFormData({...formData, hostel_name: e.target.value})} />
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            <UserPlus size={18} /> {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Sign In here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
