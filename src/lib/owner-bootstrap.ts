// This SQL is displayed for the database owner to run in Supabase SQL Editor.
// It is never executed by the application or exposed through an RPC.
export const ownerRoleProtectionSQL = `CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $polaris_role$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND current_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'Profile roles must be assigned by an authorized database administrator';
  END IF;
  RETURN NEW;
END;
$polaris_role$;`;
