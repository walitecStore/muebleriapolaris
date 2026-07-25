'use client';

import { Loader2, ArrowRight } from 'lucide-react';

interface RegisterButtonProps {
  loading: boolean;
}

export default function RegisterButton({
  loading,
}: RegisterButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="
        w-full
        rounded-xl
        bg-primary
        py-4
        text-lg
        font-bold
        text-white

        transition-all
        duration-300

        hover:scale-[1.02]
        hover:shadow-xl
        hover:brightness-110

        active:scale-[0.98]

        disabled:opacity-70
        disabled:cursor-not-allowed

        flex
        items-center
        justify-center
        gap-3
      "
    >
      {loading ? (
        <>
          <Loader2
            size={22}
            className="animate-spin"
          />
          Creando cuenta...
        </>
      ) : (
        <>
          Crear cuenta

          <ArrowRight size={20} />
        </>
      )}
    </button>
  );
}