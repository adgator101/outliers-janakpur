import { useState, useEffect } from 'react';
import { MapPin, Shield, AlertTriangle, Users, Filter, Search, Calendar } from 'lucide-react';

// Mock data for the map regions
const mockRegions = [
  {
    id: '1',
    name: 'Downtown District',
    coordinates: { lat: 27.7172, lng: 85.3240 },
    safetyScore: 25,
    incidentCount: 23,
    riskLevel: 'high',
    lastIncident: '2024-12-06T10:30:00Z',
    population: 15000
  },
  {
    id: '2',
    name: 'Industrial Zone',
    coordinates: { lat: 27.7200, lng: 85.3300 },
    safetyScore: 45,
    incidentCount: 18,
    riskLevel: 'medium',
    lastIncident: '2024-12-05T15:45:00Z',
    population: 8000
  },
  {
    id: '3',
    name: 'Residential Area A',
    coordinates: { lat: 27.7150, lng: 85.3180 },
    safetyScore: 72,
    incidentCount: 8,
    riskLevel: 'low',
    lastIncident: '2024-12-04T09:15:00Z',
    population: 12000
  },
  {
    id: '4',
    name: 'Commercial Hub',
    coordinates: { lat: 27.7180, lng: 85.3280 },
    safetyScore: 58,
    incidentCount: 15,
    riskLevel: 'medium',
    lastIncident: '2024-12-06T14:20:00Z',
    population: 6000
  },
  {
    id: '5',
    name: 'Educational District',
    coordinates: { lat: 27.7220, lng: 85.3200 },
    safetyScore: 84,
    incidentCount: 4,
    riskLevel: 'low',
    lastIncident: '2024-12-03T11:00:00Z',
    population: 9000
  }
];

const recentIncidents = [
  {
    id: '1',
    type: 'Physical Violence',
    location: 'Downtown District',
    time: '2 hours ago',
    severity: 'high',
    status: 'pending'
  },
  {
    id: '2',
    type: 'Harassment',
    location: 'Commercial Hub',
    time: '4 hours ago',
    severity: 'medium',
    status: 'validated'
  },
  {
    id: '3',
    type: 'Unsafe Area',
    location: 'Industrial Zone',
    time: '6 hours ago',
    severity: 'medium',
    status: 'resolved'
  },
  {
    id: '4',
    type: 'Poor Lighting',
    location: 'Residential Area A',
    time: '8 hours ago',
    severity: 'low',
    status: 'pending'
  }
];

export default function MapDashboard() {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [filterRisk, setFilterRisk] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('regions'); // 'regions' or 'incidents'

  const filteredRegions = mockRegions.filter(region => {
    const matchesSearch = region.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRisk === 'all' || region.riskLevel === filterRisk;
    return matchesSearch && matchesFilter;
  });

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'validated': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Geographic Overview</h1>
          <p className="text-gray-600 mt-1">Regional safety analysis and incident mapping</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('regions')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'regions' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Regions
            </button>
            <button
              onClick={() => setViewMode('incidents')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'incidents' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Incidents
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Placeholder */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Interactive Safety Map</h3>
              
              {/* Map Controls */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search regions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="low">Low Risk</option>
                </select>
              </div>
            </div>

            {/* Map Placeholder with Region Pins */}
            <div className="bg-gray-50 rounded-lg h-96 relative border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Interactive Map Component</p>
                <p className="text-gray-500 text-sm mt-1">Mapbox/Leaflet integration will be rendered here</p>
              </div>

              {/* Mock Region Markers */}
              <div className="absolute inset-0 p-8">
                {filteredRegions.map((region, index) => (
                  <button
                    key={region.id}
                    onClick={() => setSelectedRegion(region)}
                    className={`absolute w-5 h-5 rounded-full border-3 border-white shadow-xl cursor-pointer hover:scale-125 transition-all hover:shadow-2xl ${
                      region.riskLevel === 'high' ? 'bg-red-500 hover:bg-red-600' :
                      region.riskLevel === 'medium' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
                    }`}
                    style={{
                      left: `${20 + (index * 15)}%`,
                      top: `${30 + (index * 10)}%`
                    }}
                    title={region.name}
                  />
                ))}
              </div>
            </div>

            {/* Map Legend */}
            <div className="flex items-center justify-center space-x-6 mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-600">High Risk</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs text-gray-600">Medium Risk</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-600">Low Risk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Region Details */}
          {selectedRegion ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Region Details</h3>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedRegion.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Population: {selectedRegion.population.toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedRegion.safetyScore}
                    </div>
                    <div className="text-xs text-gray-600">Safety Score</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedRegion.incidentCount}
                    </div>
                    <div className="text-xs text-gray-600">Incidents</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Risk Level</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(selectedRegion.riskLevel)}`}>
                    {selectedRegion.riskLevel.toUpperCase()}
                  </span>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Last Incident</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {new Date(selectedRegion.lastIncident).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-center py-8">
                <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Select a Region</p>
                <p className="text-gray-500 text-sm mt-1">Click on a region marker to view details</p>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className={`p-1 rounded ${getSeverityColor(incident.severity)}`}>
                    <AlertTriangle className="h-3 w-3" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {incident.type}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{incident.location}</p>
                    <p className="text-xs text-gray-500">{incident.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Safe Zones</span>
                </div>
                <span className="font-semibold text-green-600">
                  {filteredRegions.filter(r => r.riskLevel === 'low').length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Medium Risk</span>
                </div>
                <span className="font-semibold text-orange-600">
                  {filteredRegions.filter(r => r.riskLevel === 'medium').length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-600">High Risk</span>
                </div>
                <span className="font-semibold text-red-600">
                  {filteredRegions.filter(r => r.riskLevel === 'high').length}
                </span>
              </div>
              
              <div className="pt-3 mt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Total Population</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {filteredRegions.reduce((sum, r) => sum + r.population, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}