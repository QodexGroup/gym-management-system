import { useState, useEffect, useCallback } from 'react';
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

const ScansForm = ({ member, isOpen, selectedScan, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(getInitialScanFormData());
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const queryClient = useQueryClient();
  const createMutation = useCreateCustomerScan();
  const updateMutation = useUpdateCustomerScan();

  /* ---------------- Load Scan Data ---------------- */
  useEffect(() => {
    if (!isOpen) return;

    if (selectedScan) {
      setFormData(mapScanToFormData(selectedScan));

      // Load existing files
      if (selectedScan.files?.length) {
        Promise.all(
          selectedScan.files.map(async (f) => {
            try {
              const url = await getFileUrl(f.fileUrl);
              return { ...f, url };
            } catch {
              return { ...f, url: null };
            }
          })
        ).then(setUploadedFiles);
      } else setUploadedFiles([]);
    } else {
      setFormData(getInitialScanFormData());
      setUploadedFiles([]);
      setUploadProgress(0);
    }
  }, [selectedScan, isOpen]);

  /* ---------------- File Handlers ---------------- */
  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!member?.id) return Toast.error('Customer ID is required');

    if (file.size > 2 * 1024 * 1024) {
      return Toast.error(`File exceeds 2MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    }

    setUploadingFile(true);
    setUploadProgress(0);

    try {
      const upload = await uploadFile(file, 1, member.id, (progress) => setUploadProgress(progress));
      const url = await getFileUrl(upload.fileUrl);

      setUploadedFiles(prev => [
        ...prev,
        {
          id: Date.now(),
          fileUrl: upload.fileUrl,
          url,
          fileName: upload.fileName,
          fileSize: upload.fileSize,
          mimeType: upload.mimeType,
        },
      ]);

      Toast.success('File uploaded successfully');
    } catch (err) {
      console.error(err);
      Toast.error(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  }, [member]);

  const handleRemoveFile = useCallback(async (file) => {
    if (!file) return;

    const isExisting = file.id && file.id.toString().length < 10;

    if (isExisting) {
      const result = await Alert.confirmDelete({
        title: 'Remove File',
        text: 'This file will be permanently deleted.',
      });
      if (!result.isConfirmed) return;

      try {
        const response = await customerFileService.delete(file.id);
        if (response?.fileUrl) await deleteFile(response.fileUrl);

        setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
        Toast.success('File removed');
        queryClient.invalidateQueries({ queryKey: customerScanKeys.lists() });
      } catch (err) {
        console.error(err);
        Toast.error(err.message || 'Failed to remove file');
      }
    } else {
      setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
    }
  }, [queryClient]);

  /* ---------------- Submit Form ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!member?.id) return;

    if (!formData.scanType) return Alert.error('Validation Error', 'Please select a scan type');

    const scanData = {
      customerId: member.id,
      scanType: formData.scanType,
      scanDate: formatDateForInput(formData.scanDate),
      notes: formData.notes || null,
    };

    const saveFiles = async (scanId) => {
      const newFiles = uploadedFiles.filter(f => !f.id || f.id.toString().length >= 10);
      if (!newFiles.length) return;

      await Promise.all(newFiles.map(file =>
        customerFileService.createScanFile(scanId, {
          customerId: member.id,
          remarks: scanData.scanType === 'inbody' ? 'inbody_scan' : 'styku_scan',
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          fileSize: file.fileSize,
          mimeType: file.mimeType || null,
          fileDate: scanData.scanDate,
        })
      ));
    };

    const mutation = selectedScan ? updateMutation : createMutation;
    const payload = selectedScan ? { id: selectedScan.id, scanData } : { customerId: member.id, scanData };

    mutation.mutate(payload, {
      onSuccess: async (data) => {
        try { await saveFiles(data.id); } catch (err) { console.error(err); }
        queryClient.invalidateQueries({ queryKey: customerScanKeys.lists() });
        onSuccess?.();
        onClose();
      },
      onError: (err) => Toast.error(err.message || 'Failed to save scan'),
    });
  };

  /* ---------------- Render ---------------- */
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedScan ? 'Edit Body Composition Scan' : 'Upload Body Composition Scan'}
      size="md"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Scan Date */}
        <div>
          <label className="label">Scan Date</label>
          <DatePicker
            selected={formData.scanDate}
            onChange={(date) => setFormData(prev => ({ ...prev, scanDate: date || new Date() }))}
            dateFormat="yyyy-MM-dd"
            className="input w-full"
            maxDate={new Date()}
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
          />
        </div>

        {/* Scan Type */}
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

        {/* Upload Files */}
        <div>
          <label className="label">Upload File (Optional)</label>
          <div className="border-2 border-dashed border-dark-200 rounded-xl p-8 text-center hover:border-primary-500 cursor-pointer transition-colors">
            <label htmlFor="scan-upload" className="cursor-pointer block">
              {uploadingFile ? (
                <>
                  <Upload className="w-12 h-12 text-primary-500 mx-auto mb-3 animate-pulse" />
                  <p className="text-dark-600 font-medium">Uploading file...</p>
                  <p className="text-sm text-dark-400 mt-1">Progress: {Math.round(uploadProgress)}%</p>
                  <div className="w-full bg-dark-200 h-2 rounded mt-2">
                    <div className="bg-primary-500 h-2 rounded transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                  <p className="text-dark-600 font-medium">Click or drag files here</p>
                  <p className="text-sm text-dark-400 mt-1">PDF, PNG, JPG, WebP up to 2MB</p>
                </>
              )}
              <input
                id="scan-upload"
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
              {uploadedFiles.map((file) => (
                <div key={file.id} className="p-3 bg-dark-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-800 truncate">{file.fileName}</p>
                        {file.fileSize && <p className="text-xs text-dark-500">{file.fileSize} KB</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file)}
                      className="p-1 text-danger-500 hover:bg-danger-50 rounded transition-colors ml-2"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {file.url && file.mimeType?.startsWith('image/') && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-dark-200">
                      <img src={file.url} alt={file.fileName} className="w-full h-48 object-contain bg-dark-100" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes (Optional)</label>
          <textarea
            className="input"
            rows={2}
            placeholder="Add notes..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            className="flex-1 btn-secondary"
            onClick={onClose}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? selectedScan ? 'Updating...' : 'Uploading...'
              : selectedScan ? 'Update Scan' : 'Upload Scan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ScansForm;
