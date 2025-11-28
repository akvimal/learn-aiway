import { User, UserRole } from '../types';

export class UserModel implements User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;

  constructor(data: User) {
    this.id = data.id;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.role = data.role;
    this.is_email_verified = data.is_email_verified;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  toJSON(): Omit<User, 'password_hash'> {
    const { password_hash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  getFullName(): string {
    return `${this.first_name} ${this.last_name}`;
  }
}
