import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { AbExperiment } from './ab-experiment.entity';
import { AbVariant } from './ab-assignment.entity';

@Entity('ab_events')
@Index(['experiment_id'])
@Index(['user_id'])
@Index(['event_type'])
@Index(['created_at'])
export class AbEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  experiment_id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({
    type: 'enum',
    enum: AbVariant,
    enumName: 'ab_variant',
  })
  variant!: AbVariant;

  @Column({ type: 'varchar', length: 50 })
  event_type!: string;

  @Column({ type: 'jsonb', default: {} })
  event_data!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => AbExperiment, (experiment) => experiment.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'experiment_id' })
  experiment!: AbExperiment;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
