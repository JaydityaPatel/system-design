import { buildParametricQuestionBank } from './practiceBankGenerator';

export interface ExamQuestion {
  id: string;
  topicId: string;
  topicLabel: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  optionReasons?: string[];
}

export interface PracticeTopic {
  id: string;
  label: string;
  description: string;
}

export const PRACTICE_TOPICS: PracticeTopic[] = [
  {
    id: 'all',
    label: 'All Topics (Mixed Exam)',
    description: 'Randomized 10-question cross-topic exam drawn from the 514-question system design bank.',
  },
  {
    id: 'latency-throughput',
    label: 'Latency & Throughput',
    description: 'Queueing theory, utilization hockey stick, p50 vs p99, Little’s Law, fan-out, and batching.',
  },
  {
    id: 'foundations',
    label: 'Foundations & Napkin Math',
    description: 'Request lifecycle, DNS/TLS/TCP hops, back-of-the-envelope QPS, and storage sizing.',
  },
  {
    id: 'scaling',
    label: 'Scaling & Load Balancing',
    description: 'Vertical vs horizontal scaling, L4 vs L7 load balancers, health checks, and auto-scaling.',
  },
  {
    id: 'caching',
    label: 'Caching & CDN',
    description: 'Cache-aside, write-through, eviction policies, thundering herds, and edge CDNs.',
  },
  {
    id: 'data-storage',
    label: 'Data, Replication & Sharding',
    description: 'SQL vs NoSQL, B-Tree vs LSM-Tree, replication lag, consistent hashing, and CAP theorem.',
  },
  {
    id: 'communication',
    label: 'Communication & Queues',
    description: 'REST vs gRPC, WebSockets vs SSE, Kafka/RabbitMQ, backpressure, and idempotency.',
  },
  {
    id: 'reliability',
    label: 'Reliability & Rate Limiting',
    description: 'Token bucket, sliding window, exponential backoff with jitter, and circuit breakers.',
  },
  {
    id: 'architecture-security',
    label: 'Architecture & Security',
    description: 'API gateways, Saga pattern, CQRS, OAuth/JWT, TLS termination, and Zero Trust.',
  },
  {
    id: 'whole-systems',
    label: 'Whole Systems Design',
    description: 'URL shortener, chat systems, news feed fan-out, and adaptive video streaming.',
  },
];

export const CORE_EXAM_QUESTIONS: ExamQuestion[] = [
  // ── 1. LATENCY & THROUGHPUT (10 questions) ─────────────────────────────────
  {
    id: 'lt-1',
    topicId: 'latency-throughput',
    topicLabel: 'Latency & Throughput',
    difficulty: 'Beginner',
    prompt:
      'A server has a capacity of 500 req/s and currently serves 350 req/s (70% utilization). What happens to p99 latency when utilization climbs from 70% to 96%?',
    options: [
      'It increases linearly by ~37% in proportion to the extra traffic.',
      'It spikes dramatically (a "hockey stick" curve) because micro-bursts cannot drain and queues build up.',
      'It stays flat until utilization exceeds 100%, at which point requests are dropped.',
      'It improves slightly because CPU branch prediction warms up under heavy load.',
    ],
    correctIndex: 1,
    explanation:
      'Near 100% utilization, spare headroom approaches zero. Random arrival bursts pile up behind already-queued requests, causing queue wait time and p99 tail latency to explode nonlinearly.',
  },
  {
    id: 'lt-2',
    topicId: 'latency-throughput',
    topicLabel: 'Latency & Throughput',
    difficulty: 'Beginner',
    prompt:
      'Which statement accurately distinguishes latency from throughput?',
    options: [
      'Latency is the number of requests completed per second; throughput is the time for one request.',
      'Latency is the time for one request to complete; throughput is the rate of completed requests per unit time.',
      'Doubling server count always cuts single-request network latency in half.',
      'Throughput and latency are always inversely proportional, even on an idle server.',
    ],
    correctIndex: 1,
    explanation:
      'Latency measures end-to-end duration for a single request (e.g., 120 ms), while throughput measures volume over time (e.g., 500 req/s). Adding lanes increases throughput, not the speed limit of an empty road.',
  },
  {
    id: 'lt-3',
    topicId: 'latency-throughput',
    topicLabel: 'Latency & Throughput',
    difficulty: 'Intermediate',
    prompt:
      'An API has p50 = 45 ms and p99 = 1,800 ms. Why is monitoring only the mean (average) latency dangerous here?',
    options: [
      'The mean cannot be computed for time-series metrics.',
      'A low mean hides the slow 1% tail experienced by your heaviest or unluckiest users.',
      'p50 is always higher than the mean in skewed latency distributions.',
      'Percentiles automatically exclude failed HTTP 500 responses.',
    ],
    correctIndex: 1,
    explanation:
      'Latency distributions are heavily right-skewed. 95% of fast responses pull the average down, masking severe p99 tail spikes caused by GC pauses, lock contention, or queueing.',
  },
  {
    id: 'lt-4',
    topicId: 'latency-throughput',
    topicLabel: 'Latency & Throughput',
    difficulty: 'Intermediate',
    prompt:
      'Using Little’s Law (L = λ × W), if a service processes 400 req/s and the average request takes 0.25 seconds (250 ms), how many requests are concurrently in-flight?',
    options: ['25 requests', '100 requests', '160 requests', '1,600 requests'],
    correctIndex: 1,
    explanation:
      'L = λ × W = 400 req/s × 0.25 s = 100 concurrent in-flight requests. If latency rises to 1 second at the same arrival rate, concurrency jumps to 400.',
  },
  {
    id: 'lt-5',
    topicId: 'latency-throughput',
    topicLabel: 'Latency & Throughput',
    difficulty: 'Advanced',
    prompt:
      'An API gateway fans out every user request in parallel to 6 independent microservices, each with a 1% chance of taking >500 ms. Roughly what percentage of user requests will take >500 ms?',
    options: ['~1.0%', '~2.5%', '~5.9%', '~16.7%'],
    correctIndex: 2,
    explanation:
      'With 6 independent calls, the chance all 6 are fast is 0.99⁶ ≈ 0.9415, so ~5.85% of parent requests hit at least one slow call (tail amplification).',
  },
  {
    id: 'lt-6',
    topicId: 'latency-throughput',
    topicLabel: 'Latency & Throughput',
    difficulty: 'Intermediate',
    prompt:
      'Your single server is at 95% utilization serving 475 req/s. You add a second identical server behind a load balancer. What happens to utilization per server and network propagation latency?',
    options: [
      'Utilization drops to ~47.5% per server; network propagation latency stays roughly the same.',
      'Utilization stays at 95%; network propagation latency drops by 50%.',
      'Both utilization and speed-of-light wire latency drop by 50%.',
      'Utilization drops to 0% on the second server until the first crashes.',
    ],
    correctIndex: 0,
    explanation:
      'Horizontal scaling splits request load and eliminates queueing delay, but it cannot change the physical speed-of-light travel time over the network.',
  },
  {
    id: 'lt-7',
    topicId: 'latency-throughput',
    topicLabel: 'Latency & Throughput',
    difficulty: 'Intermediate',
    prompt:
      'A client in Tokyo queries a single database in Virginia (round-trip ~180 ms). Why can’t adding more CPU cores to the Virginia server reduce latency below ~180 ms?',
    options: [
      'CPU cores only improve throughput for UDP traffic, not TCP.',
      'Speed-of-light fiber propagation delay sets a hard physical latency floor.',
      'DNS resolution takes 180 ms on every single SQL query.',
      'TLS 1.3 requires 180 ms of cryptographic padding.',
    ],
    correctIndex: 1,
    explanation:
      'Even with 0 ms server processing time, packets still have to cross the Pacific and back. Only moving data/compute closer (CDN, read replicas, multi-region) lowers the physics floor.',
  },
  {
    id: 'lt-8',
    topicId: 'latency-throughput',
    topicLabel: 'Latency & Throughput',
    difficulty: 'Intermediate',
    prompt:
      'When does batching requests improve throughput, and what is the primary trade-off?',
    options: [
      'It improves throughput by amortizing per-request network/syscall overhead, at the cost of higher individual latency while waiting to fill a batch.',
      'It reduces individual latency to zero while lowering overall throughput.',
      'It only works for read-only GET requests and breaks write durability.',
      'It eliminates the need for TCP acknowledgments.',
    ],
    correctIndex: 0,
    explanation:
      'Batching groups N items into one network call or disk flush, dramatically boosting throughput while adding a small bounded wait delay for early items in the batch.',
  },
  {
    id: 'lt-9',
    topicId: 'latency-throughput',
    topicLabel: 'Latency & Throughput',
    difficulty: 'Advanced',
    prompt:
      'In production capacity planning, why do teams commonly target 60–70% peak utilization rather than 95%?',
    options: [
      'Operating systems reserve 30% of RAM exclusively for kernel panic logs.',
      'Headroom absorbs traffic bursts, rolling deployments, and single-zone failovers without triggering the queueing hockey stick.',
      'Load balancers refuse to route traffic above 70% CPU.',
      'Hardware warranties are voided above 75% utilization.',
    ],
    correctIndex: 1,
    explanation:
      'With 30–40% spare capacity, normal bursts and minor node failures are absorbed cleanly before queue depth and p99 latency spiral upward.',
  },
  {
    id: 'lt-10',
    topicId: 'latency-throughput',
    topicLabel: 'Latency & Throughput',
    difficulty: 'Advanced',
    prompt:
      'Hedged requests (sending a duplicate request to a second replica if the first hasn’t responded after p95) primarily help reduce:',
    options: [
      'Total cluster CPU consumption',
      'p99 tail latency caused by transient per-node slowdowns',
      'Database disk storage footprint',
      'Cold-start DNS lookup duration',
    ],
    correctIndex: 1,
    explanation:
      'Hedging trades a tiny ~5% extra request volume to cut severe p99 tail spikes when a single replica experiences a transient stall.',
  },

  // ── 2. FOUNDATIONS & NAPKIN MATH (6 questions) ─────────────────────────────
  {
    id: 'fnd-1',
    topicId: 'foundations',
    topicLabel: 'Foundations & Napkin Math',
    difficulty: 'Beginner',
    prompt:
      'When a user types a URL into a browser for the first time, what is the typical order of network steps before HTTP data arrives?',
    options: [
      'HTTP GET → TLS Handshake → TCP Handshake → DNS Lookup',
      'DNS Lookup → TCP Handshake → TLS Handshake → HTTP Request',
      'TLS Handshake → DNS Lookup → HTTP Request → TCP Handshake',
      'TCP Handshake → HTTP Request → DNS Lookup → TLS Handshake',
    ],
    correctIndex: 1,
    explanation:
      'The browser first resolves the hostname via DNS, establishes a TCP connection (SYN/SYN-ACK/ACK), negotiates encryption via TLS, and then sends the HTTP request.',
  },
  {
    id: 'fnd-2',
    topicId: 'foundations',
    topicLabel: 'Foundations & Napkin Math',
    difficulty: 'Beginner',
    prompt:
      'Roughly how many seconds are in a day (useful for back-of-the-envelope QPS math)?',
    options: ['8,640 seconds', '86,400 seconds (~10⁵)', '864,000 seconds', '3,600,000 seconds'],
    correctIndex: 1,
    explanation:
      '24 × 60 × 60 = 86,400 seconds, commonly rounded to ~10⁵ seconds in napkin math (e.g., 10M requests/day ≈ 100 req/s average).',
  },
  {
    id: 'fnd-3',
    topicId: 'foundations',
    topicLabel: 'Foundations & Napkin Math',
    difficulty: 'Intermediate',
    prompt:
      'An app receives 86.4 million requests per day with a peak-to-average ratio of 3×. What is the approximate peak QPS?',
    options: ['1,000 req/s', '3,000 req/s', '10,000 req/s', '300 req/s'],
    correctIndex: 1,
    explanation:
      'Average QPS = 86,400,000 / 86,400 = 1,000 req/s. Multiplying by the 3× peak factor gives ~3,000 req/s.',
  },
  {
    id: 'fnd-4',
    topicId: 'foundations',
    topicLabel: 'Foundations & Napkin Math',
    difficulty: 'Intermediate',
    prompt:
      'Which memory/storage access is fastest by roughly 100×–1,000× compared to an NVMe SSD random read?',
    options: [
      'Cross-continent fiber round trip',
      'Main RAM (DRAM) reference (~100 ns)',
      'Magnetic HDD seek',
      'Same-region HTTP RPC',
    ],
    correctIndex: 1,
    explanation:
      'RAM access takes ~100 nanoseconds, whereas NVMe SSD random reads take ~10–100 microseconds (100×–1,000× slower).',
  },
  {
    id: 'fnd-5',
    topicId: 'foundations',
    topicLabel: 'Foundations & Napkin Math',
    difficulty: 'Beginner',
    prompt:
      'Why does TLS 1.3 cut connection setup latency compared to TLS 1.2?',
    options: [
      'It disables certificate verification.',
      'It completes the handshake in 1-RTT (or 0-RTT on resumption) instead of 2-RTT.',
      'It runs over ICMP instead of TCP.',
      'It compresses all DNS records inside the IP header.',
    ],
    correctIndex: 1,
    explanation:
      'TLS 1.3 eliminates an entire round-trip during key exchange, saving tens to hundreds of milliseconds on every new HTTPS connection.',
  },
  {
    id: 'fnd-6',
    topicId: 'foundations',
    topicLabel: 'Foundations & Napkin Math',
    difficulty: 'Intermediate',
    prompt:
      'If each stored record is 1 KB and you insert 10 million records per day, how much raw storage is needed for 1 year (ignoring replication)?',
    options: ['~36.5 GB', '~3.65 TB', '~365 TB', '~365 MB'],
    correctIndex: 1,
    explanation:
      '10M × 1 KB = 10 GB/day. Over 365 days, 10 GB × 365 = 3,650 GB ≈ 3.65 TB.',
  },

  // ── 3. SCALING & LOAD BALANCING (6 questions) ──────────────────────────────
  {
    id: 'scl-1',
    topicId: 'scaling',
    topicLabel: 'Scaling & Load Balancing',
    difficulty: 'Beginner',
    prompt:
      'What is the key limitation of vertical scaling (scaling up) compared to horizontal scaling (scaling out)?',
    options: [
      'Vertical scaling requires rewriting stateless services.',
      'Single-machine hardware hits physical/cost ceilings and leaves a single point of failure.',
      'Vertical scaling cannot increase RAM.',
      'Horizontal scaling requires zero network communication.',
    ],
    correctIndex: 1,
    explanation:
      'You can only buy a machine so large, costs scale super-linearly, and a single big box is still a single point of failure.',
  },
  {
    id: 'scl-2',
    topicId: 'scaling',
    topicLabel: 'Scaling & Load Balancing',
    difficulty: 'Intermediate',
    prompt:
      'When would you choose an L7 (Application) load balancer over an L4 (Transport) load balancer?',
    options: [
      'When you only need raw TCP packet forwarding with minimal inspection.',
      'When you need to route based on HTTP URL paths, headers, cookies, or terminate TLS.',
      'When you want to bypass IP routing completely.',
      'When your backend speaks no TCP or UDP.',
    ],
    correctIndex: 1,
    explanation:
      'L7 load balancers inspect HTTP-level attributes (e.g., `/api` vs `/images`, auth headers) and terminate TLS, whereas L4 operates on IP/port tuples.',
  },
  {
    id: 'scl-3',
    topicId: 'scaling',
    topicLabel: 'Scaling & Load Balancing',
    difficulty: 'Intermediate',
    prompt:
      'Why is "Least Connections" often better than "Round Robin" when requests have widely varying processing times?',
    options: [
      'Round Robin sends all traffic to the first server only.',
      'Least Connections avoids piling slow requests onto an already-busy server.',
      'Least Connections eliminates the need for health checks.',
      'Round Robin cannot work with HTTP/2.',
    ],
    correctIndex: 1,
    explanation:
      'If some requests take 5 ms and others take 2 s, Round Robin can overload one node with slow jobs; Least Connections routes new work to the node with fewest active connections.',
  },
  {
    id: 'scl-4',
    topicId: 'scaling',
    topicLabel: 'Scaling & Load Balancing',
    difficulty: 'Beginner',
    prompt:
      'Why must web servers be stateless to scale horizontally cleanly behind a load balancer?',
    options: [
      'So any server can handle any user’s next request without relying on local in-memory session state.',
      'Because stateless servers do not need a database.',
      'Because HTTP does not support cookies.',
      'To prevent servers from using CPU caches.',
    ],
    correctIndex: 0,
    explanation:
      'Storing session state in Redis/DB instead of server RAM lets load balancers route freely and allows auto-scaling to add/remove nodes safely.',
  },
  {
    id: 'scl-5',
    topicId: 'scaling',
    topicLabel: 'Scaling & Load Balancing',
    difficulty: 'Intermediate',
    prompt:
      'What problem does an auto-scaling "cooldown period" prevent?',
    options: [
      'CPU overheating in cloud data centers',
      'Oscillation / thrashing where instances are repeatedly spun up and terminated on noisy metric spikes',
      'DNS TTL expiration',
      'Database primary key collisions',
    ],
    correctIndex: 1,
    explanation:
      'New instances take time to boot and warm up; a cooldown prevents the autoscaler from over-reacting and thrashing before previous scaling actions take effect.',
  },
  {
    id: 'scl-6',
    topicId: 'scaling',
    topicLabel: 'Scaling & Load Balancing',
    difficulty: 'Advanced',
    prompt:
      'In a multi-load-balancer setup, how is the load balancer itself prevented from becoming a single point of failure?',
    options: [
      'Using active-passive or active-active pairs with DNS/BGP Anycast and health checks',
      'Running the load balancer inside the client browser',
      'Disabling TLS on all backend nodes',
      'Using a single 10 Gbps Ethernet cable',
    ],
    correctIndex: 0,
    explanation:
      'Production edges use redundant LB nodes behind Anycast BGP or multi-A-record DNS with automated failover.',
  },

  // ── 4. CACHING & CDN (6 questions) ─────────────────────────────────────────
  {
    id: 'cch-1',
    topicId: 'caching',
    topicLabel: 'Caching & CDN',
    difficulty: 'Beginner',
    prompt:
      'In the Cache-Aside (Lazy Loading) pattern, what happens on a cache miss?',
    options: [
      'The cache itself queries the database and updates the client directly.',
      'The application reads from the database, writes the result into the cache, and returns it.',
      'The request immediately fails with HTTP 404.',
      'The database deletes the stale record.',
    ],
    correctIndex: 1,
    explanation:
      'With Cache-Aside, the app checks the cache first; on a miss, it fetches from the DB, populates the cache with a TTL, and returns the data.',
  },
  {
    id: 'cch-2',
    topicId: 'caching',
    topicLabel: 'Caching & CDN',
    difficulty: 'Intermediate',
    prompt:
      'What is a "Cache Stampede" (Thundering Herd), and how do you mitigate it?',
    options: [
      'When a hot key expires and thousands of concurrent requests miss the cache and hammer the DB simultaneously; mitigated with request coalescing/locking or probabilistic early refresh.',
      'When Redis runs out of disk space for AOF logs; mitigated by disabling TTLs.',
      'When CDN edge nodes cache POST requests; mitigated by removing HTTPS.',
      'When clients send duplicate cookies; mitigated by using LRU.',
    ],
    correctIndex: 0,
    explanation:
      'Singleflight / mutex locking ensures only one request recomputes the expired hot key from the DB while others wait for the refreshed value.',
  },
  {
    id: 'cch-3',
    topicId: 'caching',
    topicLabel: 'Caching & CDN',
    difficulty: 'Intermediate',
    prompt:
      'Which cache eviction policy evicts the item that has not been accessed for the longest time?',
    options: ['FIFO', 'LFU (Least Frequently Used)', 'LRU (Least Recently Used)', 'Random'],
    correctIndex: 2,
    explanation:
      'LRU tracks recency of access and evicts the oldest untouched entry when memory is full.',
  },
  {
    id: 'cch-4',
    topicId: 'caching',
    topicLabel: 'Caching & CDN',
    difficulty: 'Beginner',
    prompt:
      'What is the primary benefit of placing static assets (images, JS, video chunks) on a CDN?',
    options: [
      'It encrypts your SQL database.',
      'It serves content from edge PoPs geographically close to users, cutting latency and origin bandwidth.',
      'It replaces the need for application authentication.',
      'It guarantees zero cache misses for dynamic personalized carts.',
    ],
    correctIndex: 1,
    explanation:
      'CDNs terminate requests at nearby edge locations, drastically lowering round-trip time and shielding your origin servers.',
  },
  {
    id: 'cch-5',
    topicId: 'caching',
    topicLabel: 'Caching & CDN',
    difficulty: 'Intermediate',
    prompt:
      'What is the main trade-off of Write-Back (Write-Behind) caching compared to Write-Through?',
    options: [
      'Write-Back is slower on writes because it waits for the DB.',
      'Write-Back offers lower write latency and coalesces writes, but risks data loss if the cache crashes before flushing to the DB.',
      'Write-Through cannot be used with relational databases.',
      'Write-Back never requires eviction.',
    ],
    correctIndex: 1,
    explanation:
      'Write-Back acknowledges writes as soon as they hit cache memory and flushes asynchronously, trading durability risk for high write throughput.',
  },
  {
    id: 'cch-6',
    topicId: 'caching',
    topicLabel: 'Caching & CDN',
    difficulty: 'Advanced',
    prompt:
      'How can a Bloom Filter protect a database behind a cache from "cache penetration" (repeated queries for non-existent IDs)?',
    options: [
      'By storing every full JSON payload in browser localStorage',
      'By quickly rejecting keys that definitely do not exist in the DB before hitting cache or storage',
      'By automatically creating missing rows in the DB',
      'By doubling the Redis TTL on every read',
    ],
    correctIndex: 1,
    explanation:
      'A compact Bloom filter in memory can answer "definitely not present" with zero false negatives, blocking malicious or buggy lookups for nonexistent keys.',
  },

  // ── 5. DATA, REPLICATION & SHARDING (7 questions) ──────────────────────────
  {
    id: 'dat-1',
    topicId: 'data-storage',
    topicLabel: 'Data, Replication & Sharding',
    difficulty: 'Beginner',
    prompt:
      'Why does adding read replicas improve read throughput but not write throughput in single-leader replication?',
    options: [
      'All writes must still go through the single leader (primary) node.',
      'Read replicas cannot store indexes.',
      'Replicas only accept UDP packets.',
      'SQL forbids INSERT statements when replicas exist.',
    ],
    correctIndex: 0,
    explanation:
      'In single-leader replication, the primary handles all mutations and streams logs to followers; scaling writes requires sharding (partitioning).',
  },
  {
    id: 'dat-2',
    topicId: 'data-storage',
    topicLabel: 'Data, Replication & Sharding',
    difficulty: 'Intermediate',
    prompt:
      'A user updates their profile picture, refreshes the page immediately, and still sees the old picture. What is the most likely cause?',
    options: [
      'TCP packet corruption',
      'Asynchronous replication lag when reading from a follower replica',
      'Consistent hashing ring wrap-around',
      'B-Tree page splitting',
    ],
    correctIndex: 1,
    explanation:
      'Reading from an asynchronous replica before it applies the primary’s latest write causes stale reads; "read-your-own-writes" routing fixes this.',
  },
  {
    id: 'dat-3',
    topicId: 'data-storage',
    topicLabel: 'Data, Replication & Sharding',
    difficulty: 'Intermediate',
    prompt:
      'Why do distributed caches and sharded databases use Consistent Hashing instead of `hash(key) % N`?',
    options: [
      'Modulo hashing cannot distribute integers evenly.',
      'Consistent hashing minimizes key remapping (~1/N keys move) when a node is added or removed, instead of reshuffling nearly all keys.',
      'Consistent hashing eliminates network partitions.',
      'Modulo hashing requires a central SQL lock.',
    ],
    correctIndex: 1,
    explanation:
      'Changing N in `hash(key) % N` invalidates almost every key’s mapping, causing massive cache misses or data migration; a hash ring only moves keys owned by the affected range.',
  },
  {
    id: 'dat-4',
    topicId: 'data-storage',
    topicLabel: 'Data, Replication & Sharding',
    difficulty: 'Intermediate',
    prompt:
      'According to the CAP theorem, during a network partition (P) between nodes, a distributed data store must choose between:',
    options: [
      'Compression (C) and Availability (A)',
      'Consistency (C — linearizability) and Availability (A — every non-failing node responds)',
      'Caching (C) and Atomicity (A)',
      'Throughput and CPU cores',
    ],
    correctIndex: 1,
    explanation:
      'Network partitions are unavoidable in distributed systems, so systems trade off returning an error to preserve consistency (CP) vs serving potentially stale data to stay available (AP).',
  },
  {
    id: 'dat-5',
    topicId: 'data-storage',
    topicLabel: 'Data, Replication & Sharding',
    difficulty: 'Advanced',
    prompt:
      'Why are LSM-Tree storage engines (e.g., Cassandra, RocksDB) typically faster for heavy write workloads than B-Trees?',
    options: [
      'LSM-Trees convert random writes into sequential append-only memtable/SSTable writes, avoiding random in-place disk page updates.',
      'LSM-Trees store all data permanently in CPU L1 cache.',
      'B-Trees cannot use SSDs.',
      'LSM-Trees never require background compaction or disk space.',
    ],
    correctIndex: 0,
    explanation:
      'Sequential appends + sorted immutable SSTables give very high write throughput, trading off some read amplification and background compaction.',
  },
  {
    id: 'dat-6',
    topicId: 'data-storage',
    topicLabel: 'Data, Replication & Sharding',
    difficulty: 'Intermediate',
    prompt:
      'What happens if you shard a social media database by `country_code`?',
    options: [
      'Every shard receives identical traffic.',
      'You risk severe hot shards because large countries generate vastly more traffic than small ones.',
      'Cross-shard joins become faster.',
      'Replication lag drops to zero.',
    ],
    correctIndex: 1,
    explanation:
      'Choosing a skewed shard key creates hot spots where one shard saturates while others sit idle. High-cardinality, uniform keys (e.g. `user_id` hash) avoid skew.',
  },
  {
    id: 'dat-7',
    topicId: 'data-storage',
    topicLabel: 'Data, Replication & Sharding',
    difficulty: 'Beginner',
    prompt:
      'What is the main downside of adding too many secondary indexes to a write-heavy SQL table?',
    options: [
      'SELECT queries become slower.',
      'Every INSERT, UPDATE, or DELETE must update every index, slowing down writes and increasing storage.',
      'The table loses ACID transactions.',
      'Primary keys stop working.',
    ],
    correctIndex: 1,
    explanation:
      'Indexes speed up reads by maintaining sorted lookup structures, which imposes write amplification on every mutation.',
  },

  // ── 6. COMMUNICATION & QUEUES (6 questions) ────────────────────────────────
  {
    id: 'com-1',
    topicId: 'communication',
    topicLabel: 'Communication & Queues',
    difficulty: 'Beginner',
    prompt:
      'When should you prefer WebSockets over standard HTTP polling for a live chat or stock ticker?',
    options: [
      'When updates only happen once per day.',
      'When you need low-latency, bidirectional persistent communication without repeated HTTP header/handshake overhead.',
      'When you want CDN edge caching for every message.',
      'When the client only sends static GET requests.',
    ],
    correctIndex: 1,
    explanation:
      'WebSockets keep a full-duplex TCP connection open so both server and client can push frames immediately.',
  },
  {
    id: 'com-2',
    topicId: 'communication',
    topicLabel: 'Communication & Queues',
    difficulty: 'Intermediate',
    prompt:
      'Why do internal microservices often prefer gRPC (Protobuf over HTTP/2) instead of JSON over REST?',
    options: [
      'JSON cannot represent numbers.',
      'Compact binary serialization, strongly typed schemas, and HTTP/2 multiplexing reduce payload size and latency.',
      'gRPC works without any network.',
      'Browsers natively render Protobuf as HTML.',
    ],
    correctIndex: 1,
    explanation:
      'Protobuf payloads are much smaller and faster to parse than JSON, and HTTP/2 multiplexes concurrent streams over a single connection.',
  },
  {
    id: 'com-3',
    topicId: 'communication',
    topicLabel: 'Communication & Queues',
    difficulty: 'Intermediate',
    prompt:
      'How does placing a message queue (e.g., Kafka / SQS) in front of a slow video-encoding worker help system stability?',
    options: [
      'It encodes videos inside the network switch.',
      'It decouples producers from consumers and buffers traffic spikes (load leveling) so workers process at their own sustainable pace.',
      'It eliminates all disk I/O.',
      'It forces synchronous blocking on the user’s HTTP request.',
    ],
    correctIndex: 1,
    explanation:
      'Queues absorb bursty uploads and allow workers to drain jobs steadily without crashing downstream storage or compute.',
  },
  {
    id: 'com-4',
    topicId: 'communication',
    topicLabel: 'Communication & Queues',
    difficulty: 'Intermediate',
    prompt:
      'In an "at-least-once" message delivery system, why must consumers be idempotent?',
    options: [
      'Because messages may be delivered more than once after retries or consumer restarts, and reprocessing must not corrupt state (e.g., double-charging).',
      'Because messages are always dropped on the first try.',
      'Because queues delete messages before delivery.',
      'To reduce TCP window size.',
    ],
    correctIndex: 0,
    explanation:
      'Idempotency keys or natural unique constraints ensure duplicate message deliveries produce the exact same final state.',
  },
  {
    id: 'com-5',
    topicId: 'communication',
    topicLabel: 'Communication & Queues',
    difficulty: 'Beginner',
    prompt:
      'How does Server-Sent Events (SSE) differ from WebSockets?',
    options: [
      'SSE is unidirectional (server → client) over standard HTTP, while WebSockets are bidirectional.',
      'SSE requires UDP.',
      'WebSockets cannot send text.',
      'SSE is only for file uploads.',
    ],
    correctIndex: 0,
    explanation:
      'SSE is lightweight and built on plain HTTP for server-to-client streaming (like LLM token streaming or live feeds) with automatic reconnect.',
  },
  {
    id: 'com-6',
    topicId: 'communication',
    topicLabel: 'Communication & Queues',
    difficulty: 'Advanced',
    prompt:
      'What is a Dead-Letter Queue (DLQ) used for in event-driven architectures?',
    options: [
      'Storing encrypted TLS private keys',
      'Isolating poison-pill messages that repeatedly fail processing so they don’t block healthy messages in the main queue',
      'Caching static images',
      'Routing DNS queries',
    ],
    correctIndex: 1,
    explanation:
      'After N failed retries, moving a bad message to a DLQ keeps the main consumer pipeline moving while allowing engineers to inspect and replay failures.',
  },

  // ── 7. RELIABILITY & RATE LIMITING (6 questions) ───────────────────────────
  {
    id: 'rel-1',
    topicId: 'reliability',
    topicLabel: 'Reliability & Rate Limiting',
    difficulty: 'Intermediate',
    prompt:
      'Why should clients add randomized "jitter" to exponential backoff when retrying failed requests?',
    options: [
      'To encrypt the HTTP body',
      'To spread out retries in time so thousands of clients don’t wake up and slam a recovering server in lockstep',
      'To bypass rate limiters completely',
      'To convert HTTP 503 into HTTP 200',
    ],
    correctIndex: 1,
    explanation:
      'Without jitter, synchronized clients retry at the exact same intervals (2s, 4s, 8s), causing repeated thundering-herd outages.',
  },
  {
    id: 'rel-2',
    topicId: 'reliability',
    topicLabel: 'Reliability & Rate Limiting',
    difficulty: 'Intermediate',
    prompt:
      'What does a Circuit Breaker do when it transitions to the OPEN state?',
    options: [
      'It doubles the timeout on every downstream call.',
      'It fails fast immediately without calling the unhealthy dependency, giving it time to recover and preventing thread-pool exhaustion.',
      'It restarts the database.',
      'It flushes the CDN cache.',
    ],
    correctIndex: 1,
    explanation:
      'Failing fast prevents cascading failures where upstream services hang waiting on a dead downstream service.',
  },
  {
    id: 'rel-3',
    topicId: 'reliability',
    topicLabel: 'Reliability & Rate Limiting',
    difficulty: 'Beginner',
    prompt:
      'Which rate-limiting algorithm naturally allows short controlled bursts up to a bucket capacity while enforcing a steady average refill rate?',
    options: ['Fixed Window Counter', 'Token Bucket', 'Round Robin', 'B-Tree Index'],
    correctIndex: 1,
    explanation:
      'Tokens refill at a steady rate up to `capacity`; accumulated tokens permit short bursts while capping sustained throughput.',
  },
  {
    id: 'rel-4',
    topicId: 'reliability',
    topicLabel: 'Reliability & Rate Limiting',
    difficulty: 'Intermediate',
    prompt:
      'What boundary flaw does the Fixed Window Counter rate limiter suffer from?',
    options: [
      'It cannot count beyond 100.',
      'A burst at the end of one window and the start of the next can allow up to 2× the intended limit within a short span.',
      'It requires a relational join on every request.',
      'It drops all IPv6 traffic.',
    ],
    correctIndex: 1,
    explanation:
      'Sliding Window Log or Sliding Window Counter smooths out boundary spikes across minute transitions.',
  },
  {
    id: 'rel-5',
    topicId: 'reliability',
    topicLabel: 'Reliability & Rate Limiting',
    difficulty: 'Intermediate',
    prompt:
      'What is the difference between a Kubernetes/LB "liveness" probe and a "readiness" probe?',
    options: [
      'Liveness checks if the process is stuck and needs a restart; readiness checks if the instance should receive live traffic.',
      'Readiness restarts the container; liveness updates DNS.',
      'They are identical.',
      'Liveness only runs during CI/CD builds.',
    ],
    correctIndex: 0,
    explanation:
      'If a pod is warming caches or temporarily overloaded, failing readiness removes it from load-balancer rotation without killing it.',
  },
  {
    id: 'rel-6',
    topicId: 'reliability',
    topicLabel: 'Reliability & Rate Limiting',
    difficulty: 'Advanced',
    prompt:
      'What is "load shedding" during extreme traffic overload?',
    options: [
      'Turning off logging to save disk',
      'Intentionally rejecting excess or low-priority requests early (e.g., HTTP 503) so the server stays healthy for the traffic it can serve',
      'Moving all data to cold archive storage',
      'Disabling TLS encryption',
    ],
    correctIndex: 1,
    explanation:
      'Without load shedding, queueing delays cause every request to time out (goodput drops to zero). Shedding excess load preserves high goodput for admitted requests.',
  },

  // ── 8. ARCHITECTURE & SECURITY (6 questions) ───────────────────────────────
  {
    id: 'arc-1',
    topicId: 'architecture-security',
    topicLabel: 'Architecture & Security',
    difficulty: 'Beginner',
    prompt:
      'Which cross-cutting responsibilities belong naturally in an API Gateway?',
    options: [
      'SQL table vacuuming and disk defragmentation',
      'Authentication, rate limiting, TLS termination, and request routing',
      'Rendering React DOM components',
      'Compiling microservice binaries',
    ],
    correctIndex: 1,
    explanation:
      'An API Gateway centralizes edge concerns so individual backend services don’t reimplement auth, throttling, and routing.',
  },
  {
    id: 'arc-2',
    topicId: 'architecture-security',
    topicLabel: 'Architecture & Security',
    difficulty: 'Intermediate',
    prompt:
      'How does the Saga pattern handle distributed transactions across microservices without Two-Phase Commit (2PC)?',
    options: [
      'By locking every microservice database globally',
      'By executing a sequence of local transactions with compensating actions to undo prior steps if a later step fails',
      'By merging all services into one SQLite file',
      'By ignoring failures silently',
    ],
    correctIndex: 1,
    explanation:
      'Sagas achieve eventual consistency across service boundaries using choreography or orchestration plus compensating transactions.',
  },
  {
    id: 'arc-3',
    topicId: 'architecture-security',
    topicLabel: 'Architecture & Security',
    difficulty: 'Intermediate',
    prompt:
      'What is the core idea behind CQRS (Command Query Responsibility Segregation)?',
    options: [
      'Separating write models (commands) from read models (queries) so each can scale and optimize independently',
      'Forbidding all SQL SELECT statements',
      'Running every service on a single thread',
      'Replacing HTTPS with FTP',
    ],
    correctIndex: 0,
    explanation:
      'CQRS lets writes use a normalized transactional store while reads hit denormalized, indexed, or cached projections.',
  },
  {
    id: 'arc-4',
    topicId: 'architecture-security',
    topicLabel: 'Architecture & Security',
    difficulty: 'Beginner',
    prompt:
      'What is the difference between Authentication (AuthN) and Authorization (AuthZ)?',
    options: [
      'AuthN verifies who you are; AuthZ checks what resources/actions you are permitted to access.',
      'AuthZ verifies passwords; AuthN manages firewall ports.',
      'They are two names for TLS.',
      'AuthN happens only in the database.',
    ],
    correctIndex: 0,
    explanation:
      'Authentication establishes identity (login/JWT), whereas Authorization enforces permissions/roles (RBAC/ABAC).',
  },
  {
    id: 'arc-5',
    topicId: 'architecture-security',
    topicLabel: 'Architecture & Security',
    difficulty: 'Intermediate',
    prompt:
      'Why is Zero Trust architecture preferred over relying solely on a perimeter VPN/firewall?',
    options: [
      'Once an attacker breaches the perimeter, implicit internal trust allows lateral movement; Zero Trust authenticates and authorizes every service-to-service call (e.g., mTLS).',
      'Zero Trust eliminates all encryption.',
      'Perimeter firewalls cannot block ports.',
      'Zero Trust requires zero passwords or tokens.',
    ],
    correctIndex: 0,
    explanation:
      '"Never trust, always verify" enforces mutual TLS, short-lived credentials, and least-privilege checks even inside the internal network.',
  },
  {
    id: 'arc-6',
    topicId: 'architecture-security',
    topicLabel: 'Architecture & Security',
    difficulty: 'Intermediate',
    prompt:
      'What is a key operational caveat of stateless JWTs compared to server-side Redis sessions?',
    options: [
      'JWTs cannot be signed.',
      'A stolen JWT remains valid until it expires unless you maintain a revocation blocklist or use short TTLs + refresh tokens.',
      'JWTs cannot carry a user ID.',
      'JWTs only work over WebSockets.',
    ],
    correctIndex: 1,
    explanation:
      'Because JWTs are self-contained, instant logout/revocation requires short expiration windows paired with revocable refresh tokens or a small deny-list.',
  },

  // ── 9. WHOLE SYSTEMS DESIGN (6 questions) ──────────────────────────────────
  {
    id: 'sys-1',
    topicId: 'whole-systems',
    topicLabel: 'Whole Systems Design',
    difficulty: 'Beginner',
    prompt:
      'In a URL Shortener (100:1 read-to-write ratio), which HTTP status code should the redirect use if you want to track click analytics on every visit?',
    options: [
      '301 Moved Permanently (browsers cache it and skip your server)',
      '302 Found (or 307), so browsers hit your redirect service for analytics',
      '404 Not Found',
      '502 Bad Gateway',
    ],
    correctIndex: 1,
    explanation:
      '301 is cached aggressively by browsers (reducing server load but breaking analytics), while 302 keeps clicks flowing through your server.',
  },
  {
    id: 'sys-2',
    topicId: 'whole-systems',
    topicLabel: 'Whole Systems Design',
    difficulty: 'Intermediate',
    prompt:
      'In a Twitter/X-style News Feed, why do systems use a hybrid approach (fan-out-on-write for regular users, fan-out-on-read for celebrities)?',
    options: [
      'Fan-out-on-write for a celebrity with 50M followers would cause massive write amplification on every tweet.',
      'Celebrities are not allowed to use caches.',
      'Regular users do not have databases.',
      'Fan-out-on-read uses zero CPU.',
    ],
    correctIndex: 0,
    explanation:
      'Pushing a post into 50M follower timelines on write creates huge write spikes; pulling celebrity posts at read time and merging them keeps both reads and writes fast.',
  },
  {
    id: 'sys-3',
    topicId: 'whole-systems',
    topicLabel: 'Whole Systems Design',
    difficulty: 'Intermediate',
    prompt:
      'How does a large-scale Chat System route a message from User A (connected to Chat Server 1) to User B (connected to Chat Server 2)?',
    options: [
      'User A opens a direct peer-to-peer USB tunnel.',
      'Chat Server 1 persists the message and publishes it via a message broker / presence-aware router to Chat Server 2’s WebSocket.',
      'Chat Server 1 broadcasts the message to every user on the platform.',
      'User B polls DNS every 10 ms.',
    ],
    correctIndex: 1,
    explanation:
      'A presence/session directory maps `user_id -> gateway_server`, and an internal pub/sub or router forwards the frame to the exact server holding User B’s socket.',
  },
  {
    id: 'sys-4',
    topicId: 'whole-systems',
    topicLabel: 'Whole Systems Design',
    difficulty: 'Intermediate',
    prompt:
      'Why do video streaming platforms (HLS / DASH) split videos into 2–6 second segments at multiple bitrates?',
    options: [
      'So players can adapt quality smoothly to changing bandwidth, seek instantly, and cache segments efficiently on CDNs.',
      'Because MP4 files cannot exceed 10 MB.',
      'To force users to download the entire movie before playback starts.',
      'To disable HTTP caching.',
    ],
    correctIndex: 0,
    explanation:
      'Adaptive Bitrate (ABR) streaming lets the client switch between 480p/1080p/4K chunk-by-chunk as network conditions fluctuate.',
  },
  {
    id: 'sys-5',
    topicId: 'whole-systems',
    topicLabel: 'Whole Systems Design',
    difficulty: 'Intermediate',
    prompt:
      'When generating unique 64-bit IDs across distributed servers (e.g., Twitter Snowflake), what components are typically packed into the ID?',
    options: [
      'Timestamp + Datacenter/Worker ID + Per-millisecond Sequence number',
      'User password + IP address + Random float',
      'Full JSON payload + CSS hash',
      'DNS TTL + Port number',
    ],
    correctIndex: 0,
    explanation:
      'Snowflake IDs are roughly time-sortable, globally unique without central coordination, and fit in a 64-bit integer.',
  },
  {
    id: 'sys-6',
    topicId: 'whole-systems',
    topicLabel: 'Whole Systems Design',
    difficulty: 'Advanced',
    prompt:
      'In a distributed payment system, what ensures a user isn’t charged twice if their mobile app times out and retries the `POST /pay` request?',
    options: [
      'Disabling TCP retries',
      'Requiring a client-generated Idempotency-Key stored atomically with the payment state on the server',
      'Using HTTP GET instead of POST',
      'Lowering the load balancer timeout to 50 ms',
    ],
    correctIndex: 1,
    explanation:
      'If the server sees the same `Idempotency-Key`, it returns the cached outcome of the first transaction instead of charging again.',
  },
];

export const EXAM_QUESTION_BANK: ExamQuestion[] = [
  ...CORE_EXAM_QUESTIONS,
  ...buildParametricQuestionBank(),
];

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Draws a fresh, randomized 10-question MCQ exam for the given topic on every refresh / exam start.
 * Both the selected question subset AND the A/B/C/D option order (with optionReasons) are shuffled.
 */
export function generateExamQuestions(topicId: string, maxCount = 10): ExamQuestion[] {
  const pool =
    topicId === 'all'
      ? EXAM_QUESTION_BANK
      : EXAM_QUESTION_BANK.filter((q) => q.topicId === topicId);

  const count = Math.min(maxCount, pool.length);
  const picked = shuffleArray(pool).slice(0, count);

  return picked.map((q) => {
    const indexedOptions = q.options.map((text, idx) => ({
      text,
      isCorrect: idx === q.correctIndex,
      reason: q.optionReasons?.[idx],
    }));
    const shuffledOptions = shuffleArray(indexedOptions);
    const hasReasons = shuffledOptions.every((o) => typeof o.reason === 'string');
    return {
      ...q,
      options: shuffledOptions.map((o) => o.text),
      correctIndex: shuffledOptions.findIndex((o) => o.isCorrect),
      optionReasons: hasReasons
        ? shuffledOptions.map((o) => o.reason as string)
        : undefined,
    };
  });
}
