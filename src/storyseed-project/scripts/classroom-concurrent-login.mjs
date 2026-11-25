#!/usr/bin/env node
/*
 * Concurrent classroom login probe.
 * Usage:
 *   BASE_URL=https://….hostingersite.com \
 *   TEACHER_EMAIL=… TEACHER_PASSWORD=… \
 *   STUDENT_USER_PREFIX=load STUDENT_CODE=… \
 *   node scripts/classroom-concurrent-login.mjs
 *
 * Without student credentials, still fires 40 distinct usernames (expect 401,
 * not 500 / class-wide rate-limit) plus one teacher attempt.
 */
const BASE = (process.env.BASE_URL || "https://stately-mediumvioletred-kudu-80.hostingersite.com").replace(/\/$/, "");
const STUDENT_COUNT = Number(process.env.STUDENT_COUNT || 40);
const ORIGIN = BASE;

async function trpcMutation(path, input, cookieJar = "") {
  const res = await fetch(`${BASE}/api/trpc/${path}?batch=1`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: ORIGIN,
      ...(cookieJar ? { cookie: cookieJar } : {}),
    },
    body: JSON.stringify({ 0: { json: input } }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { parseError: text.slice(0, 200) };
  }
  return { status: res.status, json, setCookie, ok: res.ok };
}

function summarize(label, results) {
  const counts = {};
  for (const r of results) {
    const msg =
      r.json?.[0]?.error?.json?.message ||
      r.json?.[0]?.result?.data?.json?.success ||
      r.json?.parseError ||
      `http-${r.status}`;
    const key = String(msg);
    counts[key] = (counts[key] || 0) + 1;
  }
  console.log(`\n=== ${label} (${results.length}) ===`);
  for (const [k, v] of Object.entries(counts)) console.log(`  ${v}× ${k}`);
  const failures500 = results.filter((r) => r.status >= 500).length;
  const rateLimited = results.filter((r) =>
    String(r.json?.[0]?.error?.json?.message || "").includes("過於頻繁")
  ).length;
  return { failures500, rateLimited, counts };
}

async function main() {
  console.log(`BASE_URL=${BASE}`);
  console.log(`STUDENT_COUNT=${STUDENT_COUNT}`);

  const health = await fetch(`${BASE}/healthz`).then((r) => r.json());
  console.log("healthz", health);

  const teacherEmail = process.env.TEACHER_EMAIL || "teacher-drill@chungsing.edu.hk";
  const teacherPassword = process.env.TEACHER_PASSWORD || "DrillTeacher01";
  const studentPrefix = process.env.STUDENT_USER_PREFIX || "load-student";
  const studentCode = process.env.STUDENT_CODE || "DRILLCODE01";
  const knownStudent = process.env.STUDENT_USERNAME || "student-p6-drill";

  const studentJobs = Array.from({ length: STUDENT_COUNT }, (_, i) => {
    const username =
      process.env.STUDENT_USERNAME_LIST?.split(",")[i]?.trim() ||
      `${studentPrefix}-${String(i + 1).padStart(2, "0")}`;
    return () =>
      trpcMutation("accounts.studentLogin", {
        username,
        code: studentCode,
      });
  });

  // Also try the known drill student once (if seed exists).
  studentJobs.push(() =>
    trpcMutation("accounts.studentLogin", {
      username: knownStudent,
      code: studentCode,
    })
  );

  const started = Date.now();
  const [teacher, ...students] = await Promise.all([
    trpcMutation("accounts.teacherLogin", {
      email: teacherEmail,
      password: teacherPassword,
    }),
    ...studentJobs.map((job) => job()),
  ]);
  const elapsedMs = Date.now() - started;

  console.log(`\nelapsedMs=${elapsedMs}`);
  console.log("teacher", JSON.stringify(teacher.json)?.slice(0, 300));

  const studentSummary = summarize("students", students);
  const teacherOk = Boolean(teacher.json?.[0]?.result?.data?.json?.success);
  const studentSuccesses = students.filter((r) =>
    r.json?.[0]?.result?.data?.json?.success
  ).length;

  const healthAfter = await fetch(`${BASE}/healthz`).then((r) => r.json());
  console.log("healthz_after", healthAfter);

  const report = {
    base: BASE,
    elapsedMs,
    teacherOk,
    studentSuccesses,
    studentFailures500: studentSummary.failures500,
    studentRateLimited: studentSummary.rateLimited,
    healthBefore: health,
    healthAfter,
  };
  console.log("\nREPORT", JSON.stringify(report, null, 2));

  if (studentSummary.failures500 > 0 || teacher.status >= 500) {
    process.exitCode = 2;
    console.error("FAIL: server returned 5xx under concurrent login");
  } else if (studentSummary.rateLimited > 0) {
    process.exitCode = 3;
    console.error("FAIL: class-wide rate limit tripped during 40-student wave");
  } else {
    console.log(
      "PASS: concurrent wave completed without 5xx or class-wide rate limit"
    );
    if (!teacherOk && studentSuccesses === 0) {
      console.warn(
        "NOTE: no credentials succeeded — Hostinger DB may lack drill seed. Infrastructure stayed healthy."
      );
      process.exitCode = 0;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
