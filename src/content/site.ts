// ALL site copy, links and resume files live here. Edit this file to change what the page says;
// the layout and effects code never needs to change for a content edit.
//
// Sources: resume PDFs (25M0779-2/-4/-5) and Arnob's current site (cse.iitb.ac.in/~arnobdeb).
// Numbers on the project pages come from the reports (see CREDITS.md); never invent facts here.

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
    siteUrl: 'https://www.cse.iitb.ac.in/~arnobdeb/',
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
    // Yggdrasil timeline: from the roots (school) up to the crown (now). `realm` groups the entries
    // into bands on the tree; education and milestones only (the projects have their own pages).
    timeline: [
      { realm: 'roots', when: '2017', title: 'Secondary School (Class X)', where: 'Darjeeling Public School, Fulbari · CBSE', rune: 'ᛇ', stat: '9.0' },
      { realm: 'roots', when: '2019', title: 'Higher Secondary (Class XII), PCM + CS', where: 'BSF Sr. Sec. Residential School, Kadamtala · CBSE', rune: 'ᛜ', stat: '85.8%' },
      { realm: 'midgard', when: '2020', title: 'B.Tech, Computer Science & Engineering', where: 'Haldia Institute of Technology, Haldia', rune: 'ᛒ' },
      { realm: 'midgard', when: '2024', title: 'Graduated with CPI 9.42', where: 'Haldia Institute of Technology', rune: 'ᛟ' },
      { realm: 'midgard', when: '2025', title: 'GATE CS: All India Rank 103', where: 'Also qualified for the BARC OCES/DGFS-2025 selection interview', rune: 'ᛋ', stat: 'AIR 103' },
      { realm: 'midgard', when: '2025', title: 'First publication', where: 'Employability prediction with ML · RAICCIT 2025, JIS University (co-author)', rune: 'ᚨ' },
      { realm: 'asgard', when: 'Aug 2025', title: 'M.Tech CSE begins at IIT Bombay', where: 'Teaching Assistant for CS101', rune: 'ᛏ' },
      { realm: 'asgard', when: 'Aug 2026', title: 'Teaching CS683 Advanced Computer Architecture', where: 'and mentoring 5 new students as an ISCP Student Companion', rune: 'ᛗ', stat: 'now' },
      { realm: 'asgard', when: '2027', title: 'M.Tech (expected)', where: 'IIT Bombay', rune: 'ᛃ' },
    ],
  },

  forge: {
    realm: 'The Forge',
    label: 'Work',
    intro: 'Three sagas, each told in motion. Step through a portal to watch how the work actually works.',
    portals: [
      {
        file: 'restorekv.html',
        stage: 'kv',
        auto: [0, 2, 4, 5, 6, 7],
        rune: 'ᚲ',
        status: 'Currently forging · M.Tech thesis',
        title: 'Eviction without Forgetting',
        hook: 'An LLM on a laptop throws away 90% of its memory. Eight learned runes help it remember what mattered — built into Intel’s OpenVINO GenAI.',
        stats: [
          { v: '80.7 → 89.7', l: 'RULER-4K at 25% budget' },
          { v: '−90%', l: 'KV cache per sequence' },
          { v: '+31%', l: 'throughput at batch 8' },
        ],
        tags: ['OpenVINO GenAI', 'C++', 'LoRA', 'Intel AI PC'],
        featured: true,
      },
      {
        file: 'gpu.html',
        stage: 'dram',
        auto: [2, 3],
        rune: 'ᚦ',
        status: 'R&D project + seminar · Jan – Apr 2026',
        title: 'Hammering the GPU’s memory',
        hook: 'Flip a bit you never touched. A cycle-accurate GPU + GDDR6 simulator to study RowHammer and its defences — and why warps that stall together leave a GPU idle.',
        stats: [
          { v: '~40%', l: 'hammering throttled by L2 (sim)' },
          { v: '2.3% → 0', l: 'lost transactions' },
        ],
        tags: ['GPGPU-Sim', 'DRAMSim3', 'GDDR6'],
      },
      {
        file: 'http-server.html',
        stage: 'flow',
        auto: [1, 2],
        rune: 'ᛉ',
        status: 'CS744 · Aug – Nov 2025',
        title: 'A server under siege',
        hook: 'A multi-tier HTTP server in C with a cache in front of MySQL — then a load generator to find exactly where it breaks.',
        stats: [
          { v: '4,050', l: 'req/s peak' },
          { v: 'CPU', l: 'the bottleneck' },
        ],
        tags: ['C', 'CivetWeb', 'MySQL'],
      },
    ],
    github: {
      href: 'https://github.com/ArnobDeb',
      label: 'More on GitHub',
      text: 'More of what I’ve built lives on GitHub, and the resumes list the rest.',
    },
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
      text: 'My main game. Drones out, eyes on the objective. Want to squad up?',
      id: { label: 'Ubisoft ID', value: 'GamerBoy_21041' },
    },
    anime: {
      title: 'Anime',
      text: 'Long-time anime watcher. Autoplay usually wins.',
      favorites: ['Kimetsu no Yaiba'] as string[],
      favLabel: 'Current favourite',
    },
    comics: {
      title: 'Marvel & DC',
      text: 'Love both universes — and a big Green Lantern fan. Want to argue about the multiverse? Hit me up.',
    },
    starwars: {
      title: 'Star Wars',
      text: 'A long-time fan of the saga. Up for a round of Battlefront?',
      id: { label: 'Epic Games ID', value: 'LordVader_19' },
    },
    pool: { title: 'Pool', text: 'Take a shot: drag back from the white ball and let go.' },
    pc: { title: 'Building PCs', text: 'Hover to slot the parts in.' },
    cards: { title: 'Card games', text: 'Pick a card.' },
    field: { title: 'Badminton & football', text: 'Courts and pitches when the cluster is busy.' },
    travel: { title: 'Travelling', text: 'Always plotting the next route.' },
    quote: {
      text: 'Doth mother know you weareth her drapes?',
    },
    terminal: [
      { cmd: 'whoami', out: ['arnob — systems by day, Siege by night'] },
      { cmd: 'cat favorites.txt', out: ['game: Rainbow Six Siege', 'anime: Kimetsu no Yaiba', 'hero: Green Lantern', 'saga: Star Wars'] },
      { cmd: './queue --siege', out: ['looking for squad...  ubisoft: GamerBoy_21041'] },
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
