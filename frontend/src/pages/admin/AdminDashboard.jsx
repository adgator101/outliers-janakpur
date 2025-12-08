import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  MapPin,
  Activity,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { incidentAPI, regionAPI } from '../../utils/api';

// Dummy data for charts
const incidentTrendsData = [
  { month: 'Jan', incidents: 12, validated: 8, resolved: 6 },
  { month: 'Feb', incidents: 19, validated: 15, resolved: 10 },
  { month: 'Mar', incidents: 25, validated: 20, resolved: 18 },
  { month: 'Apr', incidents: 18, validated: 14, resolved: 12 },
  { month: 'May', incidents: 32, validated: 28, resolved: 25 },
  { month: 'Jun', incidents: 28, validated: 22, resolved: 20 }
];

const incidentTypeData = [
  { name: 'Physical Violence', value: 35, count: 42 },
  { name: 'Harassment', value: 28, count: 33 },
  { name: 'Unsafe Areas', value: 22, count: 26 },
  { name: 'Poor Lighting', value: 15, count: 18 }
];

const regionRiskData = [
  { region: 'Downtown', risk: 85, incidents: 23, population: 15000 },
  { region: 'Industrial', risk: 72, incidents: 18, population: 8000 },
  { region: 'Residential A', risk: 45, incidents: 12, population: 12000 },
  { region: 'Residential B', risk: 38, incidents: 9, population: 10000 },
  { region: 'Commercial', risk: 62, incidents: 15, population: 6000 }
];

const validationStatusData = [
  { status: 'Admin Validated', value: 45, color: '#10b981' },
  { status: 'NGO Validated', value: 30, color: '#3b82f6' },
  { status: 'Pending Review', value: 25, color: '#f59e0b' }
];

const COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  secondary: '#64748b',
  muted: '#94a3b8'
};


export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalIncidents: 0,
    highRiskRegions: 0,
    pendingValidations: 0,
    resolvedIncidents: 0,
    validatedIncidents: 0,
    averageResponseTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [incidentsData, regionsData] = await Promise.all([
        incidentAPI.getAll(),
        regionAPI.getAll()
      ]);

      const incidents = incidentsData.incidents || [];
      const regions = regionsData.regions || [];

      const pending = incidents.filter(i => !i.admin_validated && !i.ngo_validated).length;
      const resolved = incidents.filter(i => i.status === 'resolved').length;
      const validated = incidents.filter(i => i.admin_validated || i.ngo_validated).length;
      const highRisk = regions.filter(r => r.safety_score < 40).length;

      setStats({
        totalIncidents: incidents.length || 156,
        highRiskRegions: highRisk || 8,
        pendingValidations: pending || 23,
        resolvedIncidents: resolved || 89,
        validatedIncidents: validated || 124,
        averageResponseTime: 2.4
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
      setStats({
        totalIncidents: 156,
        highRiskRegions: 8,
        pendingValidations: 23,
        resolvedIncidents: 89,
        validatedIncidents: 124,
        averageResponseTime: 2.4
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive safety analytics and management overview</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button className="inline-flex items-center px-4 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <MetricCard
          title="Total Incidents"
          value={stats.totalIncidents}
          change="+12%"
          changeType="increase"
          icon={<Activity className="h-5 w-5" />}
          color="bg-slate-50 text-slate-600"
        />
        
        <MetricCard
          title="Validated"
          value={stats.validatedIncidents}
          change="+8%"
          changeType="increase"
          icon={<CheckCircle className="h-5 w-5" />}
          color="bg-emerald-50 text-emerald-600"
        />
        
        <MetricCard
          title="Pending Review"
          value={stats.pendingValidations}
          change="-5%"
          changeType="decrease"
          icon={<Clock className="h-5 w-5" />}
          color="bg-amber-50 text-amber-600"
        />
        
        <MetricCard
          title="Resolved"
          value={stats.resolvedIncidents}
          change="+15%"
          changeType="increase"
          icon={<Shield className="h-5 w-5" />}
          color="bg-blue-50 text-blue-600"
        />
        
        <MetricCard
          title="High Risk Areas"
          value={stats.highRiskRegions}
          change="stable"
          changeType="stable"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="bg-red-50 text-red-600"
        />
        
        <MetricCard
          title="Avg Response"
          value={`${stats.averageResponseTime}h`}
          change="-18%"
          changeType="decrease"
          icon={<TrendingUp className="h-5 w-5" />}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Incident Trends */}
        <ChartCard title="Incident Trends" subtitle="Monthly incident reporting and resolution patterns">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={incidentTrendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="incidents"
                stackId="1"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.1}
                strokeWidth={2}
                name="Total Incidents"
              />
              <Area
                type="monotone"
                dataKey="validated"
                stackId="2"
                stroke={COLORS.success}
                fill={COLORS.success}
                fillOpacity={0.2}
                strokeWidth={2}
                name="Validated"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Incident Types Distribution */}
        <ChartCard title="Incident Categories" subtitle="Distribution of incident types reported">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={incidentTypeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {incidentTypeData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={[COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger][index]} 
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value}%`, name]}
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color, fontSize: '12px' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bottom Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Regional Risk Analysis */}
        <ChartCard title="Regional Risk Levels" subtitle="Safety scores by geographic area" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={regionRiskData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="region" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => [
                  name === 'risk' ? `${value}% Risk` : `${value} ${name}`,
                  name === 'risk' ? 'Risk Score' : name === 'incidents' ? 'Incidents' : 'Population'
                ]}
              />
              <Bar 
                dataKey="risk" 
                fill={COLORS.danger}
                radius={[4, 4, 0, 0]}
                name="risk"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Validation Status */}
        <ChartCard title="Validation Status" subtitle="Current incident validation overview">
          <div className="space-y-4">
            {validationStatusData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-700 font-medium">{item.status}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{item.value}%</div>
                </div>
              </div>
            ))}
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Validation Rate</span>
                <span className="font-semibold text-emerald-600">75%</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionButton icon={<MapPin />} label="View Heat Map" />
          <ActionButton icon={<Eye />} label="Monitor Live Feed" />
          <ActionButton icon={<BarChart3 />} label="Advanced Analytics" />
          <ActionButton icon={<Users />} label="Manage Validators" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, changeType, icon, color }) {
  const getChangeColor = () => {
    if (changeType === 'increase') return 'text-emerald-600';
    if (changeType === 'decrease') return 'text-red-600';
    return 'text-gray-500';
  };

  const getChangeIcon = () => {
    if (changeType === 'increase') return <TrendingUp className="w-3 h-3" />;
    if (changeType === 'decrease') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <span className={`text-xs font-medium ${getChangeColor()} flex items-center`}>
          {getChangeIcon()} {change}
        </span>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function ActionButton({ icon, label }) {
  return (
    <button className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group">
      <div className="text-gray-500 group-hover:text-blue-600 transition-colors">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
        {label}
      </span>
    </button>
  );
}
