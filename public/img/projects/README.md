# Portadas de proyectos

Coloca aquí las capturas y referencia el fichero desde
`src/data/profile.js` en el campo `cover`:

```js
cover: '/img/projects/mi-proyecto.webp'
```

- **Ratio:** 16:10 (la ficha recorta con `object-fit: cover`)
- **Tamaño:** 1200×750 px
- **Formato:** `.webp` con calidad 80. Pesa la mitad que un JPG
  equivalente y lo soportan todos los navegadores actuales.
- **Peso objetivo:** por debajo de 150 kB por imagen.

Convertir desde PNG/JPG:

```bash
npx @squoosh/cli --webp '{"quality":80}' -d public/img/projects captura.png
```

Si `cover` es `null`, la galería dibuja un marcador pixel-art
derivado del id del proyecto. No hay huecos, así que puedes
publicar antes de tener las capturas listas.
