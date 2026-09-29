/*
 * Teacher sign-in.
 * UNFINISHED for a local demo: the button calls Manus OAuth (`startLogin`).
 * That flow needs VITE_APP_ID and OAUTH_SERVER_URL. Without them the page
 * still renders, but login cannot complete.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { getTeacherLoginRedirect } from "@/lib/loginRedirects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LockKeyhole, PenLine } from "lucide-react";

export default function TeacherLogin() {
  const { user, loading, logout } = useAuth();
  if (user) return <main className="min-h-screen bg-[#f7f8f4] px-5 py-12 text-[#243f38]"><div className="mx-auto max-w-lg"><Card className="border-0 shadow-[0_20px_60px_rgba(36,51,47,.08)]"><CardHeader><p className="eyebrow">Chung Sing School · Staff</p><CardTitle className="text-3xl">你已經登入</CardTitle><p className="text-sm leading-6 text-[#7a8982]">目前帳戶可進入教師工作台。</p></CardHeader><CardContent><div className="flex flex-col gap-3"><Button onClick={() => { window.location.href = getTeacherLoginRedirect(); }} className="w-full rounded-full bg-[#243f38] py-6 text-white">進入教師工作台</Button><Button variant="outline" onClick={() => void logout()} disabled={loading} className="w-full rounded-full">登出教師帳戶</Button></div></CardContent></Card></div></main>;
  return <main className="min-h-screen bg-[#f7f8f4] px-5 py-12 text-[#243f38]"><div className="mx-auto max-w-lg"><div className="mb-8 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#243f38] text-[#f0c96a]"><PenLine className="h-5 w-5" /></div><div><p className="font-semibold">StorySeed</p><p className="text-[10px] uppercase tracking-[.16em] text-[#90a099]">Teacher portal</p></div></div><Card className="border-0 shadow-[0_20px_60px_rgba(36,51,47,.08)]"><CardHeader><p className="eyebrow">Chung Sing School · Staff</p><CardTitle className="mt-2 text-3xl">教師登入</CardTitle><p className="text-sm leading-6 text-[#7a8982]">登入後管理 Proofreading、Anthology、作品集 PDF 及學生帳戶。</p></CardHeader><CardContent><Button onClick={startLogin} disabled={loading} className="w-full rounded-full bg-[#243f38] py-6 text-white">{loading ? "正在檢查登入狀態…" : "使用校方教師帳戶登入"}<LockKeyhole className="ml-2 h-4 w-4" /></Button><p className="mt-5 text-center text-xs text-[#8a9891]">教師帳戶由校方管理；學生請使用學生登入入口。</p></CardContent></Card></div></main>;
}
