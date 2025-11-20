import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * SECURITY: Tracks failed login attempts to prevent brute force attacks
 * Auto-expires after LOCKOUT_DURATION to allow legitimate users to retry
 */
@Entity('login_attempts')
@Index(['identifier', 'attempt_time']) // Optimize lookups by username/IP and time
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Identifier can be username, email, or IP address
   * Used to track attempts from the same source
   */
  @Column({ type: 'varchar', length: 255 })
  @Index()
  identifier!: string;

  /**
   * Type of identifier: 'username', 'email', 'ip'
   */
  @Column({ type: 'varchar', length: 50 })
  identifier_type!: 'username' | 'email' | 'ip';

  /**
   * IP address of the failed attempt
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address?: string;

  /**
   * User agent of the failed attempt
   */
  @Column({ type: 'text', nullable: true })
  user_agent?: string;

  /**
   * Whether this attempt is part of an active lockout
   */
  @Column({ type: 'boolean', default: false })
  is_locked!: boolean;

  /**
   * When the lockout expires (null if not locked)
   */
  @Column({ type: 'timestamp', nullable: true })
  locked_until?: Date;

  /**
   * Number of consecutive failed attempts
   */
  @Column({ type: 'int', default: 1 })
  attempt_count!: number;

  @CreateDateColumn()
  attempt_time!: Date;
}
