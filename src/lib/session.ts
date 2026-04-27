// Sessão local simples baseada em e-mail/usuário
// Cada usuário tem suas próprias chaves no localStorage.

const SESSION_KEY = "safestock:current-user";
const USERS_KEY = "safestock:users";

export interface StoredUser {
  email: string;
  name?: string;
  // Em apps reais NUNCA armazene senha em texto. Aqui é apenas um mock local.
  password: string;
  createdAt: number;
}

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

export const getUsers = (): Record<string, StoredUser> =>
  safeParse<Record<string, StoredUser>>(localStorage.getItem(USERS_KEY), {});

const saveUsers = (users: Record<string, StoredUser>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getCurrentUser = (): string | null =>
  localStorage.getItem(SESSION_KEY);

export const setCurrentUser = (email: string) => {
  localStorage.setItem(SESSION_KEY, email.toLowerCase());
};

export const clearCurrentUser = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const registerUser = (
  email: string,
  password: string,
  name?: string
): { ok: true } | { ok: false; error: string } => {
  const key = email.toLowerCase();
  const users = getUsers();
  if (users[key]) return { ok: false, error: "E-mail já cadastrado" };
  users[key] = { email: key, name, password, createdAt: Date.now() };
  saveUsers(users);
  // Inicializa estrutura vazia para o novo usuário
  ensureUserScope(key);
  return { ok: true };
};

export const loginUser = (
  email: string,
  password: string
): { ok: true } | { ok: false; error: string } => {
  const key = email.toLowerCase();
  const users = getUsers();
  const u = users[key];
  if (!u) return { ok: false, error: "Usuário não encontrado" };
  if (u.password !== password) return { ok: false, error: "Senha incorreta" };
  ensureUserScope(key);
  return { ok: true };
};

// Garante que as chaves de dados do usuário existam (vazias por padrão)
export const ensureUserScope = (email: string) => {
  const projectsKey = `safestock:${email}:projects`;
  if (localStorage.getItem(projectsKey) === null) {
    localStorage.setItem(projectsKey, JSON.stringify([]));
  }
};

// Helpers para gerar chaves escopadas ao usuário atual
export const userKey = (suffix: string): string => {
  const u = getCurrentUser() ?? "anon";
  return `safestock:${u}:${suffix}`;
};

export const projectsStorageKey = () => userKey("projects");
export const cardsStorageKey = (projectId: string | undefined) =>
  userKey(`cards:${projectId ?? "default"}`);
export const projectNameStorageKey = (projectId: string | undefined) =>
  userKey(`project-name:${projectId ?? "default"}`);
