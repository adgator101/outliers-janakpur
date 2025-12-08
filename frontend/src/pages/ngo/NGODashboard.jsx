import { useState, useEffect } from 'react';
import { incidentAPI, authAPI } from '../../utils/api';
import { Heart, CheckCircle, Clock, TrendingUp, MapPin, AlertTriangle } from 'lucide-react';

export default function NGODashboard() {
  const [stats, setStats] = useState(null);
  const [myValidations, setMyValidations] = useState([]);
  const [pendingIncidents, setPendingIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = authAPI.getCurrentUser();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const incidentsRes = await incidentAPI.getAll();
      const allIncidents = incidentsRes.incidents || [];
      
      const validated = allIncidents.filter(i => i.ngo_validated_by === currentUser.id);
      const pending = allIncidents.filter(i => !i.ngo_validated && !i.admin_validated);
      
      setMyValidations(validated);
      setPendingIncidents(pending.slice(0, 10));
      
      setStats({
        totalValidated: validated.length,
        pendingReview: pending.length,
        thisWeek: validated.filter(i => {
          const diffDays = (new Date() - new Date(i.created_at)) / (1000 * 60 * 60 * 24);
          return diffDays <= 7;
        }).length,
        impact: validated.reduce((sum, i) => sum + (i.contribution_score || 0), 0),
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">NGO Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your validation overview</p>
        </div>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Validated</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalValidated}</p>
            <p className="text-xs text-gray-500 mt-2">Lifetime contributions</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Pending Review</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingReview}</p>
            <p className="text-xs text-gray-500 mt-2">Awaiting validation</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">This Week</p>
            <p className="text-3xl font-bold text-gray-900">{stats.thisWeek}</p>
            <p className="text-xs text-gray-500 mt-2">Recent validations</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Community Impact</p>
            <p className="text-3xl font-bold text-gray-900">{stats.impact.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-2">Total score contribution</p>
          </div>
      </div>

      {/* Pending Incidents */}
      <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pending Incidents</h3>
              <p className="text-sm text-gray-600">Incidents awaiting validation</p>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
              {stats.pendingReview} pending
            </span>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingIncidents.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">All caught up! No pending incidents.</p>
              </div>
            ) : (
              pendingIncidents.map((incident) => (
                <div key={incident.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          incident.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          incident.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                          incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {incident.severity}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {incident.description.substring(0, 80)}...
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="text-xs text-gray-500">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {incident.incident_type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(incident.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>

      {/* Recent Validations */}
      <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">My Recent Validations</h3>
            <p className="text-sm text-gray-600">Your latest validation activity</p>
          </div>
          <div className="divide-y divide-gray-200">
            {myValidations.slice(0, 5).map((incident) => (
              <div key={incident.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {incident.description.substring(0, 60)}...
                    </p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-gray-500">
                        Validated on {new Date(incident.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-green-600 font-medium">
                        Score: {incident.contribution_score?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                </div>
              </div>
            ))}
            {myValidations.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No validations yet. Start reviewing incidents!</p>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
