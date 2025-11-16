import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Company } from './company.entity';
import { UserRole } from './session.entity';

@Entity('user_companies')
@Unique(['user_id', 'company_id'])
@Index(['user_id'])
@Index(['company_id'])
@Index(['role'])
export class UserCompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role',
  })
  role: UserRole;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.userCompanies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Company, (company) => company.userCompanies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
