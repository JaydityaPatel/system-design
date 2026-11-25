import { LanguageCode } from '../types/course';

export interface PracticeQuestion {
  id: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  {
    id: 'pq-1',
    topic: 'Latency & Throughput',
    difficulty: 'Beginner',
    prompt:
      'Your App Server averages 96% CPU utilization during peak bursts. Throughput barely increased from 450 to 480 req/s, yet p99 latency jumped from 600 ms to 4.2 s. Why?',
    options: [
      'TCP packets automatically compress above 90% CPU',
      'Queueing delay grows nonlinearly near 100% utilization ("hockey stick" effect)',
      'The server switched from p50 to p99 measurement mode',
      'DNS TTL expired at the exact same moment',
    ],
    correctIndex: 1,
    explanation:
      'Near 100% utilization, tiny traffic bursts cannot be drained before the next burst arrives, causing queues—and tail latency—to explode exponentially.',
  },
  {
    id: 'pq-2',
    topic: 'Scaling',
    difficulty: 'Beginner',
    prompt:
      'An idle server in Frankfurt responds in 5 ms locally, but users in Tokyo still observe 240 ms latency. What will fix this?',
    options: [
      'Upgrade the Frankfurt server from 8 vCPUs to 64 vCPUs',
      'Increase the database connection pool size',
      'Deploy edge caching / regional compute closer to Tokyo users',
      'Disable p99 metrics collection',
    ],
    correctIndex: 2,
    explanation:
      'Speed of light in fiber sets a hard distance floor (~200 ms+ RTT Frankfurt–Tokyo). Only geographic proximity (CDN/edge/multi-region) reduces physical network RTT.',
  },
  {
    id: 'pq-3',
    topic: "Little's Law",
    difficulty: 'Intermediate',
    prompt:
      'A service sustains 500 req/s at an average latency of 200 ms (0.2 s). Roughly how many requests are concurrently in flight?',
    options: ['25 requests', '100 requests', '500 requests', '2,500 requests'],
    correctIndex: 1,
    explanation:
      "By Little's Law (L = λ × W): 500 req/s × 0.2 s = 100 concurrent requests in flight.",
  },
  {
    id: 'pq-4',
    topic: 'Fan-out & Tail Latency',
    difficulty: 'Intermediate',
    prompt:
      'A dashboard endpoint triggers 5 parallel microservice calls and waits for all 5 to complete. Which metric dominates the dashboard response time?',
    options: [
      'The fastest child service response',
      'The average of the 5 child latencies',
      'The slowest outlier among all 5 child responses',
      'Only the first service called',
    ],
    correctIndex: 2,
    explanation:
      'Parallel fan-out amplifies tail latency: the parent cannot return until the slowest of the 5 dependencies finishes.',
  },
  {
    id: 'pq-5',
    topic: 'Caching',
    difficulty: 'Intermediate',
    prompt:
      'A popular cache key expires and 2,000 concurrent requests miss Redis and hit PostgreSQL simultaneously. Which pattern stops this cache stampede?',
    options: [
      'Request coalescing / singleflight lock on cache miss',
      'Removing all database indexes',
      'Setting TTL to 1 millisecond',
      'Switching from HTTP/2 to HTTP/1.0',
    ],
    correctIndex: 0,
    explanation:
      'Singleflight / mutex coalescing allows only one worker to recompute the missing key from the DB while concurrent callers wait for that shared result.',
  },
  {
    id: 'pq-6',
    topic: 'Capacity Planning',
    difficulty: 'Beginner',
    prompt:
      'What target peak utilization range gives the best balance between cost efficiency and burst headroom for latency-sensitive APIs?',
    options: ['10–15%', '60–70%', '92–98%', '100%'],
    correctIndex: 1,
    explanation:
      'Running around 60–70% at peak leaves 30–40% headroom to absorb unpredictable traffic bursts without triggering the hockey-stick latency cliff.',
  },
];

export interface CheatsheetCard {
  id: string;
  title: string;
  category: string;
  items: { label: string; value: string; note?: string }[];
}

export const CHEATSHEETS: CheatsheetCard[] = [
  {
    id: 'cs-latency-numbers',
    title: 'Latency Numbers Every Engineer Should Know',
    category: 'Foundations',
    items: [
      { label: 'L1 cache reference', value: '1 ns', note: 'CPU core' },
      { label: 'RAM reference', value: '100 ns', note: 'Main memory' },
      { label: 'SSD random read', value: '100 µs', note: 'NVMe ~20–100 µs' },
      { label: 'Redis / Memcached hit', value: '0.5–1 ms', note: 'Same-AZ network' },
      { label: 'Same-region RTT', value: '1–2 ms', note: 'Intra-VPC' },
      { label: 'Cross-continent RTT', value: '80–150 ms', note: 'Speed of light floor' },
    ],
  },
  {
    id: 'cs-formulas',
    title: 'Essential Capacity & Queueing Formulas',
    category: 'Foundations',
    items: [
      { label: "Little's Law", value: 'L = λ × W', note: 'Concurrency = Throughput × Latency' },
      { label: 'Peak Utilization Target', value: '60% – 70%', note: 'Avoid >80% hockey-stick cliff' },
      { label: '1 Million req/day', value: '~12 req/s avg', note: 'Peak typically 3×–5× avg' },
      { label: '100 Million req/day', value: '~1,157 req/s avg', note: '~3.5k–6k req/s peak' },
      { label: 'Availability 99.9%', value: '8.76 hrs/yr downtime', note: 'Three nines' },
      { label: 'Availability 99.99%', value: '52.6 min/yr downtime', note: 'Four nines' },
    ],
  },
  {
    id: 'cs-protocols',
    title: 'Protocol & Pattern Selection Guide',
    category: 'Communication',
    items: [
      { label: 'Public Web / Mobile API', value: 'REST (HTTP/2+)', note: 'Cacheable, ubiquitous' },
      { label: 'Internal Service Mesh', value: 'gRPC + Protobuf', note: 'Low CPU, streaming' },
      { label: 'Server → Browser Updates', value: 'SSE (EventSource)', note: 'Simple auto-reconnect' },
      { label: 'Bidirectional Realtime', value: 'WebSockets', note: 'Chat, multiplayer, live telemetry' },
      { label: 'Traffic Spike Buffering', value: 'Kafka / SQS', note: 'Async durability & backpressure' },
    ],
  },
  {
    id: 'cs-storage',
    title: 'Storage & Caching Quick Pick',
    category: 'Data & Storage',
    items: [
      { label: 'ACID / Financial / Joins', value: 'PostgreSQL / MySQL', note: 'Strong consistency' },
      { label: 'Hot Key-Value / Rate Limit', value: 'Redis', note: 'Sub-millisecond RAM' },
      { label: 'Time-Series Telemetry', value: 'TimescaleDB / ClickHouse', note: 'Partitioned by time' },
      { label: 'Full-Text Search', value: 'Elasticsearch / OpenSearch', note: 'Inverted index' },
      { label: 'Large Media / Archives', value: 'Amazon S3 + CloudFront', note: 'Presigned URLs' },
    ],
  },
];

export const UI_LABELS: Record<
  LanguageCode,
  {
    learn: string;
    practice: string;
    designLab: string;
    cheatsheets: string;
    searchPlaceholder: string;
    course: string;
    lessons: string;
    progress: string;
    replay: string;
    pause: string;
    resume: string;
    inThisLesson: string;
    whatChanged: string;
    youllLearn: string;
    back: string;
  }
> = {
  EN: {
    learn: 'Learn',
    practice: 'Practice',
    designLab: 'Design Lab',
    cheatsheets: 'Cheatsheets',
    searchPlaceholder: 'Search lessons & concepts...',
    course: 'Course',
    lessons: 'lessons',
    progress: 'PROGRESS',
    replay: 'Replay',
    pause: 'Pause',
    resume: 'Resume',
    inThisLesson: 'IN THIS LESSON',
    whatChanged: 'WHAT CHANGED',
    youllLearn: "YOU'LL LEARN",
    back: 'Back',
  },
  ES: {
    learn: 'Aprender',
    practice: 'Practicar',
    designLab: 'Laboratorio',
    cheatsheets: 'Guías rápidas',
    searchPlaceholder: 'Buscar lecciones y conceptos...',
    course: 'Curso',
    lessons: 'lecciones',
    progress: 'PROGRESO',
    replay: 'Repetir',
    pause: 'Pausar',
    resume: 'Reanudar',
    inThisLesson: 'EN ESTA LECCIÓN',
    whatChanged: 'QUÉ CAMBIÓ',
    youllLearn: 'APRENDERÁS',
    back: 'Atrás',
  },
  FR: {
    learn: 'Apprendre',
    practice: 'Pratiquer',
    designLab: 'Labo Design',
    cheatsheets: 'Mémentos',
    searchPlaceholder: 'Rechercher des leçons...',
    course: 'Cours',
    lessons: 'leçons',
    progress: 'PROGRÈS',
    replay: 'Rejouer',
    pause: 'Pause',
    resume: 'Reprendre',
    inThisLesson: 'DANS CETTE LEÇON',
    whatChanged: 'CE QUI A CHANGÉ',
    youllLearn: 'VOUS APPRENDREZ',
    back: 'Retour',
  },
  DE: {
    learn: 'Lernen',
    practice: 'Üben',
    designLab: 'Design-Labor',
    cheatsheets: 'Spickzettel',
    searchPlaceholder: 'Lektionen & Konzepte suchen...',
    course: 'Kurs',
    lessons: 'Lektionen',
    progress: 'FORTSCHRITT',
    replay: 'Neustart',
    pause: 'Pause',
    resume: 'Fortsetzen',
    inThisLesson: 'IN DIESER LEKTION',
    whatChanged: 'WAS SICH ÄNDERTE',
    youllLearn: 'LERNZIELE',
    back: 'Zurück',
  },
  JA: {
    learn: '学習',
    practice: '演習',
    designLab: '設計ラボ',
    cheatsheets: 'チートシート',
    searchPlaceholder: 'レッスン・概念を検索...',
    course: 'コース',
    lessons: 'レッスン',
    progress: '進捗',
    replay: '再生',
    pause: '一時停止',
    resume: '再開',
    inThisLesson: 'このレッスン',
    whatChanged: '変化した項目',
    youllLearn: '学習目標',
    back: '戻る',
  },
};
