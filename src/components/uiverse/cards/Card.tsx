import React from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  interactive?: boolean;
  image?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Modern card component with multiple variants
 * Perfect for displaying presets, effects, and tracks
 * 
 * @example
 * <Card variant="elevated" title="Reverb" subtitle="Hall Reverb">
 *   <p>Effect parameters here</p>
 * </Card>
 */
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  interactive = false,
  image,
  title,
  subtitle,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`card card--${variant} ${interactive ? 'card--interactive' : ''} ${className}`}
      {...props}
    >
      {image && <div className="card__image" style={{ backgroundImage: `url(${image})` }} />}
      {(title || subtitle) && (
        <div className="card__header">
          {title && <h3 className="card__title">{title}</h3>}
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card__content">{children}</div>
    </div>
  );
};

export default Card;
