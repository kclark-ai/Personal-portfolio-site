import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Phase durations (seconds) — total cycle = 12s
const CYCLE        = 12;
const CHAOS_END    = 3;
const ORG_END      = 6;
const STRUCT_END   = 9;
const MAX_ROT      = 0.087; // ~5 degrees in radians

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function fillChaos(arr: Float32Array, count: number) {
  for (let i = 0; i < count; i++) {
    arr[i * 3]     = (Math.random() - 0.5) * 10;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
  }
}

export default function ParticleField() {
  const [reducedMotion,setReducedMotion]=useState(false);
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReducedMotion(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync)},[]);
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Mobile: fewer particles for perf
    const isMobile = window.innerWidth < 768;
    const count    = isMobile ? 800 : 2400;
    const RADIUS   = 3;

    // ── Renderer ─────────────────────────────────────────────
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    } catch {
      return; // No WebGL — hero text still shows
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene & camera ────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    // ── Particle buffers ──────────────────────────────────────
    const chaosPos   = new Float32Array(count * 3);
    const spherePos  = new Float32Array(count * 3);
    const currentPos = new Float32Array(count * 3);

    // Fibonacci golden-angle sphere — even surface distribution
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y     = 1 - (i / (count - 1)) * 2;
      const r     = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      spherePos[i * 3]     = r * Math.cos(theta) * RADIUS;
      spherePos[i * 3 + 1] = y * RADIUS;
      spherePos[i * 3 + 2] = r * Math.sin(theta) * RADIUS;
    }

    fillChaos(chaosPos, count);
    currentPos.set(chaosPos);

    // ── Geometry ──────────────────────────────────────────────
    const geometry = new THREE.BufferGeometry();
    const posAttr  = new THREE.BufferAttribute(currentPos, 3);
    geometry.setAttribute('position', posAttr);

    const material = new THREE.PointsMaterial({
      color:         0xF5F0E6,
      size:          isMobile ? 0.06 : 0.035,
      transparent:   true,
      opacity:       0.65,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let syncSurface = () => {};
    const ro = new ResizeObserver(() => {
      syncSurface();
      if(!mount.clientWidth||!mount.clientHeight)return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      if(reducedMotion)renderer.render(scene,camera);
    });
    ro.observe(mount);

    // ── Reduced motion: static sphere, single render ──────────
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || reducedMotion) {
      currentPos.set(spherePos);
      posAttr.needsUpdate = true;
      renderer.render(scene, camera);
      return () => {
        ro.disconnect(); geometry.dispose(); material.dispose(); renderer.dispose();
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      };
    }

    // ── Mouse parallax ─────────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    let rotX = 0,   rotY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX =  (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ── Animation loop ─────────────────────────────────────────
    let rafId: number | undefined;
    let heroVisible = true;
    let startTs   = performance.now();
    let prevCycleT = 0;

    const syncAnimation = () => {
      if (!document.hidden && heroVisible && mount.clientWidth > 0 && mount.clientHeight > 0) {
        if(rafId===undefined)rafId=requestAnimationFrame(tick);
      } else if(rafId!==undefined){cancelAnimationFrame(rafId);rafId=undefined;}
    };
    syncSurface = syncAnimation;
    const heroObserver=new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;syncAnimation()});
    heroObserver.observe(document.getElementById('hero')||mount);
    const onVisibility = syncAnimation;
    document.addEventListener('visibilitychange', onVisibility);

    function tick(ts: number) {
      rafId = undefined;
      if (document.hidden || !heroVisible) return;
      // Skip rendering when hero has scrolled fully off-screen


      const elapsed = (ts - startTs) / 1000;
      const finished = elapsed >= 3.5;
      const cycleT = finished ? ORG_END : elapsed * 2;

      // New cycle: regenerate chaos so dissolution never returns to same cloud
      if (prevCycleT > CYCLE - 0.1 && cycleT < 0.5) {
        fillChaos(chaosPos, count);
      }
      prevCycleT = cycleT;

      if (cycleT < CHAOS_END) {
        // ── CHAOS (0–3 s) — static random cloud
        currentPos.set(chaosPos);

      } else if (cycleT < ORG_END) {
        // ── ORGANIZING (3–6 s) — lerp chaos → sphere
        const t = easeInOutCubic((cycleT - CHAOS_END) / (ORG_END - CHAOS_END));
        for (let i = 0; i < count; i++) {
          const j = i * 3;
          currentPos[j]     = chaosPos[j]     + (spherePos[j]     - chaosPos[j])     * t;
          currentPos[j + 1] = chaosPos[j + 1] + (spherePos[j + 1] - chaosPos[j + 1]) * t;
          currentPos[j + 2] = chaosPos[j + 2] + (spherePos[j + 2] - chaosPos[j + 2]) * t;
        }

      } else if (cycleT < STRUCT_END) {
        // ── STRUCTURE (6–9 s) — sphere with single gentle breath
        const breathe = Math.sin(((cycleT - ORG_END) / (STRUCT_END - ORG_END)) * Math.PI) * 0.05;
        const scale   = 1 + breathe;
        for (let i = 0; i < count; i++) {
          const j = i * 3;
          currentPos[j]     = spherePos[j]     * scale;
          currentPos[j + 1] = spherePos[j + 1] * scale;
          currentPos[j + 2] = spherePos[j + 2] * scale;
        }

      } else {
        // ── DISSOLVING (9–12 s) — lerp sphere → chaos
        const t = 1 - easeInOutCubic((cycleT - STRUCT_END) / (CYCLE - STRUCT_END));
        for (let i = 0; i < count; i++) {
          const j = i * 3;
          currentPos[j]     = chaosPos[j]     + (spherePos[j]     - chaosPos[j])     * t;
          currentPos[j + 1] = chaosPos[j + 1] + (spherePos[j + 1] - chaosPos[j + 1]) * t;
          currentPos[j + 2] = chaosPos[j + 2] + (spherePos[j + 2] - chaosPos[j + 2]) * t;
        }
      }

      posAttr.needsUpdate = true;

      // Smooth mouse parallax (5° max rotation)
      rotY += (mouseX * MAX_ROT - rotY) * 0.04;
      rotX += (mouseY * MAX_ROT - rotX) * 0.04;
      points.rotation.y = rotY;
      points.rotation.x = rotX;

      renderer.render(scene, camera);
      if (!finished) rafId = requestAnimationFrame(tick);
    }

    syncAnimation();

    return () => {
      if(rafId!==undefined)cancelAnimationFrame(rafId);
      heroObserver.disconnect();
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('visibilitychange', onVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [reducedMotion]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" aria-hidden="true" />
    </div>
  );
}
