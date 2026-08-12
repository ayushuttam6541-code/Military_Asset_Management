import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserPlus, LogIn } from 'lucide-react';
import api from '../services/api';

const Register = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'BASE_COMMANDER',
    baseId: '',
  });
  const [bases, setBases] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const fetchPromise = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    isMounted.current = true;

    const fetchBases = async () => {
      // Cancel any existing fetch
      if (fetchPromise.current) {
        return;
      }

      try {
        const response = await api.get('/bases');
        if (isMounted.current) {
          setBases(response.data.data);
        }
      } catch (error) {
        if (isMounted.current) {
          console.error('Error fetching bases:', error);
        }
      }
    };

    fetchBases();

    return () => {
      isMounted.current = false;
      fetchPromise.current = null;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.role !== 'ADMIN' && !formData.baseId) {
      setError('Base selection is required for this role');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        baseId: formData.role === 'ADMIN' ? null : formData.baseId,
      });

      // Auto login after registration
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-slate-900 p-3 rounded-full">
              <UserPlus size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">
            Create Account
          </h1>
          <p className="text-center text-slate-500 mb-8">
            Register to access the Military Asset Management System
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength="8"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                placeholder="Create a password (min 8 characters)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength="8"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                placeholder="Confirm your password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value, baseId: '' })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="BASE_COMMANDER">Base Commander</option>
                <option value="LOGISTICS_OFFICER">Logistics Officer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {formData.role !== 'ADMIN' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Base
                </label>
                <select
                  value={formData.baseId}
                  onChange={(e) => setFormData({ ...formData, baseId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="">Select a base</option>
                  {bases.map((base) => (
                    <option key={base.id} value={base.id}>
                      {base.name} - {base.location}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-slate-900 font-medium hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
