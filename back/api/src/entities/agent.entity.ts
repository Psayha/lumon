import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { KnowledgeBase } from './knowledge-base.entity';

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

  @Column({ default: false })
  is_public!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  quick_commands?: { label: string; prompt: string; icon: string }[];

  @ManyToMany(() => KnowledgeBase)
  @JoinTable()
  knowledge_bases?: KnowledgeBase[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
