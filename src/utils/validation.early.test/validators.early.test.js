
import { validators } from '../validation';


// utils/validation.test.js
describe('validators() validators method', () => {
  describe('name validator', () => {
    // Happy path tests
    test('should validate names with alphabets and spaces', () => {
      expect(validators.name('John Doe')).toBe(true);
      expect(validators.name('Alice')).toBe(true);
    });

    // Edge case tests
    test('should invalidate names with numbers or special characters', () => {
      expect(validators.name('John123')).toBe(false);
      expect(validators.name('Alice!')).toBe(false);
    });

    test('should invalidate empty string', () => {
      expect(validators.name('')).toBe(false);
    });
  });

  describe('email validator', () => {
    // Happy path tests
    test('should validate correct email formats', () => {
      expect(validators.email('test@example.com')).toBe(true);
      expect(validators.email('user.name@domain.co')).toBe(true);
    });

    // Edge case tests
    test('should invalidate incorrect email formats', () => {
      expect(validators.email('test@.com')).toBe(false);
      expect(validators.email('user@domain')).toBe(false);
    });

    test('should invalidate empty string', () => {
      expect(validators.email('')).toBe(false);
    });
  });

  describe('phone validator', () => {
    // Happy path tests
    test('should validate Indian mobile numbers with or without +91', () => {
      expect(validators.phone('+919876543210')).toBe(true);
      expect(validators.phone('9876543210')).toBe(true);
    });

    // Edge case tests
    test('should invalidate numbers with incorrect formats', () => {
      expect(validators.phone('1234567890')).toBe(false);
      expect(validators.phone('+91987654321')).toBe(false);
    });

    test('should invalidate empty string', () => {
      expect(validators.phone('')).toBe(false);
    });
  });

  describe('positiveNumber validator', () => {
    // Happy path tests
    test('should validate positive numbers', () => {
      expect(validators.positiveNumber('123')).toBe(true);
      expect(validators.positiveNumber('123.45')).toBe(true);
    });

    // Edge case tests
    test('should invalidate non-positive numbers', () => {
      expect(validators.positiveNumber('-123')).toBe(false);
      expect(validators.positiveNumber('0')).toBe(false);
    });

    test('should invalidate non-numeric strings', () => {
      expect(validators.positiveNumber('abc')).toBe(false);
    });

    test('should invalidate empty string', () => {
      expect(validators.positiveNumber('')).toBe(false);
    });
  });

  describe('accountNumber validator', () => {
    // Happy path tests
    test('should validate account numbers with 9 to 18 digits', () => {
      expect(validators.accountNumber('123456789')).toBe(true);
      expect(validators.accountNumber('123456789012345678')).toBe(true);
    });

    // Edge case tests
    test('should invalidate account numbers with incorrect lengths', () => {
      expect(validators.accountNumber('12345678')).toBe(false);
      expect(validators.accountNumber('1234567890123456789')).toBe(false);
    });

    test('should invalidate non-numeric strings', () => {
      expect(validators.accountNumber('abc123')).toBe(false);
    });

    test('should invalidate empty string', () => {
      expect(validators.accountNumber('')).toBe(false);
    });
  });

  describe('ifsc validator', () => {
    // Happy path tests
    test('should validate correct IFSC codes', () => {
      expect(validators.ifsc('ABCD0123456')).toBe(true);
    });

    // Edge case tests
    test('should invalidate incorrect IFSC codes', () => {
      expect(validators.ifsc('ABC0123456')).toBe(false);
      expect(validators.ifsc('ABCD01234')).toBe(false);
    });

    test('should invalidate empty string', () => {
      expect(validators.ifsc('')).toBe(false);
    });
  });

  describe('pan validator', () => {
    // Happy path tests
    test('should validate correct PAN numbers', () => {
      expect(validators.pan('ABCDE1234F')).toBe(true);
    });

    // Edge case tests
    test('should invalidate incorrect PAN numbers', () => {
      expect(validators.pan('ABC1234F')).toBe(false);
      expect(validators.pan('ABCDE12345')).toBe(false);
    });

    test('should invalidate empty string', () => {
      expect(validators.pan('')).toBe(false);
    });
  });

  describe('aadhar validator', () => {
    // Happy path tests
    test('should validate correct Aadhar numbers', () => {
      expect(validators.aadhar('123456789012')).toBe(true);
    });

    // Edge case tests
    test('should invalidate incorrect Aadhar numbers', () => {
      expect(validators.aadhar('12345678901')).toBe(false);
      expect(validators.aadhar('1234567890123')).toBe(false);
    });

    test('should invalidate non-numeric strings', () => {
      expect(validators.aadhar('abc123')).toBe(false);
    });

    test('should invalidate empty string', () => {
      expect(validators.aadhar('')).toBe(false);
    });
  });

  describe('zip validator', () => {
    // Happy path tests
    test('should validate correct ZIP codes', () => {
      expect(validators.zip('123456')).toBe(true);
    });

    // Edge case tests
    test('should invalidate incorrect ZIP codes', () => {
      expect(validators.zip('12345')).toBe(false);
      expect(validators.zip('1234567')).toBe(false);
    });

    test('should validate empty string as valid ZIP code', () => {
      expect(validators.zip('')).toBe(true);
    });
  });
});