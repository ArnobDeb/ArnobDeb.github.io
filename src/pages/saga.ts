// Entry for the project saga pages.
import { $, initCommon } from '../common';
import { initCharts, initCountUp } from '../fx/chartHover';
import { initSky } from '../fx/starfield';
import { initStory } from '../fx/story';
import { defenceStage } from '../sagas/defence';
import { dramStage } from '../sagas/dram';
import { flowStage } from '../sagas/flow';
import { kvStage } from '../sagas/kv';
import { lruStage } from '../sagas/lru';
import { memoryStage } from '../sagas/memory';
import { patchStage } from '../sagas/patch';
import { raceStage } from '../sagas/race';
import { simStage } from '../sagas/sim';
import { trainStage } from '../sagas/train';
import { warpsStage } from '../sagas/warps';

initCommon();

const sky = $<HTMLCanvasElement>('.hero__sky');
if (sky) initSky(sky);

initStory({
  memory: memoryStage,
  kv: kvStage,
  train: trainStage,
  patch: patchStage,
  dram: dramStage,
  race: raceStage,
  defence: defenceStage,
  sim: simStage,
  warps: warpsStage,
  flow: flowStage,
  lru: lruStage,
});
initCharts();
initCountUp('.rstats__v');

// Chapter rail: highlight the act in view.
const links = new Map<string, HTMLAnchorElement>();
document.querySelectorAll<HTMLAnchorElement>('.rail a').forEach((a) => links.set(a.hash.slice(1), a));
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a) => a.removeAttribute('aria-current'));
      links.get(e.target.id)?.setAttribute('aria-current', 'true');
    }
  },
  { rootMargin: '-40% 0px -55% 0px' },
);
document.querySelectorAll('.act[id]').forEach((s) => io.observe(s));
