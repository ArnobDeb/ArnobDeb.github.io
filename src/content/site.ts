// ALL site copy, links and resume files live here. Edit this file to change what the page says;
// the layout and effects code never needs to change for a content edit.
//
// Sources: resume PDFs (25M0779-2/-4/-5) and Arnob's current site (cse.iitb.ac.in/~arnobdeb).
// The thesis is IN PROGRESS: describe it with "building / integrating / investigating", never results.

export interface Resume {
  id: string;
  title: string;
  track: string;
  rune: string;
  runeName: string;
  subtitle: string;
  file: string; // path under public/, no leading slash
  featured?: boolean;
}

export interface Email {
  user: string;
  domain: string;
  label: string;
}

export interface Project {
  rune: string;
  title: string;
  meta: string;
  points: string[];
  tags: string[];
  link?: { href: string; label: string };
}

export const site = {
  name: 'Arnob Deb',
  runeName: 'ᚨᚱᚾᛟᛒ',

  meta: {
    title: 'Arnob Deb — ML Systems & Computer Architecture · IIT Bombay',
    description:
      'Arnob Deb, M.Tech CSE at IIT Bombay. Working on LLM inference, KV-cache compression, GPUs and memory systems. Resumes for ML, Systems and SDE roles.',
    // Set once the final public address is decided (e.g. 'https://www.cse.iitb.ac.in/~arnobdeb/').
    // When empty, canonical / og:url / absolute og:image are left out.
    siteUrl: '',
  },

  nav: [
    { id: 'bifrost', rune: 'ᛞ', realm: 'Bifröst', label: 'Home' },
    { id: 'midgard', rune: 'ᛗ', realm: 'Midgard', label: 'About' },
    { id: 'forge', rune: 'ᚲ', realm: 'The Forge', label: 'Work' },
    { id: 'runes', rune: 'ᚱ', realm: 'Hall of Runes', label: 'Skills' },
    { id: 'scrolls', rune: 'ᛊ', realm: 'Three Scrolls', label: 'Resumes' },
    { id: 'valhalla', rune: 'ᚹ', realm: 'Valhalla', label: 'Off-duty' },
    { id: 'ravens', rune: 'ᛖ', realm: "Ravens' Post", label: 'Contact' },
  ],

  hero: {
    kicker: 'M.Tech CSE · IIT Bombay',
    tagline: 'I make machines think faster — from GPU memory to LLM inference.',
    sub: 'Currently: compressing KV caches so long-context LLMs fit on edge hardware.',
    roles: ['ML Systems', 'Computer Architecture', 'Software'],
  },

  about: {
    realm: 'Midgard',
    label: 'About',
    paragraphs: [
      "I'm Arnob, a Computer Science postgrad at IIT Bombay working where ML meets the machine: LLM inference, GPUs, caches and memory systems.",
      "My thesis brings KV-cache compression into Intel's OpenVINO stack for long-context models on AI PCs. Before that I was simulating RowHammer attacks on GPU memory and building out-of-order processors in VHDL.",
      "Off the clock, I'm probably in a Siege lobby or three episodes deep into an anime.",
    ],
    education: [
      { rune: 'ᛏ', title: 'M.Tech, Computer Science & Engineering', place: 'IIT Bombay', meta: '2025 – 2027 (expected)' },
      { rune: 'ᛒ', title: 'B.Tech, Computer Science & Engineering', place: 'Haldia Institute of Technology (MAKAUT)', meta: '2020 – 2024 · CPI 9.42' },
      { rune: 'ᛋ', title: 'GATE CS 2025', place: 'All India Rank 103', meta: 'Also qualified for the BARC OCES/DGFS-2025 selection interview' },
    ],
  },

  forge: {
    realm: 'The Forge',
    label: 'Work',
    intro: 'Where the hammer is still hot.',
    thesis: {
      status: 'In progress',
      title: 'Skylight Edge Server: KV-Cache Compression for Long-Context LLMs',
      meta: 'M.Tech thesis · Guide: Prof. Aditya Desai · CFILT Lab · Jun 2026 – present',
      points: [
        'Benchmarked LLM inference systems and chose OpenVINO as the target backend; profiled its orchestration — inference flow, device dispatch and per-stage latency — on an Intel Core Ultra AI PC (CPU / GPU / NPU).',
        'Analysed modern KV-cache compression methods for long-context LLMs across memory, latency and accuracy trade-offs.',
        'Now integrating selected methods into the OpenVINO inference pipeline, aiming at a smaller memory footprint and lower latency and energy on long-context workloads.',
      ],
      tags: ['OpenVINO', 'LLM inference', 'KV cache', 'Intel AI PC'],
    },
    projects: [
      {
        rune: 'ᚦ',
        title: 'GPU memory & scheduling',
        meta: 'Jan – Apr 2026 · R&D project + M.Tech seminar',
        points: [
          'RowHammer on GPU main memory (Prof. Virendra Singh, ISRDC Lab): isolated GDDR6-specific barriers — higher DRAM latency, shorter refresh windows, opaque row-to-address mappings.',
          'Built a cycle-accurate GPU memory simulator joining GPGPU-Sim and DRAMSim3 through a custom wrapper; profiling mitigation hooks showed the L2 cache throttles the hammering rate by 40% in simulation.',
          'Seminar on latency hiding via out-of-order scheduling in GP-GPUs (Prof. G. Sivakumar & Prof. Virendra Singh): the TLP ceiling when warps stall together, and lightweight OoO / intra-warp ILP as a way forward.',
        ],
        tags: ['GPGPU-Sim', 'DRAMSim3', 'GDDR6', 'C++'],
      },
      {
        rune: 'ᛉ',
        title: 'Multi-tier HTTP employee management server',
        meta: 'Aug – Nov 2025 · CS744, Prof. Mythili Vutukuru',
        points: [
          'Concurrent multi-tier HTTP server in C on CivetWeb: RESTful CRUD APIs, a thread-safe 64-entry LRU cache, thread-local MySQL connections and persistent storage.',
          'Closed-loop load generator across load levels to separate CPU-bound from I/O-bound bottlenecks using throughput, response time and utilisation.',
        ],
        tags: ['C', 'CivetWeb', 'MySQL', 'Load testing'],
        link: {
          href: 'https://github.com/ArnobDeb/Multi-Tier-HTTP-Employee-Management-Server',
          label: 'View the HTTP server on GitHub',
        },
      },
    ] as Project[],
    more: [
      'Cache-aware matrix multiplication up to 8.3× faster (reordering, tiling, unrolling, SIMD); embedding-lookup latency down up to 2.92× with software prefetching — CS683.',
      'Region-based L2 offset prefetcher with adaptive degree in ChampSim: up to 14% speedup over baseline in simulation — CS683.',
      'IITB-RISC: a 6-stage VHDL pipeline extended to a 2-way out-of-order superscalar with reservation stations, renaming and a ROB — EE739.',
      'Co-author, “Employability Prediction of Engineering Undergraduates Using Machine Learning Approach”, RAICCIT 2025, JIS University, pp. 208–214.',
      'Teaching Assistant for CS683 Advanced Computer Architecture (Aug 2026 – present) and CS101 (twice). ISCP Student Companion (Jul 2026 – present).',
    ],
  },

  skills: {
    realm: 'Hall of Runes',
    label: 'Skills',
    groups: [
      { rune: 'ᚠ', name: 'Languages', items: ['C', 'C++', 'Python', 'Bash', 'SQL', 'C#', 'Java', 'JavaScript', 'HTML', 'CSS'] },
      { rune: 'ᚨ', name: 'ML & inference', items: ['OpenVINO', 'PyTorch', 'NumPy', 'Pandas'] },
      { rune: 'ᚦ', name: 'Architecture & simulation', items: ['GPGPU-Sim', 'DRAMSim3', 'ChampSim', 'Vivado / VHDL', 'Vensim'] },
      { rune: 'ᛁ', name: 'Tools & data', items: ['perf', 'Git', 'Make', 'LaTeX', 'MySQL', 'PostgreSQL'] },
    ],
  },

  resumes: {
    realm: 'The Three Scrolls',
    label: 'Resumes',
    intro: 'Three scrolls, one warrior. Pick the one that fits your quest.',
    // To swap a resume: replace the PDF in public/resume/ (keep the file name) or change `file` here.
    items: [
      {
        id: 'ml',
        title: 'Scroll of Wisdom',
        track: 'ML',
        rune: 'ᚨ',
        runeName: 'Ansuz · Odin, wisdom',
        subtitle: 'ML engineering, applied ML, AI inference',
        file: 'resume/Arnob_Deb_Resume_ML.pdf',
      },
      {
        id: 'systems',
        title: 'Scroll of the Forge',
        track: 'Systems',
        rune: 'ᚦ',
        runeName: "Thurisaz · Thor's hammer",
        subtitle: 'Architecture, GPUs/CPUs, performance, infrastructure',
        file: 'resume/Arnob_Deb_Resume_Systems.pdf',
        featured: true,
      },
      {
        id: 'sde',
        title: 'Scroll of the Builder',
        track: 'SDE',
        rune: 'ᛒ',
        runeName: 'Berkanan · growth, building',
        subtitle: 'Software engineering, backend, full-stack',
        file: 'resume/Arnob_Deb_Resume_SDE.pdf',
      },
    ] as Resume[],
  },

  valhalla: {
    realm: 'Valhalla',
    label: 'Off-duty',
    intro: 'Every warrior needs a mead hall.',
    siege: {
      title: 'Rainbow Six Siege',
      text: 'My main game. Catch me in a lobby.',
      // Fill these in to show them; empty values are hidden.
      platform: '',
      handle: '',
      fallback: 'Want to squad up? Send a raven for my handle.',
    },
    anime: {
      title: 'Anime',
      text: 'Long-time anime watcher.',
      favorites: [] as string[],
    },
    comics: {
      title: 'Marvel & DC',
      text: 'Love both universes, and a big Green Lantern fan. Want to argue about the multiverse? Hit me up.',
    },
    hobbies: ['Building PCs', 'Badminton', 'Pool', 'Football', 'Card games', 'Travelling'],
    honours: ['2nd place, Algo GC (hostel General Championship), IIT Bombay', 'Finished the 5.5 km Crossy GC, IIT Bombay'],
    quote: {
      text: 'Doth mother know you weareth her drapes?',
      who: 'Tony Stark, to Thor',
      source: 'The Avengers (2012)',
    },
    terminal: [
      { cmd: 'whoami', out: ['arnob — systems by day, Siege by night'] },
      { cmd: 'cat favorites.txt', out: ['game: Rainbow Six Siege', 'hero: Green Lantern'] },
      { cmd: './queue --siege', out: ['looking for squad...  (DM me)'] },
    ],
  },

  contact: {
    realm: "Ravens' Post",
    label: 'Contact',
    intro: 'Send a raven. Huginn and Muninn are faster than they look.',
    emails: [
      { user: 'arnobdeb', domain: 'cse.iitb.ac.in', label: 'Academic' },
      { user: 'arnobhawk145', domain: 'gmail.com', label: 'Personal' },
    ] as Email[],
    links: [
      { label: 'GitHub', handle: 'ArnobDeb', href: 'https://github.com/ArnobDeb' },
      { label: 'LinkedIn', handle: 'arnob-deb', href: 'https://www.linkedin.com/in/arnob-deb/' },
    ],
  },
};
