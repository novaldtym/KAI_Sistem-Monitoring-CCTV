const StatusToggle = ({ value, onChange, disabled = false, locked = false,
  lockReason = 'Pengisian tidak tersedia untuk minggu ini.', label: fieldLabel = 'Status pemeriksaan' }) => {
  const isDisabled = disabled || locked;
  // Cycle order: '-' -> 'V' -> 'X' -> '-'
  const handleClick = () => {
    if (isDisabled) return;
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
  const description = `${fieldLabel}: ${value === 'V' ? 'Ya' : value === 'X' ? 'Tidak' : 'Belum diisi'}`;
  const accessibleLabel = locked ? `${description}. Terkunci: ${lockReason}` : description;

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      <span aria-hidden="true">{label}</span>
    </button>
  );
};

export default StatusToggle;
