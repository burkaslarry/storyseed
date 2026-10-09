/*
 * Student sign-in with a school username and a one-time initial code.
 * First login must set a new code of at least 8 characters before the
 * student can open the writing space.
 * UNFINISHED without a database: there are no accounts to check, so login
 * returns an error.
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { getStudentLoginRedirect } from "@/lib/loginRedirects";
import { LockKeyhole, Sprout } from "lucide-react";

export default function StudentLogin() {
  const { user, loading: authLoading, logout } = useAuth();
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [mustChange, setMustChange] = useState(false);
  const [error, setError] = useState("");
  const login = trpc.accounts.studentLogin.useMutation({ onSuccess: (value) => { setMustChange(value.mustChangeCode); setError(""); if (!value.mustChangeCode) window.location.href = getStudentLoginRedirect(); }, onError: (e) => setError(e.message || "登入資料不正確。") });
  const changeCode = trpc.accounts.changeCode.useMutation({ onSuccess: () => { window.location.href = getStudentLoginRedirect(); }, onError: (e) => setError(e.message || "更新初始碼失敗。") });
  if (user) return <main className="min-h-screen bg-[#f7f8f4] px-5 py-12 text-[#243f38]"><div className="mx-auto max-w-lg"><Card className="border-0 shadow-[0_20px_60px_rgba(36,51,47,.08)]"><CardHeader><p className="eyebrow">Chung Sing School · Student</p><CardTitle className="text-3xl">你已經登入</CardTitle><p className="text-sm leading-6 text-[#7a8982]">可以繼續你的寫作及 15 堂課程。</p></CardHeader><CardContent><div className="flex flex-col gap-3"><Button onClick={() => { window.location.href = getStudentLoginRedirect(); }} className="w-full rounded-full bg-[#243f38] py-6 text-white">進入學生工作區</Button><Button variant="outline" onClick={() => void logout()} disabled={authLoading} className="w-full rounded-full">登出學生帳戶</Button></div></CardContent></Card></div></main>;
  return <main className="min-h-screen bg-[#f7f8f4] px-5 py-12 text-[#243f38]"><div className="mx-auto max-w-lg"><div className="mb-8 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#243f38] text-[#f0c96a]"><Sprout className="h-5 w-5" /></div><div><p className="font-semibold">StorySeed</p><p className="text-[10px] uppercase tracking-[.16em] text-[#90a099]">Student writing space</p></div></div><Card className="border-0 shadow-[0_20px_60px_rgba(36,51,47,.08)]"><CardHeader><p className="eyebrow">Chung Sing School · Student</p><CardTitle className="mt-2 text-3xl">學生登入</CardTitle><p className="text-sm leading-6 text-[#7a8982]">使用老師提供的校內 username 及一次性初始碼，開始你的寫作旅程。</p></CardHeader><CardContent><div className="space-y-4"><label className="block text-xs font-semibold text-[#60756a]">Username<Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1.5" autoComplete="username" /></label><label className="block text-xs font-semibold text-[#60756a]">一次性初始碼<Input value={code} onChange={(e) => setCode(e.target.value)} className="mt-1.5" type="password" autoComplete="current-password" /></label><Button onClick={() => login.mutate({ username, code })} disabled={login.isPending || !username || !code} className="w-full rounded-full bg-[#243f38] py-6 text-white">{login.isPending ? "登入中…" : "登入寫作空間"}<LockKeyhole className="ml-2 h-4 w-4" /></Button>{mustChange && <div className="rounded-2xl bg-[#fff8e8] p-4"><p className="text-sm font-semibold text-[#806a38]">請先設定新碼</p><p className="mt-1 text-xs leading-5 text-[#8b7445]">為保障你的帳戶，首次登入必須設定至少 8 個字元的新碼。</p><Input value={newCode} onChange={(e) => setNewCode(e.target.value)} className="mt-3" type="password" placeholder="新的登入碼" autoComplete="new-password" /><Button onClick={() => changeCode.mutate({ newCode })} disabled={changeCode.isPending || newCode.length < 8} className="mt-3 w-full rounded-full bg-[#a67b36] text-white">{changeCode.isPending ? "更新中…" : "完成改碼並進入平台"}</Button></div>}{error && <p className="rounded-xl bg-[#fff0eb] px-3 py-2 text-xs text-[#a45d47]">{error}</p>}</div><p className="mt-6 text-center text-xs text-[#8a9891]">需要協助？請聯絡任教導師；不要在作品中輸入電話、電郵或住址。</p></CardContent></Card></div></main>;
}
