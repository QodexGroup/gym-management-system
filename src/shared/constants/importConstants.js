/**
 * Import Constants
 * Centralized constants for the client (customer) data importer.
 */

export const IMPORT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

/** Statuses that mean the job is still running (keep polling). */
export const IMPORT_ACTIVE_STATUSES = [IMPORT_STATUS.PENDING, IMPORT_STATUS.PROCESSING];

/** Statuses that mean the job has finished (stop polling). */
export const IMPORT_TERMINAL_STATUSES = [IMPORT_STATUS.COMPLETED, IMPORT_STATUS.FAILED];

/** Status -> pill classes for the import history table. */
export const IMPORT_STATUS_STYLES = {
  [IMPORT_STATUS.COMPLETED]: 'bg-success-500/15 text-success-300',
  [IMPORT_STATUS.PROCESSING]: 'bg-warning-500/15 text-warning-300',
  [IMPORT_STATUS.PENDING]: 'bg-dark-600 text-dark-200',
  [IMPORT_STATUS.FAILED]: 'bg-danger-500/15 text-danger-300',
};

/**
 * Common header aliases per client field key, used to auto-guess the column
 * mapping when a file is uploaded.
 */
export const FIELD_ALIASES = {
  firstName: ['firstname', 'fname', 'givenname', 'first'],
  lastName: ['lastname', 'lname', 'surname', 'familyname', 'last'],
  phoneNumber: ['phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact', 'contactnumber', 'cell', 'cellphone'],
  dateOfBirth: ['dateofbirth', 'dob', 'birthday', 'birthdate', 'bday'],
  gender: ['gender', 'sex'],
  email: ['email', 'emailaddress', 'mail'],
  address: ['address', 'addr', 'location'],
  bloodType: ['bloodtype', 'blood'],
  medicalNotes: ['medicalnotes', 'notes', 'medicalnote'],
  allergies: ['allergies', 'allergy'],
  currentMedications: ['currentmedications', 'medications', 'meds', 'medication'],
  medicalConditions: ['medicalconditions', 'conditions', 'condition'],
  doctorName: ['doctorname', 'doctor', 'physician'],
  doctorPhone: ['doctorphone', 'doctorcontact'],
  insuranceProvider: ['insuranceprovider', 'insurance', 'insurer'],
  insurancePolicyNumber: ['insurancepolicynumber', 'policynumber', 'policyno', 'policy'],
  emergencyContactName: ['emergencycontactname', 'emergencyname', 'emergencycontact'],
  emergencyContactRelationship: ['emergencycontactrelationship', 'relationship', 'relation'],
  emergencyContactPhone: ['emergencycontactphone', 'emergencyphone', 'emergencycontactnumber'],
  emergencyContactAddress: ['emergencycontactaddress', 'emergencyaddress'],
};

/** Importer type keys (mirror of the backend ImportConstant type keys). */
export const IMPORT_TYPE = {
  CLIENT: 'client',
};

/** File extensions the importer accepts. */
export const SUPPORTED_IMPORT_EXTENSIONS = ['csv', 'txt', 'xlsx', 'xls'];

/** Maximum upload size, in megabytes. */
export const MAX_IMPORT_FILE_MB = 50;
