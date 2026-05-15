import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/generation/pipeline';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await getAllCategories();
    const groupMap = new Map<string, typeof categories>();
    for (const cat of categories) {
      const key = cat.groupName;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(cat);
    }
    const groups = Array.from(groupMap.entries()).map(([groupName, cats]) => ({
      groupName,
      categories: cats.map(c => ({ id: c.id, name: c.name, icon: c.icon })),
    }));
    return NextResponse.json({ groups }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (err) {
    console.error('[GET /api/categories]', err);
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}
