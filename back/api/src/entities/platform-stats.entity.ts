import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('platform_stats')
@Unique(['date'])
@Index(['date'])
export class PlatformStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', unique: true })
  date: Date;

  @Column({ type: 'integer', default: 0 })
  total_users: number;

  @Column({ type: 'integer', default: 0 })
  active_users: number;

  @Column({ type: 'integer', default: 0 })
  total_companies: number;

  @Column({ type: 'integer', default: 0 })
  total_chats: number;

  @Column({ type: 'integer', default: 0 })
  total_messages: number;

  @Column({ type: 'integer', default: 0 })
  new_users: number;

  @Column({ type: 'integer', default: 0 })
  new_companies: number;

  @Column({ type: 'jsonb', default: {} })
  metrics: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
