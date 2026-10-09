import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

export function AssignmentsDesk({ user }: { user: unknown }) {
  const [classCode, setClassCode] = useState("6F");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [level, setLevel] = useState<"P5" | "P6">("P6");
  const list = trpc.manage.assignments.list.useQuery({ classCode }, { enabled: Boolean(user) });
  const create = trpc.manage.assignments.create.useMutation({ onSuccess: () => list.refetch() });
  const open = trpc.manage.assignments.open.useMutation({ onSuccess: () => list.refetch() });
  const close = trpc.manage.assignments.update.useMutation({ onSuccess: () => list.refetch() });

  return (
    <div>
      <p className="eyebrow">Teacher tools · Writing assignments</p>
      <h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">開設寫作任務</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a8982]">
        建立任務後按「向全班發佈」，會為該班所有 active 學生建立 writing 紀錄（學生登入後可寫作／校對）。
      </p>
      {!user && (
        <div className="mt-4 rounded-2xl border border-[#ead9bc] bg-[#fff8e8] p-4 text-sm text-[#806a38]">請先以教師身份登入。</div>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">新增任務</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="block text-xs font-semibold">
              班別
              <Input className="mt-1" value={classCode} onChange={(e) => setClassCode(e.target.value)} />
            </label>
            <label className="block text-xs font-semibold">
              標題
              <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="block text-xs font-semibold">
              說明／prompt
              <Textarea className="mt-1 min-h-[120px]" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </label>
            <div className="flex gap-2">
              {(["P5", "P6"] as const).map((lv) => (
                <Button key={lv} type="button" variant={level === lv ? "default" : "outline"} onClick={() => setLevel(lv)}>
                  {lv}
                </Button>
              ))}
            </div>
            <Button
              disabled={!user || !title.trim() || create.isPending}
              onClick={() => {
                create.mutate({ classCode, title, instructions, level });
                setTitle("");
                setInstructions("");
              }}
            >
              {create.isPending ? "建立中…" : "建立草稿任務"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">任務列表 · {classCode}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(list.data ?? []).map((a) => (
              <div key={a.id} className="rounded-xl border border-[#e8ece7] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{a.title}</p>
                    <p className="mt-1 text-xs text-[#8a9891]">
                      {a.level} · lesson #{a.lessonNo} · {a.status}
                    </p>
                    {a.instructions && <p className="mt-2 text-xs leading-5 text-[#60756a]">{a.instructions}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    {a.status !== "open" && (
                      <Button size="sm" disabled={open.isPending} onClick={() => open.mutate({ assignmentId: a.id })}>
                        向全班發佈
                      </Button>
                    )}
                    {a.status === "open" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => close.mutate({ assignmentId: a.id, status: "closed" })}
                      >
                        關閉
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!list.data?.length && <p className="text-sm text-[#8a9891]">此班別暫無任務。</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
