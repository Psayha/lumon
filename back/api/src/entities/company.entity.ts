import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Session } from './session.entity';
import { Chat } from './chat.entity';
import { UserCompany } from './user-company.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'jsonb', default: {} })
  settings!: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  // Relations
  @OneToMany(() => Session, (session) => session.company)
  sessions!: Session[];

  @OneToMany(() => Chat, (chat) => chat.company)
  chats!: Chat[];

  @OneToMany(() => UserCompany, (userCompany) => userCompany.company)
  userCompanies!: UserCompany[];
}
