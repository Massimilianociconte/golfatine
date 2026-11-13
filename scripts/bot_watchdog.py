#!/usr/bin/env python3
"""Watchdog cloud del bot golfatine (GitHub Actions, gratis, solo RSS).

Il bot vero gira sul Mac. Se il Mac resta spento o il bot si blocca, questo
controllo giornaliero se ne accorge: golfatine con "golf" nel titolo
pubblicate da piu' di GRACE_HOURS ore e non ancora integrate/decise nel
ledger -> apre (o aggiorna) UNA issue "[bot] golfatine in attesa".
Quando non c'e' piu' nulla in attesa, chiude l'issue.

Non scarica video (YouTube blocca i datacenter): legge solo i feed RSS.
"""

import datetime as dt
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import youtube_watch as watch  # noqa: E402

GRACE_HOURS = int(os.environ.get("GRACE_HOURS", "36"))
TITLE = "[bot] golfatine in attesa: il bot sul Mac non le ha ancora integrate"


def gh(*args):
    return subprocess.run(["gh", *args], capture_output=True, text=True)


def main():
    now = dt.datetime.now(dt.timezone.utc)
    pending = []
    for c in watch.candidates():
        if c["kind"] != "strong":
            continue
        age = now - dt.datetime.fromisoformat(c["published"])
        if age.total_seconds() > GRACE_HOURS * 3600:
            pending.append((c, age))
    r = gh("issue", "list", "--state", "open", "--search", f'in:title "{TITLE}"',
           "--json", "number,title")
    issues = [i for i in json.loads(r.stdout or "[]") if i["title"] == TITLE]
    if not pending:
        print("nessuna golfatina in attesa oltre la soglia")
        for i in issues:
            gh("issue", "close", str(i["number"]), "--comment", "Tutto integrato, chiudo.")
        return 0
    lines = [f"- {c['date']} **{c['channel']}** [{c['title']}]({c['url']}) "
             f"(da {age.total_seconds() / 3600:.0f}h)" for c, age in pending]
    body = (f"Questi video sono usciti da più di {GRACE_HOURS} ore ma il bot non li ha "
            f"ancora integrati né messi in revisione:\n\n" + "\n".join(lines) +
            "\n\nProbabile causa: Mac spento/in stop o bot fermo. Controlla "
            "`~/Library/Logs/golfatine-bot.log` oppure lancia `bash ~/.golfatine-bot/run.sh`.\n"
            f"\n_Aggiornato {now:%Y-%m-%d %H:%M} UTC dal watchdog._")
    print(body)
    if issues:
        gh("issue", "edit", str(issues[0]["number"]), "--body", body)
    else:
        r = gh("issue", "create", "--title", TITLE, "--body", body)
        print(r.stdout or r.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
