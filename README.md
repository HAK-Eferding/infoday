# Infoday · HAK/HAS Eferding

Mini-Webapp für den Tag der offenen Tür: Raumplan, Stationen-Checkliste und Umfrage.
Reine statische Seite (HTML/CSS/JavaScript, kein Build-Schritt), gehostet über GitHub Pages.

## Was muss ich wo ändern?

| Was | Datei |
| --- | --- |
| Stationen, Namen, Beschreibungen | [`data/stationen.csv`](data/stationen.csv) |
| Datum in der Kopfzeile, Link zur MS-Forms-Umfrage | [`js/config.js`](js/config.js) |
| Raumgeometrie (nur bei Umbauten nötig) | [`js/plan-data.js`](js/plan-data.js) |

Nach jedem Commit auf `main` wird die Seite automatisch neu veröffentlicht (dauert ca. 1 Minute).

### Stationen (`data/stationen.csv`)

```
id,stockwerk,name,beschreibung
nawi,EG,NAWI,Experimente zum Mitmachen
mathe-rk-ethik,1. Stock,Mathematik / RK / Ethik,
```

- **id** – verbindet die Zeile mit dem Raum im Plan. Nicht ändern.
- **stockwerk** – nur zur Orientierung in der Datei.
- **name** – ` / ` erzeugt im Plan einen Zeilenumbruch. In der Checkliste wird daraus „Mathematik · RK · Ethik“.
  Endet eine Zeile mit `-` (z. B. `Ausbildungs- / schwerpunkte`), wird das Wort in Listen wieder zusammengefügt.
- **beschreibung** – erscheint beim Antippen der Station. Darf leer bleiben.
  Enthält der Text ein Komma, muss er unter Anführungszeichen stehen: `"Workshops, Quiz und mehr"`.
- **Reihenfolge** der Zeilen = Reihenfolge in der Checkliste.

Jeder Raum im Plan hat eine id. Wer einen weiteren Raum zur Station machen möchte, fügt einfach eine Zeile mit dessen id hinzu;
wird eine Zeile gelöscht, ist der Raum wieder ein normaler grauer Raum.

<details>
<summary>Alle Raum-ids</summary>

**Erdgeschoss:** recht-vow, raum-13, nawi, raum-11, edv4, omai-smk, raum-8, genossenschaft, eg-r1, 1as, aerztin, eg-r2, eg-r3, 4bk,
deutsch-pbsk, sprachen, edv5, marktplatz, garderobe-lehrer, garderobe-lehrerinnen, eg-r4 … eg-r10, konferenzzimmer, admin, direktion

**1. Stock:** 4ak, 3bk, raum-24, ausbildungsschwerpunkte, edv2, 5bk, 5ak, raum-29, besp, og-r1, raum-35, 3ak,
kfm-winf, mathe-rk-ethik, pbgw-geo-iwk, 2bk

</details>

### Umfrage (Microsoft Forms)

1. In Forms die Umfrage erstellen und unter *Einstellungen* **„Jeder kann antworten“** wählen.
2. *Antworten sammeln* → Link kopieren.
3. Link in `js/config.js` bei `formsUrl` eintragen.

Die Umfrage wird eingebettet angezeigt; zusätzlich gibt es einen Link, um sie im Browser zu öffnen.
Solange `formsUrl` leer ist, steht dort „Umfrage folgt“.

## GitHub Pages einrichten (einmalig)

Repository → *Settings* → *Pages* → *Source*: **GitHub Actions**.
Danach ist die Seite unter `https://hak-eferding.github.io/infoday/` erreichbar.

## Lokal testen

Die CSV wird per `fetch` geladen, daher funktioniert ein Doppelklick auf `index.html` nicht. Stattdessen:

```
python3 -m http.server
```

und <http://localhost:8000> öffnen.

## Datenschutz

Die Seite lädt keine externen Schriften oder Skripte. Die Haken der Checkliste werden nur lokal im Browser
des Besuchers gespeichert (localStorage) und nirgendwohin übertragen.
