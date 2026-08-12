import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, TrendingDown, Package, ArrowRightLeft, UserCheck, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, onClick, clickable }) => (
  <div
    onClick={onClick}
    className={`
      bg-white rounded-lg shadow-md p-6 border-l-4
      ${color} ${clickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
    `}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      </div>
      <Icon size={32} className="text-slate-400" />
    </div>
  </div>
);

const NetMovementModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold mb-4">Net Movement Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Purchases</span>
            <span className="font-semibold text-green-600">+{data.purchases}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Transfers In</span>
            <span className="font-semibold text-green-600">+{data.transfersIn}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Transfers Out</span>
            <span className="font-semibold text-red-600">-{data.transfersOut}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between items-center font-bold text-lg">
            <span>Net Movement</span>
            <span className={data.netMovement >= 0 ? 'text-green-600' : 'text-red-600'}>
              {data.netMovement >= 0 ? '+' : ''}{data.netMovement}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    baseId: user?.baseId || '',
    equipmentTypeId: '',
    startDate: '',
    endDate: '',
  });
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const hasFetchedBases = useRef(false);
  const hasFetchedEquipmentTypes = useRef(false);

  useEffect(() => {
    if (!hasFetchedBases.current) {
      fetchBases();
      hasFetchedBases.current = true;
    }
    if (!hasFetchedEquipmentTypes.current) {
      fetchEquipmentTypes();
      hasFetchedEquipmentTypes.current = true;
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [filters]);

  const fetchBases = async () => {
    try {
      const response = await api.get('/bases');
      setBases(response.data.data);
    } catch (error) {
      console.error('Error fetching bases:', error);
    }
  };

  const fetchEquipmentTypes = async () => {
    try {
      const response = await api.get('/equipment-types');
      setEquipmentTypes(response.data.data);
    } catch (error) {
      console.error('Error fetching equipment types:', error);
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.baseId) params.append('baseId', filters.baseId);
      if (filters.equipmentTypeId) params.append('equipmentTypeId', filters.equipmentTypeId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/dashboard/metrics?${params.toString()}`);
      setMetrics(response.data.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      baseId: user?.baseId || '',
      equipmentTypeId: '',
      startDate: '',
      endDate: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Base</label>
            <select
              name="baseId"
              value={filters.baseId}
              onChange={handleFilterChange}
              disabled={user?.role === 'BASE_COMMANDER'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="">All Bases</option>
              {bases.map((base) => (
                <option key={base.id} value={base.id}>
                  {base.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Equipment Type</label>
            <select
              name="equipmentTypeId"
              value={filters.equipmentTypeId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="">All Equipment</option>
              {equipmentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.category})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
        </div>
        <button
          onClick={clearFilters}
          className="mt-4 px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
        >
          Clear Filters
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Opening Balance"
          value={metrics?.openingBalance || 0}
          icon={Package}
          color="border-blue-600"
        />
        <StatCard
          title="Net Movement"
          value={metrics?.netMovement || 0}
          icon={TrendingUp}
          color="border-emerald-600"
          onClick={() => setShowModal(true)}
          clickable
        />
        <StatCard
          title="Closing Balance"
          value={metrics?.closingBalance || 0}
          icon={Package}
          color="border-purple-600"
        />
        <StatCard
          title="Assigned"
          value={metrics?.assigned || 0}
          icon={UserCheck}
          color="border-amber-600"
        />
        <StatCard
          title="Expended"
          value={metrics?.expended || 0}
          icon={AlertCircle}
          color="border-red-600"
        />
      </div>

      {/* Net Movement Modal */}
      {metrics && (
        <NetMovementModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          data={{
            purchases: metrics.purchases,
            transfersIn: metrics.transfersIn,
            transfersOut: metrics.transfersOut,
            netMovement: metrics.netMovement,
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
