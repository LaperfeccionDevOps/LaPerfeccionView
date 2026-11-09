// Validaciones compartidas para registrar una opción nueva de un catálogo de
// Synergy (línea de negocio, servicio asociado) desde Crear.

export const FORMATO_CODIGO_CATALOGO = /^[A-Z0-9]{2,20}$/;

// Minúsculas y sin tildes, para comparar "Jardinería" = "jardineria".
const normalizar = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/**
 * Errores de un código y nombre nuevos frente al catálogo (`{ codigo, nombre }`).
 * `formato`: { patron, ejemplo } con el formato habitual del código; si no lo
 * cumple solo se avisa (`aviso`), porque Synergy tiene excepciones.
 */
export const validarNuevoCatalogo = (catalogo, { codigo, nombre }, formato) => {
  const codigoLimpio = codigo.trim();
  const nombreLimpio = nombre.trim();
  const mismoCodigo = catalogo.find((o) => o.codigo === codigoLimpio);
  const mismoNombre = catalogo.find((o) => normalizar(o.nombre) === normalizar(nombreLimpio));

  const errores = {
    codigo:
      codigoLimpio && !FORMATO_CODIGO_CATALOGO.test(codigoLimpio)
        ? "Solo letras mayúsculas y números, entre 2 y 20 caracteres."
        : mismoCodigo
          ? `El código ${codigoLimpio} ya existe: ${mismoCodigo.nombre}.`
          : null,
    nombre:
      nombreLimpio && mismoNombre
        ? `${mismoNombre.nombre} ya existe con el código ${mismoNombre.codigo}.`
        : null,
  };

  const aviso =
    formato && FORMATO_CODIGO_CATALOGO.test(codigoLimpio) && !formato.patron.test(codigoLimpio)
      ? `El código no sigue el formato habitual (p. ej. ${formato.ejemplo}). Revisa que sea el de Synergy.`
      : null;

  const completo =
    FORMATO_CODIGO_CATALOGO.test(codigoLimpio) && nombreLimpio && !errores.codigo && !errores.nombre;

  return { errores, aviso, completo: Boolean(completo), codigo: codigoLimpio, nombre: nombreLimpio };
};
