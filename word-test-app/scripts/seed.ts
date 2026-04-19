import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const sampleWords = [
  {
    word: "thirst",
    meaning: "갈증, 목마름; 갈망하다",
    sentences: [
      "The drink would quench the local population's thirst.",
      "We thirst for retribution."
    ],
    day: "DAY1"
  },
  {
    word: "negotiator",
    meaning: "협상가, 중재자",
    sentences: [
      "The experienced negotiator resolved the dispute quickly.",
      "As a skilled negotiator, she won favorable terms."
    ],
    day: "DAY1"
  },
  {
    word: "ambiguity",
    meaning: "모호성, 애매함",
    sentences: [
      "The contract contained an ambiguity that led to disputes.",
      "We must eliminate ambiguity in our communication."
    ],
    day: "DAY1"
  },
  {
    word: "phenomenon",
    meaning: "현상, 놀라운 일",
    sentences: [
      "Climate change is a complex phenomenon.",
      "The northern lights are a natural phenomenon."
    ],
    day: "DAY1"
  },
  {
    word: "precision",
    meaning: "정확성, 정밀함",
    sentences: [
      "Surgery requires great precision.",
      "The instrument measures with high precision."
    ],
    day: "DAY2"
  },
  {
    word: "diligent",
    meaning: "근면한, 성실한",
    sentences: [
      "Her diligent work ethic impressed everyone.",
      "A diligent student always completes assignments on time."
    ],
    day: "DAY2"
  },
  {
    word: "eloquent",
    meaning: "웅변의, 말 잘하는",
    sentences: [
      "The eloquent speaker captivated the audience.",
      "His eloquent speech moved people to tears."
    ],
    day: "DAY2"
  },
  {
    word: "resilient",
    meaning: "탄력있는, 회복력있는",
    sentences: [
      "The resilient community rebuilt after the disaster.",
      "Rubber is a resilient material."
    ],
    day: "DAY3"
  },
  {
    word: "meticulous",
    meaning: "세밀한, 꼼꼼한",
    sentences: [
      "His meticulous attention to detail was impressive.",
      "The meticulous artist painted every brushstroke carefully."
    ],
    day: "DAY3"
  },
  {
    word: "pragmatic",
    meaning: "실용적인, 현실적인",
    sentences: [
      "We need a pragmatic approach to solve this problem.",
      "The pragmatic solution was more cost-effective."
    ],
    day: "DAY3"
  }
];

const sampleStudents = [
  { student_id: "S001", name: "홍길동", class: "1-1" },
  { student_id: "S002", name: "김철수", class: "1-1" },
  { student_id: "S003", name: "이영희", class: "1-2" },
  { student_id: "S004", name: "박민지", class: "1-2" },
  { student_id: "S005", name: "정준호", class: "1-3" }
];

async function seed() {
  try {
    console.log("🌱 Seeding words...");
    const { error: wordError } = await supabase
      .from("words")
      .insert(sampleWords);
    if (wordError) throw wordError;
    console.log(`✓ Inserted ${sampleWords.length} words`);

    console.log("🌱 Seeding students...");
    const { error: studentError } = await supabase
      .from("students")
      .insert(sampleStudents);
    if (studentError) throw studentError;
    console.log(`✓ Inserted ${sampleStudents.length} students`);

    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
