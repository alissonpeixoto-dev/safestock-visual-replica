import { useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Brand } from "@/components/Brand";
import { toast } from "sonner";
import { loginUser, registerUser, setCurrentUser } from "@/lib/session";

type Mode = "login" | "signup";
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Auth = () => {
  const [params, setParams] = useSearchParams();
  const initial: Mode = params.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<Mode>(initial);
  const navigate = useNavigate();

  const switchTo = (m: Mode) => {
    setMode(m);
    setParams({ mode: m });
  };

  const [loginErr, setLoginErr] = useState<{ email?: string; password?: string }>({});
  const [signupErr, setSignupErr] = useState<{
    name?: string; email?: string; password?: string; confirm?: string;
  }>({});

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const errs: typeof loginErr = {};
    if (!email) errs.email = "Informe seu e-mail";
    else if (!emailRe.test(email)) errs.email = "E-mail inválido";
    if (!password) errs.password = "Informe sua senha";
    setLoginErr(errs);
    if (Object.keys(errs).length) return;
    const res = loginUser(email, password);
    if (!res.ok) {
      setLoginErr({ email: res.error.includes("Usuário") ? res.error : undefined, password: res.error.includes("Senha") ? res.error : undefined });
      toast.error(res.error);
      return;
    }
    setCurrentUser(email);
    toast.success("Bem-vindo de volta!");
    navigate("/dashboard");
  };

  const handleSignup = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const confirm = String(data.get("confirm") || "");
    const errs: typeof signupErr = {};
    if (!name) errs.name = "Informe seu nome";
    if (!email) errs.email = "Informe seu e-mail";
    else if (!emailRe.test(email)) errs.email = "E-mail inválido";
    if (!password) errs.password = "Crie uma senha";
    else if (password.length < 6) errs.password = "Mínimo 6 caracteres";
    if (confirm !== password) errs.confirm = "As senhas não coincidem";
    setSignupErr(errs);
    if (Object.keys(errs).length) return;
    const res = registerUser(email, password, name);
    if (!res.ok) {
      setSignupErr({ email: res.error });
      toast.error(res.error);
      return;
    }
    setCurrentUser(email);
    toast.success("Conta criada com sucesso!");
    navigate("/dashboard");
  };

  const errCls = "mt-1 text-xs text-destructive pl-2";

  return (
    <main className={`auth-container bg-background ${mode === "signup" ? "active" : ""}`}>
      <div className="auth-wrapper">
        {/* PAINEL LOGIN: form | brand */}
        <section className="auth-panel">
          <div className="auth-half">
            <form onSubmit={handleLogin} noValidate className="w-full max-w-sm">
              <h1 className="text-4xl md:text-5xl font-bold mb-10 text-foreground">Login</h1>
              <div className="space-y-4">
                <div>
                  <input
                    name="email" type="email" placeholder="Digite seu e-mail"
                    className="ss-input" aria-invalid={!!loginErr.email}
                  />
                  {loginErr.email && <p className={errCls}>{loginErr.email}</p>}
                </div>
                <div>
                  <input
                    name="password" type="password" placeholder="Digite sua senha"
                    className="ss-input" aria-invalid={!!loginErr.password}
                  />
                  {loginErr.password && <p className={errCls}>{loginErr.password}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-primary px-2 mt-3 mb-6">
                <button type="button" className="hover:underline">Esqueci minha senha</button>
                <button type="button" onClick={() => switchTo("signup")} className="hover:underline">
                  Não tenho uma conta
                </button>
              </div>
              <button type="submit" className="ss-btn-primary">Entrar</button>
            </form>
          </div>
          <div className="auth-half">
            <Brand size="xl" />
          </div>
        </section>

        {/* PAINEL CADASTRO: brand | form */}
        <section className="auth-panel">
          <div className="auth-half">
            <Brand size="xl" />
          </div>
          <div className="auth-half">
            <form onSubmit={handleSignup} noValidate className="w-full max-w-sm">
              <h1 className="text-4xl md:text-5xl font-bold mb-10 text-foreground">Cadastro</h1>
              <div className="space-y-4">
                <div>
                  <input name="name" placeholder="Digite seu nome" className="ss-input" />
                  {signupErr.name && <p className={errCls}>{signupErr.name}</p>}
                </div>
                <div>
                  <input name="email" type="email" placeholder="Digite seu e-mail" className="ss-input" />
                  {signupErr.email && <p className={errCls}>{signupErr.email}</p>}
                </div>
                <div>
                  <input name="password" type="password" placeholder="Crie uma senha" className="ss-input" />
                  {signupErr.password && <p className={errCls}>{signupErr.password}</p>}
                </div>
                <div>
                  <input name="confirm" type="password" placeholder="Confirme sua senha" className="ss-input" />
                  {signupErr.confirm && <p className={errCls}>{signupErr.confirm}</p>}
                </div>
              </div>
              <div className="px-2 mt-3 mb-6">
                <button type="button" onClick={() => switchTo("login")} className="text-xs text-primary hover:underline">
                  Já tenho uma conta
                </button>
              </div>
              <button type="submit" className="ss-btn-primary">Criar conta</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Auth;
