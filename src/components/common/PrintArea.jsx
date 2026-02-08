import { forwardRef } from 'react';

/**
 * Reusable print-only block. Use with useReactToPrint contentRef.
 * businessName, title, periodLabel, generatedAt, summaryRows (array of [label, value]), then children (e.g. table).
 */
const PrintArea = forwardRef(
  (
    {
      businessName = 'Kaizen Gym',
      title,
      periodLabel,
      generatedAt,
      summaryRows = [],
      children,
      className = '',
    },
    ref
  ) => {
    return (
      <div ref={ref} className={`report-print-only report-print-area p-6 ${className}`}>
        <div className="text-center mb-4">
          <p className="font-bold text-lg">{businessName}</p>
          <p className="font-semibold text-base uppercase">{title}</p>
          <p className="text-sm">Period: {periodLabel}</p>
          <p className="text-sm">Generated: {generatedAt}</p>
        </div>
        {summaryRows.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2 max-w-md text-sm">
            {summaryRows.map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-slate-200 pb-1">
                <span className="font-medium">{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        )}
        {children}
        <p className="text-xs mt-4 text-slate-500">Generated: {generatedAt}</p>
      </div>
    );
  }
);

PrintArea.displayName = 'PrintArea';

export default PrintArea;
