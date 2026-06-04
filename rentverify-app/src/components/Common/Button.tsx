import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'approve' | 'reject' | 'flag';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  children,
  className = '',
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const widthClass = fullWidth ? 'btn-full' : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
