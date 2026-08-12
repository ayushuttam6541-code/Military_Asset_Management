import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, UserCheck, AlertTriangle } from 'lucide-react';

const Assignments = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assignments');
  const [assignments, setAssignments] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showExpenditureForm, setShowExpenditureForm] = useState(false);
  const hasFetchedBases = useRef(false);
  const hasFetchedEquipmentTypes = useRef(false);
  const [assignmentForm, setAssignmentForm] = useState({
    baseId: user?.baseId || '',
    equipmentTypeId: '',
    personnelName: '',
    quantity: '',
  });
  const [expenditureForm, setExpenditureForm] = useState({
    baseId: user?.baseId || '',
    equipmentTypeId: '',
    quantity: '',
    reason: '',
  });
  const [filters, setFilters] = useState({
    baseId: user?.baseId || '',
    equipmentTypeId: '',
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
    fetchData();
  }, [activeTab, filters]);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.baseId) params.append('baseId', filters.baseId);
      if (filters.equipmentTypeId) params.append('equipmentTypeId', filters.equipmentTypeId);
      if (filters.status) params.append('status', filters.status);

      if (activeTab === 'assignments') {
        const response = await api.get(`/assignments?${params.toString()}`);
        setAssignments(response.data.data);
      } else {
        const response = await api.get(`/expenditures?${params.toString()}`);
        setExpenditures(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assignments', {
        ...assignmentForm,
        quantity: parseInt(assignmentForm.quantity),
      });
      setShowAssignmentForm(false);
      setAssignmentForm({
        baseId: user?.baseId || '',
        equipmentTypeId: '',
        personnelName: '',
        quantity: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert(error.response?.data?.message || 'Failed to create assignment');
    }
  };

  const handleExpenditureSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenditures', {
        ...expenditureForm,
        quantity: parseInt(expenditureForm.quantity),
      });
      setShowExpenditureForm(false);
      setExpenditureForm({
        baseId: user?.baseId || '',
        equipmentTypeId: '',
        quantity: '',
        reason: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating expenditure:', error);
      alert(error.response?.data?.message || 'Failed to create expenditure');
    }
  };

  const handleReturnAssignment = async (id) => {
    if (!confirm('Are you sure you want to return this assignment?')) return;
    try {
      await api.patch(`/assignments/${id}/return`);
      fetchData();
    } catch (error) {
      console.error('Error returning assignment:', error);
      alert('Failed to return assignment');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      baseId: user?.baseId || '',
      equipmentTypeId: '',
      status: '',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'RETURNED':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Assignments & Expenditures</h2>
        {activeTab === 'assignments' && user?.role !== 'LOGISTICS_OFFICER' && (
          <button
            onClick={() => setShowAssignmentForm(!showAssignmentForm)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus size={20} />
            <span>New Assignment</span>
          </button>
        )}
        {activeTab === 'expenditures' && user?.role !== 'LOGISTICS_OFFICER' && (
          <button
            onClick={() => setShowExpenditureForm(!showExpenditureForm)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus size={20} />
            <span>Record Expenditure</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'assignments'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Assignments
        </button>
        <button
          onClick={() => setActiveTab('expenditures')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'expenditures'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Expenditures
        </button>
      </div>

      {/* Assignment Form */}
      {showAssignmentForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Assign Equipment</h3>
          <form onSubmit={handleAssignmentSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Base</label>
              <select
                name="baseId"
                value={assignmentForm.baseId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, baseId: e.target.value })}
                disabled={user?.role === 'BASE_COMMANDER'}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">Select Base</option>
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
                value={assignmentForm.equipmentTypeId}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, equipmentTypeId: e.target.value })}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Personnel Name</label>
              <input
                type="text"
                name="personnelName"
                value={assignmentForm.personnelName}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, personnelName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={assignmentForm.quantity}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, quantity: e.target.value })}
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
                Submit Assignment
              </button>
              <button
                type="button"
                onClick={() => setShowAssignmentForm(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenditure Form */}
      {showExpenditureForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Record Expenditure</h3>
          <form onSubmit={handleExpenditureSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Base</label>
              <select
                name="baseId"
                value={expenditureForm.baseId}
                onChange={(e) => setExpenditureForm({ ...expenditureForm, baseId: e.target.value })}
                disabled={user?.role === 'BASE_COMMANDER'}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">Select Base</option>
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
                value={expenditureForm.equipmentTypeId}
                onChange={(e) => setExpenditureForm({ ...expenditureForm, equipmentTypeId: e.target.value })}
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
                value={expenditureForm.quantity}
                onChange={(e) => setExpenditureForm({ ...expenditureForm, quantity: e.target.value })}
                min="1"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
              <input
                type="text"
                name="reason"
                value={expenditureForm.reason}
                onChange={(e) => setExpenditureForm({ ...expenditureForm, reason: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Record Expenditure
              </button>
              <button
                type="button"
                onClick={() => setShowExpenditureForm(false)}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          {activeTab === 'assignments' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>
          )}
        </div>
        <button
          onClick={clearFilters}
          className="mt-4 px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
        >
          Clear Filters
        </button>
      </div>

      {/* Assignments Table */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Assigned Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Base
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Personnel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
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
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-slate-500">
                      No assignments found
                    </td>
                  </tr>
                ) : (
                  assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {new Date(assignment.assignedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {assignment.base.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {assignment.equipmentType.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {assignment.personnelName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {assignment.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {assignment.status === 'ACTIVE' && user?.role !== 'LOGISTICS_OFFICER' && (
                          <button
                            onClick={() => handleReturnAssignment(assignment.id)}
                            className="text-slate-600 hover:text-slate-900"
                          >
                            Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenditures Table */}
      {activeTab === 'expenditures' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Base
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : expenditures.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-slate-500">
                      No expenditures found
                    </td>
                  </tr>
                ) : (
                  expenditures.map((expenditure) => (
                    <tr key={expenditure.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {new Date(expenditure.expendedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {expenditure.base.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {expenditure.equipmentType.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {expenditure.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {expenditure.reason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
