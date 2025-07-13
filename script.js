// Setup du moteur Matter.js et du rendu
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Constraint, Events, Body, Vector } = Matter;
const engine = Engine.create();
engine.world.gravity.y = 1; // gravité

// Canvas et rendu
const canvas = document.getElementById('world');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false
  }
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Sol statique
const ground = Bodies.rectangle(window.innerWidth/2, window.innerHeight+25, window.innerWidth, 50, { isStatic: true });
Composite.add(engine.world, ground);

// Interaction souris/tactile
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: { stiffness: 0.2, render: { visible: false } }
});
Composite.add(engine.world, mouseConstraint);

// Outils de dessin
let tool = 'select';
document.getElementById('select').onclick = () => tool = 'select';
document.getElementById('circle').onclick = () => tool = 'circle';
document.getElementById('rect').onclick = () => tool = 'rect';
document.getElementById('link').onclick = () => tool = 'link';
document.getElementById('motor').onclick = () => tool = 'motor';
document.getElementById('fluid').onclick = () => tool = 'fluid';

// Variables pour certains outils
let linkBody = null;
let motorBody = null;

// Création d'objets au clic/touch
render.canvas.addEventListener('pointerdown', function(event) {
  const pos = { x: event.clientX, y: event.clientY };
  if (tool === 'circle') {
    const circle = Bodies.circle(pos.x, pos.y, 30, { mass: 1, friction: 0.1, restitution: 0.8 });
    Composite.add(engine.world, circle);
  }
  if (tool === 'rect') {
    const rect = Bodies.rectangle(pos.x, pos.y, 80, 50, { mass: 1, friction: 0.1, restitution: 0.8 });
    Composite.add(engine.world, rect);
  }
  if (tool === 'fluid') {
    // Génère un groupe de petites particules pour simuler un fluide
    for (let i = 0; i < 10; i++) {
      const px = pos.x + (Math.random() - 0.5) * 60;
      const py = pos.y + (Math.random() - 0.5) * 60;
      const particle = Bodies.circle(px, py, 5, { density: 0.001, friction: 0.05, restitution: 0.3 });
      Composite.add(engine.world, particle);
    }
  }
});

// Outil "Link" : relier deux corps par une contrainte lors du drag
Events.on(mouseConstraint, 'startdrag', function(event) {
  if (tool === 'link') {
    if (!linkBody) {
      linkBody = event.body;
    } else {
      const bodyA = linkBody;
      const bodyB = event.body;
      if (bodyA && bodyB && bodyA !== bodyB) {
        const length = Vector.magnitude(Vector.sub(bodyA.position, bodyB.position));
        const link = Constraint.create({ bodyA: bodyA, bodyB: bodyB, length: length, stiffness: 0.7 });
        Composite.add(engine.world, link);
      }
      linkBody = null;
    }
  }
});

// Outil "Motor" : appliquer un couple constant à un corps
Events.on(mouseConstraint, 'startdrag', function(event) {
  if (tool === 'motor') {
    motorBody = event.body;
    if (motorBody) motorBody.frictionAir = 0.02;
  }
});
Events.on(engine, 'beforeUpdate', function() {
  if (motorBody) {
    Body.rotate(motorBody, 0.02);
  }
});

// Adapter la vue au redimensionnement
window.addEventListener('resize', () => {
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;
  Render.lookAt(render, {
    min: { x: 0, y: 0 },
    max: { x: window.innerWidth, y: window.innerHeight }
  });
});
