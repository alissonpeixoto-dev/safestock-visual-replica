import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Brand } from "@/components/Brand";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

type Mode = "login" | "signup";
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Definido FORA do componente Auth para não ser recriado a cada render
// (recriar o tipo do componente desmontava o input e apagava o valor)
const PasswordInput = ({
  name, placeholder, show, onToggle, invalid,
}: {
  name: string; placeholder: string; show: boolean; onToggle: () => void; invalid?: boolean;
}) => {
  const inputRef = (typeof window !== "undefined") ? null : null;
  return (
    <div className="relative">
      <input
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className="ss-input pr-12"
        aria-invalid={!!invalid}
        autoComplete={name === "password" ? "current-password" : "new-password"}
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()} // mantém foco no input
        onClick={onToggle}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-foreground/5 active:scale-90 transition-all"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

const Auth = () => {
  const [params, setParams] = useSearchParams();
  const initial: Mode = params.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<Mode>(initial);
  const navigate = useNavigate();

  // Se já estiver logado, manda direto pro dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard", { replace: true });
    });
  }, [navigate]);

  const switchTo = (m: Mode) => {
    setMode(m);
    setParams({ mode: m });
  };

  // ---- Estado dos formulários
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const [loginErr, setLoginErr] = useState<{ email?: string; password?: string }>({});
  const [signupErr, setSignupErr] = useState<{
    name?: string; email?: string; password?: string; confirm?: string;
  }>({});

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
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

    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoginLoading(false);
    if (error) {
      const msg = error.message.includes("Invalid login")
        ? "E-mail ou senha incorretos"
        : error.message;
      setLoginErr({ password: msg });
      toast.error(msg);
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate("/dashboard");
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
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

    setSignupLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setSignupLoading(false);
    if (error) {
      const msg = error.message.includes("registered")
        ? "E-mail já cadastrado"
        : error.message;
      setSignupErr({ email: msg });
      toast.error(msg);
      return;
    }
    toast.success("Conta criada com sucesso!");
    navigate("/dashboard");
  };

  // ---- Esqueci a senha
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotErr, setForgotErr] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const submitForgot = async () => {
    const email = forgotEmail.trim();
    if (!email) { setForgotErr("Informe seu e-mail"); return; }
    if (!emailRe.test(email)) { setForgotErr("E-mail inválido"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) {
      setForgotErr(error.message);
      toast.error(error.message);
      return;
    }
    setForgotSent(true);
    toast.success("E-mail de redefinição enviado");
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setTimeout(() => {
      setForgotEmail("");
      setForgotErr("");
      setForgotSent(false);
    }, 200);
  };

  const errCls = "mt-1 text-xs text-destructive pl-2";

  return (
    <main className={`auth-container bg-background ${mode === "signup" ? "active" : ""}`}>
      <div className="auth-wrapper">
        {/* PAINEL LOGIN */}
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
                  <PasswordInput
                    name="password"
                    placeholder="Digite sua senha"
                    show={showLoginPw}
                    onToggle={() => setShowLoginPw((v) => !v)}
                    invalid={!!loginErr.password}
                  />
                  {loginErr.password && <p className={errCls}>{loginErr.password}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-primary px-2 mt-3 mb-6">
                <button type="button" onClick={() => setForgotOpen(true)} className="hover:underline">
                  Esqueci minha senha
                </button>
                <button type="button" onClick={() => switchTo("signup")} className="hover:underline">
                  Não tenho uma conta
                </button>
              </div>
              <button type="submit" disabled={loginLoading} className="ss-btn-primary disabled:opacity-60">
                {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </button>
            </form>
          </div>
          <div className="auth-half">
            <Brand size="xl" />
          </div>
        </section>

        {/* PAINEL CADASTRO */}
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
                  <PasswordInput
                    name="password"
                    placeholder="Crie uma senha"
                    show={showSignupPw}
                    onToggle={() => setShowSignupPw((v) => !v)}
                    invalid={!!signupErr.password}
                  />
                  {signupErr.password && <p className={errCls}>{signupErr.password}</p>}
                </div>
                <div>
                  <PasswordInput
                    name="confirm"
                    placeholder="Confirme sua senha"
                    show={showSignupConfirm}
                    onToggle={() => setShowSignupConfirm((v) => !v)}
                    invalid={!!signupErr.confirm}
                  />
                  {signupErr.confirm && <p className={errCls}>{signupErr.confirm}</p>}
                </div>
              </div>
              <div className="px-2 mt-3 mb-6">
                <button type="button" onClick={() => switchTo("login")} className="text-xs text-primary hover:underline">
                  Já tenho uma conta
                </button>
              </div>
              <button type="submit" disabled={signupLoading} className="ss-btn-primary disabled:opacity-60">
                {signupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* Modal esqueci senha */}
      <Dialog open={forgotOpen} onOpenChange={(o) => (o ? setForgotOpen(true) : closeForgot())}>
        <DialogContent className="sm:max-w-md ss-card border-2 border-foreground/90 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Esqueci minha senha</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {forgotSent
                ? "Se houver uma conta para esse e-mail, enviamos um link para redefinir sua senha."
                : "Digite seu e-mail e enviaremos um link para redefinir sua senha."}
            </DialogDescription>
          </DialogHeader>
          {!forgotSent && (
            <div className="py-2">
              <input
                autoFocus
                value={forgotEmail}
                onChange={(e) => { setForgotEmail(e.target.value); if (forgotErr) setForgotErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitForgot(); } }}
                type="email"
                placeholder="seu@email.com"
                className="ss-input"
                aria-invalid={!!forgotErr}
              />
              {forgotErr && <p className={errCls}>{forgotErr}</p>}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={closeForgot}
              className="rounded-full border-2 border-foreground/80 px-6 py-2.5 text-sm font-medium hover:bg-foreground/5 active:scale-[0.98] transition-all"
            >
              {forgotSent ? "Fechar" : "Cancelar"}
            </button>
            {!forgotSent && (
              <button
                type="button"
                onClick={submitForgot}
                disabled={forgotLoading}
                className="rounded-full bg-accent text-accent-foreground font-medium px-6 py-2.5 text-sm hover:bg-accent/90 active:scale-[0.98] transition-all shadow-[0_2px_0_0_hsl(var(--foreground)/0.9)] disabled:opacity-60 inline-flex items-center gap-2"
              >
                {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar link
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Auth;
