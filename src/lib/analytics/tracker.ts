import { supabaseAdmin } from '../supabase';

export async function trackEvent(event: string, properties: Record<string, unknown>, sessionId: string): Promise<void> {
  supabaseAdmin.from('analytics_events').insert({ session_id: sessionId, event, properties }).then(() => {}).catch((err) => {
    console.warn('[Analytics] track failed:', err);
  });
}

export async function trackInteraction(
  sessionId: string,
  generationLogId: string,
  action: 'copy_all' | 'copy_title' | 'copy_body' | 'copy_tags' | 'edit' | 'regenerate',
  wasEdited = false,
): Promise<void> {
  supabaseAdmin.from('content_interactions').insert({ session_id: sessionId, generation_log_id: generationLogId, action, was_edited: wasEdited }).then(() => {}).catch(() => {});
}
