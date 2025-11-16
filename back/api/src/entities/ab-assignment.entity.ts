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
import { AbExperiment } from './ab-experiment.entity';

export enum AbVariant {
  A = 'A',
  B = 'B',
}

@Entity('ab_assignments')
@Unique(['experiment_id', 'user_id'])
@Index(['experiment_id'])
@Index(['user_id'])
@Index(['variant'])
export class AbAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  experiment_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({
    type: 'enum',
    enum: AbVariant,
    enumName: 'ab_variant',
  })
  variant: AbVariant;

  @CreateDateColumn({ type: 'timestamptz' })
  assigned_at: Date;

  @ManyToOne(() => AbExperiment, (experiment) => experiment.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'experiment_id' })
  experiment: AbExperiment;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
