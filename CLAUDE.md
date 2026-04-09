# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## WHAT

RBI Agent System — automazione business basata sull'architettura Rules-Brain-Implementation.

**Tech stack:** Python 3.11+, Google APIs (Gmail + Sheets), ClickUp API, Apify, Anthropic API, Modal.com

**Struttura progetto:**

- `rules/` — SOP in Markdown (una per workflow). Leggi SEMPRE la Rule prima di eseguire.
- `implementation/` — Script Python deterministici. Uno script = una responsabilita'.
- `.tmp/` — File temporanei e stato delle esecuzioni (rigenerabile, cancellabile).
- `.env` — Segreti e API key (mai committare).

**Workflow disponibili:**

| Workflow | Rule | Script principali |
|----------|------|-------------------|
| Cold outreach | `rules/cold_outreach_leads.md` | `scrape_leads.py` → `generate_cold_email.py` → `write_to_sheets.py` |
| Onboarding email | `rules/onboarding_email.md` | `send_onboarding_email.py` |
| CRM automations | `rules/clickup_automations.md` | `crm_poll_changes.py` → `send_crm_notification.py` |
| Invoice reminders | `rules/clickup_automations.md` | `invoice_check_unpaid.py` → `send_invoice_reminder.py` |
| CRM webhook (cloud) | `rules/deploy_modal_crm.md` | `modal_crm_welcome.py` + `modal_setup_secrets.py` |

**Utility condivisi:** `load_env.py`, `google_auth.py`, `clickup_api.py`, `alert_user.py`

## HOW

**Setup:**

```bash
pip3 install -r requirements.txt
cp .env.example .env  # aggiungi le API key reali
```

**Test:** `python3 -m pytest implementation/test_all.py -v`

**Esecuzione workflow:** leggi la Rule in `rules/`, segui gli step, valida ogni output.

## WHY — Architettura RBI

Tre livelli separati di responsabilita':

- **Rules** (`rules/`) — COSA deve succedere. Non eseguono nulla.
- **Brain** (Tu, l'agent) — QUANDO e QUALE strumento usare. Non esegui logica direttamente.
- **Implementation** (`implementation/`) — COME il lavoro viene svolto. Codice deterministico.

Se un LLM pensa ed esegue allo stesso tempo, gli errori si moltiplicano (5 step al 90% = 59% totale). Separando orchestrazione da esecuzione, l'affidabilita' resta alta.

**Principi operativi:**

1. Leggi la Rule → Seleziona lo script → Valida l'output
2. Riusa script esistenti in `implementation/` prima di crearne di nuovi
3. Persisti lo stato in `.tmp/run_state.json` dopo ogni step completato
4. Se l'output non corrisponde alle aspettative: fermati e diagnostica
5. Budget tentativi: max 3, poi chiedi all'utente
6. Quando impari qualcosa di nuovo, aggiorna la Rule corrispondente
7. Se un workflow ha piu' step, valida OGNI passaggio prima di proseguire

**Notifiche:** dopo task lunghi, esegui `python3 implementation/alert_user.py success|waiting`

## DON'TS

- Non committare `.env`, `credentials.json`, `token.json`
- Non eseguire script senza leggere prima la Rule corrispondente in `rules/`
- Non saltare la validazione degli output tra uno step e l'altro
- Non inventare logica che appartiene agli script — crea un nuovo script se serve
- Non sovrascrivere Rules senza permesso — versiona (`v1`, `v2`)
- Non procedere in modo ottimistico se un output non torna
