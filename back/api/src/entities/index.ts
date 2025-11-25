// Export all entities for easy import
export { User } from './user.entity';
export { Company } from './company.entity';
export { Session, UserRole } from './session.entity';
export { AdminSession } from './admin-session.entity';
export { UserCompany } from './user-company.entity';
export { Chat } from './chat.entity';
export { Message, MessageRole } from './message.entity';
export { AuditEvent } from './audit-event.entity';
export { IdempotencyKey } from './idempotency-key.entity';
export { UserLimit } from './user-limit.entity';
export { AbExperiment } from './ab-experiment.entity';
export { AbAssignment, AbVariant } from './ab-assignment.entity';
export { AbEvent } from './ab-event.entity';
export { Agent } from './agent.entity';
export * from './knowledge-base.entity';
export { PlatformStats } from './platform-stats.entity';
export { RateLimit } from './rate-limit.entity';
export { Backup } from './backup.entity';
export { LoginAttempt } from './login-attempt.entity';
export { LegalDoc } from './legal-doc.entity';

// Import for entities array
import { User } from './user.entity';
import { Company } from './company.entity';
import { Session } from './session.entity';
import { AdminSession } from './admin-session.entity';
import { UserCompany } from './user-company.entity';
import { Chat } from './chat.entity';
import { Message } from './message.entity';
import { AuditEvent } from './audit-event.entity';
import { IdempotencyKey } from './idempotency-key.entity';
import { UserLimit } from './user-limit.entity';
import { AbExperiment } from './ab-experiment.entity';
import { AbAssignment } from './ab-assignment.entity';
import { AbEvent } from './ab-event.entity';
import { PlatformStats } from './platform-stats.entity';
import { RateLimit } from './rate-limit.entity';
import { Backup } from './backup.entity';
import { LoginAttempt } from './login-attempt.entity';
import { LegalDoc } from './legal-doc.entity';

// All entities array for TypeORM configuration
export const entities = [
  User,
  Company,
  Session,
  AdminSession,
  UserCompany,
  Chat,
  Message,
  AuditEvent,
  IdempotencyKey,
  UserLimit,
  AbExperiment,
  AbAssignment,
  AbEvent,
  PlatformStats,
  RateLimit,
  Backup,
  LoginAttempt,
  LegalDoc,
];
