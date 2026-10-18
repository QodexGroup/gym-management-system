import { formatDate } from '../../shared/utils/formatters';

/**
 * Two-row start/end date list for a client's current membership period.
 * Labels share one column so both dates line up, and dates never wrap.
 *
 * @param {{ startDate?: string|null, endDate?: string|null }} props
 * @returns {JSX.Element}
 */
const MembershipPeriod = ({ startDate, endDate }) => (
  <dl className="grid grid-cols-[auto_auto] justify-start gap-x-1.5 text-xs whitespace-nowrap">
    <dt className="text-dark-500">Start:</dt>
    <dd className="text-dark-300">{formatDate(startDate)}</dd>
    <dt className="text-dark-500">End:</dt>
    <dd className="text-dark-300">{formatDate(endDate)}</dd>
  </dl>
);

export default MembershipPeriod;
