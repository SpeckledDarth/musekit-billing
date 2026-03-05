import { getSupabaseAdmin } from './lib/database';

export interface AuditLogEntry {
  action: string;
  entity_type: string;
  entity_id: string;
  actor_id?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export async function logAuditEvent(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
  const log: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  try {
    const supabase = getSupabaseAdmin();
    await (supabase.from('audit_logs') as any).insert({
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      actor_id: log.actor_id || null,
      metadata: log.metadata || {},
      created_at: log.timestamp,
    });
  } catch {
    console.warn('[audit] Failed to write audit log to database, falling back to console');
    console.log('[audit]', JSON.stringify(log));
  }
}
