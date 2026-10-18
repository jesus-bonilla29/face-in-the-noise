import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createDrawnFaceTargets } from "../../face/faceTargets";
import { loadFaceSets, type FaceSet } from "../../face/faceLibrary";
import { FaceRevealController } from "../../face/faceReveal";
import {
  CAMERA_Z,
  CLOUD_RADIUS,
  PALETTE_HEX,
  getParticleCount,
} from "../../../shared/presets";
import { ParticleEngine } from "../particleEngine";
import { strategies } from "../strategies";
import type { MotionMode, ParticleContext } from "../particleTypes";

const FAR_AWAY = 999; // posición del cursor cuando no está sobre la escena

const PALETTE = PALETTE_HEX.map((hex) => new THREE.Color(hex));

// Un color por partícula: mezcla dos colores de la paleta para crear degradados.
function createColors(count: number): Float32Array {
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const a = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const b = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    color.copy(a).lerp(b, Math.random());

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  return colors;
}

// Con miles de partículas, cada punto debe ser pequeño y tenue: la mezcla aditiva
// suma los brillos y, si no, el rostro se satura hasta quedar blanco.
const BASE_SIZE = 0.024;
const BASE_OPACITY = 0.6;

// El rostro cuenta como "visible" al pasar de 0,75 y deja de serlo por debajo de 0,35.
// Dos umbrales distintos evitan que el aviso parpadee en el límite.
const FACE_SHOW_ABOVE = 0.75;
const FACE_HIDE_BELOW = 0.35;

type Props = {
  mode: MotionMode;
  revealTrigger: number; // cada vez que sube, se fuerza la aparición del rostro
  getAudioLevel: () => number; // 0 a 1, lo entrega el AudioAnalyzer
  onFaceVisibleChange: (visible: boolean) => void; // solo se llama cuando el valor cambia
};

export function ParticleCloud({
  mode,
  revealTrigger,
  getAudioLevel,
  onFaceVisibleChange,
}: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const faceVisible = useRef(false);
  const onFaceVisibleRef = useRef(onFaceVisibleChange);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const gl = useThree((state) => state.gl);

  // Estado del cursor. Es una referencia, no estado de React: cambia
  // decenas de veces por segundo y no debe provocar renders.
  const pointer = useRef({ x: 0, y: 0, active: false, pressed: false });
  const context = useRef<ParticleContext>({
    time: 0,
    mouseX: FAR_AWAY,
    mouseY: FAR_AWAY,
    audioLevel: 0,
  });

  // Se crean una sola vez.
  const count = useMemo(() => getParticleCount(), []);
  // Empieza con el rostro dibujado; las fotos se cargan aparte y lo sustituyen.
  const engine = useMemo(
    () => new ParticleEngine(count, CLOUD_RADIUS, createDrawnFaceTargets(count)),
    [count]
  );

  // Rostros disponibles y cuál toca. Referencias, no estado: no afectan a la interfaz.
  const faceSets = useRef<FaceSet[]>([]);
  const nextFace = useRef(0);
  // Hasta que terminan de cargar las fotos no se revela nada: así el primer rostro
  // nunca es el dibujado por llegar antes que las fotos.
  const facesReady = useRef(false);
  const reveal = useMemo(() => new FaceRevealController(), []);
  const colors = useMemo(() => createColors(count), [count]);
  const mouseLocal = useMemo(() => new THREE.Vector3(), []);

  // Cuando cambia el modo, el motor cambia de estrategia.
  useEffect(() => {
    engine.setStrategy(strategies[mode]);
  }, [mode, engine]);

  // Carga las fotos una vez (y descarta el resultado si el componente se desmonta antes).
  useEffect(() => {
    let cancelled = false;
    loadFaceSets(count)
      .then((sets) => {
        if (cancelled) return;
        faceSets.current = sets;
        nextFace.current = Math.floor(Math.random() * sets.length); // empieza por uno al azar
        facesReady.current = true;
      })
      .catch((error) => {
        console.error("[faces] Error al cargar los rostros:", error);
        // Sin fotos: se sigue con el rostro dibujado que ya tiene el motor.
        if (!cancelled) facesReady.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [count]);

  // Guardamos la última versión del callback sin volver a montar nada.
  useEffect(() => {
    onFaceVisibleRef.current = onFaceVisibleChange;
  }, [onFaceVisibleChange]);

  // Botón "Reveal face".
  useEffect(() => {
    if (revealTrigger > 0) reveal.trigger();
  }, [revealTrigger, reveal]);

  // Eventos del cursor, en coordenadas normalizadas de -1 a 1.
  useEffect(() => {
    const el = gl.domElement;
    const p = pointer.current;

    const updatePosition = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      p.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      p.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      p.active = true;
    };
    const onMove = (e: PointerEvent) => updatePosition(e);
    const onDown = (e: PointerEvent) => {
      updatePosition(e);
      p.pressed = true;
    };
    const onUp = (e: PointerEvent) => {
      p.pressed = false;
      // En pantallas táctiles, al levantar el dedo ya no hay cursor.
      if (e.pointerType !== "mouse") p.active = false;
    };
    const onLeave = () => {
      p.active = false;
      p.pressed = false;
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [gl]);

  // Se ejecuta en cada fotograma: aquí vive todo el movimiento.
  useFrame((state, delta) => {
    const points = pointsRef.current;
    const geometry = geometryRef.current;
    if (!points || !geometry) return;

    // Limita el salto si la pestaña estuvo en segundo plano.
    const dt = Math.min(delta, 0.05);
    const ready = facesReady.current;
    const amount = ready ? reveal.update(dt) : 0;

    // Al empezar una aparición, toca el siguiente rostro de la lista. El motor hace la
    // transición suave, así que da igual cuánto quede del rostro anterior.
    if (ready && reveal.consumeStart() && faceSets.current.length > 0) {
      const sets = faceSets.current;
      engine.setTargets(sets[nextFace.current % sets.length].targets);
      nextFace.current++;
    }

    const p = pointer.current;
    const ctx = context.current;
    ctx.time = state.clock.elapsedTime;
    ctx.audioLevel = getAudioLevel();

    // Avisa a la interfaz solo cuando el rostro aparece o desaparece (no en cada fotograma).
    const nowVisible = faceVisible.current
      ? amount > FACE_HIDE_BELOW
      : amount > FACE_SHOW_ABOVE;
    if (nowVisible !== faceVisible.current) {
      faceVisible.current = nowVisible;
      onFaceVisibleRef.current(nowVisible);
    }

    // El sonido también cambia el aspecto: los golpes agrandan y encienden los puntos.
    // Si la cámara se aleja (pantalla estrecha), los puntos crecen para compensar.
    const material = materialRef.current;
    if (material) {
      const zoom = state.camera.position.z / CAMERA_Z;
      material.size = BASE_SIZE * zoom * (1 + ctx.audioLevel * 0.9);
      material.opacity = Math.min(1, BASE_OPACITY + ctx.audioLevel * 0.25);
    }

    if (p.active) {
      // Del cursor (-1..1) a un punto del espacio 3D, en el plano z = 0.
      const camera = state.camera as THREE.PerspectiveCamera;
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      const halfW = (halfH * state.size.width) / state.size.height;
      mouseLocal.set(p.x * halfW, p.y * halfH, 0);
      points.worldToLocal(mouseLocal); // al sistema de coordenadas de la nube
      ctx.mouseX = mouseLocal.x;
      ctx.mouseY = mouseLocal.y;
    } else {
      ctx.mouseX = FAR_AWAY;
      ctx.mouseY = FAR_AWAY;
    }

    // Giro suave que se calma mientras el rostro se forma, para que mire de frente.
    const calm = 1 - amount;
    points.rotation.y = Math.sin(ctx.time * 0.12) * 0.6 * calm;
    points.rotation.x = Math.sin(ctx.time * 0.15) * 0.2 * calm;

    engine.update(dt, ctx, amount, p.pressed);
    geometry.getAttribute("position").needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[engine.positions, 3]}
          usage={THREE.DynamicDrawUsage}
        />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={BASE_SIZE}
        sizeAttenuation
        vertexColors
        transparent
        opacity={BASE_OPACITY}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
