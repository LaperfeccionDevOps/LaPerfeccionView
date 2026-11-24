import React, { useEffect, useRef, useState } from "react";
import SignaturePad from "react-signature-canvas";
import { Eraser, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Recuadro para firmar con el dedo (celular o tableta) o con el ratón (PC).
 * Entrega la firma como data URL PNG en `onChange`, o null si está vacía.
 *
 * El lienzo toma el ancho de su contenedor. Solo se reajusta (y se pide firmar
 * de nuevo) cuando cambia ese ancho, por ejemplo al girar el celular. No se usa
 * el borrado automático de la librería porque en el celular se dispara con solo
 * desplazarse (la barra de direcciones cambia el alto de la ventana).
 */
const CampoFirma = ({ id, label, onChange, disabled = false }) => {
  const padRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [vacia, setVacia] = useState(true);

  onChangeRef.current = onChange;

  useEffect(() => {
    const pad = padRef.current;

    if (!pad || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const canvas = pad.getCanvas();
    let anchoActual = canvas.offsetWidth;

    const observador = new ResizeObserver(() => {
      if (!canvas.offsetWidth || canvas.offsetWidth === anchoActual) {
        return;
      }

      anchoActual = canvas.offsetWidth;

      const escala = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * escala;
      canvas.height = canvas.offsetHeight * escala;
      canvas.getContext("2d").scale(escala, escala);
      pad.clear();

      setVacia(true);
      onChangeRef.current(null);
    });

    observador.observe(canvas);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    const pad = padRef.current;

    if (!pad) {
      return;
    }

    if (disabled) {
      pad.off();
    } else {
      pad.on();
    }
  }, [disabled]);

  const alTerminarTrazo = () => {
    const pad = padRef.current;

    if (!pad || pad.isEmpty()) {
      return;
    }

    setVacia(false);
    onChangeRef.current(pad.getCanvas().toDataURL("image/png"));
  };

  const limpiar = () => {
    padRef.current?.clear();
    setVacia(true);
    onChangeRef.current(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>

        <Button
          type="button"
          variant="ghost"
          onClick={limpiar}
          disabled={disabled || vacia}
          className="h-8 gap-1 px-2 text-xs text-gray-500"
        >
          <Eraser className="h-3.5 w-3.5" />
          Limpiar
        </Button>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border-2 border-dashed bg-white",
          vacia ? "border-gray-300" : "border-emerald-400",
          disabled && "opacity-50"
        )}
      >
        <SignaturePad
          ref={padRef}
          penColor="#111827"
          clearOnResize={false}
          onEnd={alTerminarTrazo}
          canvasProps={{
            id,
            className: "block h-44 w-full cursor-crosshair",
            "aria-label": label,
          }}
        />

        {vacia && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-400">
            <PenLine className="h-5 w-5" />
            <p className="text-xs">
              Firma aquí con el dedo o con el ratón
            </p>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-8 left-6 right-6 border-b border-gray-200" />
      </div>
    </div>
  );
};

export default CampoFirma;
