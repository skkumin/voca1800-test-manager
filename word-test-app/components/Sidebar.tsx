'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, History, PenLine, Users, UserCog } from 'lucide-react';

const navItems = [
  { href: '/', label: '문제 출제', icon: FileText },
  { href: '/history', label: '시험 출제 이력', icon: History },
  { href: '/grade', label: '채점', icon: PenLine },
  { href: '/results', label: '학생 기록', icon: Users },
  { href: '/students', label: '학생 관리', icon: UserCog },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{ width: '210px', minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1e293b' }}>
        <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>VOCA 1800</p>
        <h1 style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: 'bold' }}>시험 관리</h1>
      </div>
      <nav style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 12px' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                fontSize: '14px',
                fontWeight: active ? '600' : '400',
                color: active ? '#ffffff' : '#64748b',
                background: active ? '#1e40af' : 'transparent',
                borderRadius: '8px',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#1e293b'; (e.currentTarget as HTMLElement).style.color = '#cbd5e1'; }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; } }}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
