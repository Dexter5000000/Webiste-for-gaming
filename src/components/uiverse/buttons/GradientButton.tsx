import React from 'react';
import './GradientButton.css';

export interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}

/**
 * Modern gradient button with smooth hover effects
 * Perfect for primary actions in the DAW
 * 
 * @example
 * <GradientButton onClick={handlePlay} icon={<PlayIcon />}>
 *   Play
 * </GradientButton>
 */
export const GradientButton: React.FC<GradientButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  children,
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <button
      className={`gradient-btn gradient-btn--${variant} gradient-btn--${size} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      <span className="gradient-btn__content">
        {icon && <span className="gradient-btn__icon">{icon}</span>}
        <span className="gradient-btn__text">{children}</span>
        {loading && <span className="gradient-btn__loader" />}
      </span>
    </button>
  );
};

export default GradientButton;
