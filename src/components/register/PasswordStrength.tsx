'use client';

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({
  password,
}: PasswordStrengthProps) {
  const tieneMayuscula = /[A-Z]/.test(password);
  const tieneNumero = /\d/.test(password);
  const tieneMinimo = password.length >= 8;

  const puntuacion = [
    tieneMinimo,
    tieneMayuscula,
    tieneNumero,
  ].filter(Boolean).length;

  const ancho =
    puntuacion === 0
      ? 'w-0'
      : puntuacion === 1
      ? 'w-1/3'
      : puntuacion === 2
      ? 'w-2/3'
      : 'w-full';

  const color =
    puntuacion === 3
      ? 'bg-green-500'
      : puntuacion === 2
      ? 'bg-yellow-500'
      : 'bg-red-500';

  const texto =
    puntuacion === 3
      ? 'Segura'
      : puntuacion === 2
      ? 'Media'
      : 'Débil';

  return (
    <div className="space-y-3">

      <div className="flex items-center justify-between text-sm">

        <span className="text-gray-500">
          Seguridad de la contraseña
        </span>

        <span
          className={`font-semibold ${
            puntuacion === 3
              ? 'text-green-600'
              : puntuacion === 2
              ? 'text-yellow-600'
              : 'text-red-600'
          }`}
        >
          {texto}
        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-200">

        <div
          className={`h-full ${ancho} ${color} transition-all duration-500`}
        />

      </div>

      <div className="space-y-1 text-sm">

        <p className={tieneMinimo ? 'text-green-600' : 'text-gray-500'}>
          ✓ Mínimo 8 caracteres
        </p>

        <p className={tieneMayuscula ? 'text-green-600' : 'text-gray-500'}>
          ✓ Una letra mayúscula
        </p>

        <p className={tieneNumero ? 'text-green-600' : 'text-gray-500'}>
          ✓ Un número
        </p>

      </div>

    </div>
  );
}