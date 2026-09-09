import React from 'react';

const StatusToggle = ({ value, onChange, disabled = false }) => {
  // Cycle order: '-' -> 'V' -> 'X' -> '-'
  const handleClick = () => {
    if (disabled) return;
    let nextVal = '-';
    if (value === '-') nextVal = 'V';
    else if (value === 'V') nextVal = 'X';
    else if (value === 'X') nextVal = '-';
    onChange(nextVal);
  };

  let className = 'status-toggle status-empty';
  let label = '-';

  if (value === 'V') {
    className = 'status-toggle status-v';
    label = '✓';
  } else if (value === 'X') {
    className = 'status-toggle status-x';
    label = '✗';
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={disabled}
      title={value === 'V' ? 'Berfungsi (Ya)' : value === 'X' ? 'Tidak Berfungsi (Tidak)' : 'Belum diisi'}
    >
      {label}
    </button>
  );
};

export default StatusToggle;
