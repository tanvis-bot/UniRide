import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import {
  AlertTriangleIcon,
  BadgeCheckIcon,
  CarFrontIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  MapIcon,
  NavigationIcon,
  UsersIcon } from
'lucide-react';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { StatCard } from '../../components/dashboard/StatCard';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';

const COLORS = ['#2563EB', '#12AE7E', '#0B1424', '#E11D48'];

export function AdminDashboard() {
  const stats = useAsync(() => api.admin.stats(), []);

  if (stats.loading) return <LoadingState label="Loading platform statistics…" />;
  if (stats.error || !stats.data)
  return <ErrorState message={stats.error ?? 'Unable to load stats.'} onRetry={stats.refetch} />;

  const t = stats.data.totals;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        description="Users, verification queues and ride activity across UniRide."
        action={
        <Link to="/admin/driver-verification">
            <Button>Review verifications</Button>
          </Link>
        } />
      

      {t.pendingVerifications > 0 &&
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangleIcon className="h-5 w-5 text-amber-600" aria-hidden />
            <p className="text-sm font-semibold text-amber-900">
              {t.pendingVerifications} verification
              {t.pendingVerifications === 1 ? '' : 's'} awaiting review
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/driver-verification">
              <Button variant="secondary" size="sm">
                Drivers
              </Button>
            </Link>
            <Link to="/admin/student-verification">
              <Button variant="secondary" size="sm">
                Students
              </Button>
            </Link>
          </div>
        </div>
      }

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={t.users}
          hint={`${t.passengers} passengers · ${t.drivers} drivers`}
          icon={<UsersIcon className="h-5 w-5" aria-hidden />}
          to="/admin/users"
          tone="primary" />
        
        <StatCard
          label="Verified drivers"
          value={t.verifiedDrivers}
          hint={`of ${t.drivers} registered drivers`}
          icon={<BadgeCheckIcon className="h-5 w-5" aria-hidden />}
          to="/admin/drivers" />
        
        <StatCard
          label="Verified students"
          value={t.verifiedStudents}
          hint="Receiving the student discount"
          icon={<GraduationCapIcon className="h-5 w-5" aria-hidden />}
          to="/admin/student-verification" />
        
        <StatCard
          label="Total bookings"
          value={t.bookings}
          hint="Across all rides"
          icon={<ClipboardListIcon className="h-5 w-5" aria-hidden />}
          to="/admin/bookings" />
        
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total rides"
          value={t.rides}
          icon={<MapIcon className="h-5 w-5" aria-hidden />}
          to="/admin/rides" />
        
        <StatCard
          label="Active rides"
          value={t.activeRides}
          hint="Currently on the road"
          icon={<NavigationIcon className="h-5 w-5" aria-hidden />}
          to="/admin/rides" />
        
        <StatCard
          label="Completed rides"
          value={t.completedRides}
          icon={<CarFrontIcon className="h-5 w-5" aria-hidden />} />
        
        <StatCard
          label="Open issues"
          value={t.openIssues + t.sosIncidents}
          hint={`${t.sosIncidents} SOS incident${t.sosIncidents === 1 ? '' : 's'}`}
          icon={<AlertTriangleIcon className="h-5 w-5" aria-hidden />}
          to="/admin/issues" />
        
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader
            title="Rides and bookings this week"
            description="Daily volume across the platform." />
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.data.activity} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    fontSize: 12
                  }} />
                
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="rides" fill="#0B1424" radius={[6, 6, 0, 0]} name="Rides" />
                <Bar dataKey="bookings" fill="#12AE7E" radius={[6, 6, 0, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Ride status mix" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.data.rideMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}>
                  
                  {stats.data.rideMix.map((entry, index) =>
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    fontSize: 12
                  }} />
                
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>);

}