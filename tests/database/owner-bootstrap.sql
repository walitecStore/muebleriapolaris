-- Verify the trigger itself, even if a future migration accidentally grants role UPDATE.
BEGIN;
GRANT UPDATE(role) ON public.profiles TO authenticated;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
DO $$ BEGIN
  BEGIN
    UPDATE public.profiles SET role='admin' WHERE id=auth.uid();
    RAISE EXCEPTION 'TEST FAILED: customer changed their role';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Profile roles must be assigned by an authorized database administrator' THEN
      RAISE;
    END IF;
  END;
END $$;
RESET ROLE;
UPDATE public.profiles SET role='admin' WHERE id='22222222-2222-4222-8222-222222222222';
DO $$ BEGIN
  ASSERT (SELECT role::text FROM public.profiles WHERE id='22222222-2222-4222-8222-222222222222')='admin',
    'Database owner cannot bootstrap an administrator';
END $$;
ROLLBACK;
