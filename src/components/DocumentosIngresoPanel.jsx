import React, { useEffect, useMemo, useState } from "react";
import { listarDocumentosIngreso, obtenerDocumentoIngresoBase64 } from "../services/documentosIngresoService";

function base64ToBlob(base64, mimeType = "application/pdf") {
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

function guessMimeByLabel(label) {
  const l = (label || "").toLowerCase();
  if (l.includes("foto")) return "image/jpeg"; // por defecto
  return "application/pdf"; // la mayoría de docs
}

function safeFilename(label, fallbackExt = "pdf") {
  const name = (label || "documento")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  return `${name}.${fallbackExt}`;
}

export default function DocumentosIngresoPanel({ idRegistroPersonal }) {
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState("");

  const canFetch = useMemo(() => Number.isFinite(Number(idRegistroPersonal)) && Number(idRegistroPersonal) > 0, [idRegistroPersonal]);

  const cargar = async () => {
    if (!canFetch) return;
    setLoading(true);
    setError("");
    try {
      const data = await listarDocumentosIngreso(idRegistroPersonal);
      setDocs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Error cargando documentos");
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idRegistroPersonal]);

  const verDocumento = async (doc) => {
    try {
      const { IdTipoDocumentacion, label } = doc;
      const detail = await obtenerDocumentoIngresoBase64(idRegistroPersonal, IdTipoDocumentacion);
      const mime = guessMimeByLabel(label);
      const blob = base64ToBlob(detail.DocumentoBase64, mime);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      // Nota: no revoco de una porque si revocas rápido no abre; si quieres, lo revocas con setTimeout.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      alert(e?.message || "No se pudo abrir el documento");
    }
  };

  const descargarDocumento = async (doc) => {
    try {
      const { IdTipoDocumentacion, label } = doc;
      const detail = await obtenerDocumentoIngresoBase64(idRegistroPersonal, IdTipoDocumentacion);
      const mime = guessMimeByLabel(label);
      const blob = base64ToBlob(detail.DocumentoBase64, mime);
      const url = URL.createObjectURL(blob);

      const ext = mime.startsWith("image/") ? "jpg" : "pdf";
      const a = document.createElement("a");
      a.href = url;
      a.download = safeFilename(label, ext);
      a.click();

      setTimeout(() => URL.revokeObjectURL(url), 5_000);
    } catch (e) {
      alert(e?.message || "No se pudo descargar el documento");
    }
  };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Documentos de Ingreso</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Aspirante: <b>{idRegistroPersonal || "—"}</b>
          </div>
        </div>

        <button
          onClick={cargar}
          disabled={!canFetch || loading}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            background: loading ? "#f3f4f6" : "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Cargando..." : "Recargar"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 10, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", padding: 10, borderRadius: 10 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {docs.map((d) => (
          <div key={d.key || `${d.label}-${d.IdTipoDocumentacion}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: 10, borderRadius: 10, background: "#f9fafb", border: "1px solid #eef2f7" }}>
            <div style={{ display: "grid", gap: 2 }}>
              <div style={{ fontWeight: 600 }}>{d.label}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Tipo: <b>{d.IdTipoDocumentacion ?? "—"}</b>{" "}
                | Adjuntado:{" "}
                <b style={{ color: d.adjuntado ? "#166534" : "#b91c1c" }}>
                  {d.adjuntado ? "Sí" : "No"}
                </b>
                {d.IdDocumento ? <> | Doc: <b>{d.IdDocumento}</b></> : null}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => verDocumento(d)}
                disabled={!d.adjuntado || !d.IdTipoDocumentacion}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: (!d.adjuntado || !d.IdTipoDocumentacion) ? "#f3f4f6" : "white",
                  cursor: (!d.adjuntado || !d.IdTipoDocumentacion) ? "not-allowed" : "pointer",
                }}
              >
                Ver
              </button>

              <button
                onClick={() => descargarDocumento(d)}
                disabled={!d.adjuntado || !d.IdTipoDocumentacion}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: (!d.adjuntado || !d.IdTipoDocumentacion) ? "#f3f4f6" : "white",
                  cursor: (!d.adjuntado || !d.IdTipoDocumentacion) ? "not-allowed" : "pointer",
                }}
              >
                Descargar
              </button>
            </div>
          </div>
        ))}

        {!loading && canFetch && docs.length === 0 && (
          <div style={{ padding: 10, color: "#6b7280" }}>
            No hay datos para mostrar.
          </div>
        )}

        {!canFetch && (
          <div style={{ padding: 10, color: "#6b7280" }}>
            Falta el <b>IdRegistroPersonal</b> para consultar documentos.
          </div>
        )}
      </div>
    </div>
  );
}
