import { useState, useEffect } from 'react';
import { incidentAPI, regionAPI } from '../../utils/api';

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalIncidents: 0,
    highRiskRegions: 0,
    pendingValidations: 0,
    resolvedIncidents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [incidentsData, regionsData] = await Promise.all([
            incidentAPI.getAll(),
            regionAPI.getAll()
        ]);

        const incidents = incidentsData.incidents || [];
        const regions = regionsData.regions || [];

        const pending = incidents.filter(i => !i.admin_validated && !i.ngo_validated).length;
        const resolved = incidents.filter(i => i.status === 'resolved').length;
        const highRisk = regions.filter(r => r.safety_score < 30).length; // Assuming < 30 is high risk

        setStats({
          totalIncidents: incidentsData.total || 0,
          highRiskRegions: highRisk,
          pendingValidations: pending,
          resolvedIncidents: resolved
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
            title="Total Incidents" 
            value={stats.totalIncidents} 
            icon="📝" 
            color="bg-blue-50 text-blue-600"
            border="border-blue-100"
        />
        <StatsCard 
            title="High Risk Zones" 
            value={stats.highRiskRegions} 
            icon="🚨" 
            color="bg-red-50 text-red-600"
            border="border-red-100"
        />
        <StatsCard 
            title="Pending Validation" 
            value={stats.pendingValidations} 
            icon="⏳" 
            color="bg-amber-50 text-amber-600"
            border="border-amber-100"
        />
        <StatsCard 
            title="Resolved Cases" 
            value={stats.resolvedIncidents} 
            icon="✅" 
            color="bg-emerald-50 text-emerald-600"
            border="border-emerald-100"
        />
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all hover:shadow-lg active:scale-95 flex items-center gap-2">
                <span>🗺️</span> View Heatmap
            </button>
            <button className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all hover:border-gray-300 active:scale-95 flex items-center gap-2">
                <span>⚠️</span> Recent Alerts
            </button>
             <button className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all hover:border-gray-300 active:scale-95 flex items-center gap-2">
                <span>📊</span> Generate Report
            </button>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, color, border }) {
    return (
        <div className={`bg-white rounded-2xl p-6 border ${border} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium tracking-wide uppercase mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-xl`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
