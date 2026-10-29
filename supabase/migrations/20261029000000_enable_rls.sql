-- Active Row-Level Security sur toutes les tables exposées par l'API Supabase.
-- Sans RLS, n'importe qui possédant l'URL du projet + la clé anon (visible dans
-- le bundle JS du front) peut lire, modifier et supprimer toutes les données.
--
-- Après cette migration :
--   * le rôle `anon` (visiteur non connecté) n'a plus aucun accès ;
--   * le rôle `authenticated` (utilisateur connecté via Supabase Auth) a un accès complet.
--
-- IMPORTANT : désactiver les inscriptions publiques dans Supabase
-- (Authentication → Sign In / Providers → "Allow new users to sign up" = off),
-- sinon n'importe qui pourrait se créer un compte et obtenir l'accès.
--
-- Le serveur Express/Prisma se connecte avec DATABASE_URL (rôle propriétaire),
-- qui contourne RLS : il n'est pas impacté.

alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.sets    enable row level security;

revoke all on public.players, public.matches, public.sets from anon;

drop policy if exists "Authenticated users have full access" on public.players;
create policy "Authenticated users have full access" on public.players
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users have full access" on public.matches;
create policy "Authenticated users have full access" on public.matches
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users have full access" on public.sets;
create policy "Authenticated users have full access" on public.sets
  for all to authenticated using (true) with check (true);

-- Table interne de Prisma (si `prisma migrate` a été utilisé) : aucun accès via l'API.
do $$
begin
  if to_regclass('public._prisma_migrations') is not null then
    execute 'alter table public._prisma_migrations enable row level security';
    execute 'revoke all on public._prisma_migrations from anon, authenticated';
  end if;
end
$$;
