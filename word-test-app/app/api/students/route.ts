import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('student_id');

    if (error) throw error;
    return NextResponse.json({ students: data || [] });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, school } = await req.json();

    if (!name?.trim() || !school?.trim()) {
      return NextResponse.json({ error: '이름과 학교를 입력하세요' }, { status: 400 });
    }

    const studentId = `S${Date.now()}`;

    const { data, error } = await supabase
      .from('students')
      .insert({ student_id: studentId, name: name.trim(), school: school.trim() })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ student: data });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
