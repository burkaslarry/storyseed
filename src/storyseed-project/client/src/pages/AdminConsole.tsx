import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

export default function AdminConsole() {
  const { user, loading, logout } = useAuth();
  const [classFilter, setClassFilter] = useState("");
  const [tEmail, setTEmail] = useState("");
  const [tPassword, setTPassword] = useState("");
  const [tName, setTName] = useState("");
  const students = trpc.manage.students.list.useQuery(
    { classCode: classFilter || undefined },
    { enabled: user?.role === "admin" }
  );
  const teachers = trpc.manage.teachers.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const createTeacher = trpc.manage.teachers.create.useMutation({ onSuccess: () => teachers.refetch() });
  const updateTeacher = trpc.manage.teachers.update.useMutation({ onSuccess: () => teachers.refetch() });
  const removeTeacher = trpc.manage.teachers.remove.useMutation({ onSuccess: () => teachers.refetch() });
  const setStudentActive = trpc.manage.students.setActive.useMutation({ onSuccess: () => students.refetch() });

  if (loading) return <p className="p-8">Loading…</p>;
  if (!user || user.role !== "admin") {
    window.location.href = "/admin-login";
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4] px-5 py-8 text-[#243f38]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#8a9891]">StorySeed Admin</p>
            <h1 className="text-3xl font-semibold">學生 · 教師管理</h1>
          </div>
          <Button variant="outline" onClick={() => void logout()}>
            登出
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">學生名單</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <Input placeholder="班別 filter（留空=全部）例 6F" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} />
              <Button variant="outline" onClick={() => students.refetch()}>
                重新載入
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-[#8a9891]">
                    <th className="py-2">Class</th>
                    <th>Username</th>
                    <th>School code</th>
                    <th>Active</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(students.data ?? []).map((row: any) => (
                    <tr key={row.id} className="border-b border-[#eef2ef]">
                      <td className="py-2">{row.classCode ?? "—"}</td>
                      <td>{row.username}</td>
                      <td>{row.schoolCode}</td>
                      <td>{row.active ? "✓" : "—"}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStudentActive.mutate({ id: row.id, active: !row.active })}
                        >
                          {row.active ? "停用" : "啟用"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">教師帳戶</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-2 md:grid-cols-4">
              <Input placeholder="Email" value={tEmail} onChange={(e) => setTEmail(e.target.value)} />
              <Input placeholder="Password" type="password" value={tPassword} onChange={(e) => setTPassword(e.target.value)} />
              <Input placeholder="Display name" value={tName} onChange={(e) => setTName(e.target.value)} />
              <Button
                onClick={() => {
                  createTeacher.mutate({ email: tEmail, password: tPassword, displayName: tName });
                  setTPassword("");
                }}
                disabled={!tEmail || !tPassword || !tName}
              >
                新增教師
              </Button>
            </div>
            <div className="space-y-2">
              {(teachers.data ?? []).map((t) => (
                <div key={t.userId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 shadow-sm">
                  <div>
                    <p className="font-medium">{t.displayName ?? t.name}</p>
                    <p className="text-xs text-[#8a9891]">{t.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const displayName = window.prompt("新顯示名稱", t.displayName ?? "") ?? undefined;
                        const password = window.prompt("新密碼（留空不改）") ?? undefined;
                        updateTeacher.mutate({
                          userId: t.userId,
                          displayName: displayName || undefined,
                          password: password || undefined,
                        });
                      }}
                    >
                      編輯
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => removeTeacher.mutate({ userId: t.userId })}>
                      移除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
