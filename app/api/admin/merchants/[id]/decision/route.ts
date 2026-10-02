import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';

const bodySchema = z.object({
  decision: z.enum(['approved', 'rejected', 'suspended']),
});

function assertOperator(req: Request): boolean {
  const expected = process.env.UPEER_OPERATOR_API_KEY;
  if (!expected) {
    return false;
  }
  const provided = req.headers.get('x-upeer-operator-key');
  return provided === expected;
}

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }
  if (!assertOperator(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  try {
    const { decision } = bodySchema.parse(await req.json());
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('merchants')
      .update({
        status: decision,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, status, display_name')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Decision failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
