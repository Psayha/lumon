import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_limits')
@Unique(['user_id', 'limit_type'])
@Index(['user_id'])
@Index(['limit_type'])
@Index(['reset_at'])
export class UserLimit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'varchar', length: 50 })
  limit_type!: string; // 'generations_per_day', 'chats_per_month', 'messages_per_day'

  @Column({ type: 'integer', default: 0 })
  limit_value!: number;

  @Column({ type: 'integer', default: 0 })
  current_usage!: number;

  @Column({ type: 'timestamptz', nullable: true })
  reset_at!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.userLimits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
