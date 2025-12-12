import Layout from '../../components/layout/Layout';
import { StatCard, Avatar, Badge } from '../../components/common';
import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { mockMembers, mockAppointments, mockCheckIns } from '../../data/mockData';
import { formatCurrency } from '../../utils/formatters';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const TrainerDashboard = () => {
  // Mock trainer-specific data
  const trainerStats = {
    assignedMembers: 15,
    appointmentsToday: 5,
    checkedInToday: 8,
    pendingProgressLogs: 3,
    monthlyCommission: 2500,
    sessionsCompleted: 45,
  };

  const commissionData = [
    { week: 'Week 1', commission: 580 },
    { week: 'Week 2', commission: 720 },
    { week: 'Week 3', commission: 650 },
    { week: 'Week 4', commission: 550 },
  ];

  // Filter appointments for trainer (Mike Johnson - trainerId: 1)
  const myAppointments = mockAppointments.filter((apt) => apt.trainerId === 1);
  const myMembers = mockMembers.filter((m) => m.trainer === 'Mike Johnson');

  return (
    <Layout title="My Dashboard" subtitle="Welcome back, Mike! Here's your overview.">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="My Members"
          value={trainerStats.assignedMembers}
          icon={Users}
          color="primary"
          subtitle="Assigned to you"
        />
        <StatCard
          title="Today's Appointments"
          value={trainerStats.appointmentsToday}
          icon={Calendar}
          color="accent"
          subtitle="5 scheduled"
        />
        <StatCard
          title="Checked In Today"
          value={trainerStats.checkedInToday}
          icon={CheckCircle}
          color="success"
          subtitle="Your members"
        />
        <StatCard
          title="Pending Progress"
          value={trainerStats.pendingProgressLogs}
          icon={AlertCircle}
          color="warning"
          subtitle="Logs to update"
        />
      </div>

      {/* Commission Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Monthly Commission"
          value={formatCurrency(trainerStats.monthlyCommission)}
          icon={DollarSign}
          trend="up"
          trendValue="+12%"
          color="success"
        />
        <StatCard
          title="Sessions Completed"
          value={trainerStats.sessionsCompleted}
          icon={Target}
          color="primary"
          subtitle="This month"
        />
        <StatCard
          title="Performance Score"
          value="4.9/5"
          icon={TrendingUp}
          color="accent"
          subtitle="Based on reviews"
        />
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Commission Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-6">Weekly Commission</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commissionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="commission"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-dark-800">Today's Schedule</h3>
            <a href="/calendar" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
              View Calendar →
            </a>
          </div>
          <div className="space-y-3">
            {myAppointments
              .filter((apt) => apt.date === '2024-12-09')
              .map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-dark-50 to-transparent rounded-xl border-l-4 border-primary-500"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary-600">{appointment.time}</p>
                      <p className="text-xs text-dark-400">{appointment.duration}min</p>
                    </div>
                    <div>
                      <p className="font-medium text-dark-800">{appointment.member}</p>
                      <p className="text-sm text-dark-500">{appointment.type}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      appointment.status === 'confirmed'
                        ? 'success'
                        : appointment.status === 'pending'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            {myAppointments.filter((apt) => apt.date === '2024-12-09').length === 0 && (
              <p className="text-center text-dark-400 py-8">No appointments today</p>
            )}
          </div>
        </div>
      </div>

      {/* My Members */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-dark-800">My Assigned Members</h3>
          <a href="/customers" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
            View All →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myMembers.slice(0, 6).map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 p-4 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors cursor-pointer"
            >
              <Avatar
                src={member.avatar}
                name={member.name}
                size="lg"
                status={member.membershipStatus === 'active' ? 'online' : 'offline'}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-dark-800 truncate">{member.name}</p>
                <p className="text-sm text-dark-500">{member.membership}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    size="sm"
                    variant={
                      member.membershipStatus === 'active'
                        ? 'success'
                        : member.membershipStatus === 'expiring'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {member.membershipStatus}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Progress Logs */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-dark-800">Pending Progress Updates</h3>
          <a href="/customers/progress" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
            View All →
          </a>
        </div>
        <div className="space-y-4">
          {myMembers.slice(0, 3).map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-warning-50 border border-warning-100 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <Avatar src={member.avatar} name={member.name} size="md" />
                <div>
                  <p className="font-medium text-dark-800">{member.name}</p>
                  <p className="text-sm text-dark-500">
                    Last updated: {member.lastCheckIn?.split(' ')[0] || 'N/A'}
                  </p>
                </div>
              </div>
              <button className="btn-primary text-sm py-2 px-4">
                Update Progress
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default TrainerDashboard;
