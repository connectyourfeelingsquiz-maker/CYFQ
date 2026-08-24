import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-server';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const BUCKET = 'cyfq-branding';

export async function POST(request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('logo');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No valid file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 2MB limit' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Generate unique filename to avoid cache issues
    const ext = file.name.split('.').pop();
    const filename = `logo_${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from(BUCKET)
      .getPublicUrl(filename);

    // Log the update
    await supabase.from('admin_audit_logs').insert({
      admin_id: session.email,
      action: 'login_page_logo_updated',
      target_type: 'app_settings',
      safe_metadata: { timestamp: new Date().toISOString(), path: filename }
    });

    return NextResponse.json({ success: true, url: publicUrl, path: filename });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Delete from storage
    const { error } = await supabase
      .storage
      .from(BUCKET)
      .remove([path]);

    if (error) {
      console.error('Failed to remove from storage:', error);
      // Even if storage removal fails (e.g., file not found), we might still want to proceed with DB removal,
      // but let's log it.
    }

    // Log the removal
    await supabase.from('admin_audit_logs').insert({
      admin_id: session.email,
      action: 'login_page_logo_removed',
      target_type: 'app_settings',
      safe_metadata: { timestamp: new Date().toISOString(), path }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logo delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
