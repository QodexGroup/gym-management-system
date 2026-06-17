/**
 * InfoField — labelled read-only value used across profile/detail views.
 */
const InfoField = ({ label, value, valueClassName = 'text-dark-100', className = '' }) => (
  <div className={className}>
    <p className="text-xs text-dark-400 mb-0.5">{label}</p>
    <p className={`text-sm ${valueClassName}`}>{value || 'N/A'}</p>
  </div>
);

export default InfoField;
