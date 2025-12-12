import { useState } from 'react';
import { Activity, Scale, Target, Calendar, TrendingUp, TrendingDown, FileText, Plus, Ruler, Camera } from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Modal } from '../../../components/common';

const ProgressTab = ({ member, progressLogs }) => {
  const [showAddProgressModal, setShowAddProgressModal] = useState(false);
  const weightData = progressLogs.map((log) => ({
    date: log.date,
    weight: log.weight,
    bodyFat: log.bodyFat,
  }));

  const latestLog = progressLogs[0];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-primary-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Scale className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Current Weight</p>
              <p className="text-2xl font-bold text-dark-800">{latestLog?.weight || '--'} kg</p>
              {progressLogs.length > 1 && latestLog && (
                <div className="flex items-center gap-1 mt-1">
                  {latestLog.weight < progressLogs[1].weight ? (
                    <>
                      <TrendingDown className="w-4 h-4 text-success-500" />
                      <span className="text-xs text-success-600">
                        -{(progressLogs[1].weight - latestLog.weight).toFixed(1)} kg
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 text-warning-500" />
                      <span className="text-xs text-warning-600">
                        +{(latestLog.weight - progressLogs[1].weight).toFixed(1)} kg
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-accent-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent-100 rounded-xl">
              <Activity className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Body Fat</p>
              <p className="text-2xl font-bold text-dark-800">{latestLog?.bodyFat || '--'}%</p>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-success-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success-100 rounded-xl">
              <Target className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Total Visits</p>
              <p className="text-2xl font-bold text-dark-800">{member.totalVisits}</p>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-warning-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-warning-100 rounded-xl">
              <Calendar className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Last Update</p>
              <p className="text-lg font-bold text-dark-800">{latestLog?.date || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-800">Weight Progress</h3>
            <button onClick={() => setShowAddProgressModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Log
            </button>
          </div>
          <div className="h-64">
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Area type="monotone" dataKey="weight" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-400">
                No progress data yet
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">Body Fat Progress</h3>
          <div className="h-64">
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bodyFat" stroke="#d946ef" strokeWidth={2} dot={{ fill: '#d946ef' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-400">
                No progress data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Measurements */}
      {latestLog?.measurements && (
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-800 mb-4">Body Measurements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <Ruler className="w-6 h-6 text-primary-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-dark-800">{latestLog.measurements.chest} cm</p>
              <p className="text-sm text-dark-500">Chest</p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <Ruler className="w-6 h-6 text-accent-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-dark-800">{latestLog.measurements.waist} cm</p>
              <p className="text-sm text-dark-500">Waist</p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <Ruler className="w-6 h-6 text-success-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-dark-800">{latestLog.measurements.arms} cm</p>
              <p className="text-sm text-dark-500">Arms</p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <Ruler className="w-6 h-6 text-warning-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-dark-800">{latestLog.measurements.thighs} cm</p>
              <p className="text-sm text-dark-500">Thighs</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress History */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-800 mb-4">Progress History</h3>
        {progressLogs.length > 0 ? (
          <div className="space-y-3">
            {progressLogs.map((log) => (
              <div key={log.id} className="p-4 bg-dark-50 rounded-xl border-l-4 border-primary-500">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-dark-400" />
                      <span className="font-medium text-dark-800">{log.date}</span>
                      <span className="text-sm text-dark-400">by {log.trainer}</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span><strong>Weight:</strong> {log.weight} kg</span>
                      <span><strong>Body Fat:</strong> {log.bodyFat}%</span>
                    </div>
                    {log.notes && (
                      <p className="text-sm text-dark-500 mt-2 flex items-start gap-2">
                        <FileText className="w-4 h-4 mt-0.5" />
                        {log.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-dark-400 text-center py-8">No progress logs recorded yet</p>
        )}
      </div>

      {/* Add Progress Modal */}
      <Modal
        isOpen={showAddProgressModal}
        onClose={() => setShowAddProgressModal(false)}
        title="Add Progress Log"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" step="0.1" className="input" placeholder="82.5" />
            </div>
            <div>
              <label className="label">Body Fat %</label>
              <input type="number" step="0.1" className="input" placeholder="18.5" />
            </div>
          </div>
          <div>
            <label className="label">Body Measurements (cm)</label>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <input type="number" className="input" placeholder="Chest" />
                <p className="text-xs text-dark-400 mt-1">Chest</p>
              </div>
              <div>
                <input type="number" className="input" placeholder="Waist" />
                <p className="text-xs text-dark-400 mt-1">Waist</p>
              </div>
              <div>
                <input type="number" className="input" placeholder="Arms" />
                <p className="text-xs text-dark-400 mt-1">Arms</p>
              </div>
              <div>
                <input type="number" className="input" placeholder="Thighs" />
                <p className="text-xs text-dark-400 mt-1">Thighs</p>
              </div>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} placeholder="Add notes about progress..." />
          </div>
          <div>
            <label className="label">Upload Photos (Optional)</label>
            <div className="border-2 border-dashed border-dark-200 rounded-xl p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
              <Camera className="w-12 h-12 text-dark-300 mx-auto mb-3" />
              <p className="text-dark-500">Click to upload progress photos</p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowAddProgressModal(false)} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Save Progress
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProgressTab;

