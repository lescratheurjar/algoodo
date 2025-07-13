// Import Matter.js
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint,
        Constraint, Events, Body, Vector } = Matter;

// ---- Initialisation moteur & rendu ----
const engine = Engine.create();
engine.world.gravity.y = 1;

const canvas = document.getElementById('world');
const render = Render.create({ canvas, engine, options:{ wireframes:false } });
Render.run(render);
Runner.run(Runner.create(), engine);

// Resize & fullscreen
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = w; canvas.height = h;
  render.options.width = w; render.options.height = h;
  Render.lookAt(render, { min:{x:0,y:0}, max:{x:w,y:h} });
}
window.addEventListener('resize', resize);
resize();

document.getElementById('fullscreen').onclick = () => {
  document.fullscreenElement
    ? document.exitFullscreen()
    : document.documentElement.requestFullscreen();
};

// ---- Sol statique par défaut (invisible) ----
const ground = Bodies.rectangle(0,0,0,0,{ isStatic:true, render:{ visible:false }});
Composite.add(engine.world, ground);

// ---- Souris / tactile ----
const mouse = Mouse.create(render.canvas);
const mc = MouseConstraint.create(engine, {
  mouse, constraint:{ stiffness:0.2, render:{ visible:false } }
});
Composite.add(engine.world, mc);

// ---- Gestion outils UI ----
let tool = 'select';
const toolButtons = document.querySelectorAll('#toolbar-bottom .tool');
toolButtons.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    tool = btn.id;
    toolButtons.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Panneau propriétés
const sidePanel = document.getElementById('side-panel');
document.getElementById('toggle-panel').onclick = ()=> sidePanel.classList.toggle('open');
document.getElementById('close-panel').onclick  = ()=> sidePanel.classList.remove('open');

// Accès aux propriétés
function getProps() {
  return {
    mass: parseFloat(document.getElementById('mass').value),
    friction: parseFloat(document.getElementById('friction').value),
    restitution: parseFloat(document.getElementById('restitution').value)
  };
}

// ---- Variables auxiliaires ----
let linkA = null, motorBody = null, paintPoints = [];

// ---- Dessin & interactions ----
render.canvas.addEventListener('pointerdown', e => {
  const pos = { x:e.clientX, y:e.clientY };
  const props = getProps();
  if (tool==='paint') {
    paintPoints = [pos];
    return;
  }
  if (tool==='circle') {
    const c = Bodies.circle(pos.x,pos.y,30, props);
    Composite.add(engine.world, c);
  }
  if (tool==='rect') {
    const r = Bodies.rectangle(pos.x,pos.y,80,50, props);
    Composite.add(engine.world, r);
  }
  if (tool==='fluid') {
    for(let i=0;i<10;i++){
      const px=pos.x+(Math.random()-0.5)*60;
      const py=pos.y+(Math.random()-0.5)*60;
      const p = Bodies.circle(px,py,5, { density:0.001, friction:0.05, restitution:0.3 });
      Composite.add(engine.world, p);
    }
  }
});

render.canvas.addEventListener('pointermove', e => {
  if (tool==='paint' && paintPoints.length) {
    paintPoints.push({ x:e.clientX, y:e.clientY });
  }
});

render.canvas.addEventListener('pointerup', () => {
  if (tool==='paint' && paintPoints.length>1) {
    const verts = paintPoints.map(p=>Vector.create(p.x,p.y));
    const wall = Bodies.fromVertices(0,0,verts, { isStatic:true, render:{ fillStyle:'#444' }}, true);
    Composite.add(engine.world, wall);
  }
  paintPoints = [];
});

// Lien & moteur
Events.on(mc, 'startdrag', ev => {
  if (tool==='link') {
    if (!linkA) linkA = ev.body;
    else if (ev.body && ev.body!==linkA) {
      const len = Vector.magnitude(Vector.sub(linkA.position, ev.body.position));
      const ctr = Constraint.create({ bodyA:linkA, bodyB:ev.body, length:len, stiffness:0.7 });
      Composite.add(engine.world, ctr);
      linkA = null;
    }
  }
  if (tool==='motor') {
    motorBody = ev.body;
    if (motorBody) motorBody.frictionAir = 0.02;
  }
});
Events.on(engine, 'beforeUpdate', ()=> {
  if (motorBody) Body.rotate(motorBody, 0.02);
});
