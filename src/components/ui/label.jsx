import { forwardRef } from 'react';

export const Label = forwardRef(({ 
  children, 
  className = '', 
  htmlFor,
  ...props 
}, ref) => {
  return (
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={`text-sm font-medium text-gray-700 mb-1 block ${className}`}
      {...props}
    >
      {children}
    </label>
  );
});

Label.displayName = 'Label';