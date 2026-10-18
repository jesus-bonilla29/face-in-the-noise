# Fotos de los rostros

Pon aquí las fotos que quieras convertir en rostros de partículas, y añade una línea por cada una en `src/features/face/faces.ts`.

Ahora mismo `faces.ts` espera estos archivos:

- `brad-pitt.jpg`
- `leonardo-dicaprio.jpg`
- `angelina-jolie.jpg`
- `emma-watson.jpg`
- `emma-stone.jpg`

Los que no estén se omiten. Si no hay ninguno, la aplicación usa un rostro dibujado.

## Qué fotos funcionan mejor

- **De frente**, con la cara mirando a cámara. De perfil o muy ladeada, el relieve se ve raro.
- **Cara centrada**, ocupando entre el 50 % y el 70 % del alto de la foto.
- **Formato vertical 4:5** (por ejemplo 800 × 1000 px). Si no lo es, se recorta el centro. Si la cara queda a un lado o pequeña, usa `options` en `faces.ts`:
  `{ focusX: 0.35, focusY: 0.4, zoom: 1.6 }` (`focusX` y `focusY` de 0 a 1, `zoom` de 1 en adelante).
- **Buena luz y buen contraste**: sombras definidas en los ojos, las cejas y la boca. Las fotos planas, muy oscuras o muy quemadas pierden detalle.
- **Fondo liso** (aunque no es imprescindible: el fondo se apaga solo).
- Con 800 × 1000 px basta; más resolución no mejora el resultado.

## Derechos de las fotos

Una foto de una persona famosa tiene derechos de autor (del fotógrafo o la agencia) y la imagen de la persona tiene su propia protección. Para probar en tu ordenador no hay problema. Si vas a publicar la web, usa fotos propias, con licencia o libres (por ejemplo, retratos con licencia Creative Commons o de dominio público en Wikimedia Commons, respetando la atribución que pidan).

Estos archivos se publican tal cual con la web, y este README también.
