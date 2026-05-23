/* ──────────────────────────────────────────────────────────
   3D Hero element — wireframe hexapod node graph
   Vanilla canvas (no Three.js dependency) for fast load.
   Renders an isometric-ish 3D wireframe that rotates on Y
   and tilts on scroll. Lit with a soft top-left light.
   ────────────────────────────────────────────────────────── */

(function () {
  const container = document.getElementById('hero-3d-canvas');
  if (!container) return;

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const r = container.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // ── 3D node graph: hexagonal hexapod
  // Body is a hexagonal prism. Six legs (3-segment each) radiate out.
  // Position units in arbitrary 3D space, projected to 2D.

  const BODY_R = 0.55;
  const BODY_H = 0.18;

  const bodyTop = [];
  const bodyBot = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 / 6) * i + Math.PI / 6;
    bodyTop.push([Math.cos(a) * BODY_R, BODY_H / 2, Math.sin(a) * BODY_R]);
    bodyBot.push([Math.cos(a) * BODY_R, -BODY_H / 2, Math.sin(a) * BODY_R]);
  }

  // Legs: hip → knee → foot
  const legs = bodyBot.map((hip, i) => {
    const a = (Math.PI * 2 / 6) * i + Math.PI / 6;
    const dirX = Math.cos(a), dirZ = Math.sin(a);
    const knee = [hip[0] + dirX * 0.30, hip[1] - 0.08, hip[2] + dirZ * 0.30];
    const foot = [hip[0] + dirX * 0.65, hip[1] - 0.45, hip[2] + dirZ * 0.65];
    return { hip, knee, foot, phase: i / 6 };
  });

  // Inner core (IMU) node
  const core = [0, 0, 0];

  // Floating context nodes (connected by faint lines to the core)
  const contextNodes = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 / 8) * i;
    const r = 1.1;
    contextNodes.push([
      Math.cos(a) * r * 0.95,
      Math.sin(i * 1.7) * 0.5,
      Math.sin(a) * r * 0.95
    ]);
  }

  // ── Project 3D to 2D
  function project(p, rx, ry, scale, cx, cy) {
    // Rotate around Y
    const cy_ = Math.cos(ry), sy_ = Math.sin(ry);
    let x = p[0] * cy_ - p[2] * sy_;
    let z = p[0] * sy_ + p[2] * cy_;
    let y = p[1];
    // Rotate around X
    const cx_ = Math.cos(rx), sx_ = Math.sin(rx);
    const y2 = y * cx_ - z * sx_;
    const z2 = y * sx_ + z * cx_;
    y = y2; z = z2;
    // Perspective
    const persp = 2.5 / (2.5 + z);
    return {
      x: cx + x * scale * persp,
      y: cy - y * scale * persp,
      z: z,
      s: persp
    };
  }

  // ── Render
  let time = 0;
  let scrollTilt = 0;

  function frame() {
    time += 0.005;
    const ry = time;                       // continuous Y rotation
    const rx = -0.35 + scrollTilt * 0.6;   // base tilt + scroll tilt

    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const scale = Math.min(W, H) * 0.32;

    // Subtle backdrop
    const grad = ctx.createRadialGradient(cx * 0.7, cy * 0.5, 10, cx, cy, scale * 2.5);
    grad.addColorStop(0, 'rgba(26, 86, 219, 0.05)');
    grad.addColorStop(1, 'rgba(26, 86, 219, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Project everything
    const tp = bodyTop.map(p => project(p, rx, ry, scale, cx, cy));
    const bp = bodyBot.map(p => project(p, rx, ry, scale, cx, cy));
    const legProj = legs.map(L => ({
      hip:  project(L.hip,  rx, ry, scale, cx, cy),
      knee: project(L.knee, rx, ry, scale, cx, cy),
      foot: project(L.foot, rx, ry, scale, cx, cy),
      phase: L.phase
    }));
    const corep = project(core, rx, ry, scale, cx, cy);
    const ctxp = contextNodes.map(p => project(p, rx, ry, scale, cx, cy));

    // Context node ambient lines
    ctx.strokeStyle = 'rgba(26, 86, 219, 0.10)';
    ctx.lineWidth = 0.6;
    ctxp.forEach(n => {
      ctx.beginPath();
      ctx.moveTo(corep.x, corep.y);
      ctx.lineTo(n.x, n.y);
      ctx.stroke();
    });
    // Context node circles
    ctxp.forEach((n, i) => {
      const flicker = 0.4 + 0.3 * Math.sin(time * 2 + i);
      ctx.beginPath();
      ctx.fillStyle = `rgba(26, 86, 219, ${0.15 * flicker})`;
      ctx.arc(n.x, n.y, 2 * n.s, 0, Math.PI * 2);
      ctx.fill();
    });

    // Body prism — vertical edges
    ctx.strokeStyle = 'rgba(26, 86, 219, 0.55)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(tp[i].x, tp[i].y);
      ctx.lineTo(bp[i].x, bp[i].y);
      ctx.stroke();
    }
    // Top hex
    ctx.beginPath();
    tp.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.stroke();
    // Bottom hex (slightly dimmer)
    ctx.strokeStyle = 'rgba(17, 24, 39, 0.45)';
    ctx.beginPath();
    bp.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.stroke();

    // Diagonals (top→bottom alternating) for engineering feel
    ctx.strokeStyle = 'rgba(26, 86, 219, 0.15)';
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      ctx.beginPath();
      ctx.moveTo(tp[i].x, tp[i].y);
      ctx.lineTo(bp[j].x, bp[j].y);
      ctx.stroke();
    }

    // Legs with gait phase animation (subtle)
    ctx.lineWidth = 1.1;
    legProj.forEach((L, i) => {
      const gait = Math.sin(time * 1.5 + L.phase * Math.PI * 2) * 0.5 + 0.5;
      const liftY = (1 - gait) * 8;
      const footX = L.foot.x;
      const footY = L.foot.y - liftY;

      ctx.strokeStyle = 'rgba(26, 86, 219, 0.6)';
      ctx.beginPath();
      ctx.moveTo(L.hip.x, L.hip.y);
      ctx.lineTo(L.knee.x, L.knee.y);
      ctx.lineTo(footX, footY);
      ctx.stroke();

      // joints
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(26, 86, 219, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(L.knee.x, L.knee.y, 3.2 * L.knee.s, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = 'rgba(26, 86, 219, 0.9)';
      ctx.beginPath(); ctx.arc(footX, footY, 2.6 * L.foot.s, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 1.1;
    });

    // Hip joints (white with blue ring)
    tp.forEach(p => {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(26, 86, 219, 0.9)';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.6 * p.s, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    });

    // Core node (red, like the IMU heart)
    ctx.fillStyle = '#E53E3E';
    ctx.beginPath(); ctx.arc(corep.x, corep.y, 4.5 * corep.s, 0, Math.PI * 2);
    ctx.fill();
    // Core pulse ring
    const pulseR = 8 + Math.sin(time * 3) * 3;
    ctx.strokeStyle = `rgba(229, 62, 62, ${0.25 + Math.sin(time * 3) * 0.15})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(corep.x, corep.y, pulseR, 0, Math.PI * 2);
    ctx.stroke();

    // Annotations
    ctx.fillStyle = 'rgba(75, 85, 99, 0.65)';
    ctx.font = '9px "DM Mono", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText('IMU', corep.x + 10, corep.y + 1);
    ctx.fillText('NODE GRAPH · v2', 16, H - 18);
    ctx.textAlign = 'right';
    ctx.fillText('FIG.02 · 18 DOF', W - 16, H - 18);
    ctx.textAlign = 'left';

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ── Scroll tilt
  function onScroll() {
    const r = container.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 when container fully in view; +1 when scrolled past
    const progress = Math.max(0, Math.min(1, (vh - r.bottom + vh) / (vh * 2)));
    scrollTilt = progress * 0.4;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
