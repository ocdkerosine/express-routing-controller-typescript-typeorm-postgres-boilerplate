import bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { BeforeInsert, Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserRole } from '../enums/user.enums';

@Entity()
export class User extends BaseEntity {
  public static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  public async comparePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }

  @IsNotEmpty()
  @Column()
  firstName: string;

  @IsNotEmpty()
  @Column()
  lastName: string;

  @IsNotEmpty()
  @Column({ unique: true })
  public email: string;

  @IsNotEmpty()
  @Column()
  @Exclude()
  public password: string;

  @IsNotEmpty()
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  public role: UserRole;

  @Column({ default: false })
  public isEmailVerified: boolean;

  @Column({ default: true })
  public allowPasswordReset: boolean;

  @BeforeInsert()
  public normalizeEmail(): void {
    this.email = this.email.toLowerCase();
  }

  //TODO add to all entities
  view(this: User, full?: boolean): Partial<User> | User {
    const view = {} as User;
    let fields = ['id', 'email', 'firstName', 'lastName', 'role', 'isEmailVerified'];
    if (full) {
      fields = [...fields, 'createdAt', 'updatedAt'];
    }
    fields.forEach(field => {
      view[field] = this[field];
    });
    return view;
  }

  @BeforeInsert()
  public async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await User.hashPassword(this.password);
    }
  }
}
