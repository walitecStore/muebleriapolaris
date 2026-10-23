'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import BrandUploads from '@/components/admin/BrandUploads';
import { emptyStore, publicWebUrl, type StoreProfile } from '@/lib/store-profile';
const groups: { title: string; fields: [keyof StoreProfile, string, string?][] }[] = [
  {
    title: 'Identidad de la tienda',
    fields: [
      ['name', 'Nombre de la tienda'],
      ['description', 'Descripción', 'textarea'],
      ['logo_url', 'URL del logo', 'url'],
      ['tax_id', 'RUC o identificación comercial'],
    ],
  },
  {
    title: 'Cobro de membresías de vendedores',
    fields: [
      ['membership_yape_phone', 'Número Yape'],
      ['membership_payee', 'Nombre del titular de Yape'],
      ['membership_qr_url', 'URL del QR real de Yape', 'url'],
    ],
  },
  {
    title: 'Contacto y ubicación',
    fields: [
      ['phone', 'Teléfono'],
      ['whatsapp', 'WhatsApp con código de país, por ejemplo 51…'],
      ['email', 'Correo de contacto', 'email'],
      ['address', 'Dirección pública'],
      ['city', 'Ciudad'],
      ['hours', 'Horarios', 'textarea'],
      ['site_url', 'Sitio web', 'url'],
      ['instagram_url', 'Instagram', 'url'],
      ['facebook_url', 'Facebook', 'url'],
    ],
  },
  {
    title: 'Origen de las entregas',
    fields: [
      ['origin_address', 'Dirección de salida'],
      ['origin_lat', 'Latitud de salida', 'number'],
      ['origin_lng', 'Longitud de salida', 'number'],
    ],
  },
  {
    title: 'Políticas publicadas en la tienda',
    fields: [
      ['privacy_text', 'Política de privacidad', 'textarea'],
      ['terms_text', 'Términos de compra', 'textarea'],
      ['shipping_text', 'Cobertura y condiciones de envío', 'textarea'],
      ['returns_text', 'Garantía, devoluciones y reembolsos', 'textarea'],
      ['complaints_url', 'Enlace al Libro de Reclamaciones', 'url'],
    ],
  },
];
export default function StoreConfiguration() {
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reload, setReload] = useState(0);
  const [available, setAvailable] = useState<string[]>(Object.keys(emptyStore));
  const [form, setForm] = useState<StoreProfile>(emptyStore),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState('');
  useEffect(() => {
    let live = true;
    setLoading(true);
    setLoaded(false);
    setError('');
    createClient()
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (!live) return;
        if (error || !data)
          setError('No se pudo cargar el perfil. Reintenta antes de modificar los datos.');
        else {
          setForm({ ...emptyStore, ...data });
          setAvailable(Object.keys(data));
          setLoaded(true);
        }
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [reload]);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!loaded || saving || uploading) return;
    setError('');
    setSuccess('');
    if (!form.name.trim() || form.name.length > 100) {
      setError('El nombre es obligatorio y admite hasta 100 caracteres.');
      return;
    }
    for (const key of [
      'logo_url',
      'membership_qr_url',
      'site_url',
      'instagram_url',
      'facebook_url',
      'complaints_url',
    ] as const)
      if (form[key] && !publicWebUrl(form[key])) {
        setError('Los enlaces deben comenzar con https:// o http://.');
        return;
      }
    if (form.whatsapp && !/^\+?[\d\s()-]{8,25}$/.test(form.whatsapp)) {
      setError('Revisa el número de WhatsApp y su código de país.');
      return;
    }
    if (
      !(
        Number(form.origin_lat) >= -18.5 &&
        Number(form.origin_lat) <= -3 &&
        Number(form.origin_lng) >= -82 &&
        Number(form.origin_lng) <= -68
      )
    ) {
      setError('Las coordenadas de salida deben estar en Perú.');
      return;
    }
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.keys(emptyStore)
          .filter((k) => available.includes(k))
          .map((k) => [
            k,
            k === 'origin_lat' || k === 'origin_lng'
              ? Number(form[k])
              : String(form[k as keyof StoreProfile]).trim(),
          ])
      );
      const { data, error } = await createClient()
        .from('store_settings')
        .update(payload)
        .eq('id', 1)
        .select('id')
        .single();
      if (error || !data) throw error;
      window.dispatchEvent(new Event('polaris:store-updated'));
      setSuccess('Perfil guardado. Los cambios ya están disponibles en la tienda.');
    } catch {
      setError('No se pudo guardar el perfil. Verifica la conexión y los permisos.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <h1 className="text-3xl font-black">Perfil de la tienda</h1>
      <p className="mt-2 text-sm text-slate-500">
        Actualiza los datos que ven tus clientes. No incluyas contraseñas ni claves de servicios.
      </p>
      {loading ? (
        <p className="mt-8" role="status">
          Cargando perfil…
        </p>
      ) : !loaded ? (
        <div className="mt-7 rounded-xl border border-rose-200 bg-rose-50 p-5">
          <p role="alert">{error}</p>
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            className="mt-4 rounded-xl border bg-white px-5 py-3 font-bold"
          >
            Reintentar carga del perfil
          </button>
        </div>
      ) : (
        <form onSubmit={save} className="mt-7 space-y-6">
          <BrandUploads
            disabled={saving}
            onBusyChange={setUploading}
            onUploaded={(field, url) => {
              setSuccess('');
              setForm((f) => ({ ...f, [field]: url }));
            }}
          />
          {groups.map((g) => (
            <section key={g.title} className="rounded-2xl border bg-white p-5">
              <h2 className="mb-5 font-bold">{g.title}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {g.fields.map(([key, label, type]) => (
                  <label
                    key={key}
                    className={`text-sm font-semibold ${type === 'textarea' ? 'sm:col-span-2' : ''}`}
                  >
                    {label}
                    {type === 'textarea' ? (
                      <textarea
                        rows={4}
                        maxLength={15000}
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="mt-2 w-full rounded-lg border p-3 font-normal"
                      />
                    ) : (
                      <input
                        type={type || 'text'}
                        step={type === 'number' ? 'any' : undefined}
                        required={key === 'name' || type === 'number'}
                        maxLength={type === 'url' ? 2048 : 300}
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="mt-2 w-full rounded-lg border p-3 font-normal"
                      />
                    )}
                  </label>
                ))}
              </div>
            </section>
          ))}
          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">
              {success}
            </p>
          )}
          <button
            disabled={saving || uploading || !loaded}
            className="rounded-xl bg-slate-950 px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {saving ? 'Guardando…' : uploading ? 'Subiendo imagen…' : 'Guardar perfil'}
          </button>
        </form>
      )}
    </main>
  );
}
