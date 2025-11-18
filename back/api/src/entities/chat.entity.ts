import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Company } from './company.entity';
import { Message } from './message.entity';

@Entity('chats')
@Index(['user_id'])
@Index(['company_id'])
@Index(['created_at'])
@Index(['user_id', 'company_id'])
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid', nullable: true })
  company_id!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.chats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Company, (company) => company.chats, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @OneToMany(() => Message, (message) => message.chat)
  messages!: Message[];
}
