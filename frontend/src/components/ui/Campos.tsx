"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

const claseBase =
  "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400";

interface CampoProps {
  etiqueta?: string;
  htmlFor?: string;
  requerido?: boolean;
  error?: string;
  ayuda?: string;
  children: ReactNode;
  className?: string;
}

export function Campo({
  etiqueta,
  htmlFor,
  requerido,
  error,
  ayuda,
  children,
  className = "",
}: CampoProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {etiqueta && (
        <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
          {etiqueta}
          {requerido && <span className="ml-1 text-red-500 dark:text-red-400">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : ayuda ? (
        <p className="text-xs text-slate-400">{ayuda}</p>
      ) : null}
    </div>
  );
}

export function Entrada({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${claseBase} ${className}`} />;
}

const formatearNumero = (valor: number): string => {
  if (!Number.isFinite(valor)) return "0";
  return String(Math.round(valor * 10000) / 10000);
};

/**
 * Campo numérico con comportamiento predecible:
 * - al enfocar selecciona el contenido, para reemplazar el 0;
 * - permite vaciar el campo mientras se escribe;
 * - las flechas y los botones suman o restan 1, nunca decimales;
 * - sí admite decimales escritos a mano (por ejemplo 25.35 o 2.5).
 */
export function EntradaNumero({
  valor,
  onCambio,
  minimo = 0,
  maximo,
  paso = 1,
  className = "",
  ...props
}: Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "step" | "min" | "max"
> & {
  valor: number;
  onCambio: (valor: number) => void;
  minimo?: number;
  maximo?: number;
  paso?: number;
}) {
  const [texto, setTexto] = useState(() => formatearNumero(valor));
  const enfocado = useRef(false);

  useEffect(() => {
    if (!enfocado.current) setTexto(formatearNumero(valor));
  }, [valor]);

  const limitar = (numero: number): number => {
    let resultado = Number.isFinite(numero) ? numero : minimo;
    resultado = Math.max(minimo, resultado);
    if (maximo !== undefined) resultado = Math.min(maximo, resultado);
    return resultado;
  };

  const ajustar = (direccion: 1 | -1) => {
    const actual = Number(texto.replace(",", "."));
    const base = Number.isFinite(actual) ? actual : 0;
    const nuevo = limitar(base + direccion * paso);
    setTexto(formatearNumero(nuevo));
    onCambio(nuevo);
  };

  const cambiarTexto = (nuevo: string) => {
    let limpio = nuevo.replace(/,/g, ".").replace(/[^\d.]/g, "");
    const partes = limpio.split(".");
    if (partes.length > 2) {
      limpio = `${partes[0]}.${partes.slice(1).join("")}`;
    }
    // Evita que al escribir sobre el cero quede "05" o "01".
    limpio = limpio.replace(/^0+(?=\d)/, "");

    setTexto(limpio);

    if (limpio === "" || limpio === ".") {
      onCambio(0);
      return;
    }

    const numero = Number(limpio);
    if (Number.isFinite(numero)) onCambio(numero);
  };

  const alSalir = () => {
    enfocado.current = false;
    const numero = texto === "" || texto === "." ? 0 : Number(texto);
    const limitado = limitar(Number.isFinite(numero) ? numero : 0);
    setTexto(formatearNumero(limitado));
    onCambio(limitado);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        {...props}
        type="text"
        inputMode="decimal"
        value={texto}
        onFocus={(evento) => {
          enfocado.current = true;
          evento.currentTarget.select();
        }}
        onBlur={alSalir}
        onChange={(evento) => cambiarTexto(evento.target.value)}
        onKeyDown={(evento) => {
          if (evento.key === "ArrowUp") {
            evento.preventDefault();
            ajustar(1);
          }

          if (evento.key === "ArrowDown") {
            evento.preventDefault();
            ajustar(-1);
          }
        }}
        className={`${claseBase} pr-8 text-right`}
      />

      <div className="absolute inset-y-0 right-1 flex flex-col justify-center">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Aumentar valor"
          title="Aumentar 1"
          disabled={props.disabled}
          onMouseDown={(evento) => evento.preventDefault()}
          onClick={() => ajustar(1)}
          className="flex h-4 w-5 items-center justify-center rounded text-slate-400 transition hover:text-emerald-600 disabled:opacity-40"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Disminuir valor"
          title="Disminuir 1"
          disabled={props.disabled}
          onMouseDown={(evento) => evento.preventDefault()}
          onClick={() => ajustar(-1)}
          className="flex h-4 w-5 items-center justify-center rounded text-slate-400 transition hover:text-emerald-600 disabled:opacity-40"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function Seleccion({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${claseBase} ${className}`}>
      {children}
    </select>
  );
}

export function AreaTexto({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${claseBase} min-h-20 resize-y ${className}`} />;
}
