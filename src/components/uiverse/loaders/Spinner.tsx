import React from 'react';
import './Spinner.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'white';
  label?: string;
  className?: string;
}

/**
 * Animated spinner loader component
 * Perfect for loading states in the DAW
 * 
 * @example
 * <Spinner size="md" label="Loading audio..." />
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  label,
  className = '',
}) => {
  return (
    <div className={`spinner-wrapper spinner-wrapper--${size} ${className}`}>
      <div className={`spinner spinner--${color}`}>
        <div className="spinner__ring" />
        <div className="spinner__ring" />
        <div className="spinner__ring" />
      </div>
      {label && <p className="spinner-label">{label}</p>}
    </div>
  );
};

export default Spinner;
