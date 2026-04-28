// Sessão baseada em Supabase Auth.
// Dados de projetos/cartões continuam no localStorage, escopados pelo user.id real.
import { supabase } from "@/integrations/supabase/client";

let cachedUserId: string | null = null;

// Mantém o cache em sincronia com o Supabase
supabase.auth.getSession().then(({ data }) => {
  cachedUserId = data.session?.user.id ?? null;
});
supabase.auth.onAuthStateChange((_event, session) => {
  cachedUserId = session?.user.id ?? null;
});

export const getCurrentUser = (): string | null => cachedUserId;

export const clearCurrentUser = async () => {
  await supabase.auth.signOut();
  cachedUserId = null;
};

// Helpers para gerar chaves escopadas ao usuário atual
export const userKey = (suffix: string): string => {
  const u = cachedUserId ?? "anon";
  return `safestock:${u}:${suffix}`;
};

export const projectsStorageKey = () => userKey("projects");
export const cardsStorageKey = (projectId: string | undefined) =>
  userKey(`cards:${projectId ?? "default"}`);
export const projectNameStorageKey = (projectId: string | undefined) =>
  userKey(`project-name:${projectId ?? "default"}`);
