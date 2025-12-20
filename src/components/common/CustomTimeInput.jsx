import { useState, useEffect } from 'react';

// Custom Time Input Component with 3 columns: Hour, Minutes, AM/PM
const CustomTimeInput = ({ value, onChange, onClick, onTimeChange }) => {
  // Parse the time value (format: "HH:mm" - DatePicker passes 24-hour format)
  const parseTime = (timeStr) => {
    if (!timeStr) {
      const now = new Date();
      return {
        hour: now.getHours() % 12 || 12,
        minute: now.getMinutes(),
        ampm: now.getHours() >= 12 ? 'PM' : 'AM'
      };
    }

    // DatePicker passes time in 24-hour format (HH:mm)
    const match24 = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match24) {
      const hour24 = parseInt(match24[1], 10);
      const minute = parseInt(match24[2], 10);
      return {
        hour: hour24 % 12 || 12,
        minute: minute,
        ampm: hour24 >= 12 ? 'PM' : 'AM'
      };
    }

    // Try to parse "h:mm aa" format as fallback
    const match12 = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match12) {
      return {
        hour: parseInt(match12[1], 10),
        minute: parseInt(match12[2], 10),
        ampm: match12[3].toUpperCase()
      };
    }

    // Default to current time
    const now = new Date();
    return {
      hour: now.getHours() % 12 || 12,
      minute: now.getMinutes(),
      ampm: now.getHours() >= 12 ? 'PM' : 'AM'
    };
  };

  const timeParts = parseTime(value);
  const [hour, setHour] = useState(timeParts.hour.toString().padStart(2, '0'));
  const [minute, setMinute] = useState(timeParts.minute.toString().padStart(2, '0'));
  const [ampm, setAmpm] = useState(timeParts.ampm);

  // Sync state when value prop changes
  useEffect(() => {
    const parts = parseTime(value);
    setHour(parts.hour.toString().padStart(2, '0'));
    setMinute(parts.minute.toString().padStart(2, '0'));
    setAmpm(parts.ampm);
  }, [value]);

  // Update parent when any part changes
  const updateTime = (newHour, newMinute, newAmpm) => {
    // Convert 12-hour to 24-hour format for DatePicker
    let hour24 = parseInt(newHour, 10);
    if (newAmpm === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (newAmpm === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    // Format as HH:mm for DatePicker (it expects 24-hour format internally)
    const formattedTime = `${hour24.toString().padStart(2, '0')}:${newMinute}`;
    // Call DatePicker's onChange (for internal state)
    if (onChange) {
      onChange(formattedTime);
    }
    // Call custom onTimeChange if provided (for formData update)
    if (onTimeChange) {
      onTimeChange(formattedTime);
    }
  };

  const handleHourChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (val === '') val = '12';
    const num = parseInt(val, 10);
    if (num >= 1 && num <= 12) {
      const newHour = num.toString().padStart(2, '0');
      setHour(newHour);
      updateTime(newHour, minute, ampm);
    } else if (num === 0) {
      setHour('12');
      updateTime('12', minute, ampm);
    }
  };

  const handleMinuteChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (val === '') val = '00';
    const num = parseInt(val, 10);
    if (num >= 0 && num <= 59) {
      const newMinute = num.toString().padStart(2, '0');
      setMinute(newMinute);
      updateTime(hour, newMinute, ampm);
    }
  };

  return (
    <div 
      style={{ 
        width: '100%',
        maxWidth: '100%',
        padding: '0.25rem 0.375rem',
        display: 'flex',
        gap: '0.375rem',
        borderTop: '1px solid #e5e7eb',
        boxSizing: 'border-box',
        overflow: 'hidden',
        alignItems: 'stretch',
      }}
      onClick={onClick}
    >
      {/* Hour Input */}
      <input
        type="text"
        value={hour}
        onChange={handleHourChange}
        style={{
          flex: '1 1 30%',
          minWidth: 0,
          minHeight: '32px',
          padding: '0.25rem 0.125rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          textAlign: 'center',
          border: '1px solid #e5e7eb',
          borderRadius: '0.25rem',
          backgroundColor: 'white',
          color: 'rgb(17, 24, 39)',
          cursor: 'text',
          boxSizing: 'border-box',
          margin: 0,
          maxWidth: '100px',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgb(59, 130, 246)';
          e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e5e7eb';
          e.target.style.boxShadow = 'none';
        }}
        placeholder="12"
        maxLength={2}
      />
      
      {/* Separator */}
      <span style={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: 'rgb(17, 24, 39)',
        padding: '0',
        margin: '0',
        flexShrink: 0,
      }}>:</span>

      {/* Minute Input */}
      <input
        type="text"
        value={minute}
        onChange={handleMinuteChange}
        style={{
          flex: '1 1 30%',
          maxWidth: '100px',
          minHeight: '32px',
          padding: '0.25rem 0.125rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          textAlign: 'center',
          border: '1px solid #e5e7eb',
          borderRadius: '0.25rem',
          backgroundColor: 'white',
          color: 'rgb(17, 24, 39)',
          cursor: 'text',
          boxSizing: 'border-box',
          margin: 0,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgb(59, 130, 246)';
          e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e5e7eb';
          e.target.style.boxShadow = 'none';
        }}
        placeholder="00"
        maxLength={2}
      />

      {/* AM/PM Toggle Button */}
      <button
        type="button"
        onClick={() => {
          const newAmpm = ampm === 'AM' ? 'PM' : 'AM';
          setAmpm(newAmpm);
          updateTime(hour, minute, newAmpm);
        }}
        style={{
          flex: '1 1 30%',
          maxWidth: '70px',
          minHeight: '32px',
          padding: '0.25rem 1.1rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          textAlign: 'center',
          border: '1px solid #e5e7eb',
          borderRadius: '0.25rem',
          backgroundColor: 'white',
          color: 'rgb(17, 24, 39)',
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'all 0.2s',
          margin: 0,
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f9fafb';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'white';
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgb(59, 130, 246)';
          e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
          e.target.style.backgroundColor = '#f9fafb';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e5e7eb';
          e.target.style.boxShadow = 'none';
          e.target.style.backgroundColor = 'white';
        }}
      >
        {ampm}
      </button>
    </div>
  );
};

export default CustomTimeInput;

