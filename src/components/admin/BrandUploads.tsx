'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
export default function BrandUploads({
  onUploaded,
}: {
  onUploaded: (field: 'logo_url' | 'membership_qr_url', url: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  async function upload(file: File | undefined, field: 'logo_url' | 'membership_qr_url') {
    if (!file) return;
    if (
      !['image/png', 'image/jpeg', 'image/webp', 'image/avif'].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setMessage('Usa PNG, JPG, WebP o AVIF de hasta 8 MB.');
      return;
    }
    setBusy(true);
    try {
      const db = createClient();
      const path = `branding/${field}-${crypto.randomUUID()}.${file.type.split('/')[1]}`;
      const { error } = await db.storage
        .from('product-images')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      onUploaded(field, db.storage.from('product-images').getPublicUrl(path).data.publicUrl);
      setMessage('Imagen cargada. Pulsa Guardar perfil para publicarla.');
    } catch {
      setMessage('No se pudo subir la imagen. Comprueba el acceso del dueño.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <h2 className="font-bold">Subir logo y QR de cobro</h2>
      <p className="text-sm text-slate-500">
        El logo debe ser el archivo original de Polaris. Para Yape, usa el QR de cobro generado por
        tu aplicación, sin modificar su contenido.
      </p>
      {(
        [
          ['logo_url', 'Logo Polaris'],
          ['membership_qr_url', 'QR de cobro de Yape'],
        ] as const
      ).map(([field, label]) => (
        <label key={field} className="block text-sm font-semibold">
          {label}
          <input
            disabled={busy}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(e) => void upload(e.target.files?.[0], field)}
            className="mt-2 block w-full"
          />
        </label>
      ))}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
