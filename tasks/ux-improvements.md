# UX/UI 개선 제안

## 우선순위 1: 아이콘 추가 (lucide-react)

가장 빠르게 고급스러운 느낌을 줄 수 있는 방법.

```bash
npm install lucide-react
```

적용 위치:
- 사이드바 메뉴 앞: `<FileText>` 문제 출제 / `<History>` 시험 이력 / `<PenLine>` 채점 / `<Users>` 학생 기록
- 버튼: PDF 다운로드 `<Download>`, 분석 `<BarChart2>`, 시험 생성 `<Plus>`
- 학생 카드 통계 앞에 작은 아이콘

---

## 우선순위 2: shadcn/ui 도입

일관된 디자인 시스템. Button, Input, Select, Card, Table 컴포넌트를 교체하면 전체가 통일됨.

```bash
npx shadcn@latest init
npx shadcn@latest add button input select card table badge
```

현재 inline style + Tailwind 혼재 → shadcn/ui로 통일하면 유지보수도 쉬워짐.

---

## 우선순위 3: 색상 톤 조정

현재 indigo 계열 → **slate + violet** 조합 추천

| 현재 | 변경 |
|------|------|
| `bg-indigo-600` | `bg-violet-600` |
| `focus:ring-indigo-500` | `focus:ring-violet-500` |
| 사이드바 `#1e293b` | 유지 (이미 고급스러움) |

---

## 우선순위 4: 마이크로 인터랙션

- 버튼 hover 시 scale 애니메이션 (`transition hover:scale-105`)
- 학생 카드 hover 시 shadow 강화 (`hover:shadow-lg`)
- 분석 패널 슬라이드 인 애니메이션 (`translateX` CSS transition)
- 페이지 전환 시 fade-in (`opacity-0 → opacity-100`)

---

## 우선순위 5: 빈 상태(Empty State) 개선

현재 "채점 기록이 없습니다" 텍스트만 있음 → 아이콘 + 안내 문구 추가

```tsx
<div className="text-center py-16">
  <BookOpen className="mx-auto mb-4 text-gray-300" size={48} />
  <p className="text-gray-400">아직 채점 기록이 없습니다</p>
  <p className="text-sm text-gray-300 mt-1">채점 탭에서 시험을 채점해보세요</p>
</div>
```

---

## 우선순위 6: 반응형 레이아웃

현재 사이드바가 모바일에서 공간을 많이 차지함.
- 모바일: 사이드바 → 하단 탭 바로 전환
- 태블릿 이상: 현재 레이아웃 유지

---

## 권장 진행 순서

1. **lucide-react 아이콘** — 30분, 효과 큼
2. **마이크로 인터랙션** — 1시간, 체감 품질 향상
3. **shadcn/ui** — 반나절, 전체 리팩토링 필요하지만 장기적으로 가장 효과적
