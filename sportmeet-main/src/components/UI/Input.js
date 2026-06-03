import React from 'react';
import { clsx } from 'clsx';

const Input = React.forwardRef(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          'input',
          error && 'border-accent-500 focus-visible:ring-accent-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-accent-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
