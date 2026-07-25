'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

import RegisterButton from './RegisterButton';
import PasswordStrength from './PasswordStrength';

export default function RegisterForm() {

  const router = useRouter();

  const { signUp } = useAuth();

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
   const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    setError('');
    setSuccess('');

    if (!nombre.trim()) {
      setError('Ingresa tu nombre completo.');
      return;
    }

    if (!correo.trim()) {
      setError('Ingresa tu correo electrónico.');
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(correo)) {
      setError('El correo electrónico no es válido.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('La contraseña debe contener una letra mayúscula.');
      return;
    }

    if (!/\d/.test(password)) {
      setError('La contraseña debe contener al menos un número.');
      return;
    }

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {

      setLoading(true);

      await signUp(
        correo,
        password,
        {
          fullName: nombre,
          avatarUrl: '',
        }
      );

      setSuccess(
        'Tu cuenta fue creada correctamente. Revisa tu correo para confirmar tu cuenta.'
      );

      setTimeout(() => {
        router.push('/login');
      }, 2500);

    } catch (err: unknown) {

  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError('No fue posible crear la cuenta.');
  }
    } finally {

      setLoading(false);

    }

  };

  return (
<>
  {error && (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
      {error}
    </div>
  )}

  {success && (
    <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
      {success}
    </div>
  )}

  <form
    onSubmit={handleRegister}
    className="space-y-6"
  >

    {/* Nombre */}

    <div>

      <label className="mb-2 block font-semibold">
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
          placeholder="Juan Pérez"

          className="
          w-full
          rounded-xl
          border
          border-gray-300
          py-3
          pl-12
          pr-4

          transition-all
          duration-300

          hover:border-primary
          hover:shadow-md

          focus:border-primary
          focus:ring-4
          focus:ring-primary/20
          outline-none
          "
        />

      </div>

    </div>

    {/* Correo */}

    <div>

      <label className="mb-2 block font-semibold">
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
          rounded-xl
          border
          border-gray-300
          py-3
          pl-12
          pr-4

          transition-all
          duration-300

          hover:border-primary
          hover:shadow-md

          focus:border-primary
          focus:ring-4
          focus:ring-primary/20
          outline-none
          "
        />

      </div>

    </div>
 {/* Contraseña */}

    <div>

      <label className="mb-2 block font-semibold">
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
          onChange={(e) => setPassword(e.target.value)}
          placeholder="********"

          className="
          w-full
          rounded-xl
          border
          border-gray-300
          py-3
          pl-12
          pr-12

          transition-all
          duration-300

          hover:border-primary
          hover:shadow-md

          focus:border-primary
          focus:ring-4
          focus:ring-primary/20
          outline-none
          "
        />

        <button
          type="button"
          onClick={() => setMostrarPassword(!mostrarPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary"
        >
          {mostrarPassword ? (
            <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )}
        </button>

      </div>

    </div>

    <PasswordStrength password={password} />

    {/* Confirmar contraseña */}

    <div>

      <label className="mb-2 block font-semibold">
        Confirmar contraseña
      </label>

      <div className="relative">

        <Lock
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type={mostrarConfirmar ? 'text' : 'password'}
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          placeholder="********"

          className="
          w-full
          rounded-xl
          border
          border-gray-300
          py-3
          pl-12
          pr-12

          transition-all
          duration-300

          hover:border-primary
          hover:shadow-md

          focus:border-primary
          focus:ring-4
          focus:ring-primary/20
          outline-none
          "
        />

        <button
          type="button"
          onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary"
        >
          {mostrarConfirmar ? (
            <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )}
        </button>

      </div>

    </div>

    <RegisterButton loading={loading} />

    <div className="text-center pt-6">

      <p className="text-gray-600">

        ¿Ya tienes una cuenta?

      </p>

      <Link
        href="/login"
        className="mt-3 inline-block font-semibold text-primary hover:underline"
      >
        Iniciar sesión
      </Link>

    </div>

  </form>

</>

    );
}