import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, ArrowRightLeft } from 'lucide-react';

const Transfers = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const hasFetchedBases = useRef(false);
  const hasFetchedEquipmentTypes = useRef(false);
  const [formData, setFormData] = useState({
    sourceBaseId: '',
    destinationBaseId: '',
    equipmentTypeId: '',
    quantity: '',
  });
  const [filters, setFilters] = useState({
    baseId: user?.baseId || '',
    status: '',
  });

  useEffect(() => {
    if (!hasFetchedBases.current) {
      fetchBases();
      hasFetchedBases.current = true;
    }
    if (!hasFetchedEquipmentTypes.current) {
      fetchEquipmentTypes();
      hasFetchedEquipmentTypes.current = true;
    }
    fetchTransfers();
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

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.baseId) params.append('baseId', filters.baseId);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/transfers?${params.toString()}`);
      setTransfers(response.data.data);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.sourceBaseId === formData.destinationBaseId) {
        alert('Source and destination bases cannot be the same');
        return;
      }
      await api.post('/transfers', {
        ...formData,
        quantity: parseInt(formData.quantity),
      });
      setShowForm(false);
      setFormData({
        sourceBaseId: '',
        destinationBaseId: '',
        equipmentTypeId: '',
        quantity: '',
      });
      fetchTransfers();
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert(error.response?.data?.message || 'Failed to create transfer');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      baseId: user?.baseId || '',
      status: '',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Transfers</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus size={20} />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Add Transfer Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Initiate Transfer</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source Base</label>
              <select
                name="sourceBaseId"
                value={formData.sourceBaseId}
                onChange={(e) => setFormData({ ...formData, sourceBaseId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">Select Source</option>
                {bases.map((base) => (
                  <option key={base.id} value={base.id}>
                    {base.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Destination Base</label>
              <select
                name="destinationBaseId"
                value={formData.destinationBaseId}
                onChange={(e) => setFormData({ ...formData, destinationBaseId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">Select Destination</option>
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
                value={formData.equipmentTypeId}
                onChange={(e) => setFormData({ ...formData, equipmentTypeId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">Select Equipment</option>
                {equipmentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                min="1"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Submit Transfer
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
        <button
          onClick={clearFilters}
          className="mt-4 px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
        >
          Clear Filters
        </button>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Initiated By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-slate-500">
                    No transfers found
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {new Date(transfer.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {transfer.sourceBase.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {transfer.destinationBase.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {transfer.equipmentType.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {transfer.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transfer.status)}`}>
                        {transfer.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {transfer.initiator.username}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transfers;
