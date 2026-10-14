"use client";

import { useRef, useState, type PointerEvent } from "react";
import { createPiaSignature } from "@/app/actions/pia";
import { Button, Field } from "@/components/ui";

export function SignaturePad({
  atendidoId,
  signerType,
  title,
  defaultName = "",
}: {
  atendidoId: string;
  signerType: "USUARIO" | "PROFISSIONAL";
  title: string;
  defaultName?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState("");
  const drawing = useRef(false);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (event.currentTarget.width / bounds.width),
      y: (event.clientY - bounds.top) * (event.currentTarget.height / bounds.height),
    };
  }

  function start(event: PointerEvent<HTMLCanvasElement>) {
    const context = canvas.current?.getContext("2d");
    if (!context || !canvas.current) return;
    drawing.current = true;
    const { x, y } = point(event);
    context.beginPath();
    context.moveTo(x, y);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function draw(event: PointerEvent<HTMLCanvasElement>) {
    const context = canvas.current?.getContext("2d");
    if (!context || !drawing.current || !canvas.current) return;
    const { x, y } = point(event);
    context.strokeStyle = "#e5e7eb";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineTo(x, y);
    context.stroke();
  }

  function finish() {
    if (!canvas.current || !drawing.current) return;
    drawing.current = false;
    setImage(canvas.current.toDataURL("image/png"));
  }

  function clear() {
    const context = canvas.current?.getContext("2d");
    if (!context || !canvas.current) return;
    context.clearRect(0, 0, canvas.current.width, canvas.current.height);
    setImage("");
  }

  return (
    <form action={createPiaSignature} className="space-y-3">
      <input type="hidden" name="atendidoId" value={atendidoId} />
      <input type="hidden" name="signerType" value={signerType} />
      <input type="hidden" name="imageDataUrl" value={image} />
      <h3 className="text-sm font-medium text-neutral-200">{title}</h3>
      <Field label="Quem assina" name="signerName" required defaultValue={defaultName} />
      <canvas
        aria-label={`Assinatura de ${title}`}
        className="h-28 w-full touch-none rounded-lg border border-dashed border-neutral-700 bg-neutral-950"
        height={112}
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={finish}
        onPointerCancel={finish}
        ref={canvas}
        width={640}
      />
      <p className="text-xs text-neutral-500">Assine na tela com o mouse ou o dedo.</p>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={clear}>
          Limpar
        </Button>
        <Button disabled={!image}>Salvar assinatura</Button>
      </div>
    </form>
  );
}
