import { useState } from 'react';
import { 
  FileText, Eye, Download, Calendar, Image, 
  Activity, Trash2, Edit, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { Modal } from '../../../components/common';

// Mock data - combined photos and scans
const mockFiles = [
  // Photos from progress tracking
  { id: 1, date: '2024-01-15', fileType: 'photo', fileName: 'progress-jan-1.jpg', fileSize: '1.2 MB', uploadedBy: 'Coach Mike', source: 'Progress Tracking' },
  { id: 2, date: '2024-01-15', fileType: 'photo', fileName: 'progress-jan-2.jpg', fileSize: '1.1 MB', uploadedBy: 'Coach Mike', source: 'Progress Tracking' },
  // InBody scans
  { id: 3, date: '2024-01-15', fileType: 'inbody_scan', fileName: 'inbody-jan-2024.pdf', fileSize: '2.4 MB', uploadedBy: 'Coach Mike', source: 'Scans' },
  { id: 4, date: '2024-02-15', fileType: 'inbody_scan', fileName: 'inbody-feb-2024.pdf', fileSize: '2.5 MB', uploadedBy: 'Coach Mike', source: 'Scans' },
  // More photos
  { id: 5, date: '2024-03-15', fileType: 'photo', fileName: 'progress-mar-1.jpg', fileSize: '1.3 MB', uploadedBy: 'Coach Mike', source: 'Progress Tracking' },
  { id: 6, date: '2024-03-15', fileType: 'photo', fileName: 'progress-mar-2.jpg', fileSize: '1.2 MB', uploadedBy: 'Coach Mike', source: 'Progress Tracking' },
  { id: 7, date: '2024-03-15', fileType: 'photo', fileName: 'progress-mar-3.jpg', fileSize: '1.4 MB', uploadedBy: 'Coach Mike', source: 'Progress Tracking' },
  // Styku scan
  { id: 8, date: '2024-03-15', fileType: 'styku_scan', fileName: 'styku-mar-2024.pdf', fileSize: '3.2 MB', uploadedBy: 'Coach Mike', source: 'Scans' },
  // More photos
  { id: 9, date: '2024-04-15', fileType: 'photo', fileName: 'progress-apr-1.jpg', fileSize: '1.1 MB', uploadedBy: 'Coach Mike', source: 'Progress Tracking' },
  // More scans
  { id: 10, date: '2024-04-15', fileType: 'inbody_scan', fileName: 'inbody-apr-2024.pdf', fileSize: '2.6 MB', uploadedBy: 'Coach Mike', source: 'Scans' },
];

const FilesTab = ({ member }) => {
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const itemsPerPage = 50;

  // Filter and sort files
  const filteredFiles = selectedFileType === 'all'
    ? mockFiles
    : selectedFileType === 'photo'
    ? mockFiles.filter(f => f.fileType === 'photo')
    : mockFiles.filter(f => f.fileType.includes('scan'));

  const sortedFiles = [...filteredFiles].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Pagination
  const totalPages = Math.ceil(sortedFiles.length / itemsPerPage);
  const paginatedFiles = sortedFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getFileTypeIcon = (type) => {
    if (type === 'photo') return <Image className="w-5 h-5 text-success-600" />;
    if (type === 'inbody_scan') return <FileText className="w-5 h-5 text-primary-600" />;
    if (type === 'styku_scan') return <Activity className="w-5 h-5 text-accent-600" />;
    return <FileText className="w-5 h-5 text-dark-400" />;
  };

  const getFileTypeBadge = (type) => {
    if (type === 'photo') return 'bg-success-100 text-success-700';
    if (type === 'inbody_scan') return 'bg-primary-100 text-primary-700';
    if (type === 'styku_scan') return 'bg-accent-100 text-accent-700';
    return 'bg-dark-100 text-dark-700';
  };

  const getFileTypeLabel = (type) => {
    if (type === 'photo') return 'Photo';
    if (type === 'inbody_scan') return 'InBody';
    if (type === 'styku_scan') return 'Styku';
    return 'File';
  };

  const handleViewFile = (file) => {
    setSelectedFile(file);
    setShowViewModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-dark-500 to-dark-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Total Files</p>
              <p className="text-3xl font-bold">{mockFiles.length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-success-500 to-success-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Image className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Progress Photos</p>
              <p className="text-3xl font-bold">{mockFiles.filter(f => f.fileType === 'photo').length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">InBody Scans</p>
              <p className="text-3xl font-bold">{mockFiles.filter(f => f.fileType === 'inbody_scan').length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Styku Scans</p>
              <p className="text-3xl font-bold">{mockFiles.filter(f => f.fileType === 'styku_scan').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-dark-800">All Files</h3>
            <p className="text-sm text-dark-500">{sortedFiles.length} files</p>
          </div>
          
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-400" />
            <select 
              className="input-sm"
              value={selectedFileType}
              onChange={(e) => {
                setSelectedFileType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Files</option>
              <option value="photo">Photos Only</option>
              <option value="scan">Scans Only</option>
            </select>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-dark-50 rounded-lg text-sm font-medium text-dark-600 mb-2">
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-3">File Name</div>
          <div className="col-span-1">Size</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Table Rows */}
        {paginatedFiles.length > 0 ? (
          <div className="space-y-2">
            {paginatedFiles.map((file) => (
              <div 
                key={file.id} 
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors items-center"
              >
                {/* Date */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-dark-400" />
                    <p className="font-medium text-dark-800">{file.date}</p>
                  </div>
                </div>

                {/* Type */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    {getFileTypeIcon(file.fileType)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full uppercase ${getFileTypeBadge(file.fileType)}`}>
                      {getFileTypeLabel(file.fileType)}
                    </span>
                  </div>
                </div>

                {/* File Name */}
                <div className="col-span-3">
                  <p className="text-sm text-dark-800 font-medium truncate">{file.fileName}</p>
                </div>

                {/* Size */}
                <div className="col-span-1">
                  <p className="text-sm text-dark-600">{file.fileSize}</p>
                </div>

                {/* Source */}
                <div className="col-span-2">
                  <p className="text-sm text-dark-600">{file.source}</p>
                  <p className="text-xs text-dark-400">{file.uploadedBy}</p>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button 
                    onClick={() => handleViewFile(file)}
                    className="p-2 text-dark-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 text-dark-400 hover:text-success-500 hover:bg-success-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 text-dark-400 hover:text-warning-500 hover:bg-warning-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 text-dark-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-500">No files found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-100">
            <p className="text-sm text-dark-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedFiles.length)} of {sortedFiles.length} files
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-dark-200 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                    currentPage === idx + 1
                      ? 'bg-primary-500 text-white'
                      : 'border border-dark-200 hover:bg-dark-50'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-dark-200 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View File Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={selectedFile?.fileName || 'File Details'}
        size="lg"
      >
        {selectedFile && (
          <div className="space-y-4">
            <div className="aspect-video bg-dark-100 rounded-xl overflow-hidden border-2 border-dark-200 flex items-center justify-center">
              {selectedFile.fileType === 'photo' ? (
                <Image className="w-24 h-24 text-dark-300" />
              ) : (
                <FileText className="w-24 h-24 text-dark-300" />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-dark-500 mb-1">File Type</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full uppercase ${getFileTypeBadge(selectedFile.fileType)}`}>
                  {getFileTypeLabel(selectedFile.fileType)}
                </span>
              </div>
              <div>
                <p className="text-xs text-dark-500 mb-1">File Size</p>
                <p className="font-medium text-dark-800">{selectedFile.fileSize}</p>
              </div>
              <div>
                <p className="text-xs text-dark-500 mb-1">Date</p>
                <p className="font-medium text-dark-800">{selectedFile.date}</p>
              </div>
              <div>
                <p className="text-xs text-dark-500 mb-1">Source</p>
                <p className="font-medium text-dark-800">{selectedFile.source}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowViewModal(false)} className="flex-1 btn-secondary">
                Close
              </button>
              <button className="flex-1 btn-primary">
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FilesTab;

