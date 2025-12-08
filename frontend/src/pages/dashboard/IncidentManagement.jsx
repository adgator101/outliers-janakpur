import { useState, useEffect, useMemo } from 'react';
import { incidentAPI, authAPI } from '../../utils/api';
import AuditForm from '../../components/AuditForm';
import { 
  CheckCircle, 
  AlertTriangle, 
  MessageCircle,
  Calendar,
  User,
  MapPin,
  Eye,
  Trash2,
  Shield,
  Clock,
  FileText,
  Siren,
  Lightbulb,
  Construction
} from 'lucide-react';

export default function IncidentManagement() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const user = authAPI.getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const isNGO = user?.role === 'ngo';
  const canValidate = isAdmin || isNGO;

  // Enhanced Modal State
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [validationType, setValidationType] = useState(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await incidentAPI.getAll();
      setIncidents(data.incidents || []);
    } catch (error) {
      console.error("Failed to fetch incidents", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  // Filter and sort incidents
  const filteredIncidents = useMemo(() => {
    let filtered = incidents;

    // Filter by tab
    if (selectedTab === 'pending') {
      filtered = filtered.filter(incident => !incident.admin_validated && !incident.ngo_validated);
    } else if (selectedTab === 'validated') {
      filtered = filtered.filter(incident => incident.admin_validated || incident.ngo_validated);
    } else if (selectedTab === 'admin_pending') {
      filtered = filtered.filter(incident => !incident.admin_validated);
    } else if (selectedTab === 'ngo_pending') {
      filtered = filtered.filter(incident => !incident.ngo_validated);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(incident =>
        incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.incident_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.user_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [incidents, selectedTab, searchTerm, sortBy, sortOrder]);

  const getIncidentStats = () => {
    const total = incidents.length;
    const pending = incidents.filter(i => !i.admin_validated && !i.ngo_validated).length;
    const validated = incidents.filter(i => i.admin_validated || i.ngo_validated).length;
    const adminValidated = incidents.filter(i => i.admin_validated).length;
    const ngoValidated = incidents.filter(i => i.ngo_validated).length;
    
    return { total, pending, validated, adminValidated, ngoValidated };
  };

  const handleValidateClick = (incident, type) => {
    setSelectedIncident(incident);
    setValidationType(type);
    setShowValidationModal(true);
  };

  const submitValidation = async (auditData) => {
    try {
      if (validationType === 'admin') {
        await incidentAPI.validateAdmin(selectedIncident.id, auditData);
      } else {
        await incidentAPI.validateNGO(selectedIncident.id, auditData);
      }
      
      setShowValidationModal(false);
      fetchIncidents();
    } catch (error) {
      throw error; // Let AuditForm handle error display
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this incident?\nThis action cannot be undone and will affect region safety scores.")) return;
    
    try {
      await incidentAPI.delete(id);
      fetchIncidents();
    } catch (error) {
      alert("Delete failed: " + error.message);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity] || colors.medium;
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'physical': return <Siren className="h-6 w-6 text-red-500" />;
      case 'harassment': return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      case 'unsafe_area': return <Construction className="h-6 w-6 text-yellow-500" />;
      case 'poor_lighting': return <Lightbulb className="h-6 w-6 text-blue-500" />;
      default: return <MapPin className="h-6 w-6 text-gray-500" />;
    }
  };

  const stats = getIncidentStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-500 font-medium">Loading incident data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-indigo-600 rounded-2xl shadow-lg text-white p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Incident Management</h1>
            <p className="text-indigo-100">Professional incident validation and safety assessment platform</p>
          </div>
          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <Shield className="h-6 w-6" />
            <span className="font-semibold">{user?.role?.toUpperCase()} Portal</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Incidents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Pending Review</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Validated</p>
              <p className="text-2xl font-bold text-green-600">{stats.validated}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-medium">Admin Verified</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.adminValidated}</p>
            </div>
            <Shield className="h-8 w-8 text-indigo-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">NGO Verified</p>
              <p className="text-2xl font-bold text-blue-600">{stats.ngoValidated}</p>
            </div>
            <User className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Incidents' },
              { key: 'pending', label: 'Pending Review' },
              { key: 'validated', label: 'Validated' },
              { key: 'admin_pending', label: 'Admin Pending' },
              { key: 'ngo_pending', label: 'NGO Pending' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedTab === tab.key 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Sort */}
          <div className="flex gap-3 w-full lg:w-auto">
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 lg:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('_');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="created_at_desc">Newest First</option>
              <option value="created_at_asc">Oldest First</option>
              <option value="severity_desc">High Severity First</option>
              <option value="final_weight_desc">High Impact First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Incident Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Reporter & Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Impact & Engagement
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Validation Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIncidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                  {/* Incident Details */}
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">{getTypeIcon(incident.incident_type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                            {incident.severity?.toUpperCase() || 'MEDIUM'}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {incident.incident_type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium line-clamp-2">
                          {incident.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="flex items-center text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {incident.coordinates?.type || 'Location'} 
                          </span>
                          {incident.image_count > 0 && (
                            <span className="flex items-center text-xs text-gray-500">
                              📷 {incident.image_count} photos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Reporter & Date */}
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="flex items-center text-gray-900 font-medium mb-1">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        {incident.user_email?.split('@')[0] || 'Anonymous'}
                      </div>
                      <div className="flex items-center text-gray-500 text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(incident.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center text-gray-500 text-xs mt-1">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        {incident.comment_count || 0} comments
                      </div>
                    </div>
                  </td>

                  {/* Impact & Engagement */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Safety Impact:</span>
                        <span className="text-xs font-semibold text-gray-900">
                          {incident.final_weight?.toFixed(1) || '1.0'}x
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min((incident.final_weight || 1) * 20, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">
                          Engagement: {incident.engagement_score?.toFixed(0) || 0}%
                        </span>
                        <span className="text-gray-500">
                          Validation: {incident.validation_score?.toFixed(0) || 0}%
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Validation Status */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {incident.admin_validated ? (
                          <span className="flex items-center text-emerald-600 text-xs font-medium">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Admin Verified
                          </span>
                        ) : (
                          <span className="flex items-center text-gray-400 text-xs">
                            <Clock className="h-4 w-4 mr-1" />
                            Admin Pending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {incident.ngo_validated ? (
                          <span className="flex items-center text-blue-600 text-xs font-medium">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            NGO Verified
                          </span>
                        ) : (
                          <span className="flex items-center text-gray-400 text-xs">
                            <Clock className="h-4 w-4 mr-1" />
                            NGO Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {/* Admin Validation */}
                      {isAdmin && !incident.admin_validated && (
                        <button 
                          onClick={() => handleValidateClick(incident, 'admin')}
                          className="inline-flex items-center px-3 py-1.5 bg-white text-emerald-600 border-2 border-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-all shadow-md hover:shadow-lg"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Validate
                        </button>
                      )}
                      
                      {/* NGO Validation */}
                      {isNGO && !incident.ngo_validated && (
                        <button 
                          onClick={() => handleValidateClick(incident, 'ngo')}
                          className="inline-flex items-center px-3 py-1.5 bg-white text-blue-600 border-2 border-blue-600 rounded-lg text-xs font-medium hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all shadow-md hover:shadow-lg"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verify
                        </button>
                      )}

                      {/* View Details */}
                      <button className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-600 rounded-lg transition-all shadow-sm hover:shadow-md">
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Delete (Admin Only) */}
                      {isAdmin && (
                        <button 
                          onClick={() => handleDelete(incident.id)}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-600 rounded-lg transition-all shadow-sm hover:shadow-md"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredIncidents.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>

      {/* Audit Form Modal */}
      {showValidationModal && selectedIncident && (
        <AuditForm
          incident={selectedIncident}
          onSubmit={submitValidation}
          onCancel={() => setShowValidationModal(false)}
          userRole={validationType}
        />
      )}
    </div>
  );
}