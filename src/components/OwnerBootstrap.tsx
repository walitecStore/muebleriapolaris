'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ownerRoleProtectionSQL } from '@/lib/owner-bootstrap';
export default function OwnerBootstrap({ userId }: { userId: string }) {
  const [message, setMessage] = useState('');
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(userId)) return null;
  const sql = `BEGIN;\n${ownerRoleProtectionSQL}\nUPDATE public.profiles\nSET role = 'admin'\nWHERE id = '${userId}'\nRETURNING id, email, role;\nCOMMIT;`;
  return (
    <details className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
      <summary className="cursor-pointer font-bold text-cyan-900">
        Soy el propietario: autorizar mi cuenta
      </summary>
      <div className="mt-4 space-y-4 text-sm">
        <p>
          Este paso se hace una sola vez por el propietario del proyecto de Supabase. No necesitas
          compartir tu contraseña ni claves privadas.
        </p>
        <ol className="list-inside list-decimal space-y-2">
          <li>
            En tu proyecto de Supabase, abre SQL Editor → New query y selecciona el rol postgres.
          </li>
          <li>
            Copia y ejecuta el comando que aparece abajo. Autoriza únicamente la cuenta con la que
            estás conectado ahora.
          </li>
          <li>
            Comprueba que el resultado muestre tu correo y el rol admin. Después pulsa «Volver a
            comprobar mi acceso».
          </li>
        </ol>
        <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-white">
          <code>{sql}</code>
        </pre>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              navigator.clipboard
                .writeText(sql)
                .then(() =>
                  setMessage('Comando copiado. Ejecútalo solo en el SQL Editor de tu proyecto.')
                )
                .catch(() => setMessage('Selecciona y copia el comando de arriba.'))
            }
            className="rounded-full bg-cyan-600 px-5 py-3 font-bold text-white"
          >
            Copiar autorización de mi cuenta
          </button>
          <Link
            href="/admin"
            prefetch={false}
            className="rounded-full border bg-white px-5 py-3 font-semibold"
          >
            Volver a comprobar mi acceso
          </Link>
        </div>
        {message && <p role="status">{message}</p>}
        <p className="text-xs text-slate-600">
          El comando no se ejecuta desde Polaris. Solo funciona con los permisos del propietario en
          Supabase. Si no administras ese proyecto, solicita autorización al dueño.
        </p>
      </div>
    </details>
  );
}
