/**
 * Password validation utilities for signup forms
 * Requirements: 8+ chars, at least 1 number, at least 1 uppercase letter
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Validate password against requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  if (errors.length === 0) {
    // All basic requirements met
    const hasLowercase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLong = password.length >= 12;

    if (hasLowercase && hasSpecialChar && isLong) {
      strength = 'strong';
    } else if (hasLowercase || hasSpecialChar || isLong) {
      strength = 'medium';
    } else {
      strength = 'medium'; // Basic requirements met
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Get password strength color for UI display
 */
export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'strong':
      return 'bg-green-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'weak':
    default:
      return 'bg-red-500';
  }
}

/**
 * Get password requirements for display
 */
export function getPasswordRequirements(): { label: string; test: (password: string) => boolean }[] {
  return [
    { label: "At least 8 characters", test: (p) => p.length >= 8 },
    { label: "At least 1 number", test: (p) => /[0-9]/.test(p) },
    { label: "At least 1 uppercase letter", test: (p) => /[A-Z]/.test(p) },
  ];
}
