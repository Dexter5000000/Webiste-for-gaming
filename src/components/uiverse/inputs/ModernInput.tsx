import React from 'react';
import './ModernInput.css';

export interface ModernInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
}

/**
 * Modern input field with optional icon and validation
 * Perfect for forms and settings in the DAW
 * 
 * @example
 * <ModernInput 
 *   label="Track Name"
 *   placeholder="Enter track name..."
 *   icon={<TrackIcon />}
 * />
 */
export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  icon,
  error,
  size = 'md',
  variant = 'default',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`modern-input-wrapper modern-input-wrapper--${size} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="modern-input-label">
          {label}
        </label>
      )}
      <div className="modern-input-container">
        {icon && <span className="modern-input-icon">{icon}</span>}
        <input
          id={inputId}
          className={`modern-input modern-input--${variant} ${error ? 'modern-input--error' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="modern-input-error">{error}</p>}
    </div>
  );
};

export default ModernInput;
