import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

class Database {
  private users: Map<string, User> = new Map();
  private tasks: Map<string, Task> = new Map();
  private emailIndex: Map<string, string> = new Map();

  constructor() {
    this.seedAdminUser();
  }

  private async seedAdminUser() {
    const bcrypt = await import('bcryptjs-react');
    const passwordHash = await bcrypt.default.hash('admin123', 10);

    const adminUser: User = {
      id: uuidv4(),
      email: 'admin@example.com',
      passwordHash,
      fullName: 'Admin User',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);
    this.emailIndex.set(adminUser.email.toLowerCase(), adminUser.id);
  }

  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...user,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(newUser.id, newUser);
    this.emailIndex.set(newUser.email.toLowerCase(), newUser.id);
    return newUser;
  }

  getUserByEmail(email: string): User | undefined {
    const userId = this.emailIndex.get(email.toLowerCase());
    return userId ? this.users.get(userId) : undefined;
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.set(newTask.id, newTask);
    return newTask;
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getTasksByUserId(userId: string): Task[] {
    return Array.from(this.tasks.values()).filter(task => task.userId === userId);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  deleteTask(id: string): boolean {
    return this.tasks.delete(id);
  }
}

export const db = new Database();
