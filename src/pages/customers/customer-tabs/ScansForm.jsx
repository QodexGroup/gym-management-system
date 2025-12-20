import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FileText, Upload, X } from 'lucide-react';
import { Modal } from '../../../components/common';
import { useCreateCustomerScan, useUpdateCustomerScan, customerScanKeys } from '../../../hooks/useCustomerScan';
import { formatDateForInput } from '../../../utils/formatters';
import { Alert, Toast } from '../../../utils/alert';
import { uploadFile, deleteFile } from '../../../services/fileUploadService';
import { customerFileService } from '../../../services/customerFileService';
import { getFileUrl } from '../../../services/firebaseUrlService';
import { useQueryClient } from '@tanstack/react-query';
import { getInitialScanFormData, mapScanToFormData } from '../../../models/scanModel';

const ScansForm = ({ 
  member, 
  isOpen, 
  onClose, 
  selectedScan,
  onSuccess,
  onEdit
}) => {
  const [formData, setFormData] = useState(getInitialScanFormData());
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Use React Query hooks
  const queryClient = useQueryClient();
  const createScanMutation = useCreateCustomerScan();
  const updateScanMutation = useUpdateCustomerScan();

  // Load selected scan data when editing
  useEffect(() => {
    if (selectedScan && isOpen) {
      setFormData(mapScanToFormData(selectedScan));
      
      // Load all existing files
      if (selectedScan.files && selectedScan.files.length > 0) {
        Promise.all(
          selectedScan.files.map(async (file) => {
            try {
              const url = await getFileUrl(file.fileUrl);
              return {
                id: file.id,
                fileUrl: file.fileUrl,
                url: url,
                fileName: file.fileName,
                fileSize: file.fileSize,
                mimeType: file.mimeType,
              };
            } catch (error) {
              console.error('Error loading file URL:', error);
              return {
                id: file.id,
                fileUrl: file.fileUrl,
                url: null,
                fileName: file.fileName,
                fileSize: file.fileSize,
                mimeType: file.mimeType,
              };
            }
          })
        ).then(setUploadedFiles);
      } else {
        setUploadedFiles([]);
      }
    } else if (!selectedScan && isOpen) {
      // Reset form for new entry
      setFormData(getInitialScanFormData());
      setUploadedFiles([]);
      setUploadProgress(0);
    }
  }, [selectedScan, isOpen]);

  // Handle file removal with confirmation
  const handleRemoveFile = async (fileToRemove) => {
    if (!fileToRemove) return;

    // Check if it's an existing file (has a database ID that's not a timestamp)
    const isExistingFile = fileToRemove.id && fileToRemove.id.toString().length < 10;

    if (isExistingFile) {
      // Show confirmation dialog
      const result = await Alert.confirmDelete({
        title: 'Remove File',
        text: 'Are you sure you want to remove this file? This will be permanently deleted.',
        confirmButtonText: 'Yes, remove it!'
      });

      if (!result.isConfirmed) {
        return;
      }

      try {
        // Delete from database (backend will return fileUrl)
        const response = await customerFileService.delete(fileToRemove.id);
        
        // Delete from Firebase Storage if fileUrl is returned
        if (response?.fileUrl) {
          try {
            await deleteFile(response.fileUrl);
          } catch (firebaseError) {
            console.error('Failed to delete file from Firebase:', firebaseError);
            // Continue even if Firebase deletion fails (file might already be deleted)
          }
        }

        // Remove the file from the array
        setUploadedFiles(prev => prev.filter(file => file.id !== fileToRemove.id));

        // Show success message
        Toast.success('File removed successfully');

        // Invalidate queries to refresh the scan list
        queryClient.invalidateQueries({ 
          queryKey: customerScanKeys.lists(),
        });
      } catch (error) {
        console.error('Error removing file:', error);
        Toast.error(error.message || 'Failed to remove file');
      }
    } else {
      // It's a newly uploaded file (not saved to database yet), just remove from state
      setUploadedFiles(prev => prev.filter(file => file.id !== fileToRemove.id));
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > 2 * 1024 * 1024) {
      Toast.error(`File size exceeds 2MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    if (!member?.id) {
      Toast.error('Customer ID is required');
      return;
    }

    // COMMENTED OUT: Image upload disabled
    Toast.error('Image upload is currently disabled');
    e.target.value = '';
    return;
    
    /* COMMENTED OUT - File upload functionality
    setUploadingFile(true);
    setUploadProgress(0);
    const accountId = 1; // Default account ID

    try {
      const uploadResult = await uploadFile(
        file,
        accountId,
        member.id,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Fetch URL for display (cached)
      const url = await getFileUrl(uploadResult.fileUrl); // fileUrl contains the path
      
      const newFile = {
        id: Date.now(),
        fileUrl: uploadResult.fileUrl, // Path stored in fileUrl field
        url: url, // Cached URL for display
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize, // Numeric value in KB
        mimeType: uploadResult.mimeType,
      };

      // Add to the array of uploaded files
      setUploadedFiles(prev => [...prev, newFile]);

      Toast.success('File uploaded successfully');
    } catch (error) {
      console.error('File upload error:', error);
      Toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
      // Reset file input
      e.target.value = '';
    }
    */
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!member?.id) return;

    if (!formData.scanType) {
      Alert.error('Validation Error', 'Please select a scan type');
      return;
    }

    const scanData = {
      scanType: formData.scanType,
      scanDate: formatDateForInput(formData.scanDate),
      notes: formData.notes || null,
    };

    if (selectedScan) {
      // Update existing scan
      updateScanMutation.mutate(
        { id: selectedScan.id, scanData },
        {
          onSuccess: async (scanData) => {
            // COMMENTED OUT: File saving disabled
            /* COMMENTED OUT - File saving after scan update
            // Save all new files separately after scan is updated
            // Only save if it's a new file (timestamp ID from Date.now() is 13 digits, database IDs are small numbers)
            const newFiles = uploadedFiles.filter(file => !file.id || file.id.toString().length >= 10);
            
            if (newFiles.length > 0) {
              try {
                await Promise.all(
                  newFiles.map(file =>
                    customerFileService.createScanFile(scanData.id, {
                      customerId: member.id,
                      remarks: formData.scanType === 'inbody' ? 'inbody_scan' : 'styku_scan',
                      fileName: file.fileName,
                      fileUrl: file.fileUrl,
                      fileSize: file.fileSize,
                      mimeType: file.mimeType || null,
                      fileDate: formatDateForInput(formData.scanDate),
                    })
                  )
                );
                // Invalidate queries again after files are saved to refresh the list
                queryClient.invalidateQueries({ 
                  queryKey: customerScanKeys.lists(),
                });
              } catch (error) {
                console.error('Error saving files:', error);
                Toast.error('Scan saved but some files failed to save');
              }
            }
            */
            onSuccess?.();
            onClose();
          },
        }
      );
    } else {
      // Create new scan
      createScanMutation.mutate(
        { customerId: member.id, scanData },
        {
          onSuccess: async (scanData) => {
            // COMMENTED OUT: File saving disabled
            /* COMMENTED OUT - File saving after scan creation
            // Save all files separately after scan is created
            if (uploadedFiles.length > 0) {
              try {
                await Promise.all(
                  uploadedFiles.map(file =>
                    customerFileService.createScanFile(scanData.id, {
                      customerId: member.id,
                      remarks: formData.scanType === 'inbody' ? 'inbody_scan' : 'styku_scan',
                      fileName: file.fileName,
                      fileUrl: file.fileUrl,
                      fileSize: file.fileSize,
                      mimeType: file.mimeType || null,
                      fileDate: formatDateForInput(formData.scanDate),
                    })
                  )
                );
                // Invalidate queries again after files are saved to refresh the list
                queryClient.invalidateQueries({ 
                  queryKey: customerScanKeys.lists(),
                });
              } catch (error) {
                console.error('Error saving files:', error);
                Toast.error('Scan saved but some files failed to save');
              }
            }
            */
            onSuccess?.();
            onClose();
          },
        }
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedScan ? "Edit Body Composition Scan" : "Upload Body Composition Scan"}
      size="md"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label">Scan Date</label>
            <DatePicker
              selected={formData.scanDate}
              onChange={(date) => setFormData(prev => ({ ...prev, scanDate: date || new Date() }))}
              dateFormat="yyyy-MM-dd"
              className="input w-full"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              maxDate={new Date()}
              onKeyDown={(e) => {
                if (e && e.key && e.key !== 'Tab' && e.key !== 'Escape') {
                  e.preventDefault();
                }
              }}
            />
          </div>

          <div>
            <label className="label">Scan Type <span className="text-danger-500">*</span></label>
            <select 
              className="input"
              value={formData.scanType}
              onChange={(e) => setFormData(prev => ({ ...prev, scanType: e.target.value }))}
              required
            >
              <option value="">Select scan type</option>
              <option value="inbody">InBody</option>
              <option value="styku">Styku 3D</option>
            </select>
          </div>

        <div>
          <label className="label">Upload File (Optional)</label>
          <div className="border-2 border-dashed border-dark-200 rounded-xl p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
            <label htmlFor="scan-file-upload" className="cursor-pointer block">
              {uploadingFile ? (
                <>
                  <Upload className="w-12 h-12 text-primary-500 mx-auto mb-3 animate-pulse" />
                  <p className="text-dark-600 font-medium">Uploading file...</p>
                  <p className="text-sm text-dark-400 mt-1">
                    Progress: {Math.round(uploadProgress)}%
                  </p>
                  <div className="w-full bg-dark-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                  <p className="text-dark-600 font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-dark-400 mt-1">PDF, PNG, JPG, WebP up to 2MB</p>
                </>
              )}
              <input
                id="scan-file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf"
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
            </label>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={file.id || index} className="p-3 bg-dark-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-800 truncate">{file.fileName}</p>
                        {file.fileSize && (
                          <p className="text-xs text-dark-500">{file.fileSize} KB</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file)}
                      className="p-1 text-danger-500 hover:bg-danger-50 rounded transition-colors flex-shrink-0 ml-2"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Show image preview if it's an image */}
                  {file.url && file.mimeType?.startsWith('image/') && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-dark-200">
                      <img
                        src={file.url}
                        alt={file.fileName}
                        className="w-full h-48 object-contain bg-dark-100"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

          <div>
            <label className="label">Notes (Optional)</label>
            <textarea 
              className="input" 
              rows={2} 
              placeholder="Add any notes..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

        <div className="flex gap-3 pt-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 btn-secondary"
            disabled={createScanMutation.isPending || updateScanMutation.isPending}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="flex-1 btn-primary"
            disabled={createScanMutation.isPending || updateScanMutation.isPending}
          >
            {createScanMutation.isPending || updateScanMutation.isPending 
              ? (selectedScan ? 'Updating...' : 'Uploading...') 
              : (selectedScan ? 'Update Scan' : 'Upload Scan')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ScansForm;

