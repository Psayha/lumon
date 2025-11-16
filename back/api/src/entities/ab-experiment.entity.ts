import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AbAssignment } from './ab-assignment.entity';
import { AbEvent } from './ab-event.entity';

@Entity('ab_experiments')
export class AbExperiment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  feature_name: string;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'integer', default: 50 })
  traffic_percentage: number;

  @Column({ type: 'jsonb', default: {} })
  variant_a_config: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  variant_b_config: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => AbAssignment, (assignment) => assignment.experiment)
  assignments: AbAssignment[];

  @OneToMany(() => AbEvent, (event) => event.experiment)
  events: AbEvent[];
}
