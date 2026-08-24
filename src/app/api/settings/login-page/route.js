import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-server';
import { getSupabaseClient } from '@/lib/supabase-client'; // Wait, server side should use admin client for POST, but public GET can just use anon, or also admin client to bypass RLS easily since it's server side.

const DEFAULT_SETTINGS = {
  login_title: "Welcome to CYFQ",
  login_subtitle: "Connect Your Feelings Quiz",
  username_1_label: "Username 1",
  username_2_label: "Username 2",
  username_1_placeholder: "Enter Username 1",
  username_2_placeholder: "Enter Username 2",
  login_button_text: "Log In",
  login_footer_text: "Connect and play quizzes with your friends."
};

// GET is public, anyone can view the login page settings
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'login_page_config')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is not found
      throw error;
    }

    const settings = { ...DEFAULT_SETTINGS, ...(data?.setting_value || {}) };
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Fetch settings error:', error.message);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

// POST is admin only
export async function POST(request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = createAdminClient();

    // Upsert the setting
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        setting_key: 'login_page_config',
        setting_value: body,
        updated_by: session.email,
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });

    if (error) throw error;

    // Log the change
    await supabase.from('admin_audit_logs').insert({
      admin_id: session.email,
      action: 'update_login_settings',
      target_type: 'app_settings',
      target_id: 'login_page_config',
      safe_metadata: { timestamp: new Date().toISOString() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update settings error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
