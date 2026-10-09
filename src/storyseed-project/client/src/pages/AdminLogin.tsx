import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { LockKeyhole, Shield } from "lucide-react";

export default function AdminLogin() {
  const { user, loading, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = trpc.accounts.adminLogin.useMutation({
    onSuccess: () => {
      window.location.href = "/admin";
    },
    onError: (e) => setError(e.message || "登入失敗。"),
  });

  if (user?.role === "admin") {
    return (
      <main className="min-h-screen bg-[#f7f8f4] px-5 py-12">
        <div className="mx-auto max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle>管理員已登入</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button onClick={() => { window.location.href = "/admin"; }}>進入管理後台</Button>
              <Button variant="outline" onClick={() => void logout()} disabled={loading}>
                登出
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] px-5 py-12 text-[#243f38]">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <Shield className="h-8 w-8 text-[#243f38]" />
          <div>
            <p className="font-semibold">StorySeed Admin</p>
            <p className="text-xs text-[#8a9891]">學生名單 · 教師帳戶</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>管理員登入</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            <Button
              className="w-full"
              onClick={() => login.mutate({ email, password })}
              disabled={login.isPending || !email || !password}
            >
              {login.isPending ? "登入中…" : "登入"}
              <LockKeyhole className="ml-2 h-4 w-4" />
            </Button>
            {error && <p className="text-xs text-[#a45d47]">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
