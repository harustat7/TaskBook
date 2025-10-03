export interface ValidationError {
  field: string;
  message: string;
}

export const validateEmail = (email: string): ValidationError | null => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!email) {
    return { field: 'email', message: 'Email is required' };
  }
  if (!emailRegex.test(email)) {
    return { field: 'email', message: 'Invalid email format' };
  }
  return null;
};

export const validatePassword = (password: string): ValidationError | null => {
  if (!password) {
    return { field: 'password', message: 'Password is required' };
  }
  if (password.length < 6) {
    return { field: 'password', message: 'Password must be at least 6 characters long' };
  }
  return null;
};

export const validateFullName = (fullName: string): ValidationError | null => {
  if (!fullName) {
    return { field: 'fullName', message: 'Full name is required' };
  }
  if (fullName.trim().length < 2) {
    return { field: 'fullName', message: 'Full name must be at least 2 characters long' };
  }
  return null;
};

export const validateTaskTitle = (title: string): ValidationError | null => {
  if (!title) {
    return { field: 'title', message: 'Title is required' };
  }
  if (title.trim().length < 3) {
    return { field: 'title', message: 'Title must be at least 3 characters long' };
  }
  return null;
};

export const validateTaskStatus = (status: string): ValidationError | null => {
  const validStatuses = ['pending', 'in_progress', 'completed'];
  if (!status) {
    return { field: 'status', message: 'Status is required' };
  }
  if (!validStatuses.includes(status)) {
    return { field: 'status', message: 'Invalid status. Must be: pending, in_progress, or completed' };
  }
  return null;
};

export const validateTaskPriority = (priority: string): ValidationError | null => {
  const validPriorities = ['low', 'medium', 'high'];
  if (!priority) {
    return { field: 'priority', message: 'Priority is required' };
  }
  if (!validPriorities.includes(priority)) {
    return { field: 'priority', message: 'Invalid priority. Must be: low, medium, or high' };
  }
  return null;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
