import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Download, LockKeyhole, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
type TFn = (lang: "zh" | "en", key: string, vars?: Record<string, string | number>) => string;

export function AccountsDesk({ lang, user, t }: { lang: "zh" | "en"; user: unknown; t: TFn }) {
  const [classCode, setClassCode] = useState("6F");
  const [csv, setCsv] = useState("schoolCode,classCode\nP6-01,6F\nP6-02,6F");
  const [schoolCode, setSchoolCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [oneResult, setOneResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const mutation = trpc.accounts.bulkImport.useMutation({
    onSuccess: (value) => {
      setResult(value);
      setError(null);
    },
    onError: (reason) => setError(reason.message || "匯入失敗。"),
  });
  const createOne = trpc.manage.students.createOne.useMutation({
    onSuccess: (value) => {
      setOneResult(value);
      setError(null);
      setSchoolCode("");
    },
    onError: (reason) => setError(reason.message || "新增學生失敗。"),
  });
  const exportQuery = trpc.manage.students.exportCsv.useQuery({ classCode }, { enabled: false });
  const downloadCredentials = () => {
    if (!result?.credentials) return;
    const rows = [["schoolCode", "username", "initialCode"], ...result.credentials.map((item: any) => [item.schoolCode, item.username, item.initialCode])];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "storyseed-student-account-credentials.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const downloadRoster = async () => {
    const { data } = await exportQuery.refetch();
    if (!data) return;
    const rows = [["schoolCode", "classCode", "username", "active", "mustChangeCode"], ...data.map((r) => [r.schoolCode, r.classCode, r.username, r.active, r.mustChangeCode])];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `storyseed-roster-${classCode}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <p className="eyebrow">Teacher tools · Account Desk</p>
      <h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{t(lang, "accH2")}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a8982]">{t(lang, "accSub")}</p>
      {!user && (
        <div className="mt-5 rounded-2xl border border-[#ead9bc] bg-[#fff8e8] p-4 text-sm text-[#806a38]">{t(lang, "accDemoNote")}</div>
      )}
      <Card className="mt-6 border-0 bg-[#fffaf0] shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">單一新增學生</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <input value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="班別 6F" className="field w-24" />
          <input value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} placeholder="校內代號 P6-99" className="field flex-1" />
          <Button
            disabled={!user || !schoolCode || createOne.isPending}
            onClick={() => createOne.mutate({ classCode, schoolCode })}
            className="rounded-full bg-[#243f38] text-white"
          >
            建立帳號
          </Button>
          {oneResult && (
            <p className="w-full text-xs text-[#557261]">
              username: <strong>{oneResult.username}</strong> · 初始碼（只顯示一次）: <strong>{oneResult.initialCode}</strong>
            </p>
          )}
        </CardContent>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)]">
        <Card className="border-0 bg-white shadow-[0_15px_45px_rgba(36,51,47,.07)]">
          <CardHeader>
            <CardTitle className="text-lg">{t(lang, "accStep1")}</CardTitle>
            <p className="text-xs text-[#8a9891]">{t(lang, "accStep1Hint")}</p>
          </CardHeader>
          <CardContent>
            <label className="block text-xs font-semibold text-[#60756a]">
              {t(lang, "classCode")}
              <input value={classCode} onChange={(e) => setClassCode(e.target.value)} className="field mt-1.5" />
            </label>
            <Textarea value={csv} onChange={(e) => setCsv(e.target.value)} className="mt-4 min-h-[220px] rounded-2xl border-[#dfe8e1] bg-[#fbfcf9] font-mono text-xs" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => mutation.mutate({ classCode, csv })} disabled={!user || mutation.isPending} className="rounded-full bg-[#243f38] text-white">
                {mutation.isPending ? t(lang, "generating") : t(lang, "previewGenerate")}
                <Users className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => void downloadRoster()} disabled={!user} className="rounded-full">
                <Download className="mr-2 h-4 w-4" />
                匯出名單 CSV
              </Button>
            </div>
            {error && <p className="mt-3 rounded-xl bg-[#fff0eb] px-3 py-2 text-xs text-[#a45d47]">{error}</p>}
          </CardContent>
        </Card>
        <Card className="border-0 bg-[#edf6ef] shadow-none">
          <CardHeader>
            <CardTitle className="text-lg text-[#315a46]">{t(lang, "accStep2")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-[#557261]">{t(lang, "accStep2Text")}</p>
            {result && (
              <div className="mt-5 rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold text-[#37634d]">{t(lang, "generatedCount", { n: result.credentials.length })}</p>
                <Button onClick={downloadCredentials} variant="outline" className="mt-3 rounded-full border-[#b9d4c1] text-[#47705d]">
                  <Download className="mr-2 h-4 w-4" />
                  {t(lang, "downloadCredentials")}
                </Button>
                <p className="mt-3 text-[11px] leading-5 text-[#8a9891]">{result.warning}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <p className="mt-4 text-xs text-[#8a9891]">
        <LockKeyhole className="mr-1 inline h-3 w-3" />
        學生登入測試請用 <a href="/student-login" className="underline">/student-login</a>
      </p>
    </div>
  );
}
