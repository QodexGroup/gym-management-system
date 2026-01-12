import { useState, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import { Badge, Modal } from '../../components/common';
import {
  Plus,
  Search,
  Edit,
  Trash,
  Dumbbell,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Alert } from '../../utils/alert';
import { Toast } from '../../utils/alert';
import {
  PT_TRAINING_STYLES,
  PT_TRAINING_STYLE_LABELS,
  PT_PACKAGE_STATUS,
  PT_PACKAGE_STATUS_LABELS,
} from '../../constants/ptConstants';
import {
  usePtPackages,
  useCreatePtPackage,
  useUpdatePtPackage,
  useDeletePtPackage,
} from '../../hooks/usePtPackages';
import { formatCurrency } from '../../utils/formatters';
import { mockPtPackages } from '../../data/mockData';

const PtPackageList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStyle, setFilterStyle] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    packageName: '',
    description: '',
    trainingStyle: '',
    numberOfSessions: '',
    durationPerSession: '',
    price: '',
    features: [],
    status: PT_PACKAGE_STATUS.ACTIVE,
  });

  // Build query options
  const packageOptions = useMemo(() => {
    const filters = {};
    if (searchQuery) {
      filters.packageName = searchQuery;
    }
    if (filterStyle !== 'all') {
      filters.trainingStyle = filterStyle;
    }
    if (filterStatus !== 'all') {
      filters.status = filterStatus;
    }

    return {
      page: currentPage,
      pagelimit: 12,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    };
  }, [currentPage, searchQuery, filterStyle, filterStatus]);

  // Use mock data directly
  const [packagesList, setPackagesList] = useState([...mockPtPackages]);
  const loading = false;

  // Apply filters and pagination to mock data
  const filteredPackages = useMemo(() => {
    let filtered = [...packagesList];
    
    if (searchQuery) {
      filtered = filtered.filter(pkg => 
        pkg.packageName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterStyle !== 'all') {
      filtered = filtered.filter(pkg => pkg.trainingStyle === filterStyle);
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(pkg => pkg.status === filterStatus);
    }
    
    return filtered;
  }, [packagesList, searchQuery, filterStyle, filterStatus]);

  // Pagination
  const pagelimit = 12;
  const start = (currentPage - 1) * pagelimit;
  const end = start + pagelimit;
  const packages = filteredPackages.slice(start, end);
  const pagination = {
    current_page: currentPage,
    last_page: Math.ceil(filteredPackages.length / pagelimit),
    per_page: pagelimit,
    total: filteredPackages.length,
    from: filteredPackages.length > 0 ? start + 1 : 0,
    to: Math.min(end, filteredPackages.length),
  };

  const isSubmitting = false;

  // Reset to page 1 when filters change
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStyleFilterChange = (value) => {
    setFilterStyle(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setSelectedPackage(pkg);
      setFormData({
        packageName: pkg.packageName || '',
        description: pkg.description || '',
        trainingStyle: pkg.trainingStyle || '',
        numberOfSessions: pkg.numberOfSessions?.toString() || '',
        durationPerSession: pkg.durationPerSession?.toString() || '',
        price: pkg.price?.toString() || '',
        features: pkg.features || [],
        status: pkg.status || PT_PACKAGE_STATUS.ACTIVE,
      });
    } else {
      setSelectedPackage(null);
      setFormData({
        packageName: '',
        description: '',
        trainingStyle: '',
        numberOfSessions: '',
        durationPerSession: '',
        price: '',
        features: [],
        status: PT_PACKAGE_STATUS.ACTIVE,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPackage(null);
    setFormData({
      packageName: '',
      description: '',
      trainingStyle: '',
      numberOfSessions: '',
      durationPerSession: '',
      price: '',
      features: [],
      status: PT_PACKAGE_STATUS.ACTIVE,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const packageData = {
      id: selectedPackage ? selectedPackage.id : packagesList.length + 1,
      packageName: formData.packageName,
      description: formData.description,
      trainingStyle: formData.trainingStyle,
      numberOfSessions: parseInt(formData.numberOfSessions),
      durationPerSession: parseInt(formData.durationPerSession),
      price: parseFloat(formData.price),
      features: formData.features,
      status: formData.status,
      createdAt: selectedPackage ? selectedPackage.createdAt : new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    if (selectedPackage) {
      setPackagesList(prev => prev.map(pkg => pkg.id === selectedPackage.id ? packageData : pkg));
      Toast.success('PT Package updated successfully');
    } else {
      setPackagesList(prev => [...prev, packageData]);
      Toast.success('PT Package created successfully');
    }
    handleCloseModal();
  };

  const handleDeletePackage = async (packageId) => {
    const result = await Alert.confirmDelete();

    if (!result.isConfirmed) {
      return;
    }

    setPackagesList(prev => prev.filter(pkg => pkg.id !== packageId));
    Toast.success('PT Package deleted successfully');
  };

  const toggleFeature = (feature) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const availableFeatures = [
    'Nutrition Guide',
    'Progress Reports',
    'Custom Workout Plan',
    'Body Composition Analysis',
  ];

  if (loading) {
    return (
      <Layout title="PT Packages" subtitle="Manage personal training packages">
        <div className="flex items-center justify-center h-64">
          <p className="text-dark-500">Loading PT packages...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="PT Packages" subtitle="Manage personal training packages">
      {/* PT Packages Grid */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="Search packages..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 placeholder-dark-400 rounded-lg focus:bg-dark-600 focus:border-primary-500 outline-none transition-colors"
              />
            </div>
            <select
              value={filterStyle}
              onChange={(e) => handleStyleFilterChange(e.target.value)}
              className="px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:border-primary-500 outline-none"
            >
              <option value="all" className="bg-dark-700 text-dark-50">All Styles</option>
              {Object.entries(PT_TRAINING_STYLE_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="bg-dark-700 text-dark-50">
                  {label}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:border-primary-500 outline-none"
            >
              <option value="all" className="bg-dark-700 text-dark-50">All Status</option>
              {Object.entries(PT_PACKAGE_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="bg-dark-700 text-dark-50">
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add PT Package
          </button>
        </div>

        {/* Packages Grid */}
        {packages.length === 0 && !loading ? (
          <div className="text-center py-12">
            <Dumbbell className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <p className="text-dark-400">No PT packages found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-dark-800 rounded-xl border border-dark-700 p-6 hover:border-primary-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-dark-50 mb-1">
                      {pkg.packageName}
                    </h3>
                    <Badge variant="default" className="mb-2">
                      {PT_TRAINING_STYLE_LABELS[pkg.trainingStyle] || pkg.trainingStyle}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(pkg)}
                      className="p-2 text-dark-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit package"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="p-2 text-dark-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                      title="Delete package"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {pkg.description && (
                  <p className="text-sm text-dark-300 mb-4 line-clamp-2">
                    {pkg.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-dark-300">
                    <Dumbbell className="w-4 h-4 text-primary-500" />
                    <span>{pkg.numberOfSessions} Sessions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-dark-300">
                    <Clock className="w-4 h-4 text-primary-500" />
                    <span>{pkg.durationPerSession} minutes per session</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-dark-700">
                  <div>
                    <p className="text-2xl font-bold text-primary-500">
                      {formatCurrency(pkg.price)}
                    </p>
                  </div>
                  <Badge
                    variant={pkg.status === PT_PACKAGE_STATUS.ACTIVE ? 'success' : 'default'}
                  >
                    {PT_PACKAGE_STATUS_LABELS[pkg.status] || pkg.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-dark-200">
            <div className="text-sm text-dark-300">
              Showing {pagination.from} to {pagination.to} of {pagination.total} packages
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-dark-200 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-dark-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm text-dark-300">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                disabled={currentPage === pagination.last_page}
                className="p-2 rounded-lg border border-dark-200 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-dark-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={selectedPackage ? 'Edit PT Package' : 'Add New PT Package'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Package Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Strength Training Package"
              value={formData.packageName}
              onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows="3"
              placeholder="Enter package description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Training Style *</label>
              <select
                className="input"
                value={formData.trainingStyle}
                onChange={(e) => setFormData({ ...formData, trainingStyle: e.target.value })}
                required
              >
                <option value="">Select training style</option>
                {Object.entries(PT_TRAINING_STYLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Number of Sessions *</label>
              <input
                type="number"
                className="input"
                placeholder="e.g., 10"
                min="1"
                value={formData.numberOfSessions}
                onChange={(e) => setFormData({ ...formData, numberOfSessions: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Duration per Session (minutes) *</label>
              <input
                type="number"
                className="input"
                placeholder="e.g., 60"
                min="15"
                step="15"
                value={formData.durationPerSession}
                onChange={(e) => setFormData({ ...formData, durationPerSession: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Price (₱) *</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Features (Optional)</label>
            <div className="space-y-2">
              {availableFeatures.map((feature) => (
                <label key={feature} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-dark-300">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={PT_PACKAGE_STATUS.ACTIVE}
                  checked={formData.status === PT_PACKAGE_STATUS.ACTIVE}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-4 h-4 text-primary-600"
                />
                <span>{PT_PACKAGE_STATUS_LABELS[PT_PACKAGE_STATUS.ACTIVE]}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={PT_PACKAGE_STATUS.INACTIVE}
                  checked={formData.status === PT_PACKAGE_STATUS.INACTIVE}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-4 h-4 text-primary-600"
                />
                <span>{PT_PACKAGE_STATUS_LABELS[PT_PACKAGE_STATUS.INACTIVE]}</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : selectedPackage
                ? 'Save Changes'
                : 'Create Package'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default PtPackageList;

