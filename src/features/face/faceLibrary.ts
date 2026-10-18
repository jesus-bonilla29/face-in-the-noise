import { createDrawnFaceTargets, createPhotoTargets } from "./faceTargets";
import { FACES } from "./faces";

export type FaceSet = {
  id: string;
  name: string;
  targets: Float32Array;
};

// Carga las fotos de faces.ts y las convierte en posiciones para `count` partículas.
// Las que no se puedan cargar se omiten. Si no se carga ninguna, devuelve el
// rostro dibujado: la aplicación siempre tiene algo que revelar.
export async function loadFaceSets(count: number): Promise<FaceSet[]> {
  const results = await Promise.allSettled(
    FACES.map(async (face): Promise<FaceSet> => ({
      id: face.id,
      name: face.name,
      targets: await createPhotoTargets(face.src, count, face.options),
    }))
  );

  const loaded: FaceSet[] = [];
  const missing: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") loaded.push(result.value);
    else missing.push(FACES[i].id);
  });

  if (loaded.length === 0) {
    console.info("[faces] No hay fotos en public/faces/: se usa el rostro dibujado.");
    return [{ id: "drawn", name: "Drawn face", targets: createDrawnFaceTargets(count) }];
  }

  console.info(
    `[faces] ${loaded.length} rostro(s) cargado(s)` +
      (missing.length ? `; sin foto: ${missing.join(", ")}` : "")
  );
  return loaded;
}
