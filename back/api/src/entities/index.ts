// Export all entities for easy import
export { User } from './user.entity';
export { Company } from './company.entity';
export { Session, UserRole } from './session.entity';
export { UserCompany } from './user-company.entity';
export { Chat } from './chat.entity';
export { Message, MessageRole } from './message.entity';
export { AuditEvent } from './audit-event.entity';
export { IdempotencyKey } from './idempotency-key.entity';
export { UserLimit } from './user-limit.entity';

// Import for entities array
import { User } from './user.entity';
import { Company } from './company.entity';
import { Session } from './session.entity';
import { UserCompany } from './user-company.entity';
import { Chat } from './chat.entity';
import { Message } from './message.entity';
import { AuditEvent } from './audit-event.entity';
import { IdempotencyKey } from './idempotency-key.entity';
import { UserLimit } from './user-limit.entity';

// All entities array for TypeORM configuration
export const entities = [
  User,
  Company,
  Session,
  UserCompany,
  Chat,
  Message,
  AuditEvent,
  IdempotencyKey,
  UserLimit,
];
