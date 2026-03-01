import { useMemo, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { Modal, SearchAndFilter, Pagination } from '../../components/common';
import {
  Dumbbell,
  Clock,
  Plus,
} from 'lucide-react';
import { Alert } from '../../utils/alert';
import {
  usePtPackages,
  useDeletePtPackage,
} from '../../hooks/usePtPackages';
import { useAccountLimit } from '../../hooks/useAccountLimit';
import { useAuth } from '../../context/AuthContext';
import { usePtCategories } from '../../hooks/usePtCategories';
import { usePagination } from '../../hooks/usePagination';
import { formatCurrency } from '../../utils/formatters';
import { PT_DURATION_OPTIONS } from '../../constants/ptConstants';
import { GridDesign } from '../../components/Grid';
import PtPackageForm from './forms/PtPackageForm';

const PtPackageList = () => {
  const { fetchUserData } = useAuth();
  const { currentPage, setCurrentPage, goToPrev, goToNext } = usePagination(1);
  const { canCreate: canAddPackage } = useAccountLimit('pt_packages');

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Fetch packages with pagination
  const { data, isLoading: loading } = usePtPackages({
    page: currentPage,
    relations: 'category',
  });
  const { data: categories = [] } = usePtCategories({ pagelimit: 0 });
  const deleteMutation = useDeletePtPackage();

  const packages = data?.data || [];
  const pagination = data?.pagination;

  // Filter packages 
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
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
  }, [packages, searchQuery, filterCategoryId]);

  /* --------------------------------------------------
     HANDLERS
  -------------------------------------------------- */
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

  const handleFormSubmit = async () => {
    await fetchUserData();
    handleCloseModal();
  };

  const handleDeletePackage = async (packageId) => {
    const result = await Alert.confirmDelete();

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(packageId);
      await fetchUserData();
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
        <div className="mb-6">
          <SearchAndFilter
            searchValue={searchQuery}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search packages..."
            filterValue={filterCategoryId}
            onFilterChange={handleCategoryFilterChange}
            filterOptions={categories}
            filterLabel="All Categories"
            onAddClick={() => handleOpenModal()}
            addButtonLabel="Add PT Package"
            addButtonIcon={Plus}
            addButtonDisabled={!canAddPackage}
          />
        </div>
        <GridDesign
          type="GridDesignTwo"
          items={filteredPackages}
          columns={3}
          renderCard={(pkg) => ({
            title: pkg.packageName,
            badge: pkg.category?.categoryName || pkg.categoryName,
            text: pkg.description,
            footer: formatCurrency(pkg.price),
            labels: [
              { icon: Dumbbell, label: `${pkg.numberOfSessions} Sessions` },
              {
                icon: Clock,
                label:
                  PT_DURATION_OPTIONS.find(
                    (opt) => opt.value === pkg.durationPerSession
                  )?.label || `${pkg.durationPerSession} minutes per session`,
              },
            ],
            actions: {
              onEdit: () => handleOpenModal(pkg),
              onDelete: () => handleDeletePackage(pkg.id),
            },
          })}
        />

        {/* Empty state */}
        {!loading && filteredPackages.length === 0 && (
          <div className="text-center py-12 text-dark-400">
            No packages found matching your criteria
          </div>
        )}

        {/* Pagination */}
        {pagination?.lastPage > 1 && (
          <Pagination
            currentPage={currentPage}
            lastPage={pagination?.lastPage}
            from={pagination?.from}
            to={pagination?.to}
            total={pagination?.total}
            onPrev={goToPrev}
            onNext={() => goToNext(pagination?.lastPage)}
          />
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
