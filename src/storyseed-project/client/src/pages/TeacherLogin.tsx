/*
 * Teacher sign-in with school email and password (stored as MD5 on server).
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getTeacherLoginRedirect } from "@/lib/loginRedirects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { LockKeyhole, PenLine } from "lucide-react";

export default function TeacherLogin() {
  const { user, loading, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = trpc.accounts.teacherLogin.useMutation({
    onSuccess: () => {
      setError("");
      window.location.href = getTeacherLoginRedirect();
    },
    onError: (e) => setError(e.message || "登入資料不正確。"),
  });

  if (user?.role === "teacher" || user?.role === "admin") {
    return (
      <main className="min-h-screen bg-[#f7f8f4] px-5 py-12 text-[#243f38]">
        <div className="mx-auto max-w-lg">
          <Card className="border-0 shadow-[0_20px_60px_rgba(36,51,47,.08)]">
            <CardHeader>
              <p className="eyebrow">Chung Sing School · Staff</p>
              <CardTitle className="text-3xl">你已經登入</CardTitle>
              <p className="text-sm leading-6 text-[#7a8982]">目前帳戶可進入教師工作台。</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    window.location.href = getTeacherLoginRedirect();
                  }}
                  className="w-full rounded-full bg-[#243f38] py-6 text-white"
                >
                  進入教師工作台
                </Button>
                <Button variant="outline" onClick={() => void logout()} disabled={loading} className="w-full rounded-full">
                  登出教師帳戶
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] px-5 py-12 text-[#243f38]">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#243f38] text-[#f0c96a]">
            <PenLine className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">StorySeed</p>
            <p className="text-[10px] uppercase tracking-[.16em] text-[#90a099]">Teacher portal</p>
          </div>
        </div>
        <Card className="border-0 shadow-[0_20px_60px_rgba(36,51,47,.08)]">
          <CardHeader>
            <p className="eyebrow">Chung Sing School · Staff</p>
            <CardTitle className="mt-2 text-3xl">教師登入</CardTitle>
            <p className="text-sm leading-6 text-[#7a8982]">使用校方電郵及密碼，登入後管理 Proofreading、Anthology 及學生帳戶。</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-[#60756a]">
                電郵 Email
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                  type="email"
                  autoComplete="email"
                />
              </label>
              <label className="block text-xs font-semibold text-[#60756a]">
                密碼 Password
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5"
                  type="password"
                  autoComplete="current-password"
                />
              </label>
              <Button
                onClick={() => login.mutate({ email, password })}
                disabled={login.isPending || !email.trim() || !password}
                className="w-full rounded-full bg-[#243f38] py-6 text-white"
              >
                {login.isPending ? "登入中…" : "登入教師工作台"}
                <LockKeyhole className="ml-2 h-4 w-4" />
              </Button>
              {error && <p className="rounded-xl bg-[#fff0eb] px-3 py-2 text-xs text-[#a45d47]">{error}</p>}
            </div>
            <p className="mt-6 text-center text-xs text-[#8a9891]">學生請使用學生登入入口；勿與他人分享密碼。</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
