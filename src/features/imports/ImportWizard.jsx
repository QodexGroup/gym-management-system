import { useMemo, useRef, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Upload, FileSpreadsheet, ArrowLeft, ArrowRight, Loader2,
  CheckCircle, AlertTriangle, XCircle, Download, RotateCcw,
} from 'lucide-react';

import StatsCards from '../../components/common/StatsCards';
import { Toast } from '../../shared/utils/alert';
import { importService } from '../../shared/services/importService';
import {
  useUploadImport, useExecuteImport, useImportStatus, importKeys,
} from '../../shared/hooks/useImports';
import { customerKeys } from '../../shared/hooks/useCustomers';
import {
  IMPORT_STATUS, IMPORT_TERMINAL_STATUSES, FIELD_ALIASES,
  IMPORT_TYPE, SUPPORTED_IMPORT_EXTENSIONS, MAX_IMPORT_FILE_MB,
} from '../../shared/constants/importConstants';


/** Normalize a string to bare alphanumerics for fuzzy header matching. */
const normalize = (value) => (value || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Best-effort auto-mapping of file columns to fields by fuzzy-matching header
 * names against each field's key, label, and known aliases. Each header is used
 * at most once.
 * @param {Array<Object>} fields
 * @param {Array<string>} headers
 * @returns {Object<string, string>} field key => header name
 */
const buildAutoMapping = (fields, headers) => {
  const mapping = {};
  const used = new Set();
  fields.forEach((field) => {
    const candidates = new Set([
      normalize(field.key),
      normalize(field.label),
      ...(FIELD_ALIASES[field.key] || []),
    ]);
    const match = headers.find((h) => !used.has(h) && candidates.has(normalize(h)));
    if (match) {
      mapping[field.key] = match;
      used.add(match);
    }
  });
  return mapping;
};

/**
 * Step 1 — file selection and upload.
 * @param {{ onUploaded: Function }} props
 * @returns {JSX.Element}
 */
const UploadStep = ({ onUploaded }) => {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const uploadMutation = useUploadImport();

  /** Validate and stash the chosen file. */
  const handleSelect = (selected) => {
    if (!selected) return;
    const ext = selected.name.split('.').pop().toLowerCase();
    if (!SUPPORTED_IMPORT_EXTENSIONS.includes(ext)) {
      Toast.error('Please choose a CSV or Excel (.xlsx/.xls) file');
      return;
    }
    if (selected.size > MAX_IMPORT_FILE_MB * 1024 * 1024) {
      Toast.error(`File is too large (max ${MAX_IMPORT_FILE_MB} MB)`);
      return;
    }
    setFile(selected);
  };

  /** Upload the file to create a pending import job. */
  const handleUpload = async () => {
    if (!file) return;
    try {
      const result = await uploadMutation.mutateAsync({ file, importType: IMPORT_TYPE.CLIENT });
      onUploaded(result);
    } catch {
      /* toast handled in the hook */
    }
  };

  return (
    <div className="space-y-6">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleSelect(e.dataTransfer.files?.[0]); }}
        className="cursor-pointer rounded-xl border-2 border-dashed border-dark-600 hover:border-primary-500 transition-colors p-10 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept={SUPPORTED_IMPORT_EXTENSIONS.map((e) => `.${e}`).join(',')}
          className="hidden"
          onChange={(e) => handleSelect(e.target.files?.[0])}
        />
        {file ? (
          <div className="flex flex-col items-center gap-2 text-dark-50">
            <FileSpreadsheet className="w-10 h-10 text-primary-400" />
            <p className="font-semibold">{file.name}</p>
            <p className="text-xs text-dark-400">{(file.size / 1024).toFixed(1)} KB — click to choose a different file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-dark-300">
            <Upload className="w-10 h-10 text-dark-400" />
            <p className="font-medium text-dark-100">Click to upload or drag a file here</p>
            <p className="text-xs text-dark-400">CSV or Excel (.xlsx, .xls) — up to {MAX_IMPORT_FILE_MB} MB. The first row must be column headers.</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploadMutation.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-60"
        >
          {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {uploadMutation.isPending ? 'Reading file…' : 'Upload & Continue'}
        </button>
      </div>
    </div>
  );
};

/**
 * Renders a single field row in the mapping step.
 * @param {{ field: Object, headers: Array<string>, value: string, invalid: boolean, onChange: Function }} props
 * @returns {JSX.Element}
 */
const MappingRow = ({ field, headers, value, invalid, onChange }) => (
  <div className="grid grid-cols-1 items-start gap-2 py-2 sm:grid-cols-2 sm:items-center sm:gap-4">
    <div>
      <p className="text-sm font-medium text-dark-50">
        {field.label} {field.required && <span className="text-danger-500">*</span>}
      </p>
      {field.example && <p className="text-xs text-dark-400">e.g. {field.example}</p>}
    </div>
    <select
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      className={`input ${invalid ? 'border-danger-500 focus:border-danger-500' : ''}`}
    >
      <option value="">— Not mapped —</option>
      {headers.map((h) => (
        <option key={h} value={h}>{h}</option>
      ))}
    </select>
  </div>
);

/**
 * Step 2 — map each field to a file column, required fields first.
 * @param {{ uploadResult: Object, onBack: Function, onStarted: Function }} props
 * @returns {JSX.Element}
 */
const MappingStep = ({ uploadResult, onBack, onStarted }) => {
  const headers = useMemo(() => uploadResult.fileHeaders || [], [uploadResult]);
  const fields = useMemo(() => uploadResult.importFields || [], [uploadResult]);
  const [mapping, setMapping] = useState(() => buildAutoMapping(fields, headers));
  const [attempted, setAttempted] = useState(false);
  const executeMutation = useExecuteImport();

  const requiredFields = useMemo(() => fields.filter((f) => f.required), [fields]);
  const optionalFields = useMemo(() => fields.filter((f) => !f.required), [fields]);

  /** Update a single field's mapped column. */
  const handleChange = (key, headerName) => {
    setMapping((prev) => ({ ...prev, [key]: headerName }));
  };

  const missingRequired = requiredFields.filter((f) => !mapping[f.key]).map((f) => f.key);

  /** Validate required mappings then start the import. */
  const handleStart = async () => {
    setAttempted(true);
    if (missingRequired.length > 0) {
      Toast.error('Please map all required fields before importing');
      return;
    }
    // Only send fields that are actually mapped to a column.
    const payload = Object.fromEntries(
      Object.entries(mapping).filter(([, header]) => header)
    );
    try {
      const job = await executeMutation.mutateAsync({
        importJobId: uploadResult.importJobId,
        columnMapping: payload,
        options: null,
      });
      onStarted(job.id);
    } catch {
      /* toast handled in the hook */
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary-500/30 bg-primary-500/10 px-4 py-3 text-sm text-dark-200">
        Detected <span className="font-semibold text-dark-50">{headers.length}</span> columns and{' '}
        <span className="font-semibold text-dark-50">{uploadResult.totalRows}</span> rows. Match each client field to a
        column from your file. We pre-filled the obvious ones.
      </div>

      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wide text-dark-300 mb-2">Required fields</h4>
        <div className="divide-y divide-dark-700">
          {requiredFields.map((field) => (
            <MappingRow
              key={field.key}
              field={field}
              headers={headers}
              value={mapping[field.key]}
              invalid={attempted && !mapping[field.key]}
              onChange={handleChange}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wide text-dark-300 mb-2">Optional fields</h4>
        <div className="divide-y divide-dark-700">
          {optionalFields.map((field) => (
            <MappingRow
              key={field.key}
              field={field}
              headers={headers}
              value={mapping[field.key]}
              invalid={false}
              onChange={handleChange}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={handleStart}
          disabled={executeMutation.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-60"
        >
          {executeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Start Import
        </button>
      </div>
    </div>
  );
};

/**
 * Step 3 — live progress then the completion summary.
 * @param {{ jobId: number, originalFilename?: string, onReset: Function }} props
 * @returns {JSX.Element}
 */
const ProgressStep = ({ jobId, onReset }) => {
  const queryClient = useQueryClient();
  const { data: job } = useImportStatus(jobId);
  const invalidatedRef = useRef(false);

  const status = job?.status;
  const isDone = IMPORT_TERMINAL_STATUSES.includes(status);

  // When the job finishes, refresh history + the clients list so new members show.
  useEffect(() => {
    if (isDone && !invalidatedRef.current) {
      invalidatedRef.current = true;
      queryClient.invalidateQueries({ queryKey: importKeys.histories() });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    }
  }, [isDone, queryClient]);

  /** Download the generated error report for failed/skipped rows. */
  const handleDownload = () => {
    importService.downloadResult(jobId, 'import-errors.csv').catch((e) =>
      Toast.error(e.message || 'Could not download the error report')
    );
  };

  if (!job) {
    return (
      <div className="flex items-center justify-center py-16 text-dark-300">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (status === IMPORT_STATUS.FAILED) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-4 text-sm text-danger-200">
          <p className="font-semibold text-danger-100 mb-1">Import failed</p>
          {job.errorMessage || 'Something went wrong while processing the file.'}
        </div>
        <button type="button" onClick={onReset} className="btn-secondary flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> Try another file
        </button>
      </div>
    );
  }

  if (!isDone) {
    const pct = job.progressPercentage || 0;
    return (
      <div className="space-y-4 py-6">
        <div className="flex items-center gap-2 text-dark-100">
          <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
          <span className="font-medium">Importing… {job.processedRows} of {job.totalRows} rows</span>
        </div>
        <div className="w-full h-3 rounded-full bg-dark-700 overflow-hidden">
          <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-dark-400">{pct}% complete — you can keep this tab open; it updates automatically.</p>
      </div>
    );
  }

  // Completed
  const stats = [
    { title: 'Imported', value: job.successCount || 0, color: 'success', icon: CheckCircle },
    { title: 'Skipped (duplicates)', value: job.skippedCount || 0, color: 'warning', icon: AlertTriangle },
    { title: 'Failed', value: job.failureCount || 0, color: 'danger', icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-success-500/40 bg-success-500/10 px-4 py-3 text-sm text-success-100">
        Import complete — {job.successCount} client{job.successCount === 1 ? '' : 's'} added.
      </div>

      <StatsCards stats={stats} columns={3} />

      <div className="flex flex-wrap items-center gap-3">
        {job.hasResultFile && (
          <button type="button" onClick={handleDownload} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Download error report
          </button>
        )}
        <button type="button" onClick={onReset} className="btn-primary flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> Import another file
        </button>
      </div>
    </div>
  );
};

/**
 * Client import wizard: upload a file, map its columns to client fields, then
 * watch the async import run to completion.
 * @returns {JSX.Element}
 */
const ImportWizard = () => {
  const [step, setStep] = useState(1);
  const [uploadResult, setUploadResult] = useState(null);
  const [jobId, setJobId] = useState(null);

  /** Reset the wizard back to the upload step. */
  const reset = () => {
    setStep(1);
    setUploadResult(null);
    setJobId(null);
  };

  const steps = [
    { n: 1, label: 'Upload file' },
    { n: 2, label: 'Map columns' },
    { n: 3, label: 'Import' },
  ];

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-4">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                  step >= s.n ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-400'
                }`}
              >
                {s.n}
              </span>
              <span className={`text-sm ${step >= s.n ? 'text-dark-50 font-medium' : 'text-dark-400'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="w-10 h-px bg-dark-600" />}
          </div>
        ))}
      </div>

      <div className="card">
        {step === 1 && (
          <UploadStep
            onUploaded={(result) => { setUploadResult(result); setStep(2); }}
          />
        )}
        {step === 2 && uploadResult && (
          <MappingStep
            uploadResult={uploadResult}
            onBack={() => setStep(1)}
            onStarted={(id) => { setJobId(id); setStep(3); }}
          />
        )}
        {step === 3 && jobId && (
          <ProgressStep jobId={jobId} onReset={reset} />
        )}
      </div>
    </div>
  );
};

export default ImportWizard;
