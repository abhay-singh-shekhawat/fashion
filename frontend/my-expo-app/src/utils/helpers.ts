export const helpers = {
  // Check if email is valid
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Check if password is strong
  isStrongPassword: (password: string): boolean => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  },

  // Generate unique ID
  generateId: (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Deep clone object
  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
  },

  // Check if object is empty
  isEmpty: (obj: any): boolean => {
    return Object.keys(obj).length === 0;
  },

  // Delay execution
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};
