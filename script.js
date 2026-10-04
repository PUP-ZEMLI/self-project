const SITE_MOTION_RATE = 1.5;
const motionTime = milliseconds => milliseconds / SITE_MOTION_RATE;

function accelerateCssMotion(event) {
  if (event.target.closest?.('#contacts')) return;
  event.target.getAnimations().forEach(animation => { animation.playbackRate = SITE_MOTION_RATE; });
}
document.addEventListener('transitionrun', accelerateCssMotion);
document.addEventListener('animationstart', accelerateCssMotion);

const descriptions = {
  step1: ['1. Анализ технического задания', 'После получения технического задания провожу глубокий анализ и уделяю особое внимание пожеланиям заказчика.'],
  step2: ['2. Выделение целевой аудитории и её болей', 'Изучаю потребности потенциальных клиентов, чтобы точно попасть в запросы аудитории.'],
  step3: ['3. Сравнение с конкурентами', 'Анализирую сайты конкурентов и определяю, как подчеркнуть уникальность вашего бизнеса.'],
  step4: ['4. Создание макета лендинга', 'Создаю первый макет сайта на основе собранной информации и продуманной воронки продаж.'],
  step5: ['5. Работа с дизайном', 'Разрабатываю целостный дизайн с учётом логики продаж и потребностей потенциальных клиентов.'],
  step6: ['6. Вёрстка и работа с кодом', 'Переношу дизайн в код, добавляю анимации и адаптирую сайт для разных устройств.'],
  step7: ['7. Публикация и передача готового проекта', 'Размещаю сайт, подключаю необходимые сервисы, проверяю результат и передаю готовый проект.']
};
document.querySelectorAll('.benefit').forEach(button => {
  button.dataset.glow = button.textContent.trim();
});

const stepsLayout = document.querySelector('.steps');
const processPanel = document.querySelector('#process-detail');
const stepButtons = [...stepsLayout.querySelectorAll('.step')];
let selectedStep = null;
let processTypingTimer;
stepButtons.forEach(button => {
  button.dataset.glow = button.textContent.trim();
  button.setAttribute('aria-controls', 'process-detail');
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => {
    const [title, text] = descriptions[button.dataset.detail];
    toggleProcessStep(button, title, text);
  });
});
function animateStepLayout(change) {
  stepButtons.forEach(button => button.getAnimations().forEach(animation => animation.cancel()));
  const before = stepButtons.map(button => button.getBoundingClientRect());
  change();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  stepButtons.forEach((button, index) => {
    const after = button.getBoundingClientRect();
    button.animate([
      {transform:`translate(${before[index].left - after.left}px, ${before[index].top - after.top}px)`},
      {transform:'translate(0, 0)'}
    ], {duration:motionTime(650), easing:'cubic-bezier(.22,1,.36,1)'});
  });
}
function closeProcessStep(restoreFocus = false) {
  clearTimeout(processTypingTimer);
  const previous = selectedStep;
  animateStepLayout(() => {
    selectedStep = null;
    processPanel.hidden = true;
    stepsLayout.classList.remove('is-expanded');
    stepButtons.forEach(button => button.setAttribute('aria-expanded', 'false'));
  });
  if (restoreFocus) previous?.focus({preventScroll:true});
}
function toggleProcessStep(button, title, text) {
  if (selectedStep === button) { closeProcessStep(); return; }
  animateStepLayout(() => {
    selectedStep = button;
    processPanel.querySelector('h3').textContent = title;
    clearTimeout(processTypingTimer);
    const paragraph = processPanel.querySelector('p');
    paragraph.replaceChildren();
    paragraph.setAttribute('aria-label', text);
    const reserve = document.createElement('span');
    reserve.className = 'benefit-text-reserve';
    reserve.textContent = text;
    reserve.setAttribute('aria-hidden','true');
    const typed = document.createElement('span');
    typed.className = 'benefit-text-typed';
    typed.setAttribute('aria-hidden','true');
    paragraph.append(reserve,typed);
    let position = 0;
    function print() {
      typed.textContent = text.slice(0,position += 2);
      if (position < text.length) processTypingTimer = setTimeout(print,motionTime(24));
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) typed.textContent = text;
    else processTypingTimer = setTimeout(print,motionTime(300));
    processPanel.hidden = false;
    stepsLayout.classList.add('is-expanded');
    stepButtons.forEach(item => item.setAttribute('aria-expanded', String(item === button)));
  });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    processPanel.getAnimations().forEach(animation => animation.cancel());
    processPanel.animate([{opacity:0,transform:'translateY(-50%) scale(.97)'},{opacity:1,transform:'translateY(-50%) scale(1)'}], {duration:motionTime(800),delay:motionTime(150),fill:'backwards'});
  }
}
processPanel.querySelector('.process-close').addEventListener('click', () => closeProcessStep(true));
stepsLayout.addEventListener('keydown', event => {
  if (event.key === 'Escape' && selectedStep) { event.preventDefault(); closeProcessStep(true); }
});
const portfolio = {
  legenda: { title: 'ЖК «Легенда»', category: '01 / Недвижимость / Дизайн лендинга', image: 'cases/Frame%2032.webp' },
  oldschool: { title: 'Old School', category: '02 / Барбершоп / Мобильный дизайн', image: 'cases/Frame%2036.webp' },
  ags: { title: 'АГС Проект', category: '03 / Проектирование / Корпоративный сайт', image: 'cases/ags-preview.webp' }
};
const caseDialog = document.querySelector('#case-dialog');
let caseCloseTimer;
let caseRevealFrame;
function closeCaseSmoothly() {
  if (!caseDialog.open) return;
  cancelAnimationFrame(caseRevealFrame);
  clearTimeout(caseCloseTimer);
  caseDialog.classList.remove('is-visible');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) caseDialog.close();
  else caseCloseTimer = setTimeout(() => caseDialog.close(), motionTime(750));
}
document.querySelectorAll('[data-case]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.case;
    const project = portfolio[key];
    caseDialog.querySelector('h3').textContent = project.title;
    caseDialog.querySelector('.case-dialog-category').textContent = project.category;
    const preview = caseDialog.querySelector('.case-full-image');
    preview.src = project.image;
    preview.alt = `Полный макет — ${project.title}`;
    caseDialog.dataset.project = key;
    caseDialog.querySelector('.case-live-link').hidden = key !== 'ags';
    clearTimeout(caseCloseTimer);
    cancelAnimationFrame(caseRevealFrame);
    caseDialog.classList.remove('is-visible');
    caseDialog.showModal();
    caseRevealFrame = requestAnimationFrame(() => {
      caseRevealFrame = requestAnimationFrame(() => {
        if (caseDialog.open) caseDialog.classList.add('is-visible');
      });
    });
    caseDialog.querySelector('.case-dialog-scroll').scrollTop = 0;
    document.body.classList.add('case-is-open');
    const card = button.closest('.portfolio-card');
    if (card) {
      card.classList.add('hover-reset');
      card.querySelector('.case-cover')?.dispatchEvent(new Event('reset-preview'));
      card.dispatchEvent(new Event('reset-preview'));
    }
  });
});
caseDialog.querySelector('.case-close').addEventListener('click', closeCaseSmoothly);
caseDialog.addEventListener('cancel', event => { event.preventDefault(); closeCaseSmoothly(); });
caseDialog.addEventListener('close', () => {
  clearTimeout(caseCloseTimer);
  cancelAnimationFrame(caseRevealFrame);
  caseDialog.classList.remove('is-visible');
  document.body.classList.remove('case-is-open');
});
caseDialog.addEventListener('click', event => {
  if (event.target !== caseDialog) return;
  const rect = caseDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeCaseSmoothly();
});

// The three grid cells remain in place; the project previews travel clockwise.
(() => {
  const gallery = document.querySelector('.hero-gallery');
  if (!gallery) return;
  const previews = [...gallery.querySelectorAll('.hero-preview')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const slots = previews.map((_, index) => {
    const slot = document.createElement('span');
    slot.className = 'hero-orbit-slot' + (index === 0 ? ' hero-large' : '');
    slot.setAttribute('aria-hidden', 'true');
    gallery.append(slot);
    return slot;
  });
  let turn = 0;
  let visible = false;
  let hovered = false;
  let focused = false;
  let elapsed = 0;
  let previousTime = performance.now();
  gallery.classList.add('is-orbiting');

  function placePreviews() {
    const positions = slots.map(slot => ({left:slot.offsetLeft, top:slot.offsetTop, width:slot.offsetWidth, height:slot.offsetHeight}));
    previews.forEach((preview, index) => {
      const destination = (index + turn) % slots.length;
      const position = positions[destination];
      preview.dataset.slot = String(destination);
      Object.assign(preview.style, {
        left: position.left + 'px', top: position.top + 'px',
        width: position.width + 'px', height: position.height + 'px',
        zIndex: destination === 0 ? '2' : '1'
      });
    });
  }
  function updateMotion() {
    const active = visible && !document.hidden && !hovered && !focused && !reducedMotion.matches;
    gallery.dataset.motion = active ? 'active' : 'paused';
    return active;
  }
  placePreviews();
  new ResizeObserver(placePreviews).observe(gallery);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateMotion();
  }, {threshold:0}).observe(gallery);
  gallery.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; updateMotion(); } });
  gallery.addEventListener('pointerleave', () => { hovered = false; updateMotion(); });
  gallery.addEventListener('focusin', () => { focused = true; updateMotion(); });
  gallery.addEventListener('focusout', event => { focused = gallery.contains(event.relatedTarget); updateMotion(); });
  document.addEventListener('visibilitychange', updateMotion);
  reducedMotion.addEventListener('change', updateMotion);
  updateMotion();
  setInterval(() => {
    const now = performance.now();
    const delta = Math.min(now - previousTime, 1000);
    previousTime = now;
    if (!updateMotion()) return;
    elapsed += delta;
    if (elapsed >= 14000) {
      elapsed = 0;
      turn = (turn + 1) % slots.length;
      placePreviews();
    }
  }, 250);
})();

// The standalone back-to-top control appears after the second section is passed.
(() => {
  const control = document.querySelector('.back-to-top');
  const secondSection = document.querySelector('#why');
  if (!control || !secondSection) return;
  const update = () => {
    const threshold = secondSection.offsetTop + secondSection.offsetHeight;
    control.classList.toggle('is-visible', window.scrollY >= threshold);
  };
  update();
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update, {passive:true});
})();

// Project a flat website screenshot onto the four corners of the laptop screen.
(() => {
  const composition = document.querySelector('.hero-composition');
  const screen = composition?.querySelector('.laptop-screen');
  if (!screen) return;
  const corners = [[438,202],[1165,334],[1051,874],[328,675]];
  function fitScreen() {
    const scale = composition.clientWidth / 1254;
    const [p0,p1,p2,p3] = corners.map(([x,y]) => [x*scale,y*scale]);
    const dx1=p1[0]-p2[0], dx2=p3[0]-p2[0];
    const dy1=p1[1]-p2[1], dy2=p3[1]-p2[1];
    const sx=p0[0]-p1[0]+p2[0]-p3[0];
    const sy=p0[1]-p1[1]+p2[1]-p3[1];
    const det=dx1*dy2-dx2*dy1;
    if (!det) return;
    const g=(sx*dy2-dx2*sy)/det, h=(dx1*sy-sx*dy1)/det;
    const a=p1[0]-p0[0]+g*p1[0], b=p1[1]-p0[1]+g*p1[1];
    const c=p3[0]-p0[0]+h*p3[0], d=p3[1]-p0[1]+h*p3[1];
    screen.style.transform=`matrix3d(${a/1000},${b/1000},0,${g/1000},${c/625},${d/625},0,${h/625},0,0,1,0,${p0[0]},${p0[1]},0,1)`;
  }
  new ResizeObserver(fitScreen).observe(composition);
  fitScreen();
})();

// Draw each dotted connection from the actual label bounds after layout.
(() => {
  const group = document.querySelector('.benefits');
  const svg = group?.querySelector('.benefit-paths');
  if (!svg) return;
  const buttons = [...group.querySelectorAll('.benefit')];
  function drawConnections() {
    const box = group.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const core = group.querySelector('.benefit-core').getBoundingClientRect();
    const cx = core.left-box.left+core.width/2, cy = core.top-box.top+core.height/2;
    const paths = buttons.map(button => {
      const r = button.getBoundingClientRect();
      const bx=r.left-box.left+r.width/2, by=r.top-box.top+r.height/2;
      const dx=cx-bx,dy=cy-by;
      const t=1/Math.max(Math.abs(dx)/(r.width/2+10),Math.abs(dy)/(r.height/2+10));
      const x=bx+dx*Math.min(t,.8),y=by+dy*Math.min(t,.8);
      const length=Math.hypot(dx,dy)||1;
      const ex=cx-dx/length*core.width*.3,ey=cy-dy/length*core.height*.3;
      return `M${x},${y} Q${(x+ex)/2},${(y+ey)/2-25} ${ex},${ey}`;
    });
    svg.querySelector('path').setAttribute('d', paths.join(' '));
  }
  const observer = new ResizeObserver(drawConnections);
  observer.observe(group);
  buttons.forEach(button => observer.observe(button));
  document.fonts.ready.then(drawConnections);
})();

// Short eased wheel-like movements, separated by reading pauses.
document.querySelectorAll('.case-cover, .hero-composition').forEach(card => {
  const viewport = card.querySelector('.preview-window, .laptop-screen');
  const image = viewport?.querySelector('.laptop-page, img');
  if (!image) return;
  let distance = 0, position = 0, timer, tick = 0;
  let hovered = false, focused = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pauses = [680, 950, 760, 1250, 820].map(motionTime);
  function step() {
    if ((!hovered && !focused) || reduced.matches || document.hidden) return;
    position = Math.min(distance, position + viewport.clientHeight * [0.28,0.36,0.25,0.32][tick % 4]);
    image.style.transform = `translateY(${-position}px)`;
    if (position < distance) timer = setTimeout(step, pauses[tick++ % pauses.length]);
  }
  function sync() {
    clearTimeout(timer);
    if ((hovered || focused) && !reduced.matches) timer = setTimeout(step, motionTime(450));
    else { position = 0; tick = 0; image.style.transform = 'translateY(0)'; }
  }
  card.addEventListener('pointerenter', () => { hovered = true; sync(); });
  card.addEventListener('pointerleave', () => { hovered = false; sync(); });
  card.addEventListener('focus', () => { focused = true; sync(); });
  card.addEventListener('blur', () => { focused = false; sync(); });
  card.addEventListener('reset-preview', () => { hovered = false; focused = false; sync(); });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  const updateScroll = () => {
    distance = Math.max(0, image.offsetHeight - viewport.clientHeight);
    position = Math.min(position, distance);
    image.style.transform = `translateY(${-position}px)`;
  };
  const observer = new ResizeObserver(updateScroll);
  observer.observe(viewport);
  observer.observe(image);
  image.addEventListener('load', updateScroll);
  updateScroll();
});

// Type a green copy over the original case title without moving its layout.
document.querySelectorAll('.portfolio-card > h3').forEach(title => {
  const card = title.closest('.portfolio-card');
  const letters = Array.from(title.textContent.trim());
  const overlay = document.createElement('span');
  overlay.className = 'case-title-typed';
  overlay.setAttribute('aria-hidden', 'true');
  title.append(overlay);
  let timer, index = 0, hovered = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function update() {
    clearTimeout(timer);
    index = 0;
    overlay.textContent = '';
    if (card.classList.contains('hover-reset') || (!hovered && !card.contains(document.activeElement))) return;
    if (reduced.matches) { overlay.textContent = letters.join(''); return; }
    function type() {
      overlay.textContent = letters.slice(0, ++index).join('');
      if (index < letters.length) timer = setTimeout(type, motionTime(85));
    }
    type();
  }
  card.addEventListener('pointerenter', () => {
    if (caseDialog.open || card.classList.contains('hover-reset')) return;
    hovered = true;
    update();
  });
  card.addEventListener('reset-preview', () => { hovered = false; update(); });
  card.addEventListener('pointerleave', () => {
    hovered = false;
    if (!caseDialog.open) card.classList.remove('hover-reset');
    update();
  });
  card.addEventListener('focusin', update);
  card.addEventListener('focusout', event => { if (!card.contains(event.relatedTarget)) { clearTimeout(timer); if (!hovered) overlay.textContent = ''; } });
  reduced.addEventListener('change', update);
});

// Join the perimeter in the sketch's order: 1–2–4–6–7–5–3–1.
(() => {
  const svg = stepsLayout.querySelector('.process-paths');
  if (!svg) return;
  const order = [0,1,3,5,6,4,2];
  function drawProcessContour() {
    const box = stepsLayout.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const nodes = order.map(index => {
      const r = stepButtons[index].getBoundingClientRect();
      return {x:r.left-box.left+r.width/2,y:r.top-box.top+r.height/2,w:r.width,h:r.height};
    });
    const paths = nodes.map((a,i) => {
      const b = nodes[(i+1)%nodes.length];
      const dx=b.x-a.x, dy=b.y-a.y;
      const edge = p => 1 / Math.max(Math.abs(dx)/(p.w/2+12),Math.abs(dy)/(p.h/2+12));
      const ta=Math.min(.45,edge(a)), tb=Math.min(.45,edge(b));
      const x1=a.x+dx*ta,y1=a.y+dy*ta,x2=b.x-dx*tb,y2=b.y-dy*tb;
      const mx=(x1+x2)/2,my=(y1+y2)/2;
      return Math.abs(dx)>Math.abs(dy)
        ? `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`
        : `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
    });
    svg.querySelector('path').setAttribute('d',paths.join(' '));
  }
  let frame;
  function trackMovement() {
    cancelAnimationFrame(frame);
    const end = performance.now()+motionTime(1000);
    function tick() {
      drawProcessContour();
      if (performance.now()<end) frame=requestAnimationFrame(tick);
    }
    tick();
  }
  new MutationObserver(trackMovement).observe(stepsLayout,{attributes:true,attributeFilter:['class']});
  const observer=new ResizeObserver(drawProcessContour);
  observer.observe(stepsLayout);
  stepButtons.forEach(button=>observer.observe(button));
  document.fonts.ready.then(drawProcessContour);
})();

// Keep the background wordmark aligned to the lowest benefit at every width.
(() => {
  const section = document.querySelector('.why-reference');
  if (!section) return;
  const labels = [...section.querySelectorAll('.benefit')];
  const alignWordmark = () => {
    const origin = section.getBoundingClientRect().top;
    const bottom = Math.max(...labels.map(label => label.getBoundingClientRect().bottom));
    section.style.setProperty('--why-wordmark-bottom', `${bottom-origin}px`);
  };
  const observer = new ResizeObserver(alignWordmark);
  observer.observe(section);
  observer.observe(section.querySelector('.benefits'));
  labels.forEach(label => observer.observe(label));
  document.fonts.ready.then(alignWordmark);
})();

(() => {
  const crystal = document.querySelector('.benefit-core');
  if (!crystal) return;
  const caption = document.createElement('span');
  caption.className = 'crystal-invitation';
  caption.setAttribute('aria-hidden','true');
  crystal.append(caption);
  const text = 'узнать о процессе работы';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let timer, hovered = false;
  function updateCaption() {
    clearTimeout(timer);
    caption.textContent = '';
    if (!hovered && document.activeElement !== crystal) return;
    if (reduced.matches) { caption.textContent = text; return; }
    let index = 0;
    function type() {
      caption.textContent = text.slice(0, ++index);
      if (index < text.length) timer = setTimeout(type,motionTime(45));
    }
    timer = setTimeout(type,motionTime(150));
  }
  crystal.addEventListener('pointerenter',()=>{hovered=true;updateCaption();});
  crystal.addEventListener('pointerleave',()=>{hovered=false;updateCaption();});
  crystal.addEventListener('focus',updateCaption);
  crystal.addEventListener('blur',updateCaption);
  reduced.addEventListener('change',updateCaption);
})();

// Old School: two consecutive slices with one shared, native scroll timeline.
(() => {
  const scroller = caseDialog.querySelector('.case-dialog-scroll');
  const track = document.createElement('div');
  track.className = 'oldschool-track';
  track.hidden = true;
  const stage = document.createElement('div');
  stage.className = 'oldschool-stage';
  const columns = Array.from({length:2}, (_,index) => {
    const column = document.createElement('div');
    column.className = 'oldschool-column';
    column.setAttribute('aria-label', `Часть ${index+1} из 2`);
    const slice = document.createElement('div');
    slice.className = 'oldschool-slice';
    const image = document.createElement('img');
    image.src = portfolio.oldschool.image;
    image.alt = `Old School — часть ${index+1}`;
    slice.append(image);
    column.append(slice);
    stage.append(column);
    return {column,slice,image};
  });
  track.append(stage);
  scroller.append(track);
  const split = .61;
  let segmentHeights = [0,0], travelByColumn = [0,0];
  function paint() {
    if (track.hidden) return;
    columns.forEach(({slice},i) => {
      const previousTravel = travelByColumn.slice(0,i).reduce((sum,value) => sum + value,0);
      const offset = Math.min(travelByColumn[i],Math.max(0,scroller.scrollTop-previousTravel));
      slice.style.transform = `translateY(${-offset}px)`;
    });
  }
  function layout() {
    if (track.hidden || !columns[0].image.naturalWidth) return;
    const fullHeight = columns[0].column.clientWidth * columns[0].image.naturalHeight / columns[0].image.naturalWidth;
    segmentHeights = [fullHeight*split,fullHeight*(1-split)];
    const height = Math.min(scroller.clientHeight,Math.max(140,Math.min(...segmentHeights)*.78));
    travelByColumn = segmentHeights.map(segmentHeight => Math.max(0,segmentHeight-height));
    stage.style.height = `${height}px`;
    columns.forEach(({slice,image},i) => {
      const start = i ? segmentHeights[0] : 0;
      slice.style.height = `${segmentHeights[i]}px`;
      image.style.transform = `translateY(${-start}px)`;
    });
    track.style.height = `${scroller.clientHeight+travelByColumn.reduce((sum,value)=>sum+value,0)}px`;
    paint();
  }
  const sync = () => {
    track.hidden = caseDialog.dataset.project !== 'oldschool';
    if (!track.hidden) layout();
  };
  new MutationObserver(sync).observe(caseDialog,{attributes:true,attributeFilter:['data-project','open']});
  new ResizeObserver(layout).observe(scroller);
  columns.forEach(({image}) => image.addEventListener('load',layout));
  scroller.addEventListener('scroll',paint,{passive:true});
})();

// Logo glow follows the pointer only while it is over the logo image.
(() => {
  const brand = document.querySelector('.header-inner .brand');
  const logo = brand?.querySelector('img');
  if (logo) {
    logo.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      const rect = brand.getBoundingClientRect();
      brand.style.setProperty('--logo-x', `${event.clientX-rect.left}px`);
      brand.style.setProperty('--logo-y', `${event.clientY-rect.top}px`);
      brand.classList.add('logo-hover');
    });
    logo.addEventListener('pointerleave', () => brand.classList.remove('logo-hover'));
    logo.addEventListener('pointercancel', () => brand.classList.remove('logo-hover'));
  }
  document.querySelectorAll('.header-inner nav a').forEach(link => {
    link.dataset.glow = link.textContent.trim();
  });
})();

// Collapse the main navigation at the exact width where one-line links stop fitting.
(() => {
  const header = document.querySelector('.site-header');
  const inner = header?.querySelector('.header-inner');
  const nav = header?.querySelector('#main-navigation');
  const brand = header?.querySelector('.brand');
  const toggle = header?.querySelector('.menu-toggle');
  if (!header || !inner || !nav || !brand || !toggle) return;

  const close = () => {
    header.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded','false');
  };
  const sync = () => {
    header.classList.remove('is-collapsed');
    const links = [...nav.querySelectorAll('a')];
    const linksWidth = links.reduce((total,link) => total + Math.ceil(link.getBoundingClientRect().width),0);
    const navGap = parseFloat(getComputedStyle(nav).columnGap) || 0;
    const innerGap = parseFloat(getComputedStyle(inner).columnGap) || 0;
    const requiredWidth = brand.offsetWidth + linksWidth + Math.max(0,links.length-1)*navGap + innerGap;
    const collapsed = requiredWidth > inner.clientWidth;
    header.classList.toggle('is-collapsed',collapsed);
    if (!collapsed) close();
  };

  toggle.addEventListener('click',() => {
    const open = !header.classList.contains('menu-open');
    header.classList.toggle('menu-open',open);
    toggle.setAttribute('aria-expanded',String(open));
  });
  nav.addEventListener('click',event => { if (event.target.closest('a')) close(); });
  document.addEventListener('pointerdown',event => { if (!header.contains(event.target)) close(); });
  document.addEventListener('keydown',event => { if (event.key === 'Escape') close(); });
  new ResizeObserver(sync).observe(inner);
  if (document.fonts?.ready) document.fonts.ready.then(sync);
  sync();
})();
