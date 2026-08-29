import { useId } from 'react';

/**
 * Labelled on/off switch used by the settings tabs.
 *
 * Built on a real `<button role="switch">` rather than a styled checkbox so it
 * is reachable by keyboard and announced correctly by screen readers. The
 * whole row is NOT a `<label>`: with a button control that would swallow the
 * click, so the label text is associated via `aria-labelledby` instead.
 *
 * @param {{
 *   label: string,
 *   hint?: string,
 *   checked: boolean,
 *   onChange: (value: boolean) => void,
 *   disabled?: boolean,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
const ToggleSwitch = ({
  label,
  hint,
  checked,
  onChange,
  disabled = false,
  className = '',
}) => {
  const labelId = useId();
  const isOn = !!checked;

  return (
    <div className={`flex items-start justify-between gap-4 py-3 ${className}`}>
      <span className="flex flex-col min-w-0">
        <span id={labelId} className="text-sm font-medium text-dark-100">{label}</span>
        {hint && <span className="text-xs text-dark-400 mt-0.5">{hint}</span>}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={() => onChange(!isOn)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 mt-0.5 items-center rounded-full
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
          focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900
          ${isOn ? 'bg-primary-500' : 'bg-dark-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white
            shadow ring-0 transition duration-200 ease-in-out
            ${isOn ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
