# Ausport Google

Google Apps Script scheduler untuk memicu GitHub Actions pada repository Node.js:

- Target repository: `indra-boop/ausport-scraper`
- Target workflow: `.github/workflows/scrape.yml`
- Target branch: `main`

## Architecture

```text
Google Apps Script time trigger
        ↓ workflow_dispatch
GitHub Actions
        ↓
Node.js 22 + Chromium
        ↓
ausport-scraper
        ↓
Dashboard ingest API + results.csv
```

## Required Script Property

Tambahkan property berikut pada Google Apps Script:

```text
GITHUB_TOKEN=github_pat_xxxxxxxxx
```

Token tidak boleh disimpan di repository.

## Functions

- `triggerAusportScraper()` — memicu GitHub Actions secara manual/terjadwal.
- `getLatestAusportRun()` — membaca run terbaru hasil `workflow_dispatch`.
- `installThreeHourlyTrigger()` — memasang trigger setiap 3 jam.
- `deleteSchedulerTriggers()` — menghapus trigger scheduler agar tidak duplicate.

## Setup

1. Buat standalone Google Apps Script project.
2. Salin `src/Code.gs` dan `src/appsscript.json` ke project Apps Script.
3. Tambahkan `GITHUB_TOKEN` pada **Project Settings → Script Properties**.
4. Jalankan `triggerAusportScraper()` untuk test manual.
5. Expected response GitHub: HTTP `204`.
6. Jalankan `installThreeHourlyTrigger()` sekali untuk mengaktifkan schedule.

## Security

- Gunakan fine-grained GitHub PAT.
- Batasi repository hanya ke `indra-boop/ausport-scraper`.
- Permission minimum: Actions `Read and write`, Contents `Read-only`, Metadata `Read-only`.
- Jangan commit `.clasp.json`, token, `.env`, atau OAuth credentials.

## Scheduler Ownership

Bila Apps Script menjadi scheduler utama, hapus blok `schedule:` dari workflow `ausport-scraper` agar tidak terjadi duplicate execution. Pertahankan `workflow_dispatch:`.
