// Matter.js
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint,
        Constraint, Events, Body, Vector } = Matter;

// Création du moteur & du rendu
const engine = Engine.create();
engine.world.gravity.y = 1;

const canvas = document.getElementById('world');
const render = Render.create({
  canvas,
  engine,
  options: { wireframes: false }
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Resize + fullscreen
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

// Sol initial (invisible, juste pour empêcher fuite)
const ground = Bodies.rectangle(0,0,0,0,{ isStatic:true, render:{ visible:false }});
Composite.add(engine.world, ground);

// Souris/tactile
const mouse = Mouse.create(render.canvas);
const mc = MouseConstraint.create(engine, {
  mouse, constraint:{ stiffness:0.2, render:{ visible:false } }
});
Composite.add(engine.world, mc);

// Outils
let tool = 'select';
const buttons = document.querySelectorAll('#toolbar .tool');
buttons.forEach(btn => {
  btn.onclick = () => {
    tool = btn.id;
    buttons.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  };
});

// Toggle toolbar
const tb = document.getElementById('toolbar');
document.getElementById('toggle-tools').onclick = () => {
  tb.classList.toggle('collapsed');
};

// Variables auxiliaires
let linkA = null, motorBody = null, paintPoints = [];

// Dessin libre pour sol fixe
function commitPaint() {
  if (paintPoints.length > 1) {
    const vertices = paintPoints.map(p=>Vector.create(p.x,p.y));
    const wall = Bodies.fromVertices(0,0,vertices, {
      isStatic: true,
      render:{ fillStyle:'#888' }
    }, true);
    Composite.add(engine.world, wall);
  }
  paintPoints = [];
}

// Événements de dessin
render.canvas.addEventListener('pointerdown', e => {
  const p = { x:e.clientX, y:e.clientY };
  if (tool==='paint') {
    paintPoints = [p];
  } else if (tool==='circle') {
    Composite.add(engine.world, Bodies.circle(p.x,p.y,30,{ friction:0.1, restitution:0.8 }));
  } else if (tool==='rect') {
    Composite.add(engine.world, Bodies.rectangle(p.x,p.y,80,50,{ friction:0.1, restitution:0.8 }));
  } else if (tool==='fluid') {
    for(let i=0;i<10;i++){
      const px=p.x+(Math.random()-0.5)*60;
      const py=p.y+(Math.random()-0.5)*60;
      Composite.add(engine.world,Bodies.circle(px,py,5,{ density:0.001, friction:0.05, restitution:0.3 }));
    }
  }
});

render.canvas.addEventListener('pointermove', e => {
  if (tool==='paint' && paintPoints.length) {
    paintPoints.push({ x:e.clientX, y:e.clientY });
    // Optionnel : afficher en temps réel la ligne tracée
  }
});

render.canvas.addEventListener('pointerup', e => {
  if (tool==='paint' && paintPoints.length) {
    commitPaint();
  }
});

// Lien et moteur
Events.on(mc, 'startdrag', ev => {
  if (tool==='link') {
    if (!linkA) linkA = ev.body;
    else if (ev.body && ev.body!==linkA) {
      const len = Vector.magnitude(Vector.sub(linkA.position, ev.body.position));
      Composite.add(engine.world, Constraint.create({
        bodyA: linkA, bodyB: ev.body,
        length: len, stiffness: 0.7
      }));
      linkA = null;
    }
  }
  if (tool==='motor') {
    motorBody = ev.body;
    if (motorBody) motorBody.frictionAir = 0.02;
  }
});
Events.on(engine, 'beforeUpdate', () => {
  if (motorBody) Body.rotate(motorBody, 0.02);
});
