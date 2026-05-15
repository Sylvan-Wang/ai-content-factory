import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, trackInteraction } from '@/lib/analytics/tracker';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, sessionId, event, properties, generationLogId, action, wasEdited } = body;
    if (!sessionId) return NextResponse.json({ ok: false }, { status: 400 });
    if (type === 'interaction' && generationLogId && action) {
      await trackInteraction(sessionId, generationLogId, action, wasEdited);
    } else if (event) {
      await trackEvent(event, properties ?? {}, sessionId);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/track]', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
