import { db, User } from './database';
import { hashPassword, comparePassword, generateToken, verifyToken, extractTokenFromHeader } from './auth';
import { validateEmail, validatePassword, validateFullName, sanitizeInput, ValidationError } from './validation';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    errors?: ValidationError[];
  };
  statusCode: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

export const register = async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
  try {
    const errors: ValidationError[] = [];

    const emailError = validateEmail(data.email);
    if (emailError) errors.push(emailError);

    const passwordError = validatePassword(data.password);
    if (passwordError) errors.push(passwordError);

    const fullNameError = validateFullName(data.fullName);
    if (fullNameError) errors.push(fullNameError);

    if (errors.length > 0) {
      return {
        success: false,
        error: {
          message: 'Validation failed',
          errors
        },
        statusCode: 400
      };
    }

    const sanitizedEmail = sanitizeInput(data.email.toLowerCase());
    const sanitizedFullName = sanitizeInput(data.fullName);

    const existingUser = db.getUserByEmail(sanitizedEmail);
    if (existingUser) {
      return {
        success: false,
        error: {
          message: 'User with this email already exists'
        },
        statusCode: 409
      };
    }

    const passwordHash = await hashPassword(data.password);

    const newUser = db.createUser({
      email: sanitizedEmail,
      passwordHash,
      fullName: sanitizedFullName,
      role: 'user'
    });

    const token = generateToken({
      user_id: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return {
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      statusCode: 201
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Internal server error during registration'
      },
      statusCode: 500
    };
  }
};

export const login = async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
  try {
    const errors: ValidationError[] = [];

    const emailError = validateEmail(data.email);
    if (emailError) errors.push(emailError);

    const passwordError = validatePassword(data.password);
    if (passwordError) errors.push(passwordError);

    if (errors.length > 0) {
      return {
        success: false,
        error: {
          message: 'Validation failed',
          errors
        },
        statusCode: 400
      };
    }

    const sanitizedEmail = sanitizeInput(data.email.toLowerCase());

    const user = db.getUserByEmail(sanitizedEmail);
    if (!user) {
      return {
        success: false,
        error: {
          message: 'Invalid email or password'
        },
        statusCode: 401
      };
    }

    const isPasswordValid = await comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        success: false,
        error: {
          message: 'Invalid email or password'
        },
        statusCode: 401
      };
    }

    const token = generateToken({
      user_id: user.id,
      email: user.email,
      role: user.role
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      success: true,
      data: {
        user: userWithoutPassword,
        token
      },
      statusCode: 200
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Internal server error during login'
      },
      statusCode: 500
    };
  }
};

export const verifyTokenApi = (authHeader: string | null): ApiResponse<Omit<User, 'passwordHash'>> => {
  try {
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return {
        success: false,
        error: {
          message: 'No token provided'
        },
        statusCode: 401
      };
    }

    const payload = verifyToken(token);
    const user = db.getUserById(payload.user_id);

    if (!user) {
      return {
        success: false,
        error: {
          message: 'User not found'
        },
        statusCode: 404
      };
    }

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      success: true,
      data: userWithoutPassword,
      statusCode: 200
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Invalid token'
      },
      statusCode: 401
    };
  }
};

export const getAllUsers = (authHeader: string | null): ApiResponse<Omit<User, 'passwordHash'>[]> => {
  try {
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return {
        success: false,
        error: {
          message: 'No token provided'
        },
        statusCode: 401
      };
    }

    const payload = verifyToken(token);

    if (payload.role !== 'admin') {
      return {
        success: false,
        error: {
          message: 'Access denied. Admin role required.'
        },
        statusCode: 403
      };
    }

    const users = db.getAllUsers();
    const usersWithoutPasswords = users.map(({ passwordHash, ...user }) => user);

    return {
      success: true,
      data: usersWithoutPasswords,
      statusCode: 200
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Invalid or expired token'
      },
      statusCode: 401
    };
  }
};
