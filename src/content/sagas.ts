// Content for the three project "saga" pages. Every number comes from Arnob's own reports:
//   RestoreKV  → 25M0779_MTP_Report.pdf (M.Tech Project Stage I, Oct 2026)
//   GPU        → R&D report "Mitigating RowHammer Vulnerability in GPU Main Memory" (May 2026)
//                + seminar report "Out-of-Order Scheduling in GPGPUs" (May 2026)
//   HTTP       → github.com/ArnobDeb/Multi-Tier-HTTP-Employee-Management-Server (results/, saturation_report.txt)
import { barChart, lineChart, SERIES } from './charts.ts';

export interface Stat { v: string; l: string }
export interface Step { title: string; text: string; stats?: Stat[] }
export interface ActBlock { kind: 'act'; id: string; numeral: string; title: string; intro?: string; stage: string; steps: Step[]; controls?: string }
export interface ChartsBlock { kind: 'charts'; id: string; numeral: string; title: string; intro?: string; charts: string[]; stats?: Stat[] }
export interface StonesBlock { kind: 'stones'; id: string; numeral: string; title: string; intro?: string; stones: { rune: string; title: string; text: string; stat?: string }[] }
export type Block = ActBlock | ChartsBlock | StonesBlock;

export interface Saga {
  slug: string;
  file: string;
  rune: string;
  realm: string;
  title: string;
  sub: string;
  meta: string;
  heroStats: Stat[];
  blocks: Block[];
  links?: { href: string; label: string }[];
  disclaimer?: string;
}

const restorekv: Saga = {
  slug: 'restorekv',
  file: 'restorekv.html',
  rune: 'ᚲ',
  realm: 'The Forge · Thesis',
  title: 'Eviction without Forgetting',
  sub: 'Teaching an LLM on a laptop to throw away 90% of its memory — and still remember what mattered. RestoreKV, built into Intel’s OpenVINO GenAI.',
  meta: 'M.Tech thesis (Skylight Edge Server), Stage I · Guide: Prof. Aditya Desai · CFILT Lab · Jun – Oct 2026',
  heroStats: [
    { v: '80.7 → 89.7', l: 'RULER-4K at a 25% cache budget (full cache: 93.1)' },
    { v: '−90%', l: 'KV cache per sequence at a 10% budget' },
    { v: '+31%', l: 'decode throughput at batch 8' },
    { v: '99.7–99.9%', l: 'of evicted blocks match the real runtime' },
  ],
  blocks: [
    {
      kind: 'act',
      id: 'memory',
      numeral: 'I',
      title: 'One pool of memory',
      intro: 'Why a long conversation is a memory problem on an AI PC.',
      stage: 'memory',
      steps: [
        {
          title: 'There is no separate GPU memory',
          text: 'The target machine is an Intel Core Ultra 7 258V (Lunar Lake) laptop. Its CPU, Arc integrated GPU and NPU sit on one chip and all allocate from the same 32 GB of RAM — about 30 GB of it visible to the OS.',
        },
        {
          title: 'The model moves in first',
          text: 'Qwen3-8B’s FP16 weights take 16.4 GB of that pool before a single word is read.',
        },
        {
          title: 'Then every token leaves something behind',
          text: 'While reading a prompt, the model stores a key and a value per token, per layer, per head — the KV cache. For Qwen3-8B that is 144 KiB per token: 0.6 GB at 4K tokens, 4.8 GB at 32K, 9.7 GB at 64K.',
          stats: [{ v: '144 KiB', l: 'per token' }, { v: '9.7 GB', l: 'at 64K tokens' }],
        },
        {
          title: 'Two long documents don’t fit',
          text: 'Weights plus two 64K-token sequences overflow the machine. The cache is the part of memory that grows — with the context and with the batch — and it competes directly with the weights. Try it: change the context and the number of sequences.',
        },
      ],
      controls: `
        <div class="ctrl" data-ctrl="memory">
          <label class="ctrl__row"><span>Context per sequence</span><input type="range" min="0" max="4" step="1" value="2" data-k="ctx" aria-describedby="mem-ctx-out"><output id="mem-ctx-out">16K</output></label>
          <label class="ctrl__row"><span>Sequences in the batch</span><input type="range" min="0" max="3" step="1" value="0" data-k="seq" aria-describedby="mem-seq-out"><output id="mem-seq-out">1</output></label>
        </div>`,
    },
    {
      kind: 'charts',
      id: 'engine',
      numeral: 'II',
      title: 'Choosing the forge',
      intro: 'Four engines were considered — llama.cpp, vLLM, SGLang and OpenVINO GenAI. Only OpenVINO runs one model on all three compute units, already ships KV-cache eviction (a real baseline to beat), and is open source. Then: which device?',
      charts: [
        barChart({
          title: 'Time to first token, Qwen3-8B (FP16), 1K-token prompt',
          yLabel: 'seconds',
          unit: ' s',
          categories: ['CPU', 'iGPU', 'NPU', 'HETERO'],
          series: [{ name: 'Time to first token', color: SERIES.violet, values: [62.7, 2.1, 3.1, 63.6] }],
          labelSeries: 0,
          caption: 'The iGPU reads the prompt about 30× faster than the CPU. HETERO behaves like the CPU because the graph lands there; the NPU stopped after 129–169 of 512 tokens in these runs.',
        }),
      ],
      stats: [
        { v: '29–46×', l: 'faster prompt reading on the iGPU than the CPU' },
        { v: '1,558 s', l: 'Phi-3.5 TTFT on the CPU at 32K (16 s at 1K)' },
        { v: '~30 GB', l: 'Qwen3-8B on the CPU: the plugin unpacks FP16 to FP32' },
      ],
    },
    {
      kind: 'act',
      id: 'cache',
      numeral: 'III',
      title: 'How OpenVINO forgets — and eight runes that remember',
      intro: 'One layer of the cache, drawn as 16-token blocks. Rows are attention heads.',
      stage: 'kv',
      steps: [
        {
          title: 'Prefill fills the cache',
          text: 'The whole prompt runs through the model in one pass. Every token writes its keys and values, block by block. This is compute-bound, and its cost is the time to first token.',
        },
        {
          title: 'Decode reads all of it, every time',
          text: 'Each new token is one forward pass that must read the weights and the entire cache. Decoding is memory-bandwidth-bound — a bigger cache means slower tokens.',
        },
        {
          title: 'Eviction: keep a little, drop the rest',
          text: 'OpenVINO never evicts the first 32 tokens or the most recent ones. Everything in between is scored by attention from the last 8 prompt tokens, and the lowest-scoring 16-token blocks go — down to the budget.',
        },
        {
          title: 'Coarse by design',
          text: 'Inside a layer, one block holds every head, so all heads keep or drop the same tokens. Measured step by step, this head-shared decision is the single biggest loss: at 10% it alone drops KVzip from 66.6 to 25.1.',
          stats: [{ v: '66.6 → 25.1', l: 'RULER-4K at 10%, from sharing one decision across heads' }],
        },
        {
          title: 'Whatever is dropped is gone',
          text: 'If the answer lived in an evicted block, the model can’t find it. At small budgets, answer quality collapses.',
        },
        {
          title: 'RestoreKV: eight learned tokens read everything first',
          text: 'Just before eviction, 8 restore tokens — learned vectors, not words — attend to every block of the document with a tiny LoRA adapter switched on.',
        },
        {
          title: 'They write a summary into one protected block',
          text: 'Their own keys and values land in one block that eviction may never drop. It is counted inside the budget, so the cache is exactly the same size as plain eviction.',
        },
        {
          title: 'The question asks the runes',
          text: 'Later, the question attends to the kept blocks and the 8 restore entries, and gets back part of what eviction threw away.',
        },
      ],
    },
    {
      kind: 'act',
      id: 'training',
      numeral: 'IV',
      title: 'Teaching the runes',
      intro: 'An adapter only helps the evictor it was trained with. The released one was trained for KVzip, so new ones had to be trained against OpenVINO’s exact rules.',
      stage: 'train',
      steps: [
        {
          title: 'The model is its own teacher',
          text: 'The frozen model runs twice on the same example: once as the teacher with the full cache, once as the student with the restore pass and OpenVINO-style eviction at a random budget between 2.5% and 25%.',
        },
        {
          title: 'Match the full model, token by token',
          text: 'For every answer position, both runs predict a distribution over the whole vocabulary. The loss is the symmetric KL divergence between them — zero only when the student predicts exactly like the full model.',
        },
        {
          title: 'Only a sliver learns',
          text: 'Gradients reach only the 8 restore embeddings and the LoRA matrices: 21.9 million parameters, about 0.3% of Qwen3-8B. Each adapter took about 3 hours on one A40 on the department’s Prajna cluster; eight were trained.',
          stats: [{ v: '21.9 M', l: 'trained parameters (0.3%)' }, { v: '8', l: 'adapters trained' }],
        },
        {
          title: 'Proving the copy is faithful',
          text: 'A logging patch inside the real OpenVINO GenAI printed every block score and eviction. The Python replica chose 99.7–99.9% of the same evicted blocks over 1,296 layer rows.',
          stats: [{ v: '99.7–99.9%', l: 'identical evicted blocks' }],
        },
      ],
    },
    {
      kind: 'act',
      id: 'patch',
      numeral: 'V',
      title: 'Into the C++ forge',
      intro: 'GenAI can’t feed learned vectors, can’t switch LoRA on for 8 tokens of one sequence, and has no hook between prefill and eviction. The way around all three: make the restore pass happen inside a normal prefill.',
      stage: 'patch',
      steps: [
        {
          title: 'Hide the runes in the prompt',
          text: 'The caller builds the prompt as [document][8 restore IDs][question]. The IDs sit just past the vocabulary, so the tokenizer can never produce them by accident.',
        },
        {
          title: 'A normal prefill is the restore pass',
          text: 'The exported model swaps those 8 IDs for the learned vectors and gates LoRA on only for them. Attention is causal, so they read the whole document — exactly the restore pass, with zero new pipeline inputs.',
        },
        {
          title: 'Find and protect the block',
          text: 'Worked example: a 4,000-token prompt is 250 blocks. The restore IDs at positions 3,904–3,911 fall into block 244, which the patch marks protected in all 36 layers.',
          stats: [{ v: 'block 244', l: 'protected in all 36 layers' }],
        },
        {
          title: 'Evict, and keep the runes',
          text: 'At a 10% budget, 25 blocks survive: 2 start, 2 recent, and 21 evictable — the protected block plus the 20 best document blocks. Same memory as plain eviction.',
        },
        {
          title: 'Renumber and carry on',
          text: 'After eviction, blocks behind the dropped ones move forward, so block 244 becomes logical block 19 and stays protected through every later eviction while the answer is generated.',
        },
      ],
      controls: `
        <pre class="code" aria-label="The core of the change inside OpenVINO's cache_eviction.cpp"><code><span class="c">// RestoreKV: protected blocks are kept as if they had the highest score</span>
<span class="k">for</span> (size_t block : m_protected_blocks[layer]) {
    scores[block - start_blocks] = std::numeric_limits&lt;double&gt;::<span class="f">max</span>();
    num_protected++;
}
num_blocks_to_evict = std::<span class="f">min</span>(num_blocks_to_evict, scores.size() - num_protected);
evicted = <span class="f">get_indices_of_blocks_to_evict</span>(scores, num_blocks_to_evict);
<span class="c">// remaining blocks move down past the evicted ones</span>
<span class="k">for</span> (size_t block : m_protected_blocks[layer])
    shifted.insert(block - <span class="f">count_evicted_before</span>(evicted, block));
m_protected_blocks[layer] = shifted;</code></pre>`,
    },
    {
      kind: 'charts',
      id: 'results',
      numeral: 'VI',
      title: 'What the runes won back',
      intro: 'Inside OpenVINO GenAI’s continuous-batching pipeline on the laptop’s iGPU, RULER-4K, 130 samples, same memory budget.',
      charts: [
        barChart({
          title: 'RULER-4K score, Qwen3-8B, OpenVINO’s default eviction',
          yLabel: 'score (0–100)',
          categories: ['2.5%', '5%', '10%', '15%', '25%'],
          series: [
            { name: 'OpenVINO eviction', color: SERIES.violet, values: [10.5, 49.6, 67.6, 75.3, 80.7] },
            { name: '+ RestoreKV', color: SERIES.gold, values: [10.2, 53.5, 72.3, 81.3, 89.7] },
          ],
          yMax: 100,
          reference: { value: 93.1, label: 'Full cache 93.1' },
          labelSeries: 1,
          caption: 'Cache budget kept on the x-axis. Gains of +3.9 to +9.1 points from 5% up, every 95% interval above zero. At 2.5% only ~80 tokens survive and nothing helps.',
        }),
        barChart({
          title: 'RestoreKV gain on three models (points, RULER-4K)',
          yLabel: 'gain over plain eviction',
          unit: ' pts',
          categories: ['5%', '10%', '15%', '25%'],
          series: [
            { name: 'Qwen3-8B', color: SERIES.teal, values: [3.9, 4.7, 5.9, 9.1] },
            { name: 'Qwen3-4B', color: SERIES.violet, values: [2.7, 8.2, 6.4, 5.0] },
            { name: 'Llama-3.1-8B', color: SERIES.gold, values: [8.3, 7.3, 9.6, 10.7] },
          ],
          caption: 'Each model with its own adapter. Llama reaches 92.0 at 25%, within 4.3 points of its full cache.',
        }),
        barChart({
          title: 'Total decode throughput, Qwen3-8B, 4K input, 10% budget',
          yLabel: 'tokens / second',
          unit: ' tok/s',
          categories: ['Batch 1', 'Batch 4', 'Batch 8'],
          series: [
            { name: 'Full cache', color: SERIES.violet, values: [4.55, 13.21, 20.61] },
            { name: 'Eviction', color: SERIES.teal, values: [4.61, 15.7, 27.05] },
            { name: '+ RestoreKV', color: SERIES.gold, values: [4.59, 15.69, 26.83] },
          ],
          caption: 'Eviction pays when batching: +31% at batch 8. RestoreKV keeps that speed — its cache is the same size.',
        }),
      ],
      stats: [
        { v: '2,880 → 58.5 MB', l: 'KV cache held after a 16K-token answer (−98%)' },
        { v: '7 → 40', l: 'identical tokens before the answer drifts from the full model (Qwen3-8B, one prompt)' },
        { v: '0.34 s', l: 'restore pass at 4K — vs 86 s for KVzip’s scoring pass' },
      ],
    },
    {
      kind: 'stones',
      id: 'scars',
      numeral: 'VII',
      title: 'What fought back',
      intro: 'Things the work uncovered in OpenVINO 2026.4.1 on the iGPU.',
      stones: [
        { rune: 'ᚺ', title: 'Eviction kills the fast kernel', text: 'Asking for attention scores switches off the fused attention kernels. Prefill gets 2.9–9.4× slower; the fallback’s buffers ate 7.5 GB extra on a 3K prompt — 7.25 GB was predicted from the source.', stat: '2.9–9.4×' },
        { rune: 'ᚾ', title: 'NaN scores past 4K', text: 'For a single-chunk prompt over 4,096 tokens, GPU eviction scores came out as NaN in all 36 layers.', stat: 'NaN × 36' },
        { rune: 'ᛁ', title: 'ADAPTIVE_RKV can’t run on the iGPU', text: 'The GPU path never registers the block diversity the newest eviction mode needs.', stat: '—' },
        { rune: 'ᛃ', title: 'FP16 overflow', text: 'Some adapters pushed restore-token activations past FP16 range. Fixed with ACTIVATIONS_SCALE_FACTOR=8 and FP32 LoRA nodes.', stat: '×8' },
        { rune: 'ᛇ', title: 'The 2.5% wall', text: 'At 80 tokens of budget, start and recent areas take 64 and the last block goes to the runes — no document block survives. RestoreKV hurts here (−8.5 on Llama).', stat: '80 tokens' },
      ],
    },
  ],
  disclaimer: 'All numbers from the Stage I report (Oct 2026). Charts are redrawn from its tables.',
};

const gpu: Saga = {
  slug: 'gpu',
  file: 'gpu.html',
  rune: 'ᚦ',
  realm: 'The Forge · GPU',
  title: 'Hammering the GPU’s memory',
  sub: 'How repeatedly opening one row of DRAM can flip bits in its neighbour, why GPUs were thought immune, and a cycle-accurate simulator built to study the defences. Plus: why warps that all stall together leave a GPU idle.',
  meta: 'R&D project · Prof. Virendra Singh · ISRDC Lab · Jan – Apr 2026  ·  M.Tech seminar · Prof. G. Sivakumar & Prof. Virendra Singh',
  heroStats: [
    { v: 'GPGPU-Sim × DRAMSim3', l: 'joined through a new cycle-accurate wrapper' },
    { v: '~40%', l: 'lower hammering rate: the L2 cache throttles it (in simulation)' },
    { v: '353–357', l: 'refreshes logged per bank vs 355 expected' },
    { v: '2.3% → 0', l: 'lost transactions once backpressure is on' },
  ],
  blocks: [
    {
      kind: 'act',
      id: 'dram',
      numeral: 'I',
      title: 'The hammer and the anvil',
      intro: 'One DRAM bank: rows of cells, one row buffer.',
      stage: 'dram',
      steps: [
        { title: 'Open, read, close', text: 'To read, the controller ACTIVATEs a row — copying it into the row buffer — reads the column it needs, then PRECHARGEs to close it. Every cell is a tiny capacitor that slowly leaks.' },
        { title: 'Refresh keeps the charge', text: 'So every row is refreshed within a window: 64 ms for DDR4, about 23 ms measured for GDDR6.' },
        { title: 'Hammer the neighbours', text: 'Toggle the two rows on either side of a victim fast enough, and coupling between wordlines drains the victim’s cells faster than refresh can top them up.' },
        { title: 'A bit flips', text: 'Cross the RowHammer threshold before the next refresh and a cell flips — without ever being accessed. DDR3 needed 139K activations; modern DDR4/5 and GDDR6 need only 10–20K.', stats: [{ v: '139K → 10–20K', l: 'activations to flip a bit, DDR3 → today' }] },
      ],
    },
    {
      kind: 'act',
      id: 'race',
      numeral: 'II',
      title: 'Why GPUs seemed safe — and weren’t',
      intro: 'Activations per refresh window, racing against the threshold.',
      stage: 'race',
      steps: [
        { title: 'Slow memory, short window', text: 'GPU memory latency is ~300 ns, 4–5× a CPU’s ~60 ns, and GDDR6’s refresh window is only ~23 ms. A single CUDA thread manages only ~100K activations per window — not enough for a many-sided pattern.' },
        { title: 'Hidden maps, no flush', text: 'NVIDIA doesn’t expose physical addresses, and before Ampere there was no instruction to evict one line from L2. GPUHammer had to learn row/bank maps from timing alone.' },
        { title: 'But a GPU has thousands of threads', text: 'Give each aggressor its own warp: when one stalls, the scheduler issues the next. With 8 warps, GPUHammer reached ~620K activations per window — 93% of the ~700K maximum — and flipped bits in an RTX A6000.', stats: [{ v: '93%', l: 'of the theoretical activation rate' }, { v: 'up to 80%', l: 'ImageNet accuracy loss from the flips' }] },
      ],
    },
    {
      kind: 'act',
      id: 'defences',
      numeral: 'III',
      title: 'Shields that crack',
      intro: 'Three in-DRAM defences, and how each one gives.',
      stage: 'defence',
      steps: [
        { title: 'PARA: a coin flip per activation', text: 'On every ACT, refresh the neighbours with a small probability. Stateless and cheap, but probabilistic.' },
        { title: 'TRR: watch the hottest rows', text: 'A sampler tracks frequently activated rows and refreshes their neighbours. On the A6000 it holds 16 rows per bank — so 17 aggressors overflow it and one row hammers unseen.', stats: [{ v: '17', l: 'aggressors to overflow a 16-entry tracker' }] },
        { title: 'RFM: count, then block', text: 'A per-bank counter triggers extra refreshes, and at its maximum the bank refuses activations. Strong — but the stalls are visible as timing, which itself leaks information.' },
      ],
    },
    {
      kind: 'act',
      id: 'sim',
      numeral: 'IV',
      title: 'What I built: a GPU with a real memory',
      intro: 'GPGPU-Sim models the SMs, warps and caches but treats DRAM as a fixed delay. DRAMSim3 models every DRAM command but has no GPU. The new dramsim3 wrapper joins them.',
      stage: 'sim',
      steps: [
        { title: 'L2 misses become DRAM transactions', text: 'When an L2 miss leaves for memory, AddTransaction() hands it to the DRAMSim3 channel that owns the address — one MemorySystem per GDDR6 channel.' },
        { title: 'Two clocks, one bridge', text: 'The GPU ticks at the SIMT clock and DRAM at its own frequency. ClockTick() advances DRAMSim3 by the right ratio of cycles.' },
        { title: 'Backpressure instead of loss', text: 'WillAcceptTransaction() checks the DRAM command queue before L2 dequeues a request. Past the high-water mark, the GPU side waits. Without it, ~2.3% of transactions were dropped; with it, none.', stats: [{ v: '2.3% → 0', l: 'dropped transactions' }] },
        { title: 'Every ACT is counted', text: 'An instrumentation layer counts activations per row, resets on refresh, and flags any row past the threshold. PARA, TRR and RFM plug in as mitigation hooks.' },
        { title: 'The L2 is a natural shield', text: 'Hammering two addresses from one thread, the L2 served part of the accesses from cache: the effective hammering rate came out about 40% below the latency-based estimate.', stats: [{ v: '~40%', l: 'lower hammering rate (in simulation)' }] },
      ],
    },
    {
      kind: 'stones',
      id: 'checks',
      numeral: 'V',
      title: 'How the simulator proved itself',
      intro: 'GDDR6 timing (tRC 45 ns, tREFI 1,407 ns, tREFW 23 ms, 16 banks × 64K rows), Rodinia and CUDA SDK workloads.',
      stones: [
        { rune: 'ᛚ', title: 'Three latency peaks', text: 'stream benchmark: row hits near 22 ns, row conflicts near 68 ns (tRP + tRCD + tCL), refresh-stalled accesses near 200 ns — as GDDR6 timing predicts.', stat: '22 · 68 · 200 ns' },
        { rune: 'ᛋ', title: 'Refresh on schedule', text: '500 µs simulated: 353–357 REF commands per bank against 500,000 / 1,407 ≈ 355 expected.', stat: '< 1% off' },
        { rune: 'ᛏ', title: 'Single-thread hammer', text: '≈ 4,600 activations per aggressor row in 10 ms, ≈ 10,600 per 23 ms window — matching GPUHammer’s ~15% of max for one thread.', stat: '≈ 10.6K' },
        { rune: 'ᛈ', title: 'PARA is cheap', text: 'With p = 0.001 on stream, total cycles grew by about 1.8%.', stat: '+1.8%' },
        { rune: 'ᚱ', title: 'RFM has a long tail', text: 'On spmv, banks hitting the RFM maximum caused 10–15× latency spikes.', stat: '10–15×' },
      ],
    },
    {
      kind: 'act',
      id: 'warps',
      numeral: 'VI',
      title: 'Warps that won’t wait (seminar)',
      intro: 'Four warps on one SM. Each square is an issue slot.',
      stage: 'warps',
      steps: [
        { title: 'Thread-level parallelism', text: 'A GPU hides a 400–600-cycle memory access by switching to another ready warp. As long as someone is ready, the pipeline stays busy.' },
        { title: 'When everyone stalls at once', text: 'When occupancy is limited or bandwidth saturates, all warps end up waiting together. The pipeline sits idle — TLP alone is not enough.' },
        { title: 'Look inside the stalled warp', text: 'A stalled warp often has younger instructions that don’t depend on the missing load. Out-of-order issue lets them go ahead — instruction-level parallelism filling the bubbles.' },
      ],
    },
    {
      kind: 'charts',
      id: 'designs',
      numeral: 'VII',
      title: 'Seven ways to break the order',
      intro: 'The seminar compared four design philosophies: a fully out-of-order pipeline (LOOG), lightweight dependency tracking (SIMIL, GhOST), ISA hints (HAWS, TURBULENCE), and pre-execution modes (Warped-Preexecution, MIPSGPU).',
      charts: [
        barChart({
          title: 'Speedup reported by each paper (geometric mean over its own baseline)',
          yLabel: 'speedup %',
          unit: '%',
          categories: ['LOOG', 'SIMIL', 'GhOST', 'HAWS', 'TURBUL.', 'Warped-P', 'MIPSGPU'],
          series: [{ name: 'Reported speedup', color: SERIES.teal, values: [16, 31, 7, 25, 18, 23, 19] }],
          labelSeries: 0,
          caption: 'Surveyed results, not my measurements. Baselines differ (HAWS is against round-robin), so compare with care. LOOG also reports a 16.5% slowdown on compiled SASS.',
        }),
      ],
      stats: [
        { v: '∼31%', l: 'SIMIL: a dependency matrix, the best lightweight design' },
        { v: '0.7%', l: 'TURBULENCE instruction overhead, vs 20%+ for pure distance ISAs' },
      ],
    },
  ],
  disclaimer: 'RowHammer results are from simulation. GPUHammer and seminar figures are reported by the surveyed papers and credited to them.',
};

const http: Saga = {
  slug: 'http-server',
  file: 'http-server.html',
  rune: 'ᛉ',
  realm: 'The Forge · Systems',
  title: 'A server under siege',
  sub: 'A multi-tier HTTP server in C, a cache in front of MySQL, and a closed-loop load generator to find exactly where it breaks.',
  meta: 'CS744 Design & Engineering of Computing Systems · Prof. Mythili Vutukuru · Aug – Nov 2025',
  heroStats: [
    { v: '4,050 req/s', l: 'peak: skewed reads at 24 client threads' },
    { v: '64', l: 'entries in the thread-safe LRU cache' },
    { v: '~98%', l: 'CPU at saturation, disk under 7%: CPU-bound' },
    { v: '20', l: 'load runs: 4 workloads × 5 thread counts' },
  ],
  blocks: [
    {
      kind: 'act',
      id: 'flow',
      numeral: 'I',
      title: 'Three tiers, one request',
      intro: 'Requests travel left to right. Gold returns from the cache, violet from the database.',
      stage: 'flow',
      steps: [
        { title: 'The front door', text: 'CivetWeb accepts HTTP connections and hands each request to one of 8 worker threads. REST routes: GET, POST, PUT and DELETE on /employee, plus /metrics for cache hits and misses.' },
        { title: 'Cache hit: straight back', text: 'Reads check an in-memory LRU cache of 64 employees first — a hash table for lookup plus a doubly linked list for recency. A hit answers without touching the database.' },
        { title: 'Miss: down to MySQL', text: 'A miss goes to MySQL over a thread-local connection, then the answer is written into the cache — evicting the least-recently-used entry if it’s full.' },
        { title: 'One lock, many threads', text: 'The cache is shared by every worker, so a mutex guards it. PUT and DELETE write to MySQL and invalidate the cached copy, so a read never sees stale data.' },
      ],
    },
    {
      kind: 'act',
      id: 'lru',
      numeral: 'II',
      title: 'Feel the cache',
      intro: 'A toy version with 8 slots instead of 64. Send requests and watch the hit rate.',
      stage: 'lru',
      steps: [
        { title: 'Popular keys stay hot', text: 'With a skewed workload a few employees get most requests. They stay near the front of the LRU list and almost every read is a hit — the get_popular workload.' },
        { title: 'Uniform keys thrash', text: 'Spread reads over thousands of IDs and the cache keeps evicting what it just loaded — most reads fall through to MySQL, like get_all.' },
      ],
      controls: `
        <div class="ctrl ctrl--buttons" data-ctrl="lru">
          <button type="button" class="btn btn--ghost btn--sm" data-k="popular">GET popular ×20</button>
          <button type="button" class="btn btn--ghost btn--sm" data-k="uniform">GET uniform ×20</button>
          <button type="button" class="btn btn--ghost btn--sm" data-k="reset">Reset</button>
        </div>`,
    },
    {
      kind: 'charts',
      id: 'load',
      numeral: 'III',
      title: 'Finding the breaking point',
      intro: 'A closed-loop load generator in C: each client thread sends a request, waits for the reply, sends the next. Server pinned to cores 0–1 and load generator to cores 2–3 with taskset, 300-second runs, CPU and disk sampled with mpstat and iostat.',
      charts: [
        lineChart({
          title: 'Throughput vs client threads',
          x: [4, 8, 16, 24, 32],
          xLabel: 'client threads',
          yLabel: 'requests / second',
          unit: ' req/s',
          series: [
            { name: 'get_popular', color: SERIES.gold, values: [1985.31, 2438.45, 2949.59, 4050.26, 2830.9] },
            { name: 'get_all', color: SERIES.teal, values: [1350.24, 1889.02, 2499.94, 2593.99, 2184.35] },
            { name: 'mix', color: SERIES.violet, values: [245.02, 254.49, 233.56, 273.87, 282.34] },
            { name: 'put_all', color: SERIES.rose, values: [201.01, 298.9, 222.65, 168.72, 132.87] },
          ],
          caption: 'Cache-friendly reads peak at 24 threads, then fall as threads fight over two cores. Writes go to MySQL every time and peak at only 8.',
        }),
        lineChart({
          title: 'Average latency vs client threads',
          x: [4, 8, 16, 24, 32],
          xLabel: 'client threads',
          yLabel: 'milliseconds',
          unit: ' ms',
          series: [
            { name: 'put_all', color: SERIES.rose, values: [18.761, 22.864, 43.826, 62.015, 92.12] },
            { name: 'mix', color: SERIES.violet, values: [7.15, 11.009, 27.319, 27.021, 32.13] },
            { name: 'get_all', color: SERIES.teal, values: [2.515, 3.644, 5.745, 8.518, 13.909] },
            { name: 'get_popular', color: SERIES.gold, values: [1.624, 2.809, 4.884, 5.51, 10.687] },
          ],
          caption: 'Past saturation, extra clients only queue: latency climbs while throughput stays flat or drops.',
        }),
      ],
      stats: [
        { v: '98.4%', l: 'CPU at get_all saturation (32 threads), disk 0.16%' },
        { v: '95.1%', l: 'CPU at put_all saturation (24 threads), disk 4.2%' },
        { v: 'CPU', l: 'the bottleneck in all four workloads' },
      ],
    },
  ],
  links: [{ href: 'https://github.com/ArnobDeb/Multi-Tier-HTTP-Employee-Management-Server', label: 'Source on GitHub' }],
  disclaimer: 'Throughput and latency from results/out_<workload>_<threads>.txt in the repository; saturation from saturation_report.txt. The cache demo is a toy simulation.',
};

export const sagas: Saga[] = [restorekv, gpu, http];
export const sagaBySlug = Object.fromEntries(sagas.map((s) => [s.slug, s])) as Record<string, Saga>;
