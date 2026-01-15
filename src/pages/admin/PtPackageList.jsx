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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Alert } from '../../utils/alert';
import {
  usePtPackages,
  useDeletePtPackage,
} from '../../hooks/usePtPackages';
import { usePtCategories } from '../../hooks/usePtCategories';
import { formatCurrency } from '../../utils/formatters';
import { PT_DURATION_OPTIONS } from '../../constants/ptConstants';
import PtPackageForm from './forms/PtPackageForm';

const PtPackageList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // React Query hooks - fetch all packages without filters
  const { data: packagesData, isLoading: loading } = usePtPackages({
    pagelimit: 0,
    relations: 'category',
  });
  const { data: categories = [] } = usePtCategories({ pagelimit: 0 });
  const deleteMutation = useDeletePtPackage();

  const allPackages = packagesData?.data || [];

  // Filter packages client-side
  const filteredPackages = useMemo(() => {
    return allPackages.filter((pkg) => {
      const matchesSearch =
        searchQuery === '' ||
        pkg.packageName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory =
        filterCategoryId === 'all' ||
        pkg.categoryId === parseInt(filterCategoryId) ||
        pkg.category?.id === parseInt(filterCategoryId);

      return matchesSearch && matchesCategory;
    });
  }, [allPackages, searchQuery, filterCategoryId]);

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

  // Reset to page 1 when filters change
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (value) => {
    setFilterCategoryId(value);
    setCurrentPage(1);
  };

  const handleOpenModal = (pkg = null) => {
    setSelectedPackage(pkg);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPackage(null);
  };

  const handleFormSubmit = () => {
    handleCloseModal();
  };

  const handleDeletePackage = async (packageId) => {
    const result = await Alert.confirmDelete();

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(packageId);
    } catch (error) {
      console.error('Error deleting package:', error);
    }
  };

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
              value={filterCategoryId}
              onChange={(e) => handleCategoryFilterChange(e.target.value)}
              className="px-4 py-2.5 bg-dark-700 border border-dark-600 text-dark-50 rounded-lg focus:border-primary-500 outline-none"
            >
              <option value="all" className="bg-dark-700 text-dark-50">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id} className="bg-dark-700 text-dark-50">
                  {category.categoryName}
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
                    {pkg.category && (
                      <Badge variant="default" className="mb-2">
                        {pkg.category.categoryName}
                      </Badge>
                    )}
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
                    <span>
                      {PT_DURATION_OPTIONS.find(opt => opt.value === pkg.durationPerSession)?.label || `${pkg.durationPerSession} minutes`} per session
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-dark-700">
                  <div>
                    <p className="text-2xl font-bold text-primary-500">
                      {formatCurrency(pkg.price)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
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
        <PtPackageForm
          package={selectedPackage}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </Layout>
  );
};

export default PtPackageList;
