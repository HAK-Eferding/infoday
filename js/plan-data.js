// Geometrie der Raumpläne.
// Koordinaten stammen 1:1 aus den Plänen in Druckdatei_Raumplan.pdf (Bild 1600 × 1131 px),
// daher stimmen die Größenverhältnisse exakt mit dem Original überein.
//
// Jeder Raum hat eine id. Steht diese id in data/stationen.csv, wird der Raum zur Station
// (rot, antippbar, auf der Checkliste). Sonst wird er als normaler grauer Raum gezeichnet.
//
// r:     [x1, y1, x2, y2]
// type:  room | infra | landmark | stairs
// label: Beschriftung, wenn der Raum KEINE Station ist (" / " = Zeilenumbruch)

export const FLOORS = {
  eg: {
    name: 'Erdgeschoss',
    short: 'EG',
    outline: [[5, 346], [1593, 346], [1593, 1012], [834, 1012], [834, 764], [5, 764]],
    rooms: [
      // obere Reihe
      { id: 'recht-vow', r: [11, 353, 204, 528], label: 'Recht / VOW' },
      { id: 'raum-13', r: [206, 353, 302, 528], label: 'Raum 13' },
      { id: 'nawi', r: [305, 353, 395, 528], label: 'NAWI' },
      { id: 'raum-11', r: [398, 353, 460, 528], label: 'Raum 11' },
      { id: 'edv4', r: [463, 353, 623, 528], label: 'EDV4 / Raum 10' },
      { id: 'omai-smk', r: [626, 353, 833, 528], label: 'OMAI / SMK' },
      { id: 'raum-8', r: [836, 353, 899, 528], label: 'Raum 8' },
      { id: 'genossenschaft', r: [910, 474, 1053, 528], label: 'Schüler:innen- / genossenschaft' },
      { id: 'eg-r1', r: [1060, 353, 1118, 528] },
      { id: '1as', r: [1121, 353, 1276, 528], label: '1AS / Raum 18' },
      { id: 'aerztin', r: [1279, 353, 1342, 528], label: 'Ärztin / Raum 19' },
      { id: 'eg-r2', r: [1345, 353, 1403, 528] },
      { id: 'eg-r3', r: [1406, 353, 1466, 528] },
      { id: '4bk', r: [1469, 353, 1587, 528], label: '4BK / Raum 21' },

      // untere Reihe links
      { id: 'deutsch-pbsk', r: [11, 580, 268, 757], label: 'Deutsch / PBSK' },
      { id: 'sprachen', r: [271, 580, 454, 757], label: 'Spanisch / Englisch / Erasmus', labelBox: [271, 627, 454, 757] },
      { id: 'eg-abstell', r: [273, 582, 356, 625], noHit: true },
      { id: 'edv5', r: [457, 580, 623, 757], label: 'EDV5 / Raum 16' },
      { id: 'marktplatz', r: [626, 580, 833, 757], label: 'Marktplatz / Übungsfirmen' },

      // Eingangshalle
      { id: 'eingang', r: [842, 759, 905, 1005], type: 'landmark', label: 'Eingang', icon: 'door' },
      { id: 'buffet', r: [987, 857, 1039, 979], type: 'landmark', label: 'Buffet', icon: 'food' },

      // Mitteltrakt rechts
      { id: 'eg-stiege', r: [1061, 583, 1156, 750], type: 'stairs', label: 'Stiege' },
      { id: 'garderobe-lehrer', r: [1061, 753, 1156, 802], label: 'Garderobe / Lehrer' },
      { id: 'eg-wc1', r: [1160, 583, 1190, 689], type: 'infra', label: 'WC' },
      { id: 'eg-lift', r: [1193, 583, 1223, 689], type: 'infra', label: 'Lift' },
      { id: 'eg-wc2', r: [1226, 583, 1255, 689], type: 'infra', label: 'WC' },
      { id: 'eg-bwc', r: [1160, 692, 1223, 802], type: 'infra', label: 'WC / ♿' },
      { id: 'garderobe-lehrerinnen', r: [1226, 692, 1335, 800], label: 'Garderobe / WC / Lehrerinnen' },
      { id: 'eg-r4', r: [1258, 583, 1335, 689] },
      { id: 'eg-r5', r: [1338, 583, 1476, 689] },
      { id: 'eg-r6', r: [1338, 692, 1476, 800] },
      { id: 'eg-r7', r: [1479, 583, 1587, 689] },
      { id: 'eg-r8', r: [1479, 692, 1587, 800] },
      { id: 'eg-r9', r: [1533, 805, 1587, 843] },

      // untere Reihe rechts
      { id: 'eg-r10', r: [1063, 845, 1099, 1005] },
      { id: 'konferenzzimmer', r: [1101, 845, 1364, 1005], label: 'Konferenzzimmer' },
      { id: 'admin', r: [1367, 845, 1425, 1005], label: 'Admin' },
      { id: 'sek', r: [1428, 845, 1494, 1005], type: 'infra', label: 'SEK' },
      { id: 'direktion', r: [1497, 845, 1587, 1005], label: 'Direktion' },
    ],
  },

  og1: {
    name: '1. Stock',
    short: '1. OG',
    outline: [[94, 193], [1159, 193], [1159, 486], [1525, 486], [1525, 1012], [563, 1012], [563, 719], [94, 719]],
    rooms: [
      // obere Reihe
      { id: '4ak', r: [100, 200, 336, 425], label: '4AK / Raum 26' },
      { id: '3bk', r: [339, 200, 576, 425], label: '3BK / Raum 25' },
      { id: 'raum-24', r: [580, 200, 658, 425], label: 'Netzwerk- / raum / Raum 24' },
      { id: 'ausbildungsschwerpunkte', r: [661, 200, 914, 425], label: 'Ausbildungs- / schwerpunkte' },
      { id: 'edv2', r: [917, 200, 1152, 425], label: 'EDV 2 / Raum 22' },

      // mittlere Reihe links
      { id: '5bk', r: [100, 491, 330, 712], label: '5BK / Raum 28' },
      { id: '5ak', r: [333, 491, 566, 712], label: '5AK / Raum 27' },
      { id: 'raum-29', r: [569, 491, 650, 718], label: 'Schul- / möbel- / lager / Raum 29' },
      { id: 'besp', r: [658, 491, 782, 720], label: 'BESP / Simply Strong' },

      // Mitte
      { id: 'og-stiege', r: [918, 492, 1036, 719], type: 'stairs', label: 'Stiege' },
      { id: 'og-wc1', r: [1040, 492, 1070, 598], type: 'infra', label: 'WC' },
      { id: 'og-lift', r: [1073, 492, 1110, 598], type: 'infra', label: 'Lift' },
      { id: 'og-wc2', r: [1113, 492, 1152, 598], type: 'infra', label: 'WC' },
      { id: 'og-r1', r: [1044, 603, 1152, 719] },
      { id: 'raum-35', r: [1159, 492, 1272, 719], label: 'Lehrmittel- / kabinett / Raum 35' },
      { id: '3ak', r: [1275, 492, 1518, 719], label: '3AK / Raum 34' },

      // untere Reihe
      { id: 'kfm-winf', r: [571, 789, 800, 1005], label: 'kfm. Fächer / WINF' },
      { id: 'mathe-rk-ethik', r: [803, 789, 1037, 1005], label: 'Mathematik / RK / Ethik' },
      { id: 'pbgw-geo-iwk', r: [1040, 789, 1279, 1005], label: 'PBGW / GEO / IWK' },
      { id: '2bk', r: [1282, 789, 1518, 1005], label: '2BK / Raum 33' },
    ],
  },
};
