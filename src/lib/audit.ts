import { supabase } from '@/lib/supabase';

export async function logAudit(params: {
  action: string;
  module: string;
  record_id?: string;
  record_type?: string;
  description: string;
  previous_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
}) {
  try {
    await supabase.from('audit_logs').insert({
      action: params.action,
      module: params.module,
      record_id: params.record_id || null,
      record_type: params.record_type || null,
      description: params.description,
      previous_values: params.previous_values || null,
      new_values: params.new_values || null,
    });
  } catch (err) {
    console.error('Failed to log audit entry:', err);
  }
}
