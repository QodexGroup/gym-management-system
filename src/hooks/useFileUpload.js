import { useState } from 'react';
import { uploadMultipleFiles, deleteFile } from '../services/fileUploadService';
import { customerFileService } from '../services/customerFileService';
import { getFileUrl } from '../services/firebaseUrlService';
import { Toast, Alert } from '../utils/alert';
import { useQueryClient } from '@tanstack/react-query';
import { customerProgressKeys } from './useCustomerProgress';

/**
 * Custom hook for handling file uploads and management
 * @param {Object} options - Configuration options
 * @param {number} options.customerId - Customer ID
 * @param {number} options.accountId - Account ID (default: 1)
 * @param {Function} options.onInvalidate - Optional callback for query invalidation
 * @returns {Object} - File upload state and handlers
 */
export const useFileUpload = ({ customerId, accountId = 1, onInvalidate }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const queryClient = useQueryClient();

  /**
   * Handle file removal with confirmation
   */
  const handleRemoveFile = async (fileToRemove, index) => {
    if (!fileToRemove) return;

    // Don't allow deletion of scan files
    if (fileToRemove.isScanFile) {
      Toast.error('Cannot delete scan files. They belong to the associated scan.');
      return;
    }

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
            // Continue even if Firebase deletion fails
          }
        }

        // Remove the file from the array
        setUploadedFiles(prev => prev.filter(file => file.id !== fileToRemove.id));

        // Show success message
        Toast.success('File removed successfully');

        // Invalidate queries
        if (onInvalidate) {
          onInvalidate();
        } else {
          queryClient.invalidateQueries({ 
            queryKey: customerProgressKeys.lists(),
          });
        }
      } catch (error) {
        console.error('Error removing file:', error);
        Toast.error(error.message || 'Failed to remove file');
      }
    } else {
      // It's a newly uploaded file, just remove from state
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  /**
   * Handle file upload
   */
  const handleFileUpload = async (e, maxSizeMB = 2) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file sizes
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxSizeBytes);
    if (oversizedFiles.length > 0) {
      Toast.error(`Some files exceed ${maxSizeMB}MB limit. Please select smaller files.`);
      return;
    }

    if (!customerId) {
      Toast.error('Customer ID is required');
      return;
    }

    setUploadingFiles(true);

    try {
      const uploadResults = await uploadMultipleFiles(
        files,
        accountId,
        customerId,
        (fileIndex, progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [fileIndex]: progress
          }));
        }
      );

      // Fetch URLs for display (cached)
      const newFiles = await Promise.all(
        uploadResults.map(async (result, index) => {
          const url = await getFileUrl(result.fileUrl);
          return {
            id: Date.now() + index,
            fileUrl: result.fileUrl,
            url: url,
            fileName: result.fileName,
            fileSize: result.fileSize,
            mimeType: result.mimeType,
            file: files[index],
          };
        })
      );

      setUploadedFiles(prev => [...prev, ...newFiles]);
      setUploadProgress({});
      Toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('File upload error:', error);
      Toast.error(error.message || 'Failed to upload files');
    } finally {
      setUploadingFiles(false);
      // Reset file input
      e.target.value = '';
    }
  };

  /**
   * Save files to backend
   */
  const saveFiles = async (progressId, fileDate, remarks = 'progress_tracking') => {
    if (uploadedFiles.length === 0) return [];

    const filesToSave = uploadedFiles.filter(file => 
      !file.isScanFile && (!file.id || file.id.toString().length >= 10)
    );

    if (filesToSave.length === 0) return [];

    try {
      const filePromises = filesToSave.map(file => 
        customerFileService.createProgressFile(progressId, {
          customerId: customerId,
          remarks: remarks,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          fileSize: file.fileSize,
          mimeType: file.mimeType || null,
          fileDate: fileDate,
        })
      );
      
      await Promise.all(filePromises);
      return filesToSave;
    } catch (error) {
      console.error('Error saving files:', error);
      throw error;
    }
  };

  /**
   * Load existing files (including scan files)
   */
  const loadFiles = async (progressFiles = [], scanFiles = []) => {
    const allFiles = [...progressFiles, ...scanFiles];
    
    if (allFiles.length === 0) {
      setUploadedFiles([]);
      return;
    }

    const loadedFiles = await Promise.all(
      allFiles.map(async (file) => {
        const url = await getFileUrl(file.fileUrl);
        return {
          id: file.id,
          fileUrl: file.fileUrl,
          url: url,
          fileName: file.fileName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          isScanFile: scanFiles.some(sf => sf.id === file.id),
        };
      })
    );

    setUploadedFiles(loadedFiles);
  };

  /**
   * Reset file state
   */
  const resetFiles = () => {
    setUploadedFiles([]);
    setUploadProgress({});
  };

  return {
    uploadedFiles,
    uploadingFiles,
    uploadProgress,
    setUploadedFiles,
    handleRemoveFile,
    handleFileUpload,
    saveFiles,
    loadFiles,
    resetFiles,
  };
};

