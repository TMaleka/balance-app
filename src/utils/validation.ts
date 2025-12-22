/**
 * Form Validation Utilities
 * Provides consistent validation across all forms
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationRule {
  field: string;
  value: any;
  rules: string[];
  customMessage?: string;
}

export class FormValidator {
  private static instance: FormValidator;
  
  static getInstance(): FormValidator {
    if (!FormValidator.instance) {
      FormValidator.instance = new FormValidator();
    }
    return FormValidator.instance;
  }

  /**
   * Validate a single field
   */
  validateField(value: any, rules: string[], fieldName: string = 'Field'): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of rules) {
      const [ruleName, ...params] = rule.split(':');
      
      switch (ruleName) {
        case 'required':
          if (!this.isRequired(value)) {
            errors.push(`${fieldName} is required`);
          }
          break;
          
        case 'email':
          if (value && !this.isValidEmail(value)) {
            errors.push(`${fieldName} must be a valid email address`);
          }
          break;
          
        case 'phone':
          if (value && !this.isValidPhone(value)) {
            errors.push(`${fieldName} must be a valid phone number`);
          }
          break;
          
        case 'minLength':
          const minLength = parseInt(params[0] || '0');
          if (value && value.length < minLength) {
            errors.push(`${fieldName} must be at least ${minLength} characters long`);
          }
          break;
          
        case 'maxLength':
          const maxLength = parseInt(params[0] || '255');
          if (value && value.length > maxLength) {
            errors.push(`${fieldName} must be no more than ${maxLength} characters long`);
          }
          break;
          
        case 'min':
          const minValue = parseFloat(params[0] || '0');
          if (value !== null && value !== undefined && parseFloat(value) < minValue) {
            errors.push(`${fieldName} must be at least ${minValue}`);
          }
          break;
          
        case 'max':
          const maxValue = parseFloat(params[0] || '999999');
          if (value !== null && value !== undefined && parseFloat(value) > maxValue) {
            errors.push(`${fieldName} must be no more than ${maxValue}`);
          }
          break;
          
        case 'numeric':
          if (value && !this.isNumeric(value)) {
            errors.push(`${fieldName} must be a valid number`);
          }
          break;
          
        case 'positive':
          if (value !== null && value !== undefined && parseFloat(value) <= 0) {
            errors.push(`${fieldName} must be a positive number`);
          }
          break;
          
        case 'password':
          const passwordResult = this.validatePassword(value);
          if (!passwordResult.isValid) {
            errors.push(...passwordResult.errors);
            warnings.push(...passwordResult.warnings);
          }
          break;
          
        case 'cardId':
          if (value && !this.isValidCardId(value)) {
            errors.push(`${fieldName} must be a valid loyalty card ID`);
          }
          break;
          
        case 'amount':
          if (value && !this.isValidAmount(value)) {
            errors.push(`${fieldName} must be a valid monetary amount`);
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate multiple fields
   */
  validateForm(rules: ValidationRule[]): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (const rule of rules) {
      const result = this.validateField(rule.value, rule.rules, rule.field);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  // Private validation methods
  private isRequired(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  private isValidPhone(phone: string): boolean {
    // Support international formats
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone.trim());
  }

  private isNumeric(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  private validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (password && password.length < 8) {
      warnings.push('Consider using a longer password for better security');
    }

    if (password && !/[A-Z]/.test(password)) {
      warnings.push('Consider adding uppercase letters for stronger security');
    }

    if (password && !/[0-9]/.test(password)) {
      warnings.push('Consider adding numbers for stronger security');
    }

    if (password && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      warnings.push('Consider adding special characters for stronger security');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private isValidCardId(cardId: string): boolean {
    // Format: bal_usr_XXXXXXXX (where X is alphanumeric)
    const cardIdRegex = /^bal_usr_[A-Za-z0-9]{8}$/;
    return cardIdRegex.test(cardId.trim());
  }

  private isValidAmount(amount: any): boolean {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount >= 0 && numAmount <= 999999.99;
  }
}

// Export singleton instance
export const validator = FormValidator.getInstance();

// Utility functions for common validations
export const validateEmail = (email: string): ValidationResult => 
  validator.validateField(email, ['required', 'email'], 'Email');

export const validatePassword = (password: string): ValidationResult => 
  validator.validateField(password, ['required', 'password'], 'Password');

export const validatePhone = (phone: string): ValidationResult => 
  validator.validateField(phone, ['phone'], 'Phone Number');

export const validateName = (name: string): ValidationResult => 
  validator.validateField(name, ['required', 'minLength:2', 'maxLength:50'], 'Name');

export const validateAmount = (amount: any): ValidationResult => 
  validator.validateField(amount, ['required', 'amount', 'positive'], 'Amount');

export const validateCardId = (cardId: string): ValidationResult => 
  validator.validateField(cardId, ['cardId'], 'Card ID');

// Form validation helpers
export const getFirstError = (result: ValidationResult): string | null => 
  result.errors.length > 0 ? result.errors[0] : null;

export const getFirstWarning = (result: ValidationResult): string | null => 
  result.warnings.length > 0 ? result.warnings[0] : null;

export const hasErrors = (result: ValidationResult): boolean => 
  result.errors.length > 0;

export const hasWarnings = (result: ValidationResult): boolean => 
  result.warnings.length > 0;
