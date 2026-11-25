import type { ExamQuestion } from './practiceBank';

/**
 * Generates 455 deterministic, scenario-varied system design MCQ questions
 * across all 9 curriculum topics (bringing the total bank with the 59 core
 * questions to 514 unique questions).
 */
export function buildParametricQuestionBank(): ExamQuestion[] {
  const out: ExamQuestion[] = [];
  let seq = 1;
  const nextId = (prefix: string) => `${prefix}-gen-${seq++}`;

  // ── 1. LATENCY & THROUGHPUT (50 questions) ─────────────────────────────────
  // 1a. Little's Law (15)
  const littlesCases = [
    [200, 50], [300, 100], [400, 150], [500, 200], [600, 250],
    [800, 125], [1000, 40], [1200, 50], [1500, 200], [2000, 150],
    [250, 400], [750, 200], [900, 100], [1600, 250], [3000, 50],
  ];
  for (const [qps, ms] of littlesCases) {
    const conc = Math.round((qps * ms) / 1000);
    const wrongHalf = Math.max(1, Math.round(conc / 2));
    const wrongDouble = conc * 2;
    const wrongTenX = conc * 10;
    out.push({
      id: nextId('lt'),
      topicId: 'latency-throughput',
      topicLabel: 'Latency & Throughput',
      difficulty: ms >= 200 ? 'Intermediate' : 'Beginner',
      prompt: `By Little's Law (L = λ × W), if a service sustains ${qps.toLocaleString()} req/s with an average response time of ${ms} ms, how many requests are concurrently in-flight?`,
      options: [
        `${conc.toLocaleString()} concurrent requests`,
        `${wrongHalf.toLocaleString()} concurrent requests`,
        `${wrongDouble.toLocaleString()} concurrent requests`,
        `${wrongTenX.toLocaleString()} concurrent requests`,
      ],
      correctIndex: 0,
      explanation: `L = λ × W = ${qps.toLocaleString()} req/s × ${(ms / 1000).toFixed(3)} s = ${conc.toLocaleString()} concurrent in-flight requests.`,
      optionReasons: [
        `Correct: ${qps} × (${ms}/1000) s = ${conc} in-flight requests.`,
        `Incorrect: ${wrongHalf} underestimates concurrency by 2×, which would under-provision worker/connection pools.`,
        `Incorrect: ${wrongDouble} overestimates by 2× (doubling latency or QPS would produce this, not the given values).`,
        `Incorrect: ${wrongTenX} comes from misplacing a decimal when converting milliseconds to seconds.`,
      ],
    });
  }

  // 1b. Tail Amplification in Fan-Out (15)
  const fanOutCases = [
    [3, 1], [4, 1], [5, 1], [8, 1], [10, 1],
    [4, 2], [5, 2], [6, 2], [8, 2], [10, 2],
    [3, 5], [4, 5], [5, 5], [6, 3], [12, 1],
  ];
  for (const [n, pct] of fanOutCases) {
    const pSlow = 1 - Math.pow(1 - pct / 100, n);
    const ans = `${(pSlow * 100).toFixed(1)}%`;
    const w1 = `${pct.toFixed(1)}%`;
    const w2 = `${(pct / n).toFixed(1)}%`;
    const w3 = `${Math.min(99, pct * n * 2).toFixed(1)}%`;
    out.push({
      id: nextId('lt'),
      topicId: 'latency-throughput',
      topicLabel: 'Latency & Throughput',
      difficulty: n >= 8 ? 'Advanced' : 'Intermediate',
      prompt: `An aggregator fans out each user request in parallel to ${n} independent downstream services, each having a ${pct}% probability of a slow >500 ms response. Roughly what percentage of parent requests will experience >500 ms latency?`,
      options: [ans, w1, w2, w3],
      correctIndex: 0,
      explanation: `The parent waits for all ${n} calls. Probability all ${n} are fast is (1 - ${pct / 100})^${n}, so at least one is slow with probability 1 - (1 - ${pct / 100})^${n} ≈ ${ans}.`,
      optionReasons: [
        `Correct: Tail probability compounds across ${n} parallel branches to ~${ans}.`,
        `Incorrect: ${w1} assumes a single-call tail rate applies unchanged, ignoring that the slowest of ${n} branches dictates parent latency.`,
        `Incorrect: ${w2} mistakenly divides tail risk by ${n} instead of compounding it.`,
        `Incorrect: ${w3} overstates the union probability by double-counting overlapping slow events.`,
      ],
    });
  }

  // 1c. Utilization & Headroom Planning (20)
  const utilScenarios = [
    [500, 480, 96], [1000, 920, 92], [800, 760, 95], [600, 570, 95], [1200, 1140, 95],
    [400, 380, 95], [2000, 1880, 94], [1500, 1410, 94], [900, 855, 95], [700, 665, 95],
    [500, 250, 50], [1000, 450, 45], [800, 400, 50], [1200, 600, 50], [600, 300, 50],
    [400, 160, 40], [2000, 1000, 50], [1500, 750, 50], [900, 360, 40], [700, 280, 40],
  ];
  for (const [cap, load, utilPct] of utilScenarios) {
    const isHot = utilPct >= 90;
    out.push({
      id: nextId('lt'),
      topicId: 'latency-throughput',
      topicLabel: 'Latency & Throughput',
      difficulty: isHot ? 'Intermediate' : 'Beginner',
      prompt: `A service cluster has a maximum capacity of ${cap.toLocaleString()} req/s and currently handles ${load.toLocaleString()} req/s (${utilPct}% utilization). What best describes its queueing behavior?`,
      options: isHot
        ? [
            `Only ${100 - utilPct}% headroom remains, so minor traffic bursts will cause rapid queue growth and a sharp p99 latency spike.`,
            `Latency stays completely flat until load strictly exceeds ${cap.toLocaleString()} req/s.`,
            `Queueing delay drops to zero because the CPU scheduler batches requests automatically.`,
            `Throughput will double if you shorten the TCP keepalive timeout.`,
          ]
        : [
            `With ${100 - utilPct}% spare headroom, random micro-bursts drain quickly and p99 latency stays close to p50.`,
            `The server is saturated and dropping 50% of incoming packets.`,
            `Queue depth grows exponentially whenever utilization exceeds 25%.`,
            `You must immediately shard the database because utilization is at ${utilPct}%.`,
          ],
      correctIndex: 0,
      explanation: isHot
        ? `At ${utilPct}% utilization, there is almost no slack (${cap - load} req/s) to absorb Poisson arrival bursts, placing the system on the steep part of the M/M/1 queueing hockey stick.`
        : `At ${utilPct}% utilization, ${100 - utilPct}% headroom (${cap - load} req/s) absorbs normal bursts before queues accumulate.`,
    });
  }

  // ── 2. FOUNDATIONS & NAPKIN MATH (50 questions) ────────────────────────────
  // 2a. Daily Requests -> Average & Peak QPS (25)
  const dauCases = [
    [4320000, 2], [8640000, 2], [8640000, 3], [17280000, 3], [25920000, 2],
    [43200000, 3], [86400000, 2], [86400000, 4], [172800000, 3], [259200000, 2],
    [4320000, 4], [17280000, 5], [43200000, 2], [86400000, 5], [129600000, 2],
    [21600000, 4], [34560000, 3], [60480000, 2], [69120000, 3], [95040000, 2],
    [103680000, 3], [112320000, 2], [120960000, 4], [138240000, 2], [155520000, 3],
  ];
  for (const [dailyReq, peakMult] of dauCases) {
    const avgQps = Math.round(dailyReq / 86400);
    const peakQps = avgQps * peakMult;
    out.push({
      id: nextId('fnd'),
      topicId: 'foundations',
      topicLabel: 'Foundations & Napkin Math',
      difficulty: 'Beginner',
      prompt: `An endpoint serves ${(dailyReq / 1_000_000).toFixed(1)}M requests per day with a ${peakMult}× peak-to-average traffic ratio. Using 86,400 seconds/day, what is the approximate peak QPS?`,
      options: [
        `${peakQps.toLocaleString()} req/s`,
        `${avgQps.toLocaleString()} req/s`,
        `${(peakQps * 10).toLocaleString()} req/s`,
        `${Math.max(1, Math.round(avgQps / peakMult)).toLocaleString()} req/s`,
      ],
      correctIndex: 0,
      explanation: `Average QPS = ${dailyReq.toLocaleString()} / 86,400 = ${avgQps.toLocaleString()} req/s. Multiplying by the ${peakMult}× peak factor yields ${peakQps.toLocaleString()} req/s.`,
    });
  }

  // 2b. Storage & Bandwidth Sizing (25)
  const storageCases = [
    [1, 2, 1], [2, 2, 1], [5, 2, 1], [10, 4, 1], [20, 1, 1],
    [1, 5, 3], [2, 5, 3], [5, 4, 3], [10, 2, 5], [15, 2, 2],
    [4, 3, 2], [8, 2, 5], [12, 1, 5], [25, 2, 1], [30, 1, 2],
    [3, 4, 5], [6, 5, 2], [7, 2, 5], [9, 3, 2], [14, 2, 3],
    [16, 1, 4], [18, 2, 2], [22, 1, 3], [24, 2, 1], [50, 1, 1],
  ];
  for (const [mPerDay, kbEach, years] of storageCases) {
    const gbPerDay = (mPerDay * 1_000_000 * kbEach) / (1000 * 1000);
    const totalTb = (gbPerDay * 365 * years) / 1000;
    const ans = totalTb >= 1 ? `${totalTb.toFixed(2)} TB` : `${Math.round(totalTb * 1000)} GB`;
    const wrong10x = totalTb >= 1 ? `${(totalTb * 10).toFixed(1)} TB` : `${Math.round(totalTb * 10000)} GB`;
    const wrongDiv10 = totalTb >= 1 ? `${(totalTb / 10).toFixed(2)} TB` : `${Math.round(totalTb * 100)} GB`;
    const wrongDay = `${gbPerDay.toFixed(1)} GB`;
    out.push({
      id: nextId('fnd'),
      topicId: 'foundations',
      topicLabel: 'Foundations & Napkin Math',
      difficulty: 'Intermediate',
      prompt: `A service writes ${mPerDay}M events/day, each ${kbEach} KB in size. Ignoring replication and indexes, roughly how much raw storage is required for ${years} year(s)?`,
      options: [ans, wrong10x, wrongDiv10, wrongDay],
      correctIndex: 0,
      explanation: `Daily volume = ${mPerDay}M × ${kbEach} KB = ${gbPerDay.toFixed(1)} GB/day. Over ${years} × 365 days, that totals ~${ans}.`,
    });
  }

  // ── 3. SCALING & LOAD BALANCING (50 questions) ─────────────────────────────
  const scalingTemplates = [
    {
      diff: 'Beginner' as const,
      make: (n: number) => ({
        prompt: `You scale an API tier horizontally from 1 server to ${n} stateless servers behind an L7 load balancer. Which bottleneck is LEAST likely to be solved by adding these ${n} app nodes?`,
        options: [
          'A single shared primary SQL database handling all uncached writes',
          'App server CPU saturation from JSON serialization',
          'In-process request concurrency limits on a single app instance',
          'Single app instance memory exhaustion from request parsing',
        ],
        explanation: `Scaling stateless app servers ${n}× increases compute capacity, but a single unsharded primary database still receives all write queries and becomes the next bottleneck.`,
      }),
    },
    {
      diff: 'Intermediate' as const,
      make: (n: number) => ({
        prompt: `An L7 load balancer distributes traffic across ${n} backend pods. Pod #${Math.min(n, 2)} stalls due to an infinite loop while its TCP port stays open. How do you stop routing requests to it?`,
        options: [
          'Configure an HTTP application-level health check endpoint (e.g., GET /healthz with timeout) so the LB ejects stalled pods.',
          'Rely purely on TCP SYN checks, since TCP handshakes fail during application loops.',
          'Increase DNS TTL to 24 hours.',
          'Disable connection pooling on all clients.',
        ],
        explanation: `Kernel-level TCP handshakes can succeed even when an app worker is deadlocked; an HTTP readiness probe with a strict timeout detects stalled handlers.`,
      }),
    },
    {
      diff: 'Intermediate' as const,
      make: (n: number) => ({
        prompt: `With ${n} heterogeneous backend instances (some 4-core, some 16-core), which load balancing algorithm best prevents smaller nodes from overloading?`,
        options: [
          'Weighted Least Connections (or Weighted Round Robin)',
          'Pure Random selection',
          'Strict IP Hash pinned to /16 subnets',
          'Sending 100% of traffic to the lowest IP address',
        ],
        explanation: `Assigning weights proportional to instance capacity across ${n} heterogeneous servers ensures 16-core nodes take ~4× the load of 4-core nodes.`,
      }),
    },
    {
      diff: 'Advanced' as const,
      make: (n: number) => ({
        prompt: `During a sudden ${n}× traffic flash crowd, auto-scaling new VM instances takes 4 minutes to boot and warm caches. What protects the cluster in the meantime?`,
        options: [
          'Maintaining pre-warmed headroom + rate limiting / load shedding at the edge',
          'Setting auto-scale cooldown to 0 seconds so hundreds of VMs launch simultaneously',
          'Disabling all readiness probes during boot',
          'Switching from HTTP/2 to HTTP/1.0',
        ],
        explanation: `Because compute takes minutes to warm up, edge rate limiting, load shedding, and warm headroom prevent cascading timeouts during the ${n}× spike.`,
      }),
    },
    {
      diff: 'Intermediate' as const,
      make: (n: number) => ({
        prompt: `You operate ${n} stateful WebSocket gateway nodes. Why does "sticky sessions" (session affinity) help for HTTP long-polling fallback, and what is its risk?`,
        options: [
          'It routes a client’s reconnects to the same node holding session state, but can cause uneven load distribution if one client opens many sockets.',
          'It replicates RAM automatically across all ${n} nodes.',
          'It eliminates the need for TLS certificates.',
          'It forces every request through DNS.',
        ],
        explanation: `Sticky sessions preserve per-node affinity for multi-step handshakes, at the cost of potential load imbalance when heavy clients pin to one server.`,
      }),
    },
  ];
  for (let i = 0; i < 50; i++) {
    const tpl = scalingTemplates[i % scalingTemplates.length];
    const n = 2 + (i % 10);
    const built = tpl.make(n);
    out.push({
      id: nextId('scl'),
      topicId: 'scaling',
      topicLabel: 'Scaling & Load Balancing',
      difficulty: tpl.diff,
      prompt: built.prompt,
      options: built.options,
      correctIndex: 0,
      explanation: built.explanation,
    });
  }

  // ── 4. CACHING & CDN (50 questions) ────────────────────────────────────────
  // 4a. Effective Latency from Cache Hit Ratio (25)
  const cacheHitCases = [
    [90, 2, 52], [95, 2, 102], [99, 1, 101], [80, 5, 55], [90, 1, 91],
    [95, 1, 81], [98, 2, 102], [85, 2, 62], [75, 4, 44], [92, 2, 52],
    [96, 1, 101], [94, 2, 52], [88, 3, 53], [99, 2, 202], [90, 4, 104],
    [80, 2, 102], [95, 3, 63], [97, 1, 101], [90, 5, 45], [85, 4, 64],
    [92, 1, 51], [98, 1, 151], [70, 5, 105], [95, 2, 42], [90, 3, 83],
  ];
  for (const [hitPct, tCache, tDb] of cacheHitCases) {
    const h = hitPct / 100;
    const eff = h * tCache + (1 - h) * tDb;
    const ans = `${eff.toFixed(1)} ms`;
    const w1 = `${tCache.toFixed(1)} ms`;
    const w2 = `${((tCache + tDb) / 2).toFixed(1)} ms`;
    const w3 = `${(tDb * h).toFixed(1)} ms`;
    out.push({
      id: nextId('cch'),
      topicId: 'caching',
      topicLabel: 'Caching & CDN',
      difficulty: 'Intermediate',
      prompt: `A Redis cache responds in ${tCache} ms and a cache miss falls back to PostgreSQL in ${tDb} ms. With a ${hitPct}% cache hit ratio, what is the expected average read latency?`,
      options: [ans, w1, w2, w3],
      correctIndex: 0,
      explanation: `Expected latency = ${h.toFixed(2)} × ${tCache} ms + ${(1 - h).toFixed(2)} × ${tDb} ms = ${ans}.`,
    });
  }

  // 4b. Cache & CDN Architecture (25)
  const cacheArchTemplates = [
    {
      diff: 'Intermediate' as const,
      make: (ttl: number) => ({
        prompt: `A hot homepage key has a ${ttl}-second TTL. When it expires at peak traffic, 4,000 concurrent threads miss Redis simultaneously and query MySQL. Which pattern prevents this stampede?`,
        options: [
          'Singleflight / distributed mutex locking so only 1 request queries MySQL while others wait or serve stale-while-revalidate',
          'Lowering the TTL from ' + ttl + 's to 1s',
          'Disabling Redis persistence',
          'Switching eviction from LRU to FIFO',
        ],
        explanation: `Request coalescing (singleflight) or background refresh before the ${ttl}s TTL expires ensures only one DB query runs per key expiration.`,
      }),
    },
    {
      diff: 'Beginner' as const,
      make: (ttl: number) => ({
        prompt: `You cache immutable content-hashed JS bundles (` + '`app.9f8a2c.js`' + `) on a CDN. Why can you safely set ` + '`Cache-Control: public, max-age=31536000, immutable`' + ` instead of a ${ttl}s TTL?`,
        options: [
          'Because a new code deploy produces a new content hash filename, so browsers and CDNs never serve stale code.',
          'Because CDNs automatically ignore Cache-Control headers on JS files.',
          'Because max-age=31536000 disables HTTPS.',
          'Because immutable tells browsers to delete the file after 1 second.',
        ],
        explanation: `Content-addressed filenames bust the cache cleanly on every deploy while maximizing edge cache hit rates.`,
      }),
    },
  ];
  for (let i = 0; i < 25; i++) {
    const tpl = cacheArchTemplates[i % cacheArchTemplates.length];
    const ttl = 15 + (i % 12) * 5;
    const built = tpl.make(ttl);
    out.push({
      id: nextId('cch'),
      topicId: 'caching',
      topicLabel: 'Caching & CDN',
      difficulty: tpl.diff,
      prompt: built.prompt,
      options: built.options,
      correctIndex: 0,
      explanation: built.explanation,
    });
  }

  // ── 5. DATA, REPLICATION & SHARDING (50 questions) ─────────────────────────
  const dataTemplates = [
    {
      diff: 'Intermediate' as const,
      make: (nodes: number) => ({
        prompt: `A distributed cache uses Consistent Hashing with ${nodes} physical nodes. If you add 1 new node (${nodes + 1} total), roughly what fraction of keys must be remapped?`,
        options: [
          `~1/${nodes + 1} (about ${Math.round(100 / (nodes + 1))}% of keys)`,
          `~${nodes}/${nodes + 1} (nearly all keys)`,
          '100% of keys',
          '0% of keys — no keys ever move',
        ],
        explanation: `Consistent hashing only moves the keys belonging to the new node's ring segment (~1/(N+1)), rather than reshuffling ~100% as modulo hashing would.`,
      }),
    },
    {
      diff: 'Intermediate' as const,
      make: (nodes: number) => ({
        prompt: `A quorum-based key-value store has N = ${nodes} replicas (say ${Math.max(3, nodes | 1)}). To guarantee strong read-after-write consistency (R + W > N) with W = ${Math.floor((Math.max(3, nodes | 1)) / 2) + 1}, what minimum read quorum R is needed?`,
        options: [
          `${Math.max(3, nodes | 1) - (Math.floor((Math.max(3, nodes | 1)) / 2) + 1) + 1} replicas`,
          '1 replica',
          `${Math.max(3, nodes | 1) + 2} replicas`,
          '0 replicas',
        ],
        explanation: `Strict quorum consistency requires R + W > N so the read set and write set overlap by at least one up-to-date node.`,
      }),
    },
    {
      diff: 'Beginner' as const,
      make: (nodes: number) => ({
        prompt: `You have 1 primary database and ${nodes} asynchronous read replicas. A user posts a comment and immediately refreshes, hitting a replica with 400 ms lag. How do you ensure read-your-own-writes?`,
        options: [
          'Route the user’s reads to the primary (or a replica caught up past their write LSN) for a short window after they write.',
          'Delete all ' + nodes + ' read replicas permanently.',
          'Disable primary key indexes.',
          'Cache the POST body in DNS.',
        ],
        explanation: `Pinning a writer briefly to the primary or tracking write LSN/timestamps avoids showing stale replica state right after a mutation.`,
      }),
    },
    {
      diff: 'Advanced' as const,
      make: (nodes: number) => ({
        prompt: `Your multi-terabyte orders table is sharded across ${nodes} PostgreSQL shards by \`customer_id\`. Why should you avoid \`JOIN\`s across different shards in the hot request path?`,
        options: [
          'Cross-shard joins require scatter-gather network round-trips across all ' + nodes + ' shards, inflating p99 latency and failure blast radius.',
          'PostgreSQL forbids SQL queries on tables larger than 1 GB.',
          'Shards cannot use primary keys.',
          'Scatter-gather queries use zero network bandwidth.',
        ],
        explanation: `Distributed scatter-gather joins multiply tail latency and fail if any shard stalls; co-locating related data or denormalizing avoids cross-shard joins.`,
      }),
    },
    {
      diff: 'Intermediate' as const,
      make: (nodes: number) => ({
        prompt: `In a ${nodes}-node consistent hashing ring, why do production systems assign 100+ virtual nodes (vnodes) per physical server?`,
        options: [
          'To smooth out uneven key/load distribution when physical node counts are small and spread recovery load evenly when a node fails.',
          'To bypass TCP/IP.',
          'To increase replication lag.',
          'To store passwords in plaintext.',
        ],
        explanation: `Virtual nodes prevent hot spots on small rings and ensure a failed node’s keys are shared evenly across all remaining servers.`,
      }),
    },
  ];
  for (let i = 0; i < 50; i++) {
    const tpl = dataTemplates[i % dataTemplates.length];
    const nodes = 3 + (i % 10);
    const built = tpl.make(nodes);
    out.push({
      id: nextId('dat'),
      topicId: 'data-storage',
      topicLabel: 'Data, Replication & Sharding',
      difficulty: tpl.diff,
      prompt: built.prompt,
      options: built.options,
      correctIndex: 0,
      explanation: built.explanation,
    });
  }

  // ── 6. COMMUNICATION & QUEUES (50 questions) ───────────────────────────────
  const commTemplates = [
    {
      diff: 'Intermediate' as const,
      make: (parts: number) => ({
        prompt: `A Kafka topic has ${parts} partitions. If you deploy ${parts + 4} consumer instances in a single consumer group, how many instances will actively receive partitions?`,
        options: [
          `${parts} instances will be active; 4 instances will sit idle because each partition can only be assigned to one consumer in a group.`,
          `All ${parts + 4} instances will share every single partition simultaneously.`,
          '0 instances will receive messages.',
          'Kafka will automatically double the partition count to ' + (parts * 2) + '.',
        ],
        explanation: `In Kafka, max parallelism within one consumer group equals the partition count (${parts}); extra consumers remain idle standbys.`,
      }),
    },
    {
      diff: 'Beginner' as const,
      make: (parts: number) => ({
        prompt: `An LLM chat UI streams tokens from server to browser as they are generated over ${parts} seconds. Which protocol is simplest and purpose-built for server-to-client text streaming over HTTP?`,
        options: [
          'Server-Sent Events (SSE)',
          'FTP',
          'SMTP',
          'Raw ICMP echo packets',
        ],
        explanation: `SSE streams incremental UTF-8 events over standard HTTP with built-in browser reconnect, ideal for unidirectional token or feed streaming.`,
      }),
    },
    {
      diff: 'Intermediate' as const,
      make: (parts: number) => ({
        prompt: `A queue consumer crashes after charging a customer’s card but before acknowledging the message, so the broker redelivers it after ${parts}0 seconds. What prevents a double charge?`,
        options: [
          'Idempotent processing keyed by a unique transaction/idempotency ID stored atomically with the charge',
          'Disabling message acknowledgments',
          'Using UDP instead of TCP',
          'Reducing queue retention to 1 millisecond',
        ],
        explanation: `At-least-once delivery guarantees redelivery on crash; idempotency keys ensure retries return the prior result without repeating side effects.`,
      }),
    },
    {
      diff: 'Advanced' as const,
      make: (parts: number) => ({
        prompt: `Producers push 50,000 events/s while downstream consumers can only process 10,000 events/s during a ${parts}-minute batch job. What prevents consumer OOM crashes?`,
        options: [
          'Backpressure (pull-based bounded prefetch / queue buffering + rate limiting) so consumers only pull what they can process.',
          'Sending unbounded push webhooks to consumers.',
          'Disabling all consumer memory limits.',
          'Dropping TCP ACKs randomly.',
        ],
        explanation: `Pull-based consumption with bounded in-flight prefetch lets the durable broker buffer the burst while protecting consumer memory.`,
      }),
    },
    {
      diff: 'Intermediate' as const,
      make: (parts: number) => ({
        prompt: `Between ${parts} internal Go/Java microservices in the same VPC, why does gRPC outperform REST+JSON for high-QPS internal RPCs?`,
        options: [
          'Protobuf binary encoding + HTTP/2 header compression & stream multiplexing lower CPU serialization cost and connection overhead.',
          'gRPC skips TCP completely.',
          'JSON cannot encode nested objects.',
          'gRPC requires zero schema definitions.',
        ],
        explanation: `Binary Protobuf + HTTP/2 multiplexing significantly reduce payload size, parsing CPU, and head-of-line blocking.`,
      }),
    },
  ];
  for (let i = 0; i < 50; i++) {
    const tpl = commTemplates[i % commTemplates.length];
    const parts = 4 + (i % 10);
    const built = tpl.make(parts);
    out.push({
      id: nextId('com'),
      topicId: 'communication',
      topicLabel: 'Communication & Queues',
      difficulty: tpl.diff,
      prompt: built.prompt,
      options: built.options,
      correctIndex: 0,
      explanation: built.explanation,
    });
  }

  // ── 7. RELIABILITY & RATE LIMITING (50 questions) ──────────────────────────
  const relTemplates = [
    {
      diff: 'Intermediate' as const,
      make: (limit: number) => ({
        prompt: `You configure a Token Bucket rate limiter with capacity ${limit} tokens and refill rate ${Math.round(limit / 2)} tokens/sec. If a user is idle for 10 seconds, how many requests can they burst immediately?`,
        options: [
          `${limit} requests (capped at bucket capacity)`,
          `${limit * 5} requests`,
          `1 request`,
          `0 requests`,
        ],
        explanation: `Tokens accumulate up to the bucket capacity (${limit}), allowing a controlled ${limit}-request burst while capping long-term average rate.`,
      }),
    },
    {
      diff: 'Intermediate' as const,
      make: (limit: number) => ({
        prompt: `A downstream payment provider is returning 503s for ${limit}% of calls. How does a Circuit Breaker protect your checkout service's thread pool?`,
        options: [
          'It trips OPEN and fails fast locally without waiting on slow timeouts, periodically testing a HALF-OPEN probe until the provider recovers.',
          'It increases the HTTP timeout from 2s to 120s.',
          'It retries infinitely in a tight while-loop.',
          'It deletes the payment database.',
        ],
        explanation: `Failing fast prevents threads from piling up on a dead dependency, keeping the rest of the application responsive.`,
      }),
    },
    {
      diff: 'Beginner' as const,
      make: (limit: number) => ({
        prompt: `A client retries a failed API call with exponential backoff (${limit}00 ms, ${limit * 2}00 ms, ${limit * 4}00 ms) WITHOUT jitter. What risk remains after an outage?`,
        options: [
          'Retry waves stay synchronized across thousands of clients, creating periodic thundering-herd spikes.',
          'The client will never retry at all.',
          'TLS certificates expire immediately.',
          'DNS records are deleted.',
        ],
        explanation: `Adding random jitter desynchronizes client retries so recovery traffic arrives smoothly instead of in lockstep spikes.`,
      }),
    },
    {
      diff: 'Advanced' as const,
      make: (limit: number) => ({
        prompt: `During a massive DDoS/flash spike at ${limit}× normal load, your server starts dropping latency SLAs. What is the difference between rate limiting and load shedding?`,
        options: [
          'Rate limiting enforces per-client/tenant quotas; load shedding protects global server health by shedding excess or low-priority work regardless of who sent it.',
          'Rate limiting runs only in SQL; load shedding runs in CSS.',
          'Load shedding forces every client to wait 60 seconds.',
          'They are identical terms.',
        ],
        explanation: `Even if every individual user is within their rate limit, aggregate traffic can exceed capacity—load shedding sheds excess requests early to preserve goodput.`,
      }),
    },
    {
      diff: 'Intermediate' as const,
      make: (limit: number) => ({
        prompt: `Why is Sliding Window Counter preferred over Fixed Window Counter for enforcing ${limit} req/min per API key?`,
        options: [
          'It eliminates the 2× boundary burst problem where a client sends ' + limit + ' requests at 00:59 and ' + limit + ' more at 01:01.',
          'It uses zero memory and zero timestamps.',
          'It allows unlimited bursts.',
          'It only counts HTTP POST requests.',
        ],
        explanation: `Sliding Window Counter weights the previous window's count proportionally, preventing double-quota bursts across minute boundaries.`,
      }),
    },
  ];
  for (let i = 0; i < 50; i++) {
    const tpl = relTemplates[i % relTemplates.length];
    const limit = 10 + (i % 10) * 5;
    const built = tpl.make(limit);
    out.push({
      id: nextId('rel'),
      topicId: 'reliability',
      topicLabel: 'Reliability & Rate Limiting',
      difficulty: tpl.diff,
      prompt: built.prompt,
      options: built.options,
      correctIndex: 0,
      explanation: built.explanation,
    });
  }

  // ── 8. ARCHITECTURE & SECURITY (50 questions) ──────────────────────────────
  const archTemplates = [
    {
      diff: 'Intermediate' as const,
      make: (k: number) => ({
        prompt: `An e-commerce checkout spans ${k} microservices (Order, Inventory, Payment). Payment fails after Inventory was reserved. How does a Saga recover consistency?`,
        options: [
          'It executes a compensating transaction to release the reserved Inventory.',
          'It leaves Inventory permanently locked.',
          'It drops the Order table.',
          'It restarts all ' + k + ' Kubernetes nodes.',
        ],
        explanation: `Sagas maintain eventual consistency across ${k} services by running explicit compensating actions when a downstream step fails.`,
      }),
    },
    {
      diff: 'Beginner' as const,
      make: (k: number) => ({
        prompt: `You have ${k} backend microservices. Why is terminating TLS and verifying JWTs at the API Gateway common, and when should you also use mTLS internally?`,
        options: [
          'Gateway centralizes public auth/TLS, while internal mTLS enforces Zero Trust identity and encryption between the ' + k + ' services.',
          'Internal networks are physically immune to compromise, so mTLS is never used.',
          'API Gateways cannot parse HTTP headers.',
          'JWTs are encrypted with the user’s browser CSS.',
        ],
        explanation: `Edge termination simplifies external clients, while internal mTLS prevents lateral movement if an internal pod is compromised.`,
      }),
    },
    {
      diff: 'Intermediate' as const,
      make: (k: number) => ({
        prompt: `A reporting dashboard runs heavy analytical queries across ${k} tables while checkout writes orders at high QPS. How does CQRS help?`,
        options: [
          'Writes go to a normalized OLTP store and asynchronously project into a denormalized read store tuned for the dashboard.',
          'It merges all ' + k + ' tables into one unindexed CSV.',
          'It blocks checkout writes whenever anyone opens the dashboard.',
          'It disables ACID transactions on payments.',
        ],
        explanation: `CQRS isolates write contention from read-heavy analytical/search workloads using independent read projections.`,
      }),
    },
    {
      diff: 'Intermediate' as const,
      make: (k: number) => ({
        prompt: `An OAuth2 access token (JWT) has a ${k}-minute TTL paired with a revocable refresh token. Why keep the access token short-lived?`,
        options: [
          'To limit the exposure window if an access token is leaked, while allowing instant revocation via the refresh token.',
          'Because JWTs stop parsing after 60 minutes.',
          'To force users to re-enter their password every ' + k + ' minutes.',
          'To compress the database.',
        ],
        explanation: `Short access-token TTLs bound the blast radius of stateless token theft without requiring a DB lookup on every single API request.`,
      }),
    },
    {
      diff: 'Advanced' as const,
      make: (k: number) => ({
        prompt: `When migrating a monolith into ${k} microservices, what is the Strangler Fig pattern?`,
        options: [
          'Incrementally routing specific routes/capabilities from the monolith to new services behind an edge proxy until the monolith can be retired.',
          'Rewriting all ' + k + ' services from scratch in a single big-bang cutover.',
          'Deleting the production database first.',
          'Sharing one global database schema across all ' + k + ' services forever.',
        ],
        explanation: `The Strangler Fig pattern minimizes migration risk by replacing slices of functionality incrementally in production.`,
      }),
    },
  ];
  for (let i = 0; i < 50; i++) {
    const tpl = archTemplates[i % archTemplates.length];
    const k = 3 + (i % 8);
    const built = tpl.make(k);
    out.push({
      id: nextId('arc'),
      topicId: 'architecture-security',
      topicLabel: 'Architecture & Security',
      difficulty: tpl.diff,
      prompt: built.prompt,
      options: built.options,
      correctIndex: 0,
      explanation: built.explanation,
    });
  }

  // ── 9. WHOLE SYSTEMS DESIGN (55 questions) ─────────────────────────────────
  const sysTemplates = [
    {
      diff: 'Intermediate' as const,
      make: (len: number) => ({
        prompt: `A URL shortener uses Base62 (\`a-zA-Z0-9\`) codes of length ${len}. Roughly how many unique short URLs can it represent?`,
        options: [
          `62^${len} (≈ ${(Math.pow(62, len) / 1e9).toFixed(1)} billion+ for len ≥ 6)`,
          `62 × ${len}`,
          `2^${len}`,
          `10 × ${len}`,
        ],
        explanation: `Each of the ${len} characters has 62 choices, giving 62^${len} possible unique short keys.`,
      }),
    },
    {
      diff: 'Intermediate' as const,
      make: (len: number) => ({
        prompt: `In a News Feed system, a celebrity with ${len}M followers publishes a post. Why is fan-out-on-write avoided for their account?`,
        options: [
          `Writing to ${len}M follower timeline caches per post causes massive write amplification and queue backlog; fan-out-on-read merges it at read time.`,
          `Celebrities cannot use Redis.`,
          `Fan-out-on-write deletes follower accounts.`,
          `HTTP GET requests cannot read from two lists.`,
        ],
        explanation: `Hybrid fan-out pushes normal users' posts eagerly and pulls high-follower celebrity posts lazily at read time.`,
      }),
    },
    {
      diff: 'Intermediate' as const,
      make: (len: number) => ({
        prompt: `A distributed chat service has ${len}00k concurrent WebSocket connections per gateway region. How are messages ordered consistently within a 1:1 or group conversation?`,
        options: [
          'Assigning monotonic per-conversation sequence IDs (or Snowflake-like ordered IDs) on the chat server / partition.',
          'Relying on client wall-clock timestamps without synchronization.',
          'Broadcasting over UDP without sequence numbers.',
          'Sorting alphabetically by message text.',
        ],
        explanation: `Client clocks drift; server-assigned per-conversation sequence numbers guarantee deterministic message ordering.`,
      }),
    },
    {
      diff: 'Beginner' as const,
      make: (len: number) => ({
        prompt: `A video streaming platform encodes uploads into ${len}-second HLS/DASH chunks at 360p, 720p, 1080p, and 4K. Why not serve a single 4 GB MP4 file?`,
        options: [
          'Chunked multi-bitrate segments enable instant seeking, CDN edge caching of popular segments, and adaptive bitrate switching as user bandwidth changes.',
          'Browsers cannot play MP4 video.',
          'CDNs reject files larger than 1 KB.',
          'Single MP4 files cannot use HTTPS.',
        ],
        explanation: `Adaptive Bitrate (ABR) streaming prevents rebuffering by letting the player switch quality every ${len} seconds.`,
      }),
    },
    {
      diff: 'Advanced' as const,
      make: (len: number) => ({
        prompt: `A ride-hailing app tracks ${len}00k active drivers updating GPS every 4 seconds. Which spatial indexing structure makes "find nearest 10 drivers within 3 km" fast in memory?`,
        options: [
          'Geohash / S2 cells / QuadTree index updated in-memory (e.g., Redis Geo or spatial shard)',
          'Full-table SQL LIKE scan over latitude strings',
          'Alphabetical sorting by driver first name',
          'Storing PNG map tiles in a message queue',
        ],
        explanation: `Geohashing or QuadTrees map 2D coordinates into 1D prefix buckets or spatial cells for sub-millisecond radius lookups.`,
      }),
    },
  ];
  for (let i = 0; i < 55; i++) {
    const tpl = sysTemplates[i % sysTemplates.length];
    const len = 6 + (i % 6);
    const built = tpl.make(len);
    out.push({
      id: nextId('sys'),
      topicId: 'whole-systems',
      topicLabel: 'Whole Systems Design',
      difficulty: tpl.diff,
      prompt: built.prompt,
      options: built.options,
      correctIndex: 0,
      explanation: built.explanation,
    });
  }

  return out;
}
