# Section C — Pricing Package (redraft)

Replace the current Section C in IXP-Q027. Amounts are HKD. This redraft prices completion of the StorySeed demo the School has already seen. It does not price a new product.

One alignment with Section D is required if this text is adopted: delete the sentence that gives twelve months of warranty and hosting inside the development fee. Hosting is monthly from go-live. Defect support included in C-1 lasts eight weeks.

---

## Section C — Pricing Package

All amounts are quoted and payable in Hong Kong dollars.

The School receives a hosted, non-exclusive licence to the StorySeed service described in Section B for the subscription period. Platform source code remains InnovateXP Limited’s Platform IP.

This quotation has three pricing categories:

- **C-1** One-off production completion and go-live
- **C-2** Monthly hosting, and an optional support plan
- **C-3** Ad hoc on-site and remote support outside C-2

The following are outside C-1, C-2 and C-3 unless a separate written quotation is accepted: handwriting OCR, on-premise or custom model training, EPUB or flipbook conversion, illustration and print buying, extra classes beyond the agreed P5 and P6 groups, single sign-on to the School’s learning system, and features not listed in Section B.

## Section C-1 — Production completion and go-live

C-1 completes, brands and deploys the demonstrated StorySeed application for the School’s P5 and P6 classes. The man-day rate is HKD 2,000, the same rate as Section C-3.

| Item | Scope of work | Man-days | Amount (HKD) |
| --- | --- | ---: | ---: |
| 1. Deployment | One always-on application service in a Singapore region, managed MySQL, object storage for anthology PDFs, HTTPS, environment secrets, and the first database migration. Teacher and student sign-in use school-issued usernames and passwords. | 4 | 8,000 |
| 2. Data model | Foreign keys; school codes unique inside a class and year; seed rows for the two classes and 15 lessons; one writing per student per lesson; `lessonProgress` for saved lesson text and checklists; anthology fields for status, category, editor note, confirmation, level and a body snapshot. | 3 | 6,000 |
| 3. Student portal | Persist lesson saves across refresh; Chinese character count; show a rubric score only after a real evaluation; five-stage version history; issue cards, reflection and the limited AI coach already demonstrated. | 4 | 8,000 |
| 4. Teacher portal | Live class overview from the database; proofreading review queue; anthology desk reading and writing `anthologyItems`; create a class, then CSV account import. Sample counts and the five demo pieces are removed from the live school site. | 4 | 8,000 |
| 5. Admin and care | Admin control of teacher and student menu access; scheduled database backup; one monthly summary email to a named teacher address. | 4 | 8,000 |
| 6. Go-live | School acceptance test on the production URL, and handover of admin, backup and restore notes. | 2 | 4,000 |
| **C-1 total** | | **21** | **42,000** |

C-1 includes eight weeks of hypercare after the go-live date. Hypercare covers defect fixes and security patches in the delivered scope. It does not include new screens, extra classes, data entry, or training beyond one remote handover session of up to two hours.

Handwriting OCR is not included. If the School requires students to submit photographed handwritten work, that work will be quoted separately after a sample set is reviewed.

## Section C-2 — Hosting and optional support

Hosting starts on the go-live date and is independent of the support plan. Tick one support row. Response time means acknowledgement and triage, not a guaranteed fix. Support hours are Monday to Friday, 09:00–18:00 Hong Kong time, excluding public holidays.

A support plan, if ticked, starts the day after the eight-week hypercare period. The School may ask for it to start earlier. Major new features, extra classes, third-party fees above the allowances below, and work outside Section B are quoted separately.

| Service | What is included | Amount (HKD) | Tick |
| --- | --- | ---: | --- |
| Hosting | Always-on application service, MySQL, and file storage in a Singapore region. LLM usage up to HKD 600 per month. Provider cost above that allowance is billed at cost after written notice to the School. | 900 per month | Required from go-live |
| Support — Basic | Uptime and error monitoring; security patching; monthly backup restore check; LLM key and storage checks; up to 2 hours of minor defect fixes per month; email support during support hours. | 1,800 per month | ☐ |
| Support — Premium | Everything in Basic, plus up to 4 hours per month of agreed small changes, and one half-day on-site or remote visit per school term. | 3,200 per month | ☐ |

Annual prepayment of a support plan covers 12 months and is charged at 85% of the monthly support total. Hosting is not discounted, because it follows provider cost.

If no support row is ticked, post-hypercare help is available only under Section C-3.

## Section C-3 — Ad hoc on-site and remote support

For a School that does not take a C-2 support plan, or that needs time beyond that plan. Purchased in days or weeks. A week is five working days and is charged at 70% of the daily rate. Hours are Monday to Friday, 09:00–18:00 Hong Kong time, excluding public holidays. Unused days expire six months after payment.

| Service | What is included | Amount (HKD) |
| --- | --- | ---: |
| Daily | One day (8 hours) on site or remote: defect triage, configuration, small changes, data fixes, user training, or a health check. | 2,000 per day |
| Weekly | Five working days. | 7,000 per week |

## Payment, for use with Section D

Development fee (C-1): 50% on commencement, 50% on written acceptance of the production site.

Hosting (C-2): monthly in advance from the go-live date, payable by the 7th of each month.

Support plan (C-2): monthly in advance from the plan start date, or annually in advance if the School chooses the annual rate.

Ad hoc support (C-3): payable in full on booking. For a booking longer than three days, 50% on booking and 50% on completion.
