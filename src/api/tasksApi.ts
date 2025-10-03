import { db, Task } from './database';
import { verifyToken, extractTokenFromHeader } from './auth';
import { validateTaskTitle, validateTaskStatus, validateTaskPriority, sanitizeInput, ValidationError } from './validation';
import { ApiResponse } from './authApi';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
}

export const createTask = (authHeader: string | null, data: CreateTaskRequest): ApiResponse<Task> => {
  try {
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return {
        success: false,
        error: { message: 'No token provided' },
        statusCode: 401
      };
    }

    const payload = verifyToken(token);
    const errors: ValidationError[] = [];

    const titleError = validateTaskTitle(data.title);
    if (titleError) errors.push(titleError);

    if (data.status) {
      const statusError = validateTaskStatus(data.status);
      if (statusError) errors.push(statusError);
    }

    if (data.priority) {
      const priorityError = validateTaskPriority(data.priority);
      if (priorityError) errors.push(priorityError);
    }

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

    const task = db.createTask({
      title: sanitizeInput(data.title),
      description: data.description ? sanitizeInput(data.description) : '',
      status: data.status || 'pending',
      priority: data.priority || 'medium',
      userId: payload.user_id
    });

    return {
      success: true,
      data: task,
      statusCode: 201
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      statusCode: 500
    };
  }
};

export const getTasks = (authHeader: string | null): ApiResponse<Task[]> => {
  try {
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return {
        success: false,
        error: { message: 'No token provided' },
        statusCode: 401
      };
    }

    const payload = verifyToken(token);

    let tasks: Task[];
    if (payload.role === 'admin') {
      tasks = db.getAllTasks();
    } else {
      tasks = db.getTasksByUserId(payload.user_id);
    }

    return {
      success: true,
      data: tasks,
      statusCode: 200
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      statusCode: 401
    };
  }
};

export const getTaskById = (authHeader: string | null, taskId: string): ApiResponse<Task> => {
  try {
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return {
        success: false,
        error: { message: 'No token provided' },
        statusCode: 401
      };
    }

    const payload = verifyToken(token);
    const task = db.getTaskById(taskId);

    if (!task) {
      return {
        success: false,
        error: { message: 'Task not found' },
        statusCode: 404
      };
    }

    if (payload.role !== 'admin' && task.userId !== payload.user_id) {
      return {
        success: false,
        error: { message: 'Access denied' },
        statusCode: 403
      };
    }

    return {
      success: true,
      data: task,
      statusCode: 200
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      statusCode: 401
    };
  }
};

export const updateTask = (authHeader: string | null, taskId: string, data: UpdateTaskRequest): ApiResponse<Task> => {
  try {
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return {
        success: false,
        error: { message: 'No token provided' },
        statusCode: 401
      };
    }

    const payload = verifyToken(token);
    const task = db.getTaskById(taskId);

    if (!task) {
      return {
        success: false,
        error: { message: 'Task not found' },
        statusCode: 404
      };
    }

    if (payload.role !== 'admin' && task.userId !== payload.user_id) {
      return {
        success: false,
        error: { message: 'Access denied' },
        statusCode: 403
      };
    }

    const errors: ValidationError[] = [];

    if (data.title) {
      const titleError = validateTaskTitle(data.title);
      if (titleError) errors.push(titleError);
    }

    if (data.status) {
      const statusError = validateTaskStatus(data.status);
      if (statusError) errors.push(statusError);
    }

    if (data.priority) {
      const priorityError = validateTaskPriority(data.priority);
      if (priorityError) errors.push(priorityError);
    }

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

    const updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>> = {};

    if (data.title) updates.title = sanitizeInput(data.title);
    if (data.description !== undefined) updates.description = sanitizeInput(data.description);
    if (data.status) updates.status = data.status;
    if (data.priority) updates.priority = data.priority;

    const updatedTask = db.updateTask(taskId, updates);

    if (!updatedTask) {
      return {
        success: false,
        error: { message: 'Failed to update task' },
        statusCode: 500
      };
    }

    return {
      success: true,
      data: updatedTask,
      statusCode: 200
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      statusCode: 500
    };
  }
};

export const deleteTask = (authHeader: string | null, taskId: string): ApiResponse<{ message: string }> => {
  try {
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return {
        success: false,
        error: { message: 'No token provided' },
        statusCode: 401
      };
    }

    const payload = verifyToken(token);
    const task = db.getTaskById(taskId);

    if (!task) {
      return {
        success: false,
        error: { message: 'Task not found' },
        statusCode: 404
      };
    }

    if (payload.role !== 'admin' && task.userId !== payload.user_id) {
      return {
        success: false,
        error: { message: 'Access denied' },
        statusCode: 403
      };
    }

    const deleted = db.deleteTask(taskId);

    if (!deleted) {
      return {
        success: false,
        error: { message: 'Failed to delete task' },
        statusCode: 500
      };
    }

    return {
      success: true,
      data: { message: 'Task deleted successfully' },
      statusCode: 200
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      statusCode: 500
    };
  }
};
