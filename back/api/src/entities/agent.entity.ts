import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 'gpt-4-turbo-preview' })
  model!: string;

  @Column({ type: 'text', nullable: true })
  system_prompt?: string;

  @Column({ type: 'float', default: 0.7 })
  temperature!: number;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ default: false })
  is_default!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
