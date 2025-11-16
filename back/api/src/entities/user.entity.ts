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
import { UserLimit } from './user-limit.entity';
import { AuditEvent } from './audit-event.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true })
  telegram_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  first_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  last_name: string;

  @Column({ type: 'varchar', length: 10, default: 'ru' })
  language_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  app_version: string;

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToMany(() => Chat, (chat) => chat.user)
  chats: Chat[];

  @OneToMany(() => UserCompany, (userCompany) => userCompany.user)
  userCompanies: UserCompany[];

  @OneToMany(() => UserLimit, (userLimit) => userLimit.user)
  userLimits: UserLimit[];

  @OneToMany(() => AuditEvent, (auditEvent) => auditEvent.user)
  auditEvents: AuditEvent[];
}
