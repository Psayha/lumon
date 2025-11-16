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

@Entity('rate_limits')
@Unique(['user_id', 'endpoint', 'window_start'])
@Index(['user_id', 'endpoint'])
@Index(['window_start'])
export class RateLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  endpoint: string;

  @Column({ type: 'integer', default: 0 })
  request_count: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  window_start: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
