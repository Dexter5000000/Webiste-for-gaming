import React, { useState } from 'react';
import './Switch.css';

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

/**
 * Animated toggle switch component
 * Perfect for on/off controls in the DAW
 * 
 * @example
 * <Switch 
 *   label="Master Mute"
 *   checked={isMuted}
 *   onChange={(e) => setIsMuted(e.target.checked)}
 * />
 */
export const Switch: React.FC<SwitchProps> = ({
  label,
  size = 'md',
  color = 'primary',
  id,
  className = '',
  ...props
}) => {
  const [inputId] = useState(id || `switch-${Math.random().toString(36).substr(2, 9)}`);

  return (
    <div className={`switch-wrapper switch-wrapper--${size} ${className}`}>
      <input
        type="checkbox"
        id={inputId}
        className={`switch-input switch-input--${color}`}
        {...props}
      />
      <label htmlFor={inputId} className="switch-label">
        <span className="switch-slider" />
      </label>
      {label && <label htmlFor={inputId} className="switch-text">{label}</label>}
    </div>
  );
};

export default Switch;
