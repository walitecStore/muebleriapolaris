'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';

import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function RegisterPage() {

  const router = useRouter();
  const { signUp } = useAuth();

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const passwordSegura =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);
    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {

  e.preventDefault();

  setError('');
  setSuccess('');

  if (!nombre.trim()) {
    setError('Ingresa tu nombre.');
    return;
  }

  if (!correo.trim()) {
    setError('Ingresa tu correo.');
    return;
  }

  if (!passwordSegura) {
    setError('La contraseña no cumple los requisitos.');
    return;
  }

  if (password !== confirmar) {
    setError('Las contraseñas no coinciden.');
    return;
  }

  setLoading(true);

  try {

    await signUp(
      correo,
      password,
      {
        fullName: nombre
      }
    );

    setSuccess(
      'Cuenta creada correctamente. Revisa tu correo para verificar tu cuenta.'
    );

    setTimeout(() => {
      router.push('/login');
    }, 3000);

  } catch (err: any) {

    setError(
      err?.message || 'Ocurrió un error al crear la cuenta.'
    );

  } finally {

    setLoading(false);

  }

};

  return (

    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center px-5 pt-24 pb-20">

        <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-primary/10 overflow-hidden">

          <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-8 text-center">

            <div className="flex justify-center mb-4">
              <AppLogo size={70}/>
            </div>

            <h1 className="text-3xl font-extrabold">
              Crear cuenta
            </h1>

            <p className="mt-2 text-white/90">
              Regístrate para comprar, guardar favoritos y seguir tus pedidos.
            </p>

          </div>

          <div className="p-8">

            {error && (

              <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3">

                <AlertCircle size={20}/>

                <span>{error}</span>

              </div>

            )}

            {success && (

              <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3">

                <CheckCircle size={20}/>

                <span>{success}</span>

              </div>

            )}

            <form
              onSubmit={handleRegister}
              className="space-y-5"
            >

              <div>

                <label className="block font-semibold mb-2">

                  Nombre completo

                </label>

                <div className="relative">

                  <User
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={nombre}
                    onChange={(e)=>setNombre(e.target.value)}
                    placeholder="Ingresa tu nombre"

                    className="
                    w-full
                    pl-12
                    pr-4
                    py-3
                    rounded-xl
                    border
                    border-gray-300
                    bg-white
                    transition-all
                    duration-300
                    outline-none

                    hover:border-primary
                    hover:shadow-lg

                    focus:border-primary
                    focus:ring-4
                    focus:ring-primary/20
                    "

                  />

                </div>

              </div>

              <div>

                <label className="block font-semibold mb-2">

                  Correo electrónico

                </label>

                <div className="relative">

                  <Mail
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    value={correo}
                    onChange={(e)=>setCorreo(e.target.value)}
                    placeholder="correo@ejemplo.com"

                    className="
                    w-full
                    pl-12
                    pr-4
                    py-3
                    rounded-xl
                    border
                    border-gray-300
                    bg-white
                    transition-all
                    duration-300
                    outline-none

                    hover:border-primary
                    hover:shadow-lg

                    focus:border-primary
                    focus:ring-4
                    focus:ring-primary/20
                    "

                  />

                </div>

              </div>
               {/* Contraseña */}

              <div>

                <label className="block font-semibold mb-2">
                  Contraseña
                </label>

                <div className="relative">

                  <Lock
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    placeholder="Crea una contraseña"

                    className="
                    w-full
                    pl-12
                    pr-12
                    py-3
                    rounded-xl
                    border
                    border-gray-300
                    bg-white
                    transition-all
                    duration-300
                    outline-none

                    hover:border-primary
                    hover:shadow-lg

                    focus:border-primary
                    focus:ring-4
                    focus:ring-primary/20
                    "
                  />

                  <button
                    type="button"
                    onClick={()=>setMostrarPassword(!mostrarPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary"
                  >
                    {mostrarPassword ? (
                      <EyeOff size={20}/>
                    ) : (
                      <Eye size={20}/>
                    )}
                  </button>

                </div>

              </div>
              
               {/* Indicador de seguridad */}
                <div className="space-y-2">

  <div className="flex justify-between text-sm">

    <span>Seguridad de la contraseña</span>

    <span
      className={`font-semibold ${
        passwordSegura
          ? 'text-green-600'
          : 'text-red-500'
      }`}
    >
      {passwordSegura ? 'Segura' : 'Débil'}
    </span>

  </div>

  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">

    <div
      className={`h-full transition-all duration-500 ${
        passwordSegura
          ? 'w-full bg-green-500'
          : password.length > 0
          ? 'w-1/2 bg-yellow-500'
          : 'w-0'
      }`}
    />

  </div>

  <ul className="text-sm text-gray-500 space-y-1">

    <li>✓ Mínimo 8 caracteres</li>

    <li>✓ Al menos una letra mayúscula</li>

    <li>✓ Al menos un número</li>

  </ul>

</div>
               {/* Confirmar contraseña */}

              <div>

                <label className="block font-semibold mb-2">
                  Confirmar contraseña
                </label>

                <div className="relative">

                  <Lock
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={mostrarConfirmacion ? 'text' : 'password'}
                    value={confirmar}
                    onChange={(e)=>setConfirmar(e.target.value)}
                    placeholder="Repite tu contraseña"

                    className="
                    w-full
                    pl-12
                    pr-12
                    py-3
                    rounded-xl
                    border
                    border-gray-300
                    bg-white
                    transition-all
                    duration-300
                    outline-none

                    hover:border-primary
                    hover:shadow-lg

                    focus:border-primary
                    focus:ring-4
                    focus:ring-primary/20
                    "
                  />

                  <button
                    type="button"
                    onClick={()=>setMostrarConfirmacion(!mostrarConfirmacion)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary"
                  >
                    {mostrarConfirmacion ? (
                      <EyeOff size={20}/>
                    ) : (
                      <Eye size={20}/>
                    )}
                  </button>

                </div>

              </div>
               <button
                type="submit"
                disabled={loading}
                className="
                w-full
                py-4
                rounded-xl
                bg-primary
                text-white
                font-bold
                text-lg
                transition-all
                duration-300

                hover:scale-[1.02]
                hover:shadow-xl

                disabled:opacity-60
                disabled:cursor-not-allowed
                "
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>

              <div className="text-center pt-4">

                <p className="text-gray-600">
                  ¿Ya tienes una cuenta?
                </p>

                <Link
                  href="/login"
                  className="mt-2 inline-block font-semibold text-primary hover:underline"
                >
                  Iniciar sesión
                </Link>

              </div>

            </form>

          </div>

        </div>

      </main>

      <Footer />

    </>

  );
}