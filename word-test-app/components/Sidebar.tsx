'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '문제 출제' },
  { href: '/history', label: '시험 출제 이력' },
  { href: '/grade', label: '채점' },
  { href: '/results', label: '학생 기록' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{ width: '200px', minHeight: '100vh', background: '#1e293b', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #334155' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: 'bold', lineHeight: 1.4 }}>
          VOCA 1800<br />시험 관리
        </h1>
      </div>
      <nav style={{ marginTop: '16px' }}>
        {navItems.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: active ? 'bold' : 'normal',
                color: active ? '#ffffff' : '#94a3b8',
                background: active ? '#3b82f6' : 'transparent',
                borderRadius: active ? '0 8px 8px 0' : '0',
                marginRight: '12px',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
