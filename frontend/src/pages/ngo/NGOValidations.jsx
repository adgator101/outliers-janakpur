import { useState, useEffect } from 'react';
import { incidentAPI, authAPI } from '../../utils/api';
import { 
  CheckCircle, 
  Clock, 
  Search, 
  MapPin,
  TrendingUp,
  FileText,
  Eye,
  X
} from 'lucide-react';

export default function NGOValidations() {
  const [validations, setValidations] = useState([]);
  const [filteredValidations, setFilteredValidations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, validated, pending
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, month
  const [selectedValidation, setSelectedValidation] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    validated: 0,
    pending: 0,
    thisWeek: 0,
    thisMonth: 0,
    avgResponseTime: 0
  });

  const currentUser = authAPI.getCurrentUser();

  useEffect(() => {
    fetchValidations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [validations, searchTerm, statusFilter, timeFilter]);

  const fetchValidations = async () => {
    try {
      const response = await incidentAPI.getAll();
      const allIncidents = response.incidents || [];
      
      // Get all incidents validated by current user + pending ones
      const myValidated = allIncidents.filter(i => i.ngo_validated_by === currentUser.id);
      const pending = allIncidents.filter(i => !i.ngo_validated && !i.admin_validated);
      
      const combined = [
        ...myValidated.map(v => ({ ...v, status: 'validated' })),
        ...pending.map(p => ({ ...p, status: 'pending' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setValidations(combined);
      calculateStats(combined);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching validations:', error);
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const validated = data.filter(v => v.status === 'validated');
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    setStats({
      total: data.length,
      validated: validated.length,
      pending: data.filter(v => v.status === 'pending').length,
      thisWeek: validated.filter(v => new Date(v.created_at) >= weekAgo).length,
      thisMonth: validated.filter(v => new Date(v.created_at) >= monthAgo).length,
      avgResponseTime: '2.3 hrs' // Mock data
    });
  };

  const applyFilters = () => {
    let filtered = [...validations];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = {
        today: new Date(now.setHours(0, 0, 0, 0)),
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }[timeFilter];

      filtered = filtered.filter(v => new Date(v.created_at) >= filterDate);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.region_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.incident_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredValidations(filtered);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Validations</h1>
        <p className="text-gray-600 mt-1">Track and manage your incident validations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Incidents"
          value={stats.total}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Validated"
          value={stats.validated}
          icon={CheckCircle}
          color="green"
          subtitle={`${stats.thisWeek} this week`}
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Avg Response Time"
          value={stats.avgResponseTime}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="validated">Validated</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Time Filter */}
          <div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Validations List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredValidations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No validations found
                  </td>
                </tr>
              ) : (
                filteredValidations.map((validation) => (
                  <tr key={validation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {validation.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{validation.incident_type || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(validation.severity)}`}>
                        {validation.severity || 'medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        <span className="max-w-xs truncate">{validation.region_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {validation.status === 'validated' ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Validated
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                          <Clock className="w-4 h-4 mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(validation.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedValidation(validation)}
                        className="text-green-600 hover:text-green-900 inline-flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedValidation && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Validation Details</h2>
                <button
                  onClick={() => setSelectedValidation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-gray-900">{selectedValidation.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="mt-1 text-gray-900">{selectedValidation.incident_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Severity</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(selectedValidation.severity)}`}>
                      {selectedValidation.severity}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <p className="mt-1 text-gray-900">{selectedValidation.region_name}</p>
              </div>
              {selectedValidation.audits && selectedValidation.audits.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Audit Information</label>
                  <div className="mt-2 space-y-2">
                    {selectedValidation.audits.map((audit, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm">
                          <strong>S_env Score:</strong> {audit.s_env?.toFixed(2) || 'N/A'}
                        </div>
                        {audit.notes && (
                          <div className="text-sm mt-1">
                            <strong>Notes:</strong> {audit.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedValidation(null)}
                className="w-full px-4 py-2 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
