// Imports
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint,
        Constraint, Events, Body, Vector } = Matter;

// Initialisation
const engine = Engine.create();
engine.world.gravity.y = 1;

const canvas = document.getElementById('world');
const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: { wireframes: false }
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Fonction pour redimensionner correctement
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  render.options.width = w;
  render.options.height = h;
  Render.lookAt(render, { min: { x: 0, y: 0 }, max: { x: w, y: h } });
}
window.addEventListener('resize', resize);
resize();  // appel initial

// Sol
const ground = Bodies.rectangle(window.innerWidth/2, window.innerHeight+25,
                                window.innerWidth, 50, { isStatic: true });
Composite.add(engine.world, ground);

// Souris / tactile
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: { stiffness: 0.2, render: { visible: false } }
});
Composite.add(engine.world, mouseConstraint);

// Outils
let tool = 'select';
['select','circle','rect','link','motor','fluid'].forEach(id => {
  document.getElementById(id).onclick = () => tool = id;
});

// Fullscreen
document.getElementById('fullscreen').onclick = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

// Variables aides
let linkBody = null, motorBody = null;

// Création d’objets
render.canvas.addEventListener('pointerdown', e => {
  const pos = { x: e.clientX, y: e.clientY };
  if (tool === 'circle') {
    Composite.add(engine.world,
      Bodies.circle(pos.x, pos.y, 30, { mass: 1, friction: 0.1, restitution: 0.8 }));
  }
  if (tool === 'rect') {
    Composite.add(engine.world,
      Bodies.rectangle(pos.x, pos.y, 80, 50, { mass: 1, friction: 0.1, restitution: 0.8 }));
  }
  if (tool === 'fluid') {
    for (let i = 0; i < 10; i++) {
      const px = pos.x + (Math.random()-0.5)*60;
      const py = pos.y + (Math.random()-0.5)*60;
      Composite.add(engine.world,
        Bodies.circle(px, py, 5, { density: 0.001, friction: 0.05, restitution: 0.3 }));
    }
  }
});

// Contrainte (link) et moteur
Events.on(mouseConstraint, 'startdrag', ev => {
  if (tool === 'link') {
    if (!linkBody) linkBody = ev.body;
    else {
      if (linkBody !== ev.body) {
        const len = Vector.magnitude(Vector.sub(linkBody.position, ev.body.position));
        Composite.add(engine.world,
          Constraint.create({ bodyA: linkBody, bodyB: ev.body, length: len, stiffness: 0.7 }));
      }
      linkBody = null;
    }
  }
  if (tool === 'motor') {
    motorBody = ev.body;
    if (motorBody) motorBody.frictionAir = 0.02;
  }
});
Events.on(engine, 'beforeUpdate', () => {
  if (motorBody) Body.rotate(motorBody, 0.02);
});
