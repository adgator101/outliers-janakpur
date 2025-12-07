import { useState, useEffect } from 'react';
import { incidentAPI, authAPI } from '../../utils/api';

export default function IncidentManagement() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = authAPI.getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const isNGO = user?.role === 'ngo';
  const canValidate = isAdmin || isNGO;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [validationType, setValidationType] = useState(null); // 'admin' or 'ngo'
  const [validationNote, setValidationNote] = useState("");

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

  const handleValidateClick = (id, type) => {
      setSelectedIncidentId(id);
      setValidationType(type);
      setValidationNote(""); // Reset notes
      setShowModal(true);
  };

  const submitValidation = async () => {
    if (!validationNote.trim()) return;

    try {
      if (validationType === 'admin') {
        await incidentAPI.validateAdmin(selectedIncidentId, validationNote);
      } else {
        await incidentAPI.validateNGO(selectedIncidentId, validationNote);
      }
      setShowModal(false);
      fetchIncidents(); // Refresh
    } catch (error) {
      alert("Validation failed: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this incident?\nThis action cannot be undone.")) return;
    try {
      await incidentAPI.delete(id);
      fetchIncidents();
    } catch (error) {
        alert("Delete failed: " + error.message);
    }
  };

  if (loading) return (
      <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
  );

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Reported Incidents</h3>
            <p className="text-sm text-gray-500 mt-1">Review and validate incoming reports</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600">Total: {incidents.length}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-wider">Type</th>
                <th className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-wider">Details</th>
                <th className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-wider">Validation</th>
                <th className="px-8 py-4 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap">
                     <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wide ${
                         incident.incident_type === 'physical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                     }`}>
                      {incident.incident_type}
                     </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-[240px]">{incident.description}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{new Date(incident.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                        {incident.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5">
                        {incident.admin_validated ? (
                            <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Admin Verified
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Pending Admin
                            </span>
                        )}
                        {incident.ngo_validated ? (
                            <span className="flex items-center gap-1.5 text-blue-600 text-xs font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> NGO Verified
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Pending NGO
                            </span>
                        )}
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        {/* Validation Buttons */}
                        {isAdmin && !incident.admin_validated && (
                            <button 
                                onClick={() => handleValidateClick(incident.id, 'admin')}
                                className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-md text-xs font-bold transition-colors border border-emerald-100"
                            >
                                Validate
                            </button>
                        )}
                        {canValidate && !incident.ngo_validated && !isAdmin && (
                            <button 
                                onClick={() => handleValidateClick(incident.id, 'ngo')}
                                className="text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md text-xs font-bold transition-colors border border-blue-100"
                            >
                                Validate
                            </button>
                        )}
                        
                        {/* Delete Button */}
                        {isAdmin && (
                            <button 
                                onClick={() => handleDelete(incident.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded"
                                title="Delete Incident"
                            >
                                🗑️
                            </button>
                        )}
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">Validation Review</h3>
                    <p className="text-sm text-gray-500 mt-1">Please provide notes for this validation.</p>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Validation Notes <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={validationNote}
                            onChange={(e) => setValidationNote(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[120px] resize-none"
                            placeholder="Describe your verification findings..."
                            autoFocus
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            This creates a permanent audit record. Validating increases safety score weightage by 5x.
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    <button 
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg text-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={submitValidation}
                        disabled={!validationNote.trim()}
                        className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                    >
                        Confirm Validation
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
