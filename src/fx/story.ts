// Scrollytelling: each .act has a sticky .stage and a column of .step articles.
// The step crossing the middle of the viewport becomes active and drives the stage.
import { reducedMotion } from './loop';

export interface StageApi {
  setStep(i: number): void;
}
export type StageFactory = (root: HTMLElement, controls: HTMLElement | null) => StageApi;

export function initStory(factories: Record<string, StageFactory>) {
  document.querySelectorAll<HTMLElement>('.act').forEach((act) => {
    const stageEl = act.querySelector<HTMLElement>('.stage');
    if (!stageEl) return;
    const make = factories[stageEl.dataset.stage ?? ''];
    if (!make) return;
    const api = make(stageEl, act.querySelector<HTMLElement>('.ctrl'));
    const steps = [...act.querySelectorAll<HTMLElement>('.step')];
    let current = -1;

    const activate = (i: number) => {
      if (i === current) return;
      current = i;
      steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
      stageEl.dataset.step = String(i);
      api.setStep(i);
    };

    // A thin band across the middle of the viewport decides which step is active.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) activate(steps.indexOf(e.target as HTMLElement));
      },
      { rootMargin: '-48% 0px -48% 0px' },
    );
    steps.forEach((s) => io.observe(s));
    activate(0);

    // Keyboard and screen-reader users can also focus a step to drive the stage.
    steps.forEach((s, i) => {
      s.tabIndex = 0;
      s.addEventListener('focus', () => activate(i));
    });

    if (reducedMotion()) stageEl.classList.add('is-still');
  });
}
