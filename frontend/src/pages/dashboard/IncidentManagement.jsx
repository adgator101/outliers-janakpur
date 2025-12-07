import { useState, useEffect, useMemo } from 'react';
import { incidentAPI, authAPI } from '../../utils/api';
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
  FileText
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
  const [validationForm, setValidationForm] = useState({
    notes: ''
  });

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
    setValidationForm({
      notes: ''
    });
    setShowValidationModal(true);
  };

  const submitValidation = async () => {
    if (!validationForm.notes.trim() || validationForm.notes.length < 20) {
      alert("Please provide detailed validation notes (minimum 20 characters)");
      return;
    }

    try {
      const validationData = {
        validation_notes: validationForm.notes
      };

      if (validationType === 'admin') {
        await incidentAPI.validateAdmin(selectedIncident.id, JSON.stringify(validationData));
      } else {
        await incidentAPI.validateNGO(selectedIncident.id, JSON.stringify(validationData));
      }
      
      setShowValidationModal(false);
      fetchIncidents();
    } catch (error) {
      alert("Validation failed: " + error.message);
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
      case 'physical': return '🚨';
      case 'harassment': return '⚠️';
      case 'unsafe_area': return '🚧';
      case 'poor_lighting': return '💡';
      default: return '📍';
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
                      <div className="text-2xl">{getTypeIcon(incident.incident_type)}</div>
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
                          className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-all shadow-md hover:shadow-lg"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Validate
                        </button>
                      )}
                      
                      {/* NGO Validation */}
                      {isNGO && !incident.ngo_validated && (
                        <button 
                          onClick={() => handleValidateClick(incident, 'ngo')}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all shadow-md hover:shadow-lg"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verify
                        </button>
                      )}

                      {/* View Details */}
                      <button className="p-1.5 text-indigo-500 hover:text-white hover:bg-indigo-600 rounded-lg transition-all shadow-sm hover:shadow-md">
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Delete (Admin Only) */}
                      {isAdmin && (
                        <button 
                          onClick={() => handleDelete(incident.id)}
                          className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded-lg transition-all shadow-sm hover:shadow-md"
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

      {/* Enhanced Validation Modal */}
      {showValidationModal && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-800/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-indigo-600 px-6 py-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">Professional Incident Validation</h3>
                  <p className="text-indigo-100 text-sm mt-1">
                    {validationType === 'admin' ? 'Administrative' : 'NGO'} validation for incident #{selectedIncident.id.slice(-6)}
                  </p>
                </div>
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center text-xl font-light leading-none transition-all"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {/* Incident Summary */}
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getTypeIcon(selectedIncident.incident_type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(selectedIncident.severity)}`}>
                        {selectedIncident.severity?.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {selectedIncident.incident_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 font-medium">{selectedIncident.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Reported by: {selectedIncident.user_email}</span>
                      <span>Date: {new Date(selectedIncident.created_at).toLocaleDateString()}</span>
                      <span>Current Impact: {selectedIncident.final_weight?.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation Form */}
              <div className="px-6 py-6 space-y-6">
                {/* Validation Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Detailed Validation Assessment <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={validationForm.notes}
                    onChange={(e) => setValidationForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm min-h-[120px] resize-none"
                    placeholder="Provide comprehensive validation notes including:
• Verification of incident details and location
• Assessment of evidence quality and reliability  
• Risk analysis and potential community impact
• Recommendations for follow-up actions
• Any additional relevant observations"
                    required
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      Minimum 20 characters required for professional documentation
                    </p>
                    <p className={`text-xs font-medium ${validationForm.notes.length >= 20 ? 'text-green-600' : 'text-red-500'}`}>
                      {validationForm.notes.length}/20+
                    </p>
                  </div>
                </div>

                {/* Impact Notice */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-indigo-600 mr-2 mt-0.5" />
                    <div className="text-sm">
                      <h4 className="font-semibold text-indigo-900 mb-1">Validation Impact</h4>
                      <p className="text-indigo-700">
                        {validationType === 'admin' ? 'Administrative' : 'NGO'} validation will increase this incident's 
                        safety score impact by up to 5x, significantly affecting regional safety ratings and resource allocation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
              <button 
                onClick={() => setShowValidationModal(false)}
                className="px-6 py-2 text-gray-600 font-medium border border-gray-300 hover:bg-gray-100 hover:border-gray-400 rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
              <button 
                onClick={submitValidation}
                disabled={!validationForm.notes.trim() || validationForm.notes.length < 20}
                className="px-8 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Complete Validation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}