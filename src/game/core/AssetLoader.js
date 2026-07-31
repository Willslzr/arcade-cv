/**
 * AssetLoader — carga de imágenes con promesas.
 *
 * Corrige un fallo real de la versión anterior: el motor asignaba
 * `atlas.onload` DESPUÉS de fijar `src`. Si la imagen ya estaba en
 * caché, el navegador podía disparar `load` antes de registrar el
 * handler y el bucle no arrancaba nunca. Con una promesa que
 * comprueba `complete` primero, ese caso desaparece.
 */

export class AssetLoader {
  constructor() {
    /** @type {Map<string, HTMLImageElement>} */
    this.images = new Map()
  }

  /**
   * @param {string} key
   * @param {string} src
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(key, src) {
    if (this.images.has(key)) return Promise.resolve(this.images.get(key))

    return new Promise((resolve, reject) => {
      const img = new Image()

      const done = () => {
        this.images.set(key, img)
        resolve(img)
      }

      img.decoding = 'async'
      img.src = src

      // Caso caché: la imagen ya está lista antes de escuchar nada.
      if (img.complete && img.naturalWidth > 0) {
        done()
        return
      }

      img.addEventListener('load', done, { once: true })
      img.addEventListener(
        'error',
        () => reject(new Error(`No se pudo cargar el asset "${key}" (${src})`)),
        { once: true }
      )
    })
  }

  get(key) {
    return this.images.get(key) ?? null
  }
}
