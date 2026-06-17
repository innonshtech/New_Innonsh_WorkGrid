import { useState, useCallback } from 'react';
import { validators } from '@/utils/validation';

/**
 * Custom hook for instant form validation
 * @param {Object} initialState - Initial form state
 * @param {Object} validationRules - Object mapping field IDs to validation functions/regex
 */
export const useValidation = (initialState = {}, validationSchema = {}) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  /**
   * Validate a single field
   * @param {string} name - Field name
   * @param {any} value - Field value
   */
  const validateField = useCallback((name, value) => {
    // Check if a validator exists for this field
    // It can be a direct function or a reference to the 'validators' object keys
    let validator = validationSchema[name];

    // If schema maps to a known validator string key (e.g. 'email'), use that
    if (typeof validator === 'string' && validators[validator]) {
      validator = validators[validator];
    }

    if (!validator && validators[name]) {
        validator = validators[name];
    }
    
    // If nested field path (e.g. 'personalDetails.email'), finding validator might need custom logic
    // For now, simpler is better. Pass explicit validator name if needed.
    
    if (typeof validator === 'function') {
      const isValid = validator(value);
      
      setErrors(prev => {
        const newErrors = { ...prev };
        if (!isValid) {
            // Default error messages based on field type
            let message = "Invalid value";
            if (name.includes('email')) message = "Invalid email address";
            if (name.includes('phone') || name.includes('mobile')) message = "Invalid phone number (10 digits)";
            if (name.includes('pan')) message = "Invalid PAN format";
            if (name.includes('aadhar')) message = "Invalid Aadhar (12 digits)";
            if (name.includes('zip') || name.includes('pin')) message = "Invalid Zip Code";
            
           newErrors[name] = message;
        } else {
          delete newErrors[name];
        }
        return newErrors;
      });
      return isValid;
    }
    return true;
  }, [validationSchema]);

  /**
   * Handle onBlur event for instant validation feedback
   */
  const handleBlur = (name, value) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  /**
   * Setup for input elements
   * Use spread syntax: {...register('email', emailValue)}
   */
  const register = (name, value, customValidatorName) => {
      // Determine invalid state
      const isInvalid = !!errors[name];
      const isTouched = !!touched[name];

      return {
          name,
          value: value || '',
          onBlur: (e) => handleBlur(name, e.target.value),
          onChange: (e) => {
               // We don't control state here, just validation triggers if needed
               // Typically user updates state in their own onChange, then calls this? 
               // Actually, usually we prefer controlled components. 
               // This helper might be better as just getting the className.
               
               if (isTouched) {
                   validateField(name, e.target.value);
               }
          },
          className: `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
              isInvalid 
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50' 
                  : 'border-slate-300 focus:ring-yellow-500 focus:border-yellow-500'
          }`
      };
  };
  
  // Return helper to get error message
  const getError = (name) => errors[name];

  // Manual trigger
  const triggerValidation = (data) => {
      const newErrors = {};
      let isValid = true;
      
      Object.keys(data).forEach(key => {
          // Logic to validate all...
          // For now, simpler: user calls validateField manually or we iterate schema
      });
      // ... implementation detail for full submit validation
      return isValid;
  };

  return {
    errors, 
    touched,
    validateField,
    handleBlur,
    getError,
    setErrors
  };
};
