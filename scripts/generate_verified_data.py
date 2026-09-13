import json
import os
import re

# Complete, verified master dataset extracted and validated from the 14 pages of the original PDF
MASTER_PDF_DATA = [
  {
    "id": 1,
    "title": "SDROGO GOLFATINA ALLA RICERCA DEL PROGETTO GABBINESS",
    "date": "2026-08-09",
    "url": "https://youtu.be/-VpgGrDbnx0?si=AQWNSAnHc2atfUkA",
    "youtubeId": "-VpgGrDbnx0",
    "totalPar": 61,
    "players": [
      {"name": "Delux", "position": 1, "totalScore": 49, "diffPar": -12, "holes": [2,2,1,1,4,2,4,2,3,2,1,1,3,9,2,3,3,4]},
      {"name": "Mollu", "position": 2, "totalScore": 61, "diffPar": 0, "holes": [1,4,1,1,3,4,2,1,5,1,1,5,4,2,4,14,2,6]},
      {"name": "Just Rohn", "position": 3, "totalScore": 64, "diffPar": 3, "holes": [1,1,4,1,2,4,2,1,1,3,1,9,4,3,14,9,1,3]},
      {"name": "GaBBo", "position": 4, "totalScore": 71, "diffPar": 10, "holes": [2,1,1,1,3,5,2,1,4,6,1,2,4,10,2,14,2,10]},
      {"name": "nonsonodread", "position": 5, "totalScore": 78, "diffPar": 17, "holes": [2,3,6,1,2,3,1,1,5,3,1,14,4,1,14,14,1,2]}
    ]
  },
  {
    "id": 2,
    "title": "LA GOLFATINA DEI G**. [NUOVO STANDARD DI REGOLE] con Delux, Rohn, Dread, Mollu & Cannuccia Bianca",
    "date": "2026-08-19",
    "url": "https://youtu.be/9Ht6yvEN_Pg?si=zwjH0HkzGtQG9MTL",
    "youtubeId": "9Ht6yvEN_Pg",
    "totalPar": 86,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 117, "diffPar": 31, "holes": [1,12,8,6,3,8,3,2,9,14,6,6,4,6,5,12,1,11]},
      {"name": "Delux", "position": 2, "totalScore": 120, "diffPar": 34, "holes": [2,5,10,3,6,2,3,4,19,10,4,5,2,9,5,7,5,19]},
      {"name": "Mollu", "position": 3, "totalScore": 122, "diffPar": 36, "holes": [3,14,5,6,14,2,1,2,19,6,2,11,6,2,5,10,8,6]},
      {"name": "nonsonodread", "position": 4, "totalScore": 130, "diffPar": 44, "holes": [2,4,9,4,16,4,2,19,19,4,10,7,3,5,6,4,4,8]},
      {"name": "GaBBo", "position": 5, "totalScore": 181, "diffPar": 95, "holes": [2,7,7,4,3,19,3,2,19,19,6,13,12,19,11,11,5,19]}
    ]
  },
  {
    "id": 3,
    "title": "SDROGO GOLFATINA per il mio COMPLEANNO con Dread, Rohn, Delux, JTaz e Mollu",
    "date": "2026-08-18",
    "url": "https://youtu.be/VydxAl_uxBI?si=jacdrVyMVGrrtHg7",
    "youtubeId": "VydxAl_uxBI",
    "totalPar": 43,
    "players": [
      {"name": "GaBBo", "position": 1, "totalScore": 38, "diffPar": -5, "holes": [4,1,6,2,1,1,2,1,2,2,2,2,2,3,3,1,2,1]},
      {"name": "Just Rohn", "position": 2, "totalScore": 45, "diffPar": 2, "holes": [2,3,1,3,2,1,1,6,3,3,2,3,2,2,4,3,3,1]},
      {"name": "Delux", "position": 3, "totalScore": 47, "diffPar": 4, "holes": [2,1,1,2,1,4,4,5,1,2,3,5,4,3,2,1,5,1]},
      {"name": "nonsonodread", "position": 4, "totalScore": 50, "diffPar": 7, "holes": [3,4,2,1,2,2,6,1,1,3,2,3,2,4,5,1,7,1]},
      {"name": "JTaz", "position": 5, "totalScore": 51, "diffPar": 8, "holes": [2,2,1,3,2,2,7,6,2,7,3,2,4,2,1,2,2,1]},
      {"name": "Mollu", "position": 6, "totalScore": 62, "diffPar": 19, "holes": [4,5,1,2,3,2,2,1,8,4,2,1,11,3,4,4,4,1]}
    ]
  },
  {
    "id": 4,
    "title": "LA GOLFATINA DELLA VERGOGNA! w/ROHN, DREAD, GABBO, DELUX e MOLLU ⛳",
    "date": "2026-08-11",
    "url": "https://youtu.be/K7ObaKsIbM0?si=XOsp_IGLt-c23Nk9",
    "youtubeId": "K7ObaKsIbM0",
    "totalPar": 48,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 42, "diffPar": -6, "holes": [2,4,3,2,1,3,1,4,2,1,1,1,2,1,3,7,1,3]},
      {"name": "Mollu", "position": 2, "totalScore": 55, "diffPar": 7, "holes": [2,2,2,1,1,5,1,6,3,1,2,4,8,2,3,7,3,3]},
      {"name": "nonsonodread", "position": 3, "totalScore": 56, "diffPar": 8, "holes": [1,4,3,2,1,3,5,4,2,2,5,2,6,3,4,1,1,7]},
      {"name": "GaBBo", "position": 4, "totalScore": 58, "diffPar": 10, "holes": [1,6,4,2,1,4,4,3,3,2,1,5,6,2,3,3,3,4]},
      {"name": "Delux", "position": 5, "totalScore": 62, "diffPar": 14, "holes": [2,7,9,3,1,3,3,5,2,1,2,1,5,3,13,11,2,1]}
    ]
  },
  {
    "id": 5,
    "title": "C'É UN PO DI GOLFATINA IN QUESTA CENSURA. con Delux, Rohn, Dread & JTaz",
    "date": "2026-09-01",
    "url": "https://youtu.be/LMg9XwLmyhs?si=wkKe0fUuxTRXKc5D",
    "youtubeId": "LMg9XwLmyhs",
    "totalPar": 62,
    "players": [
      {"name": "Delux", "position": 1, "totalScore": 93, "diffPar": 31, "holes": [15,10,18,2,3,3,6,8,3,2,2,1,2,4,1,2,5,6]},
      {"name": "nonsonodread", "position": 1, "totalScore": 93, "diffPar": 31, "holes": [12,11,8,3,4,5,6,10,4,2,4,2,3,4,1,5,5,4]},
      {"name": "JTaz", "position": 2, "totalScore": 96, "diffPar": 34, "holes": [8,13,9,1,4,7,10,6,4,2,5,2,2,3,4,7,4,5]},
      {"name": "Just Rohn", "position": 3, "totalScore": 101, "diffPar": 39, "holes": [6,11,8,2,3,6,7,18,4,2,8,2,2,3,7,3,6,3]}
    ]
  },
  {
    "id": 6,
    "title": "BENVENUTI ALL'INFERNO: SDROGO GOLFATINA DEMONIACA ( mappa folle )",
    "date": "2026-08-30",
    "url": "https://youtu.be/xC_YNHOFDE4?si=i340NNzCeHZ_gq2P",
    "youtubeId": "xC_YNHOFDE4",
    "totalPar": 90,
    "players": [
      {"name": "ilMasseo", "position": 1, "totalScore": 105, "diffPar": 15, "holes": [2,8,2,3,3,16,5,4,5,3,6,13,10,4,2,9,4,6]},
      {"name": "GaBBo", "position": 2, "totalScore": 110, "diffPar": 20, "holes": [6,3,5,3,7,7,6,2,7,5,6,16,2,7,1,8,16,3]},
      {"name": "nonsonodread", "position": 3, "totalScore": 116, "diffPar": 26, "holes": [4,8,4,6,5,4,6,7,6,3,7,3,7,6,14,9,12,5]},
      {"name": "Just Rohn", "position": 4, "totalScore": 117, "diffPar": 27, "holes": [3,5,8,13,4,10,4,5,7,3,3,9,6,3,6,16,7,5]},
      {"name": "Delux", "position": 5, "totalScore": 120, "diffPar": 30, "holes": [1,6,6,5,5,12,6,8,9,3,3,6,7,3,2,16,11,11]},
      {"name": "Mollu", "position": 6, "totalScore": 154, "diffPar": 64, "holes": [5,12,8,16,8,13,6,4,1,16,14,16,3,1,8,7,10,6]}
    ]
  },
  {
    "id": 7,
    "title": "LA GOLFATINA NEL MUSEO...PRENDE SUBITO UNA BRUTTA PIEGA...w/ROHN, DREAD, GABBO, DELUX e MOLLU ⛳",
    "date": "2026-08-21",
    "url": "https://youtu.be/XXTN5QD3PXc?si=NxZZhhXqZeLzHQpD",
    "youtubeId": "XXTN5QD3PXc",
    "totalPar": 55,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 54, "diffPar": -1, "holes": [2,1,4,4,1,5,1,2,1,4,4,6,3,10,4,2,1,2]},
      {"name": "nonsonodread", "position": 2, "totalScore": 55, "diffPar": 0, "holes": [3,3,3,3,2,5,1,2,2,2,1,2,3,3,2,4,3,1]},
      {"name": "Delux", "position": 3, "totalScore": 57, "diffPar": 2, "holes": [4,3,5,3,2,3,2,2,2,5,3,4,4,3,1,1,1,2]},
      {"name": "Mollu", "position": 4, "totalScore": 61, "diffPar": 6, "holes": [10,4,2,10,2,3,2,4,3,1,3,1,1,1,2,8,1,3]},
      {"name": "GaBBo", "position": 5, "totalScore": 78, "diffPar": 23, "holes": [8,6,3,8,5,3,3,5,5,3,7,2,3,2,2,3,8,2]}
    ]
  },
  {
    "id": 8,
    "title": "LA MEGA GOLFATA DEGLI DEI (ilmasseo ha fatto arrabbiare Zeus) con Dread, Gabbo, Mollu, Delux, Masseo",
    "date": "2026-08-08",
    "url": "https://youtu.be/HQalUVkaCS8?si=15YoMImz0DTJm2OA",
    "youtubeId": "HQalUVkaCS8",
    "totalPar": 72,
    "players": [
      {"name": "nonsonodread", "position": 1, "totalScore": 62, "diffPar": -10, "holes": [2,5,3,3,4,3,3,2,6,3,3,4,4,4,5,3,2,1]},
      {"name": "Delux", "position": 2, "totalScore": 79, "diffPar": 7, "holes": [2,2,3,4,13,4,3,2,5,5,5,3,6,7,5,3,16,1]},
      {"name": "ilMasseo", "position": 3, "totalScore": 81, "diffPar": 9, "holes": [2,5,4,2,3,3,6,4,3,5,4,1,5,6,4,5,16,3]},
      {"name": "Mollu", "position": 4, "totalScore": 84, "diffPar": 12, "holes": [2,3,3,2,4,3,6,3,2,6,5,7,2,5,5,3,7,16]},
      {"name": "GaBBo", "position": 4, "totalScore": 84, "diffPar": 12, "holes": [2,3,2,4,4,3,4,3,5,7,4,4,4,7,16,3,4,5]}
    ]
  },
  {
    "id": 9,
    "title": "LA MIA PRIMISSIMA GOLFATINA con Delux Rohn Gabbo e Jtaz",
    "date": "2026-08-21",
    "url": "https://youtu.be/LC3bdmO-AGI?si=_DtAeH5CmrHsoBzM",
    "youtubeId": "LC3bdmO-AGI",
    "totalPar": 55,
    "players": [
      {"name": "Mollu", "position": 1, "totalScore": 46, "diffPar": -9, "holes": [3,2,2,1,3,6,1,4,2,2,2,3,2,1,3,3,3,3]},
      {"name": "Just Rohn", "position": 2, "totalScore": 50, "diffPar": -5, "holes": [1,2,2,1,2,5,4,4,3,2,1,4,2,1,2,6,4,4]},
      {"name": "JTaz", "position": 3, "totalScore": 54, "diffPar": -1, "holes": [1,2,1,3,4,6,1,5,2,3,2,3,3,2,3,4,4,5]},
      {"name": "Delux", "position": 4, "totalScore": 65, "diffPar": 10, "holes": [1,1,2,1,6,9,1,1,14,4,2,4,3,2,1,4,1,8]},
      {"name": "GaBBo", "position": 5, "totalScore": 68, "diffPar": 13, "holes": [1,1,2,5,3,14,4,4,3,3,3,2,4,1,6,4,4,4]}
    ]
  },
  {
    "id": 10,
    "title": "GOLFATINA DIVERTENTISSIMA con Dread, Rohn, Masseo e Delux",
    "date": "2026-07-25",
    "url": "https://youtu.be/PXNSIH3FsTE?si=M0ycGXcntidlEU3h",
    "youtubeId": "PXNSIH3FsTE",
    "totalPar": 64,
    "players": [
      {"name": "nonsonodread", "position": 1, "totalScore": 57, "diffPar": -7, "holes": [2,1,2,2,4,3,5,3,3,3,2,3,3,6,3,5,4,3]},
      {"name": "Just Rohn", "position": 2, "totalScore": 62, "diffPar": -2, "holes": [2,1,2,4,2,3,2,2,1,2,4,2,4,7,2,9,8,5]},
      {"name": "Delux", "position": 2, "totalScore": 62, "diffPar": -2, "holes": [1,1,2,7,3,2,6,1,3,2,4,2,5,7,5,2,6,3]},
      {"name": "ilMasseo", "position": 3, "totalScore": 64, "diffPar": 0, "holes": [3,1,3,2,5,1,2,3,1,2,2,5,4,4,8,6,7,5]}
    ]
  },
  {
    "id": 11,
    "title": "La PRIMA GOLFATINA non si scorda MAI: Golf With Your Friends ⛳🏌️‍♂️",
    "date": "2026-05-13",
    "url": "https://youtu.be/EJMEBEJzjGo?si=9_PdtZ15WkiuquUl",
    "youtubeId": "EJMEBEJzjGo",
    "totalPar": 59,
    "players": [
      {"name": "ilMasseo", "position": 1, "totalScore": 45, "diffPar": -14, "holes": [4,2,3,2,5,1,1,2,2,2,2,5,2,2,3,3,2,2]},
      {"name": "Mollu", "position": 2, "totalScore": 47, "diffPar": -12, "holes": [2,1,2,2,4,5,2,1,2,4,3,1,4,3,3,1,4,3]},
      {"name": "nonsonodread", "position": 3, "totalScore": 49, "diffPar": -10, "holes": [3,3,3,2,2,4,2,2,2,3,2,2,3,3,3,3,4,3]},
      {"name": "JTaz", "position": 4, "totalScore": 58, "diffPar": -1, "holes": [3,2,2,2,3,3,2,2,6,6,4,4,2,2,2,2,7,4]}
    ]
  },
  {
    "id": 12,
    "title": "MINI-GOLF NATALIZIO con ROHN,DREAD,GABBO e DELUX!",
    "date": "2026-12-15",
    "url": "https://youtu.be/St2VvfXHwpE?si=IVIjvotbsylF7hOB",
    "youtubeId": "St2VvfXHwpE",
    "totalPar": 58,
    "players": [
      {"name": "nonsonodread", "position": 1, "totalScore": 45, "diffPar": -13, "holes": [2,3,2,3,2,3,3,2,3,5,5,2,2,5,3,1,2,1]},
      {"name": "Delux", "position": 2, "totalScore": 48, "diffPar": -10, "holes": [2,2,10,3,3,1,3,4,2,4,3,3,3,4,1,1,1,1]},
      {"name": "Just Rohn", "position": 3, "totalScore": 49, "diffPar": -9, "holes": [2,3,2,3,2,4,3,9,3,4,3,2,5,1,3,1,1,1]},
      {"name": "GaBBo", "position": 4, "totalScore": 50, "diffPar": -8, "holes": [5,3,3,2,2,5,3,2,5,3,8,1,2,2,4,1,1,1]}
    ]
  },
  {
    "id": 13,
    "title": "La SDROGO GOLFATINA di cui NON avevate bisogno",
    "date": "2025-12-17",
    "url": "https://youtu.be/5S6Dq7LAFNA?si=QIQcaOVcYbQqQtth",
    "youtubeId": "5S6Dq7LAFNA",
    "totalPar": 30,
    "players": [
      {"name": "JTaz", "position": 1, "totalScore": 37, "diffPar": 7, "holes": [4,6,3,3,3,2,2,2,7,5]},
      {"name": "Delux", "position": 1, "totalScore": 37, "diffPar": 7, "holes": [2,4,5,5,2,3,4,4,6,2]},
      {"name": "GaBBo", "position": 2, "totalScore": 41, "diffPar": 11, "holes": [3,3,3,6,6,2,7,6,2,3]},
      {"name": "nonsonodread", "position": 3, "totalScore": 43, "diffPar": 13, "holes": [2,6,7,5,4,1,3,4,5,6]},
      {"name": "ilMasseo", "position": 4, "totalScore": 44, "diffPar": 14, "holes": [2,4,8,4,5,2,3,9,3,4]}
    ]
  },
  {
    "id": 18,
    "title": "UNA GOLFATINA PERICOLOSAMENTE NOSTALGICA...",
    "date": "2025-12-18",
    "url": "https://youtu.be/80BMUVxCM9o?si=3IQxfT492VmznoM6",
    "youtubeId": "80BMUVxCM9o",
    "totalPar": 62,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 68, "diffPar": 6, "holes": [2,4,5,3,4,6,4,2,5,4,3,4,5,3,5,4,1,4]},
      {"name": "Delux", "position": 2, "totalScore": 83, "diffPar": 21, "holes": [4,3,1,5,2,3,2,1,7,4,4,5,11,3,4,3,7,14]},
      {"name": "nonsonodread", "position": 3, "totalScore": 84, "diffPar": 22, "holes": [2,4,3,10,5,5,2,2,6,4,6,7,7,3,4,3,5,6]},
      {"name": "GaBBo", "position": 4, "totalScore": 86, "diffPar": 24, "holes": [6,4,4,6,2,8,3,2,4,4,6,6,10,3,3,4,3,8]}
    ]
  },
  {
    "id": 19,
    "title": "GOLFATINA MATTA con I MAESTRI di MAZZE e PALLE | w/Dread, Rohn, Marza, Gabbo, Delux",
    "date": "2025-12-27",
    "url": "https://youtu.be/nORFy_eGVDA?si=uS07eNYXvb2FF5Tu",
    "youtubeId": "nORFy_eGVDA",
    "totalPar": 54,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 43, "diffPar": -11, "holes": [2,3,2,2,1,3,2,2,5,3,2,4,3,2,2,2,1,2]},
      {"name": "Just Marzaa", "position": 2, "totalScore": 45, "diffPar": -9, "holes": [1,2,2,2,1,2,4,3,8,3,1,2,3,1,2,2,2,4]},
      {"name": "Delux", "position": 2, "totalScore": 45, "diffPar": -9, "holes": [3,4,1,2,1,1,3,2,6,2,1,4,4,3,2,2,2,2]},
      {"name": "nonsonodread", "position": 3, "totalScore": 50, "diffPar": -4, "holes": [2,2,2,2,2,3,4,3,4,2,2,5,3,1,2,2,4,5]},
      {"name": "GaBBo", "position": 4, "totalScore": 60, "diffPar": 6, "holes": [3,3,2,2,2,3,4,2,6,3,1,5,4,1,5,3,8,3]}
    ]
  },
  {
    "id": 20,
    "title": "SONO TORNATI I DOMINATORI DEL GOLF | Golfatina con Dread, Rohn, Gabbo, Delux",
    "date": "2026-01-08",
    "url": "https://youtu.be/KadhcxiF6Io?si=H-YrtymEMuzNwyIi",
    "youtubeId": "KadhcxiF6Io",
    "totalPar": 75,
    "players": [
      {"name": "Delux", "position": 1, "totalScore": 58, "diffPar": -17, "holes": [2,1,2,4,2,4,4,2,3,2,5,3,3,5,6,2,4,4]},
      {"name": "Just Rohn", "position": 2, "totalScore": 64, "diffPar": -11, "holes": [2,1,2,3,2,2,3,4,2,3,5,4,3,4,10,2,6,6]},
      {"name": "GaBBo", "position": 3, "totalScore": 67, "diffPar": -8, "holes": [2,2,1,3,1,6,3,5,2,2,4,4,2,7,8,3,5,7]},
      {"name": "nonsonodread", "position": 4, "totalScore": 70, "diffPar": -5, "holes": [3,2,2,4,2,5,2,7,2,4,4,4,4,5,7,3,4,6]}
    ]
  },
  {
    "id": 21,
    "title": "GOLFATINA MAGICA con ROHN,DREAD, DELUX e il MASSEO!",
    "date": "2026-01-09",
    "url": "https://youtu.be/qX7wKf7uupY?si=abPlQVtVvfdGhtjv",
    "youtubeId": "qX7wKf7uupY",
    "totalPar": 55,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 58, "diffPar": 3, "holes": [3,5,7,3,3,2,3,1,6,1,6,3,4,2,9]},
      {"name": "Delux", "position": 2, "totalScore": 59, "diffPar": 4, "holes": [4,3,3,5,5,1,2,2,6,4,4,2,5,3,10]},
      {"name": "nonsonodread", "position": 2, "totalScore": 59, "diffPar": 4, "holes": [4,4,4,4,5,1,7,1,5,4,4,1,4,4,7]},
      {"name": "ilMasseo", "position": 3, "totalScore": 70, "diffPar": 15, "holes": [4,4,4,5,5,4,9,3,5,5,3,2,4,2,11]}
    ]
  },
  {
    "id": 22,
    "title": "LA SDROGO GOLFATINA DI INIZIO ANNO PER INIZIARE QUESTO 2026 AL MEGLIO",
    "date": "2026-01-10",
    "url": "https://youtu.be/fWl8BCgXTxQ?si=X_p_Ai54f_DjK9m7",
    "youtubeId": "fWl8BCgXTxQ",
    "totalPar": 66,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 68, "diffPar": 2, "holes": [1,2,4,3,2,4,3,3,6,4,1,3,3,5,4,5,4,11]},
      {"name": "Delux", "position": 2, "totalScore": 82, "diffPar": 16, "holes": [1,6,4,2,2,7,4,7,6,4,2,5,3,4,3,2,6,14]},
      {"name": "GaBBo", "position": 3, "totalScore": 85, "diffPar": 19, "holes": [3,4,2,2,5,4,6,4,8,4,2,4,4,5,4,4,12,8]},
      {"name": "nonsonodread", "position": 4, "totalScore": 86, "diffPar": 20, "holes": [3,2,4,4,3,7,5,9,8,5,1,3,2,4,3,6,3,14]}
    ]
  },
  {
    "id": 23,
    "title": "LA PRIMA GOLFATINA DELL'ANNO!",
    "date": "2026-01-12",
    "url": "https://youtu.be/4j9iPqrWtw0?si=Ju4cb7uTgC5azY4d",
    "youtubeId": "4j9iPqrWtw0",
    "totalPar": 47,
    "players": [
      {"name": "Delux", "position": 1, "totalScore": 40, "diffPar": -7, "holes": [2,3,3,4,1,1,2,2,1,2,1,2,4,3,1,1,2,5]},
      {"name": "Just Rohn", "position": 2, "totalScore": 46, "diffPar": -1, "holes": [2,1,2,2,1,1,2,2,1,3,1,3,14,1,3,2,2,3]},
      {"name": "ilMasseo", "position": 3, "totalScore": 47, "diffPar": 0, "holes": [2,4,2,2,6,3,5,2,1,3,1,3,1,2,3,2,3,2]},
      {"name": "nonsonodread", "position": 4, "totalScore": 50, "diffPar": 3, "holes": [4,2,3,2,1,1,3,2,1,2,4,3,8,2,2,1,6,3]}
    ]
  },
  {
    "id": 24,
    "title": "GOLFATINA MATTA INSENSATA (regà fermateci) con Dread, Rohn, Gabbo, Mollu",
    "date": "2026-01-22",
    "url": "https://youtu.be/6rJWPcxFRiM?si=I26_ZE7DRXw6xPYl",
    "youtubeId": "6rJWPcxFRiM",
    "totalPar": 72,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 53, "diffPar": -19, "holes": [2,2,4,6,3,3,3,2,4,2,3,3,3,3,3,3,2,2]},
      {"name": "nonsonodread", "position": 2, "totalScore": 54, "diffPar": -18, "holes": [2,3,2,3,2,5,2,4,7,6,2,2,2,3,2,3,1,3]},
      {"name": "Mollu", "position": 3, "totalScore": 56, "diffPar": -16, "holes": [2,5,5,4,2,4,2,2,5,3,2,2,2,3,2,4,2,5]},
      {"name": "GaBBo", "position": 4, "totalScore": 69, "diffPar": -3, "holes": [2,5,3,6,3,5,3,2,5,4,2,3,4,4,2,3,10,3]}
    ]
  },
  {
    "id": 25,
    "title": "GOLFATINA \"HORROR\" CON QUALCHE IMPRECAZIONE DI TROPPO w/ROHN,DREAD, DELUX, JTAZ e il MASSEO!",
    "date": "2026-01-26",
    "url": "https://youtu.be/CULR32YN7mM?si=t-_42LGw9XVN3wPz",
    "youtubeId": "CULR32YN7mM",
    "totalPar": 83,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 62, "diffPar": -21, "holes": [1,4,2,5,3,5,2,4,2,3,3,3,3,3,7,2,6,4]},
      {"name": "JTaz", "position": 2, "totalScore": 63, "diffPar": -20, "holes": [2,3,2,3,2,3,8,3,3,2,4,6,3,3,8,2,4,2]},
      {"name": "Delux", "position": 3, "totalScore": 65, "diffPar": -18, "holes": [1,1,2,5,6,3,3,3,3,2,1,4,4,7,12,3,1,4]},
      {"name": "nonsonodread", "position": 4, "totalScore": 78, "diffPar": -5, "holes": [2,3,4,4,4,4,8,3,2,1,5,3,4,14,6,4,5,2]},
      {"name": "ilMasseo", "position": 4, "totalScore": 78, "diffPar": -5, "holes": [3,3,6,4,5,9,5,4,4,3,3,2,3,3,9,6,4,2]}
    ]
  },
  {
    "id": 26,
    "title": "UNA GOLFATINA OLIMPICA SPA ZIA LE!",
    "date": "2026-01-27",
    "url": "https://youtu.be/u9_inJEE6JA?si=aNxFaPRsPrfySThe",
    "youtubeId": "u9_inJEE6JA",
    "totalPar": 62,
    "players": [
      {"name": "Mollu", "position": 1, "totalScore": 74, "diffPar": 12, "holes": [2,3,2,1,3,4,6,4,2,3,14,4,4,5,2,5,7,3]},
      {"name": "Just Rohn", "position": 2, "totalScore": 77, "diffPar": 15, "holes": [2,2,2,2,6,5,2,4,3,5,3,2,5,6,5,5,14,4]},
      {"name": "Delux", "position": 3, "totalScore": 78, "diffPar": 16, "holes": [2,2,2,1,4,10,4,5,3,10,4,1,4,5,2,4,14,1]},
      {"name": "nonsonodread", "position": 4, "totalScore": 92, "diffPar": 30, "holes": [3,4,3,2,5,2,5,3,5,14,4,2,3,8,4,4,14,7]},
      {"name": "GaBBo", "position": 5, "totalScore": 107, "diffPar": 45, "holes": [2,2,4,3,12,8,4,4,2,6,4,4,11,7,5,6,14,9]}
    ]
  },
  {
    "id": 27,
    "title": "SDROGO GOLFATINA SUPER COMBATTUTA con ilMasseo Dread Delu ( c'è anche Jtaz )",
    "date": "2026-02-05",
    "url": "https://youtu.be/97Z5oHEr8-4?si=v5vXuz6Oa32FDndb",
    "youtubeId": "97Z5oHEr8-4",
    "totalPar": 61,
    "players": [
      {"name": "GaBBo", "position": 1, "totalScore": 87, "diffPar": 26, "holes": [2,2,2,3,2,3,5,2,3,3,12,11,9,4,7,3,7,7]},
      {"name": "ilMasseo", "position": 1, "totalScore": 87, "diffPar": 26, "holes": [2,2,3,2,3,3,4,4,3,5,14,7,8,6,4,7,4,6]},
      {"name": "nonsonodread", "position": 2, "totalScore": 91, "diffPar": 30, "holes": [1,2,3,5,2,1,5,2,3,6,14,8,9,5,7,5,7,6]},
      {"name": "JTaz", "position": 3, "totalScore": 136, "diffPar": 75, "holes": [2,2,2,10,2,14,4,4,2,4,14,7,7,14,14,6,14,14]}
    ]
  },
  {
    "id": 28,
    "title": "GOLFATINA FUORI DI CAPOCCIA con Dread, Gabbo, Masseo, JTaz",
    "date": "2026-02-06",
    "url": "https://youtu.be/G10APU6StfY?si=RVz8HKklV3taRlWz",
    "youtubeId": "G10APU6StfY",
    "totalPar": 51,
    "players": [
      {"name": "ilMasseo", "position": 1, "totalScore": 56, "diffPar": 5, "holes": [2,3,3,2,3,2,4,5,5,2,2,3,3,4,2,3,4,4]},
      {"name": "nonsonodread", "position": 2, "totalScore": 60, "diffPar": 9, "holes": [3,2,3,2,2,4,5,4,5,5,1,3,3,2,1,6,4,5]},
      {"name": "GaBBo", "position": 3, "totalScore": 66, "diffPar": 15, "holes": [3,4,3,4,2,2,3,11,5,1,3,3,3,5,3,3,5,3]},
      {"name": "JTaz", "position": 4, "totalScore": 78, "diffPar": 27, "holes": [3,3,7,2,3,3,3,3,5,3,2,4,5,4,2,2,8,16]}
    ]
  },
  {
    "id": 29,
    "title": "GOLFATINA \"INVERNALE\" CON COLPI SENZA SENSO w/ROHN,DREAD, DELUX, GABBO e il MASSEO!",
    "date": "2026-02-12",
    "url": "https://youtu.be/rOYOAVS4H54?si=-TaXqK5NiaKCijxw",
    "youtubeId": "rOYOAVS4H54",
    "totalPar": 74,
    "players": [
      {"name": "Delux", "position": 1, "totalScore": 44, "diffPar": -30, "holes": [2,7,2,1,2,4,2,2,2,2,2,3,3,1,3,1,2,3]},
      {"name": "Just Rohn", "position": 2, "totalScore": 52, "diffPar": -22, "holes": [2,3,2,2,2,3,2,2,2,6,4,3,4,3,2,2,4,4]},
      {"name": "nonsonodread", "position": 3, "totalScore": 59, "diffPar": -15, "holes": [2,9,2,2,2,3,2,1,2,6,3,3,4,3,4,4,3,4]},
      {"name": "GaBBo", "position": 4, "totalScore": 63, "diffPar": -11, "holes": [2,3,2,2,4,4,8,2,2,9,3,5,3,3,3,2,4,2]},
      {"name": "ilMasseo", "position": 5, "totalScore": 65, "diffPar": -9, "holes": [2,3,2,2,4,4,2,2,2,6,2,2,2,4,4,3,14,5]}
    ]
  },
  {
    "id": 30,
    "title": "UNA GOLFATINA PACIFICA TRA AMICI con Delux, Masseo, Gabbo & Dread",
    "date": "2026-03-17",
    "url": "https://youtu.be/efppNZh_4UA?si=1f2ENwWU47MlZcLe",
    "youtubeId": "efppNZh_4UA",
    "totalPar": 69,
    "players": [
      {"name": "ilMasseo", "position": 1, "totalScore": 74, "diffPar": 5, "holes": [3,2,3,1,4,1,5,12,5,3,4,3,4,5,3,7,7,2]},
      {"name": "nonsonodread", "position": 2, "totalScore": 78, "diffPar": 9, "holes": [4,3,6,5,3,3,4,13,1,3,3,4,6,4,5,4,5,2]},
      {"name": "Delux", "position": 3, "totalScore": 79, "diffPar": 10, "holes": [2,5,2,2,1,2,2,16,2,8,4,1,4,1,16,4,2,5]},
      {"name": "GaBBo", "position": 4, "totalScore": 87, "diffPar": 18, "holes": [3,4,7,5,2,2,5,10,5,7,5,2,6,2,7,5,6,4]}
    ]
  },
  {
    "id": 31,
    "title": "GOLFATINA DEMONIACA con Dread, Masseo, Gabbo, Delux",
    "date": "2026-03-18",
    "url": "https://youtu.be/sEUHEXe3iwM?si=sMAq1CkkUG5iWY4J",
    "youtubeId": "sEUHEXe3iwM",
    "totalPar": 53,
    "players": [
      {"name": "Delux", "position": 1, "totalScore": 64, "diffPar": 11, "holes": [1,2,2,4,6,4,4,5,7,1,2,3,3,2,4,4,4,6]},
      {"name": "nonsonodread", "position": 2, "totalScore": 71, "diffPar": 18, "holes": [1,1,8,5,2,3,1,6,8,1,3,6,5,3,4,5,4,5]},
      {"name": "ilMasseo", "position": 3, "totalScore": 77, "diffPar": 24, "holes": [3,3,3,4,8,4,2,3,7,4,2,6,4,4,5,3,6,6]},
      {"name": "GaBBo", "position": 3, "totalScore": 77, "diffPar": 24, "holes": [2,2,6,7,3,4,3,8,6,4,3,6,3,3,5,3,3,6]}
    ]
  },
  {
    "id": 32,
    "title": "UNA GOLFATINA INIZIATA BENE E FINITA NEL CAOS PIU' TOTALE w/ROHN,DREAD, GABBO, MOLLU e il MASSEO",
    "date": "2026-03-20",
    "url": "https://youtu.be/YcdQ2kgViqM?si=rTMy_W704VzyAMAq",
    "youtubeId": "YcdQ2kgViqM",
    "totalPar": 53,
    "players": [
      {"name": "ilMasseo", "position": 1, "totalScore": 74, "diffPar": 21, "holes": [1,2,1,3,2,2,2,1,2,4,8,4,4,5,3,10,14,6]},
      {"name": "Just Rohn", "position": 2, "totalScore": 78, "diffPar": 25, "holes": [1,3,2,3,2,3,1,4,1,5,4,4,6,4,3,14,14,4]},
      {"name": "GaBBo", "position": 3, "totalScore": 80, "diffPar": 27, "holes": [3,2,2,2,2,5,4,3,4,5,8,6,4,4,3,4,14,5]},
      {"name": "nonsonodread", "position": 4, "totalScore": 83, "diffPar": 30, "holes": [2,2,3,4,3,2,4,3,3,10,14,5,6,4,5,4,5,4]},
      {"name": "Mollu", "position": 5, "totalScore": 88, "diffPar": 35, "holes": [1,2,2,7,2,5,3,2,4,4,5,5,6,3,2,14,14,7]}
    ]
  },
  {
    "id": 33,
    "title": "GOLFATINA A SQUADRE...MA UNA SQUADRA INIZIA A LITIGARE A META' PARTITA! w/ROHN,DREAD,GABBO e DELUX",
    "date": "2026-03-30",
    "url": "https://youtu.be/aY8s3zHX0Qk?si=W8WsV79JWBrtsZKB",
    "youtubeId": "aY8s3zHX0Qk",
    "totalPar": 40,
    "players": [
      {"name": "Delux", "position": 1, "totalScore": 44, "diffPar": 4, "holes": [2,2,3,3,1,2,2,3,4,3,3,4,2,2,2,3,1]},
      {"name": "Just Rohn", "position": 2, "totalScore": 52, "diffPar": 12, "holes": [1,2,5,2,3,2,2,6,4,3,2,2,1,3,2,2,7,3]},
      {"name": "nonsonodread", "position": 3, "totalScore": 53, "diffPar": 13, "holes": [1,2,4,4,2,3,3,4,5,2,2,3,2,3,3,4,4,2]},
      {"name": "GaBBo", "position": 4, "totalScore": 71, "diffPar": 31, "holes": [2,1,5,2,6,2,2,3,4,14,3,3,3,3,1,2,14,1]}
    ]
  },
  {
    "id": 34,
    "title": "Questa volta abbiamo fatto DAVVERO ARRABBIARE il Rohnnino… SDROGO GOLFATINA",
    "date": "2026-04-08",
    "url": "https://youtu.be/1SoHXNKL53o?si=3H6MA4z0ERNXyrkL",
    "youtubeId": "1SoHXNKL53o",
    "totalPar": 53,
    "players": [
      {"name": "Delux", "position": 1, "totalScore": 53, "diffPar": 0, "holes": [1,1,2,4,2,1,1,3,3,4,1,2,5,4,3,4,7,5]},
      {"name": "GaBBo", "position": 2, "totalScore": 57, "diffPar": 4, "holes": [1,1,1,2,3,1,4,6,3,3,3,1,5,7,6,2,4,4]},
      {"name": "nonsonodread", "position": 3, "totalScore": 59, "diffPar": 6, "holes": [2,2,2,7,3,3,1,3,4,2,2,2,3,3,4,8,3,5]},
      {"name": "Just Rohn", "position": 4, "totalScore": 65, "diffPar": 12, "holes": [1,1,3,5,3,2,3,3,3,3,2,4,9,5,3,7,5,3]}
    ]
  },
  {
    "id": 35,
    "title": "SDROGO GOLFATINA CON I RE DELLE PALLE (amano le mazze...) con Dread, Rohn, Gabbo, Delux",
    "date": "2026-04-10",
    "url": "https://youtu.be/sXtQUINYS8Y?si=R25RYgN-ehOOKRZH",
    "youtubeId": "sXtQUINYS8Y",
    "totalPar": 58,
    "players": [
      {"name": "nonsonodread", "position": 1, "totalScore": 61, "diffPar": 3, "holes": [1,1,3,3,2,2,3,5,8,5,1,5,1,4,3,4,4,6]},
      {"name": "Just Rohn", "position": 2, "totalScore": 72, "diffPar": 14, "holes": [2,3,4,6,3,4,4,4,3,3,4,4,2,6,5,5,4,6]},
      {"name": "Delux", "position": 3, "totalScore": 77, "diffPar": 19, "holes": [3,3,4,3,2,2,3,5,3,4,4,4,5,6,2,14,6,4]},
      {"name": "GaBBo", "position": 4, "totalScore": 82, "diffPar": 24, "holes": [3,3,6,6,3,2,7,4,4,4,2,5,2,5,7,7,4,8]}
    ]
  },
  {
    "id": 36,
    "title": "GOLFATINA FURIOSA!...nella MAPPA PIU' BELLA MAI GIOCATA!? w/ROHN,DREAD,GABBO e DELUX",
    "date": "2026-04-17",
    "url": "https://youtu.be/DtzjUGyzg0I?si=QHPYV1wt6CsI5BPc",
    "youtubeId": "DtzjUGyzg0I",
    "totalPar": 51,
    "players": [
      {"name": "nonsonodread", "position": 1, "totalScore": 77, "diffPar": 26, "holes": [1,1,3,3,9,5,3,4,3,2,8,4,3,1,5,3,5,14]},
      {"name": "Delux", "position": 2, "totalScore": 78, "diffPar": 27, "holes": [1,2,2,5,2,8,2,5,8,2,5,2,6,5,4,2,9,8]},
      {"name": "Just Rohn", "position": 3, "totalScore": 101, "diffPar": 50, "holes": [1,3,3,14,8,5,2,6,5,6,6,4,4,7,4,7,2,14]},
      {"name": "GaBBo", "position": 4, "totalScore": 102, "diffPar": 51, "holes": [2,4,2,6,5,4,3,4,4,10,8,4,5,6,6,7,14,8]}
    ]
  },
  {
    "id": 37,
    "title": "GOLFATINA MALEDETTA (l'ultimo ci lascia per sempre) con Dread, Rohn, Gabbo, Delux",
    "date": "2026-04-22",
    "url": "https://youtu.be/K6XbosbFIjg?si=bmRFkck6H6sHG_5q",
    "youtubeId": "K6XbosbFIjg",
    "totalPar": 39,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 45, "diffPar": 6, "holes": [2,2,2,3,2,3,2,5,3,2,2,2,2,2,2,3,4,2]},
      {"name": "Delux", "position": 2, "totalScore": 48, "diffPar": 9, "holes": [3,2,3,5,2,2,2,3,3,2,1,1,2,2,6,2,5,2]},
      {"name": "GaBBo", "position": 3, "totalScore": 52, "diffPar": 13, "holes": [2,3,4,3,2,2,2,4,5,2,2,1,2,2,3,2,9,2]},
      {"name": "nonsonodread", "position": 3, "totalScore": 52, "diffPar": 13, "holes": [3,3,2,2,2,2,3,2,4,4,1,6,2,3,4,2,5,2]}
    ]
  },
  {
    "id": 38,
    "title": "SDROGO GOLFATINA ma IO E ROHN abbiamo LITIGATO",
    "date": "2026-04-29",
    "url": "https://youtu.be/ZKEYfCubz1k?si=21LEhQFTKlGux4aw",
    "youtubeId": "ZKEYfCubz1k",
    "totalPar": 54,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 42, "diffPar": -12, "holes": [2,2,1,2,2,4,1,2,2,3,2,3,3,4,4,1,2,2]},
      {"name": "nonsonodread", "position": 2, "totalScore": 43, "diffPar": -11, "holes": [4,3,1,3,2,6,2,2,2,3,1,2,4,2,1,1,2,2]},
      {"name": "Delux", "position": 2, "totalScore": 43, "diffPar": -11, "holes": [3,2,1,1,1,2,3,4,2,2,6,5,1,1,2,3,3,1]},
      {"name": "GaBBo", "position": 3, "totalScore": 64, "diffPar": 10, "holes": [5,3,2,1,2,14,1,4,2,4,2,2,3,2,5,7,2,3]}
    ]
  },
  {
    "id": 39,
    "title": "GOLFATINA FINITA MALE...RAGEQUIT A META' PARTITA?! w/ROHN,DREAD,GABBO e DELUX",
    "date": "2026-05-01",
    "url": "https://youtu.be/_uvZcJiAq5I?si=rELBZJERiMmPSYhf",
    "youtubeId": "_uvZcJiAq5I",
    "totalPar": 53,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 44, "diffPar": -9, "holes": [3,2,3,4,1,4,3,1,4,2,2,2,2,2,4,1,1,3]},
      {"name": "GaBBo", "position": 2, "totalScore": 48, "diffPar": -5, "holes": [3,1,2,5,3,3,4,2,3,3,1,2,4,2,2,2,1,5]},
      {"name": "Delux", "position": 2, "totalScore": 48, "diffPar": -5, "holes": [4,2,2,5,6,2,1,2,3,3,3,1,4,2,2,1,1,4]},
      {"name": "nonsonodread", "position": 3, "totalScore": 52, "diffPar": -1, "holes": [2,2,3,4,3,6,3,1,4,2,4,3,2,2,2,2,2,5]}
    ]
  },
  {
    "id": 40,
    "title": "L'ELENCO PIÚ BELLO MAI FATTO FINO AD ORA A MANI BASSE. con Delux, Rohn, Dread, Mollu & JTaz",
    "date": "2026-05-07",
    "url": "https://youtu.be/0E5bB60k9YI?si=8amRjmHwp1fo4dTM",
    "youtubeId": "0E5bB60k9YI",
    "totalPar": 59,
    "players": [
      {"name": "Mollu", "position": 1, "totalScore": 54, "diffPar": -5, "holes": [8,5,5,2,1,2,2,1,4,3,1,2,6,3,3,3,2,1]},
      {"name": "Just Rohn", "position": 2, "totalScore": 57, "diffPar": -2, "holes": [3,3,3,2,3,3,3,1,6,3,2,3,4,3,4,3,5,3]},
      {"name": "nonsonodread", "position": 3, "totalScore": 64, "diffPar": 5, "holes": [2,2,5,2,2,3,5,1,8,3,4,4,5,4,6,4,2,2]},
      {"name": "Delux", "position": 4, "totalScore": 65, "diffPar": 6, "holes": [2,2,7,5,1,3,3,1,8,3,2,7,4,5,4,3,3,2]},
      {"name": "JTaz", "position": 5, "totalScore": 98, "diffPar": 39, "holes": [3,5,4,2,17,5,3,1,7,5,3,5,17,5,7,3,4,2]}
    ]
  },
  {
    "id": 41,
    "title": "GOLFATINA MOLTO ARRABBIATA con Dread, Rohn, Masseo, Gabbo, Delux",
    "date": "2026-05-09",
    "url": "https://youtu.be/a6IGtNxVAGM?si=ERlBjWz3RFNkcFTJ",
    "youtubeId": "a6IGtNxVAGM",
    "totalPar": 68,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 57, "diffPar": -11, "holes": [4,2,3,2,2,3,3,2,3,3,4,4,2,4,4,3,4,5]},
      {"name": "nonsonodread", "position": 2, "totalScore": 59, "diffPar": -9, "holes": [4,2,2,3,2,4,4,3,2,5,4,4,3,2,4,3,4,4]},
      {"name": "Delux", "position": 3, "totalScore": 66, "diffPar": -2, "holes": [1,2,1,3,3,3,4,4,1,12,1,4,4,4,3,6,3,7]},
      {"name": "GaBBo", "position": 4, "totalScore": 84, "diffPar": 16, "holes": [5,2,3,4,3,2,7,3,4,8,6,5,4,2,5,3,6,12]},
      {"name": "ilMasseo", "position": 5, "totalScore": 98, "diffPar": 30, "holes": [4,2,2,3,3,3,5,12,8,12,12,4,11,4,3,3,6,11]}
    ]
  },
  {
    "id": 42,
    "title": "GOLFATINA OLIMPICA - UN RECORD IMPOSSIBILE DA BATTERE w/ROHN,DREAD,DELUX e JTAZ",
    "date": "2026-05-12",
    "url": "https://youtu.be/2zdkusQJBbU?si=VIELuJzSYLlDHoDh",
    "youtubeId": "2zdkusQJBbU",
    "totalPar": 61,
    "players": [
      {"name": "Delux", "position": 1, "totalScore": 43, "diffPar": -18, "holes": [2,5,1,8,3,4,4,2,1,2,1,1,1,3,1,2,1,1]},
      {"name": "Just Rohn", "position": 2, "totalScore": 49, "diffPar": -12, "holes": [4,5,2,8,2,2,2,2,3,4,1,1,2,4,2,2,2,1]},
      {"name": "JTaz", "position": 3, "totalScore": 58, "diffPar": -3, "holes": [6,2,2,6,6,3,4,3,6,3,2,1,3,2,4,3,1,1]},
      {"name": "nonsonodread", "position": 4, "totalScore": 62, "diffPar": 1, "holes": [5,5,1,14,2,2,3,3,4,4,1,2,3,3,3,1,2,4]}
    ]
  },
  {
    "id": 43,
    "title": "UNA MAPPA SDROGO PER UNA GOLFATINA SDROGO ( occhio al progetto )",
    "date": "2026-05-15",
    "url": "https://youtu.be/54RjIkAC8g4?si=VtlMmqNYtqKtJwZN",
    "youtubeId": "54RjIkAC8g4",
    "totalPar": 49,
    "players": [
      {"name": "Mollu", "position": 1, "totalScore": 44, "diffPar": -5, "holes": [1,4,1,2,1,1,2,3,2,2,2,3,4,7,2,2,4,1]},
      {"name": "GaBBo", "position": 2, "totalScore": 54, "diffPar": 5, "holes": [2,3,4,2,1,3,2,3,3,3,2,3,6,4,3,4,2,4]},
      {"name": "nonsonodread", "position": 3, "totalScore": 55, "diffPar": 6, "holes": [1,2,3,2,1,4,3,2,3,2,2,9,2,6,3,3,4,3]},
      {"name": "Just Rohn", "position": 4, "totalScore": 58, "diffPar": 9, "holes": [1,1,3,10,2,3,3,3,4,2,3,2,5,5,2,3,3,3]},
      {"name": "Delux", "position": 5, "totalScore": 66, "diffPar": 17, "holes": [1,3,4,9,1,2,2,6,5,1,2,8,6,2,4,4,3,3]}
    ]
  },
  {
    "id": 44,
    "title": "GOLFATINA DI COMPLEANNO...MA MI TRATTANO TUTTI MALE w/ROHN, DREAD, MOLLU, JTAZ e il MASSEO",
    "date": "2026-05-26",
    "url": "https://youtu.be/-NC4P43jSLs?si=dlxTldRtDNCcdn3q",
    "youtubeId": "-NC4P43jSLs",
    "totalPar": 53,
    "players": [
      {"name": "Mollu", "position": 1, "totalScore": 61, "diffPar": 8, "holes": [2,5,2,1,3,8,2,3,1,1,3,1,2,10,1,2,14]},
      {"name": "Just Rohn", "position": 2, "totalScore": 68, "diffPar": 15, "holes": [1,3,1,1,9,6,6,3,5,2,1,14,3,3,2,2,6]},
      {"name": "nonsonodread", "position": 3, "totalScore": 71, "diffPar": 18, "holes": [2,3,2,2,7,6,5,6,2,6,2,4,3,3,4,3,11]},
      {"name": "ilMasseo", "position": 4, "totalScore": 72, "diffPar": 19, "holes": [2,3,2,1,8,3,6,14,1,1,3,2,5,14,2,3,2]},
      {"name": "JTaz", "position": 5, "totalScore": 88, "diffPar": 35, "holes": [2,3,2,1,8,14,4,14,4,5,1,3,4,10,3,5,5]}
    ]
  },
  {
    "id": 45,
    "title": "SDROGO GOLFATINA ESPLOSIVA ( letteralmente )",
    "date": "2026-06-05",
    "url": "https://youtu.be/YleYm6W8AU4?si=uP2XkE27bgoyvy31",
    "youtubeId": "YleYm6W8AU4",
    "totalPar": 75,
    "players": [
      {"name": "ilMasseo", "position": 1, "totalScore": 71, "diffPar": -4, "holes": [3,2,2,3,2,2,3,6,4,1,6,7,3,5,8,5,3,6]},
      {"name": "Just Rohn", "position": 2, "totalScore": 74, "diffPar": -1, "holes": [2,2,1,1,4,3,4,4,7,3,6,5,2,7,7,4,6,6]},
      {"name": "Delux", "position": 3, "totalScore": 76, "diffPar": 1, "holes": [3,2,1,1,1,2,3,5,5,8,4,5,4,5,7,9,6,5]},
      {"name": "nonsonodread", "position": 4, "totalScore": 80, "diffPar": 5, "holes": [2,4,1,1,4,3,4,6,6,1,6,6,3,8,7,3,8,7]},
      {"name": "GaBBo", "position": 5, "totalScore": 93, "diffPar": 18, "holes": [3,3,2,1,7,5,4,7,8,3,4,5,4,6,8,3,14,6]}
    ]
  },
  {
    "id": 46,
    "title": "UNA CALDA GOLFATINA...CHE SAPPIAMO GIA' COME ANDRA' A FINIRE w/ROHN, DREAD, GABBO, MOLLU e DELUX",
    "date": "2026-06-06",
    "url": "https://youtu.be/la960Us8FWQ?si=ViXBiYumqx4_yDK2",
    "youtubeId": "la960Us8FWQ",
    "totalPar": 50,
    "players": [
      {"name": "Mollu", "position": 1, "totalScore": 39, "diffPar": -11, "holes": [2,1,2,2,1,3,1,1,2,3,3,1,1,2,2,1,3,8]},
      {"name": "Delux", "position": 2, "totalScore": 43, "diffPar": -7, "holes": [3,1,2,2,2,2,2,2,2,4,2,2,4,2,3,3,1,4]},
      {"name": "Just Rohn", "position": 3, "totalScore": 44, "diffPar": -6, "holes": [1,1,2,2,3,2,2,2,1,3,4,1,3,5,2,1,4,5]},
      {"name": "GaBBo", "position": 4, "totalScore": 51, "diffPar": 1, "holes": [3,2,2,1,1,2,2,3,3,2,3,2,3,3,3,3,3,10]},
      {"name": "nonsonodread", "position": 5, "totalScore": 54, "diffPar": 4, "holes": [3,2,1,3,1,2,2,4,3,4,4,2,1,3,4,2,5,8]}
    ]
  },
  {
    "id": 47,
    "title": "GOLFATINA SBUDELLANTE con Dread, Rohn, Gabbo e Delu",
    "date": "2026-06-08",
    "url": "https://youtu.be/x9M1RflGCE4?si=TI6huoyaqMc4OEok",
    "youtubeId": "x9M1RflGCE4",
    "totalPar": 49,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 74, "diffPar": 25, "holes": [10,1,4,3,14,1,1,1,2,2,6,8,4,3,4,2,1,7]},
      {"name": "nonsonodread", "position": 2, "totalScore": 82, "diffPar": 33, "holes": [3,5,11,5,11,1,2,1,4,2,4,11,6,3,3,2,1,7]},
      {"name": "Delux", "position": 3, "totalScore": 101, "diffPar": 52, "holes": [8,6,14,4,14,1,2,1,3,9,1,9,6,6,14,1,1,1]},
      {"name": "ilMasseo", "position": 4, "totalScore": 102, "diffPar": 53, "holes": [12,2,8,8,14,5,1,3,5,4,8,14,4,2,5,2,3,2]},
      {"name": "GaBBo", "position": 5, "totalScore": 116, "diffPar": 67, "holes": [14,3,11,5,14,1,1,1,14,6,4,7,5,10,14,3,2,1]}
    ]
  },
  {
    "id": 48,
    "title": "GOLFATINA ESTIVA PER DIVERTIRCI FRA AMICI (non ci siamo divertiti)",
    "date": "2026-06-10",
    "url": "https://youtu.be/XWkrat_kXCw?si=S057h2hYa86Jjm15",
    "youtubeId": "XWkrat_kXCw",
    "totalPar": 74,
    "players": [
      {"name": "nonsonodread", "position": 1, "totalScore": 53, "diffPar": -21, "holes": [4,2,1,3,1,6,3,4,3,3,3,2,1,6,3,2,1,5]},
      {"name": "Delux", "position": 2, "totalScore": 58, "diffPar": -16, "holes": [1,2,6,3,2,3,4,3,4,5,6,3,1,4,2,4,1,4]},
      {"name": "Mollu", "position": 3, "totalScore": 62, "diffPar": -12, "holes": [3,2,2,4,4,2,3,3,4,2,6,2,1,8,6,3,1,6]},
      {"name": "Just Rohn", "position": 4, "totalScore": 66, "diffPar": -8, "holes": [3,2,5,4,5,3,5,3,3,1,3,2,1,3,3,3,13,4]},
      {"name": "GaBBo", "position": 5, "totalScore": 67, "diffPar": -7, "holes": [3,3,11,6,5,2,5,4,3,2,4,3,1,2,5,4,1,3]}
    ]
  },
  {
    "id": 49,
    "title": "QUESTA É LA GOLFATINA RISTORATIVA. con Delux, Dread, Gabbo, Rohn & Mollu",
    "date": "2026-06-11",
    "url": "https://youtu.be/Hu7tK5NXzrU?si=bZN7y-3ZwnL0PoeV",
    "youtubeId": "Hu7tK5NXzrU",
    "totalPar": 56,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 44, "diffPar": -12, "holes": [2,3,3,8,3,4,1,3,1,4,2,4,2,1,2,1,1,1]},
      {"name": "GaBBo", "position": 2, "totalScore": 45, "diffPar": -11, "holes": [4,2,1,5,5,3,1,2,3,5,2,6,1,3,1,1,1,1]},
      {"name": "Delux", "position": 3, "totalScore": 50, "diffPar": -6, "holes": [4,8,1,4,4,3,1,3,2,3,2,9,3,1,1,1,1,1]},
      {"name": "nonsonodread", "position": 4, "totalScore": 54, "diffPar": -2, "holes": [2,2,1,2,4,4,2,5,16,3,3,4,2,1,2,1,1,1]},
      {"name": "Mollu", "position": 5, "totalScore": 56, "diffPar": 0, "holes": [2,2,1,4,6,3,7,3,4,5,3,9,2,3,1,1,1,1]}
    ]
  },
  {
    "id": 50,
    "title": "UNA FRESCA GOLFATINA TRA LE CASCATE...NON BASTA A TENERCI CALMI w/ROHN, DREAD, GABBO e DELUX",
    "date": "2026-06-12",
    "url": "https://youtu.be/Msk6dgjsLLc?si=NwUbV-lEqFScB8hO",
    "youtubeId": "Msk6dgjsLLc",
    "totalPar": 51,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 38, "diffPar": -13, "holes": [3,2,2,2,3,2,2,1,1,2,2,1,2,3,1,4,2,3]},
      {"name": "GaBBo", "position": 2, "totalScore": 46, "diffPar": -5, "holes": [4,2,2,2,6,2,1,5,2,2,3,2,1,1,5,2,2,2]},
      {"name": "nonsonodread", "position": 3, "totalScore": 53, "diffPar": 2, "holes": [3,4,3,2,4,2,2,14,1,5,2,2,1,2,1,2,2,1]}
    ]
  },
  {
    "id": 51,
    "title": "UNA GOLFATINA NEI CIELI...PASSATA A INSULTARE CHI CI ABITA w/ROHN, DREAD, GABBO, DELUX e il MASSEO",
    "date": "2026-06-19",
    "url": "https://youtu.be/SjL8fdo25HY?si=Zk7pN0a_DNwAB0tF",
    "youtubeId": "SjL8fdo25HY",
    "totalPar": 57,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 93, "diffPar": 36, "holes": [4,2,4,4,3,2,5,6,7,4,7,4,1,8,7,10,10,5]},
      {"name": "Delux", "position": 2, "totalScore": 107, "diffPar": 50, "holes": [9,2,6,4,5,1,4,8,5,3,9,3,1,14,14,8,9,2]},
      {"name": "nonsonodread", "position": 3, "totalScore": 109, "diffPar": 52, "holes": [9,1,4,6,7,1,7,6,9,3,6,7,3,9,9,8,9,5]},
      {"name": "ilMasseo", "position": 4, "totalScore": 132, "diffPar": 75, "holes": [5,2,5,14,7,2,3,10,14,5,6,3,4,5,14,11,11,11]},
      {"name": "GaBBo", "position": 5, "totalScore": 145, "diffPar": 88, "holes": [8,1,9,14,10,2,5,7,9,10,5,3,5,14,10,9,10,14]}
    ]
  },
  {
    "id": 52,
    "title": "GOLFATINA DELIZIOSA con Dread, Rohn, Gabbo, Delux, Mollu",
    "date": "2026-06-20",
    "url": "https://youtu.be/VOkBVCSZfPU?si=dSI8QiEeq8cwlXhP",
    "youtubeId": "VOkBVCSZfPU",
    "totalPar": 69,
    "players": [
      {"name": "Just Rohn", "position": 1, "totalScore": 68, "diffPar": -1, "holes": [1,2,1,2,4,1,6,3,7,5,5,4,2,7,2,5,6,5]},
      {"name": "Mollu", "position": 2, "totalScore": 70, "diffPar": 1, "holes": [2,1,1,2,5,1,6,5,6,4,5,6,2,6,2,4,5,7]},
      {"name": "nonsonodread", "position": 3, "totalScore": 72, "diffPar": 3, "holes": [2,3,1,4,4,1,5,4,5,3,6,6,2,3,3,5,9,6]},
      {"name": "Delux", "position": 4, "totalScore": 83, "diffPar": 14, "holes": [1,2,2,7,4,2,5,3,5,6,7,5,2,5,2,6,6,13]},
      {"name": "GaBBo", "position": 5, "totalScore": 86, "diffPar": 17, "holes": [2,1,3,4,3,1,5,6,6,3,6,5,11,5,2,7,6,10]}
    ]
  },
  {
    "id": 53,
    "title": "SDROGO GOLFATINA ma IO CREDO NEL PROGETTO GABBINESS",
    "date": "2026-06-21",
    "url": "https://youtu.be/PhqKCnbBATg?si=M-uk_A5e6UA9c9ne",
    "youtubeId": "PhqKCnbBATg",
    "totalPar": 63,
    "players": [
      {"name": "nonsonodread", "position": 1, "totalScore": 59, "diffPar": -4, "holes": [2,2,2,6,4,5,5,2,5,4,3,5,2,1,3,3,3,2]},
      {"name": "Just Rohn", "position": 1, "totalScore": 59, "diffPar": -4, "holes": [2,3,2,6,3,5,5,3,5,4,3,5,2,2,2,3,2,2]},
      {"name": "ilMasseo", "position": 1, "totalScore": 59, "diffPar": -4, "holes": [2,4,3,5,3,5,4,2,4,6,3,7,2,1,2,2,2,2]},
      {"name": "GaBBo", "position": 2, "totalScore": 64, "diffPar": 1, "holes": [3,5,2,8,3,5,4,1,3,5,4,7,3,1,2,3,3,2]},
      {"name": "Delux", "position": 3, "totalScore": 68, "diffPar": 5, "holes": [2,3,2,6,4,4,6,2,5,5,3,9,5,1,2,3,4,2]}
    ]
  },
  {
    "id": 54,
    "title": "UNA GOLFATINA ZUCCHERATA con Dread, Rohn, Gabbo e Delu",
    "date": "2026-06-22",
    "url": "https://youtu.be/GAJyP4Qc5Es?si=47Eh3Ba1KzyEPaLL",
    "youtubeId": "GAJyP4Qc5Es",
    "totalPar": 74,
    "players": [
      {"name": "GaBBo", "position": 1, "totalScore": 59, "diffPar": -15, "holes": [2,2,3,2,4,3,3,4,1,2,2,6,3,5,3,3,3,8]},
      {"name": "nonsonodread", "position": 2, "totalScore": 61, "diffPar": -13, "holes": [2,2,2,5,8,4,3,3,1,2,3,6,3,2,4,2,4,5]},
      {"name": "Just Rohn", "position": 3, "totalScore": 63, "diffPar": -11, "holes": [2,1,4,6,3,3,4,2,1,3,4,1,6,3,4,4,4,8]},
      {"name": "Delux", "position": 3, "totalScore": 63, "diffPar": -11, "holes": [2,4,2,3,4,6,2,4,1,3,2,5,2,2,6,4,7,4]},
      {"name": "ilMasseo", "position": 4, "totalScore": 64, "diffPar": -10, "holes": [3,2,3,3,2,4,4,3,1,2,3,5,4,6,2,5,4,8]}
    ]
  },
  {
    "id": 55,
    "title": "UNA GOLFATINA VERAMENTE POCO BLASFEMA. con Delux, Masseo, Dread, Rohn & Gabbo",
    "date": "2026-06-27",
    "url": "https://youtu.be/drFF-_eNNJE?si=SDL0P3_nsYzaDcDf",
    "youtubeId": "drFF-_eNNJE",
    "totalPar": 60,
    "players": [
      {"name": "nonsonodread", "position": 1, "totalScore": 98, "diffPar": 38, "holes": [1,1,3,3,2,9,11,5,4,3,4,2,5,11,5,7,6,16]},
      {"name": "Delux", "position": 2, "totalScore": 99, "diffPar": 39, "holes": [1,1,5,5,2,6,6,2,16,9,5,2,5,5,2,9,2,16]},
      {"name": "Just Rohn", "position": 3, "totalScore": 109, "diffPar": 49, "holes": [2,2,9,2,3,7,6,4,5,11,16,5,3,6,5,5,2,16]},
      {"name": "GaBBo", "position": 4, "totalScore": 126, "diffPar": 66, "holes": [1,6,1,7,4,7,8,2,16,5,4,5,6,16,8,10,4,16]},
      {"name": "ilMasseo", "position": 5, "totalScore": 140, "diffPar": 80, "holes": [2,8,3,16,2,6,7,4,8,13,8,4,6,8,11,8,10,16]}
    ]
  },
  {
    "id": 56,
    "title": "GOLFATINA NEL CASTELLO! LA MAPPA PIU' BELLA DI SEMPRE?! w/ROHN, DREAD, GABBO, DELUX e il MASSEO",
    "date": "2026-07-03",
    "url": "https://youtu.be/CS8kqLYXJZo?si=ZsSTrl2GaRQ7LOfE",
    "youtubeId": "CS8kqLYXJZo",
    "totalPar": 59,
    "players": [
      {"name": "Delux", "position": 1, "totalScore": 35, "diffPar": -24, "holes": [2,1,4,1,1,1,2,2,2,2,2,5,3,1,2,2,1,1]},
      {"name": "ilMasseo", "position": 2, "totalScore": 48, "diffPar": -11, "holes": [4,2,4,2,1,1,4,4,3,2,4,2,4,2,2,1,2,4]},
      {"name": "Just Rohn", "position": 3, "totalScore": 54, "diffPar": -5, "holes": [3,3,3,2,1,1,1,6,3,2,3,5,4,3,3,5,2,4]},
      {"name": "nonsonodread", "position": 4, "totalScore": 58, "diffPar": -1, "holes": [2,2,14,1,4,2,2,2,2,2,1,2,5,2,1,4,3,7]},
      {"name": "GaBBo", "position": 5, "totalScore": 63, "diffPar": 4, "holes": [2,4,3,2,3,1,4,3,2,2,2,7,3,3,3,2,3,14]}
    ]
  },
  {
    "id": 57,
    "title": "SDROGO GOLFATINA CON DUE PAZZI SCATENATI ( speciali ) w/ Chape, Fava, Dread, Delux",
    "date": "2026-07-05",
    "url": "https://youtu.be/pehCX9kJwbI?si=YPtvbD5Lws9Wd4UU",
    "youtubeId": "pehCX9kJwbI",
    "totalPar": 71,
    "players": [
      {"name": "nonsonodread", "position": 1, "totalScore": 53, "diffPar": -18, "holes": [2,3,2,4,3,3,2,2,2,4,1,3,2,2,4,4,5,5]},
      {"name": "nbayungchape", "position": 2, "totalScore": 62, "diffPar": -9, "holes": [3,5,2,2,3,2,3,2,4,1,4,6,4,6,4,3,4,4]},
      {"name": "GaBBo", "position": 2, "totalScore": 62, "diffPar": -9, "holes": [2,4,2,2,2,3,3,5,2,3,3,5,4,7,4,4,4,3]},
      {"name": "Delux", "position": 3, "totalScore": 71, "diffPar": 0, "holes": [1,5,2,2,4,2,1,2,2,3,6,8,4,10,5,6,4,4]},
      {"name": "Fava", "position": 4, "totalScore": 98, "diffPar": 27, "holes": [3,4,3,2,3,3,2,6,14,2,5,8,2,14,7,4,6,10]}
    ]
  },
  {
    "id": 58,
    "title": "UNA GOLFATINA CON LE COLLISIONI PER CHI NON SI OFFENDE. con Delux, Gubbio, Droid & JTaz",
    "date": "2026-07-07",
    "url": "https://youtu.be/As94bosHv14?si=7hKEgXpx4xOczSfZ",
    "youtubeId": "As94bosHv14",
    "totalPar": 54,
    "players": [
      {"name": "nonsonodread", "position": 1, "totalScore": 64, "diffPar": 10, "holes": [2,4,1,7,5,3,1,3,3,3,1,3,4,3,2,7,10,2]},
      {"name": "JTaz", "position": 2, "totalScore": 69, "diffPar": 15, "holes": [1,4,3,6,4,4,1,3,3,5,5,4,3,3,3,7,9,1]},
      {"name": "Delux", "position": 3, "totalScore": 99, "diffPar": 45, "holes": [2,12,1,5,4,7,4,6,5,9,3,3,3,5,4,9,16,1]},
      {"name": "GaBBo", "position": 4, "totalScore": 122, "diffPar": 68, "holes": [2,11,2,7,6,6,5,11,8,10,4,6,7,6,7,8,15,1]}
    ]
  },
  {
    "id": 59,
    "title": "LA GOLFATINA PIÙ DIFFICILE DI SEMPRE con Dread, Rohn, Masseo, Delux, Jimmy",
    "date": "2026-07-11",
    "url": "https://youtu.be/hJpkPpCW4xI?si=n-CAsgnSGTH2SSnp",
    "youtubeId": "hJpkPpCW4xI",
    "totalPar": 68,
    "players": [
      {"name": "nonsonodread", "position": 1, "totalScore": 97, "diffPar": 29, "holes": [2,3,4,5,10,8,4,2,1,3,4,5,6,8,16,10,6]},
      {"name": "Just Rohn", "position": 2, "totalScore": 99, "diffPar": 31, "holes": [2,3,4,7,11,6,4,1,1,3,5,5,12,4,16,10,5]},
      {"name": "Delux", "position": 3, "totalScore": 112, "diffPar": 44, "holes": [1,3,7,3,5,9,5,2,2,2,5,11,8,6,16,11,16]},
      {"name": "ilMasseo", "position": 4, "totalScore": 115, "diffPar": 47, "holes": [2,3,4,4,13,5,4,3,1,3,10,4,6,16,8,16,13]},
      {"name": "JTaz", "position": 5, "totalScore": 122, "diffPar": 54, "holes": [3,9,5,5,10,5,5,1,1,5,5,5,4,16,16,16,11]}
    ]
  },
  {
    "id": 60,
    "title": "LA GOLFATINA SETTIMANALE DEL CRISTO con Dolbex Dredonicogrobert GorbioBarsbertaland Masbrecot & Molu",
    "date": "2026-07-23",
    "url": "https://youtu.be/uNAW22mWuuw?si=ngdHQgUv0gQlQTKU",
    "youtubeId": "uNAW22mWuuw",
    "totalPar": 72,
    "players": [
      {"name": "Delux", "position": 1, "totalScore": 61, "diffPar": -11, "holes": [2,1,6,2,3,3,4,2,5,2,1,6,4,5,4,3,5,3]},
      {"name": "ilMasseo", "position": 2, "totalScore": 65, "diffPar": -7, "holes": [3,1,3,3,4,6,4,4,3,5,3,5,4,2,5,5,4,1]},
      {"name": "nonsonodread", "position": 3, "totalScore": 66, "diffPar": -6, "holes": [2,2,5,3,3,3,2,4,2,5,6,4,5,4,5,3,4,4]},
      {"name": "GaBBo", "position": 4, "totalScore": 74, "diffPar": 2, "holes": [1,2,4,3,2,4,5,6,3,3,3,11,5,2,4,3,5,8]},
      {"name": "Mollu", "position": 5, "totalScore": 77, "diffPar": 5, "holes": [2,1,4,2,4,3,4,4,4,3,4,5,4,4,11,7,5,6]}
    ]
  },
  {
    "id": 61,
    "title": "LA GOLFATINA DELLA REDENZIONE DI JUST ROHN ( ancora orbo )",
    "date": "2026-07-24",
    "url": "https://youtu.be/6Gg12l2y3G4?si=Qgk_kyEXB6sldeG5",
    "youtubeId": "6Gg12l2y3G4",
    "totalPar": 42,
    "players": [
      {"name": "Delux", "position": 1, "totalScore": 62, "diffPar": 20, "holes": [3,5,3,4,4,3,8,4,4,5,2,2,8,1,4,2]},
      {"name": "nonsonodread", "position": 2, "totalScore": 70, "diffPar": 28, "holes": [11,1,5,4,4,3,5,6,5,3,1,3,8,2,7,2]},
      {"name": "GaBBo", "position": 3, "totalScore": 80, "diffPar": 38, "holes": [6,3,4,5,5,5,8,4,4,6,2,6,7,7,4,4]},
      {"name": "Just Rohn", "position": 4, "totalScore": 83, "diffPar": 41, "holes": [14,1,3,6,4,3,6,5,4,3,2,6,14,6,3,2]},
      {"name": "JTaz", "position": 5, "totalScore": 90, "diffPar": 48, "holes": [5,2,7,5,6,4,8,6,14,3,3,5,14,3,3,2]}
    ]
  }
]

player_lore = {
    'Just Rohn': {
        'nickname': 'Il Cecchino Sdrogo',
        'badge': 'Dominatore Assoluto',
        'color': '#3b82f6',
        'accent': 'from-blue-500 to-indigo-600',
        'avatar': '🎯',
        'quote': "Regaz, non ci credo... ho preso la traiettoria quantistica!",
        'bio': "Macchina da hole-in-one e recordman assoluto di vittorie. Quando il Rohnnino si concentra non ce n'è per nessuno, tranne quando la fisica di Golf With Your Friends decide di spedire la sua palla nello spazio.",
        'radar': {'precisione': 96, 'clutch': 92, 'sdroganza': 88, 'tiltControl': 78, 'fortuna': 85}
    },
    'Delux': {
        'nickname': 'Il Chirurgo delle Buche',
        'badge': 'Precisione Millimetrica',
        'color': '#10b981',
        'accent': 'from-emerald-500 to-teal-600',
        'avatar': '🏌️‍♂️',
        'quote': "Pazienza, studio della pendenza e tocco morbido. È pura geometria applicata.",
        'bio': "Maestro indiscusso della regolarità e dei tiri chirurgici. Detiene il record assoluto di -30 sotto il par nella leggendaria Golfatina Invernale (#29). Letale e glaciale.",
        'radar': {'precisione': 98, 'clutch': 89, 'sdroganza': 82, 'tiltControl': 94, 'fortuna': 80}
    },
    'nonsonodread': {
        'nickname': 'Il Padrino dello Sdrogo',
        'badge': 'Creatore dell\'Universo',
        'color': '#8b5cf6',
        'accent': 'from-purple-500 to-violet-700',
        'avatar': '🍈',
        'quote': "QUESTA È LA SDROGO GOLFATINA RAGAZZI! Benvenuti all'inferno!",
        'bio': "Il cuore pulsante del gruppo e presentatore supremo di ogni Golfatina. Sempre presente su 56 match su 57, capace di tiri celestiali o disastri atomici da 16 colpi con risata isterica annessa.",
        'radar': {'precisione': 85, 'clutch': 84, 'sdroganza': 99, 'tiltControl': 75, 'fortuna': 86}
    },
    'ilMasseo': {
        'nickname': 'La Furia Veneta',
        'badge': 'Bestemmia Tattica',
        'color': '#f97316',
        'accent': 'from-orange-500 to-amber-600',
        'avatar': '⚡',
        'quote': "MA COME FA A USCIREEE?! ERA DENTRO! MANNAGGIA LA***",
        'bio': "Pura energia, decibel altissimi e imprevedibilità totale. Quando è in partita può piazzare una serie devastante di Hole-in-One o subire un tilt da 16 colpi che fa tremare i muri di casa.",
        'radar': {'precisione': 82, 'clutch': 88, 'sdroganza': 95, 'tiltControl': 55, 'fortuna': 84}
    },
    'GaBBo': {
        'nickname': 'Il Martire del Gabbiness',
        'badge': 'Progetto Gabbiness',
        'color': '#ef4444',
        'accent': 'from-red-500 to-rose-700',
        'avatar': '👑',
        'quote': "Io credo fermamente nel Progetto Gabbiness, anche con 19 colpi su una buca.",
        'bio': "Eroe indiscusso dei momenti comici più leggendari. Nonostante le difficoltà su certe mappe infernali (fino a 181 colpi!), non molla mai e regala perle di intrattenimento immortali.",
        'radar': {'precisione': 70, 'clutch': 79, 'sdroganza': 96, 'tiltControl': 60, 'fortuna': 72}
    },
    'Mollu': {
        'nickname': 'Lo Stratega Silenzioso',
        'badge': 'Cecchino a Sorpresa',
        'color': '#06b6d4',
        'accent': 'from-cyan-500 to-blue-600',
        'avatar': '🧠',
        'quote': "Voi urlate, io intanto imbucata in 1 colpo con rimbalzo a sponda.",
        'bio': "Freddo, calcolatore e incredibilmente efficace. Vanta ben 6 vittorie su sole 20 partite giocate con un win rate altissimo del 30%. Quando gioca Mollu, tutti tremano.",
        'radar': {'precisione': 90, 'clutch': 86, 'sdroganza': 78, 'tiltControl': 90, 'fortuna': 88}
    },
    'JTaz': {
        'nickname': 'L\'Outsider delle Buche',
        'badge': 'Anarchia Pura',
        'color': '#ec4899',
        'accent': 'from-pink-500 to-rose-600',
        'avatar': '🎲',
        'quote': "Tiro forte verso il vuoto e spero che la provvidenza mi aiuti.",
        'bio': "Protagonista di colpi al limite delle leggi della fisica e ribaltamenti improvvisi. Vanta una vittoria iconica nel match #13 e performance al cardiopalma.",
        'radar': {'precisione': 72, 'clutch': 76, 'sdroganza': 89, 'tiltControl': 68, 'fortuna': 82}
    },
    'Just Marzaa': {
        'nickname': 'Il Maestro Supremo',
        'badge': 'Guest Star Speciale',
        'color': '#eab308',
        'accent': 'from-yellow-400 to-amber-600',
        'avatar': '⭐',
        'quote': "Basta poco, tocco nobile e stile napoletano sulla buca!",
        'bio': "Apparizione epica nella Golfatina #19 dei Maestri di Mazze e Palle: conquista un 2° posto leggendario a -9 con 45 colpi totali.",
        'radar': {'precisione': 88, 'clutch': 85, 'sdroganza': 92, 'tiltControl': 85, 'fortuna': 85}
    },
    'nbayungchape': {
        'nickname': 'Lo Sdrogo Acrobat',
        'badge': 'Pazzo Scatenato',
        'color': '#14b8a6',
        'accent': 'from-teal-400 to-emerald-600',
        'avatar': '🔥',
        'quote': "Saltiamo l'intera rampa e andiamo direttamente al green!",
        'bio': "Protagonista della spettacolare Golfatina #57 dove ottiene un clamoroso 2° posto a -9 dal par.",
        'radar': {'precisione': 84, 'clutch': 80, 'sdroganza': 90, 'tiltControl': 82, 'fortuna': 86}
    },
    'Fava': {
        'nickname': 'L\'Ardito del Green',
        'badge': 'Spirito Combattivo',
        'color': '#a855f7',
        'accent': 'from-purple-500 to-pink-600',
        'avatar': '🛡️',
        'quote': "Non importa quanti colpi prendo, l'importante è lo sdrogo!",
        'bio': "Ha affrontato la difficilissima mappa della Golfatina #57 con coraggio e tenacia tra rimbalzi impossibili.",
        'radar': {'precisione': 68, 'clutch': 70, 'sdroganza': 85, 'tiltControl': 75, 'fortuna': 70}
    }
}

# Enrich match data
matches_list = []
for m in MASTER_PDF_DATA:
    m_id = m['id']
    
    # Process player scorecards
    for p in m['players']:
        non_null_holes = [h for h in p['holes'] if h is not None]
        p['holeCount'] = len(non_null_holes)
        p['hios'] = sum(1 for h in non_null_holes if h == 1)
        p['disasters'] = sum(1 for h in non_null_holes if h >= 10)
        p['capped'] = sum(1 for h in non_null_holes if h >= 14)
        p['bestHole'] = min(non_null_holes) if non_null_holes else None
        p['worstHole'] = max(non_null_holes) if non_null_holes else None

    # Sort players by position then total score
    m['players'].sort(key=lambda p: (p['position'], p['totalScore']))

    winners = [p['name'] for p in m['players'] if p['position'] == 1]
    winner_str = " e ".join(winners)
    best_player = m['players'][0]
    worst_player = m['players'][-1]
    total_hios = sum(p['hios'] for p in m['players'])
    max_hole_score = max(p['worstHole'] for p in m['players'] if p['worstHole'] is not None)

    diff_text = f"{best_player['diffPar']:+d}" if best_player['diffPar'] != 0 else "PAR"

    if m_id == 1:
        comment = f"Trionfo inaugurale di Delux con un favoloso {diff_text}! Dread e GaBBo pagano dazio con buche da 14 colpi alla ricerca disperata del Progetto Gabbiness."
    elif m_id == 2:
        comment = f"La partita dei record folli con il nuovo standard di regole! GaBBo chiude a 181 colpi (+95) entrando nella leggenda dello sdrogo, vince Just Rohn."
    elif m_id == 3:
        comment = f"Compleanno memorabile con GaBBo che domina a sorpresa a -5 dal par (38 colpi)! Mollu in tilt completo a buca 13."
    elif m_id == 11:
        comment = f"La primissima Golfatina non si scorda mai: Masseo detta legge a -14 (45 colpi) e piazza buche perfette sul green."
    elif m_id == 29:
        comment = f"Prestazione mostruosa di Delux che sigla il record storico di -30 sotto il par (44 colpi su par 74)! Giocata da cineteca."
    elif m_id == 38:
        comment = f"Tensione alle stelle e frecciatine: Just Rohn vince a -12 al fotofinish su Dread e Delux appaiati al 2° posto a -11."
    elif m_id == 56:
        comment = f"Delux in stato di grazia nella mappa del castello chiude con uno sbalorditivo 35 (-24 dal par) e una precisione da manuale."
    elif len(winners) > 1:
        comment = f"Pareggio epico al vertice tra {winner_str} con {best_player['totalScore']} colpi ({diff_text} dal par)! Finale al cardiopalma."
    elif max_hole_score >= 14:
        comment = f"Vittoria di {winner_str} ({diff_text}). Partita segnata da buche maledette con picchi fino a {max_hole_score} colpi per {worst_player['name']}!"
    elif total_hios >= 5:
        comment = f"Festival dell'Hole-in-One! Ben {total_hios} buche in 1 colpo registrate in totale. {winner_str} chiude al 1° posto."
    else:
        comment = f"Grande scontro su mappa da par {m['totalPar']}: vince {winner_str} con {best_player['totalScore']} colpi ({diff_text} dal par)."

    m['winner'] = winner_str
    m['winningScore'] = best_player['totalScore']
    m['winningDiffPar'] = best_player['diffPar']
    m['mvp'] = best_player['name']
    m['asino'] = worst_player['name']
    m['totalHIOs'] = total_hios
    m['maxHoleScore'] = max_hole_score
    m['sdrogoCommentary'] = comment

    matches_list.append(m)

# Compute global stats per player
player_stats_map = {}
for p_name in player_lore.keys():
    p_matches = []
    for m in matches_list:
        for p in m['players']:
            if p['name'] == p_name:
                p_matches.append((m, p))
                break

    if not p_matches:
        continue

    total_played = len(p_matches)
    wins = sum(1 for m, p in p_matches if p['position'] == 1)
    podiums = sum(1 for m, p in p_matches if p['position'] in [1, 2, 3])
    total_score = sum(p['totalScore'] for m, p in p_matches)
    total_diff_par = sum(p['diffPar'] for m, p in p_matches)

    best_score = min(p['totalScore'] for m, p in p_matches)
    worst_score = max(p['totalScore'] for m, p in p_matches)
    best_diff_par = min(p['diffPar'] for m, p in p_matches)
    worst_diff_par = max(p['diffPar'] for m, p in p_matches)

    all_holes = []
    for m, p in p_matches:
        all_holes.extend([h for h in p['holes'] if h is not None])

    total_holes = len(all_holes)
    hios = sum(1 for h in all_holes if h == 1)
    twos = sum(1 for h in all_holes if h == 2)
    threes = sum(1 for h in all_holes if h == 3)
    fours_to_nines = sum(1 for h in all_holes if 4 <= h <= 9)
    disasters = sum(1 for h in all_holes if h >= 10)
    capped = sum(1 for h in all_holes if h >= 14)

    lore = player_lore[p_name]

    # Calculate nemesis
    nemesis_counts = {}
    for m, p in p_matches:
        p_pos = p['position']
        for other in m['players']:
            if other['name'] != p_name and other['position'] < p_pos:
                nemesis_counts[other['name']] = nemesis_counts.get(other['name'], 0) + 1

    nemesis = max(nemesis_counts.items(), key=lambda x: x[1])[0] if nemesis_counts else "Nessuno (Dominatore)"

    player_stats_map[p_name] = {
        'name': p_name,
        'nickname': lore['nickname'],
        'badge': lore['badge'],
        'color': lore['color'],
        'accent': lore['accent'],
        'avatar': lore['avatar'],
        'quote': lore['quote'],
        'bio': lore['bio'],
        'radar': lore['radar'],
        'matchesPlayed': total_played,
        'wins': wins,
        'winRate': round((wins / total_played) * 100, 1),
        'podiums': podiums,
        'podiumRate': round((podiums / total_played) * 100, 1),
        'avgScore': round(total_score / total_played, 1),
        'avgDiffPar': round(total_diff_par / total_played, 1),
        'bestScore': best_score,
        'worstScore': worst_score,
        'bestDiffPar': best_diff_par,
        'worstDiffPar': worst_diff_par,
        'totalHoles': total_holes,
        'totalHIOs': hios,
        'hioRate': round((hios / total_holes) * 100, 1) if total_holes > 0 else 0,
        'totalTwos': twos,
        'totalThrees': threes,
        'totalDisasters': disasters,
        'totalCapped': capped,
        'nemesis': nemesis
    }

# Head-to-head records calculation
h2h_matrix = {}
players_list = list(player_stats_map.keys())
for p1 in players_list:
    h2h_matrix[p1] = {}
    for p2 in players_list:
        if p1 == p2:
            continue
        shared = []
        p1_ahead = 0
        p2_ahead = 0
        draws = 0
        p1_total_score = 0
        p2_total_score = 0
        for m in matches_list:
            p1_entry = next((p for p in m['players'] if p['name'] == p1), None)
            p2_entry = next((p for p in m['players'] if p['name'] == p2), None)
            if p1_entry and p2_entry:
                shared.append(m['id'])
                p1_total_score += p1_entry['totalScore']
                p2_total_score += p2_entry['totalScore']
                if p1_entry['position'] < p2_entry['position']:
                    p1_ahead += 1
                elif p2_entry['position'] < p1_entry['position']:
                    p2_ahead += 1
                else:
                    draws += 1

        h2h_matrix[p1][p2] = {
            'sharedMatches': len(shared),
            'p1Wins': p1_ahead,
            'p2Wins': p2_ahead,
            'draws': draws,
            'p1AvgScore': round(p1_total_score / len(shared), 1) if shared else 0,
            'p2AvgScore': round(p2_total_score / len(shared), 1) if shared else 0,
            'sharedMatchIds': shared
        }

# Global summary
global_summary = {
    'totalMatches': len(matches_list),
    'totalVideos': 61,
    'totalScorecards': sum(len(m['players']) for m in matches_list),
    'totalHolesPlayed': sum(p['totalHoles'] for p in player_stats_map.values()),
    'totalHIOs': sum(p['totalHIOs'] for p in player_stats_map.values()),
    'totalDisasters': sum(p['totalDisasters'] for p in player_stats_map.values()),
    'mostWinsPlayer': max(player_stats_map.values(), key=lambda p: p['wins'])['name'],
    'bestDiffParRecord': min(m['winningDiffPar'] for m in matches_list),
    'worstScoreRecord': max(p['worstScore'] for p in player_stats_map.values())
}

# Write TypeScript file
os.makedirs('src/data', exist_ok=True)
ts_content = f'''// Master Verified Dataset for Lo Sdrogo Golfometro (Synchronized with Official PDF)

export interface PlayerScorecard {{
  name: string;
  position: number;
  totalScore: number;
  diffPar: number;
  holes: (number | null)[];
  holeCount: number;
  hios: number;
  disasters: number;
  capped: number;
  bestHole: number | null;
  worstHole: number | null;
}}

export interface GolfatinaMatch {{
  id: number;
  date: string;
  title: string;
  url: string;
  youtubeId: string;
  totalPar: number;
  winner: string;
  winningScore: number;
  winningDiffPar: number;
  mvp: string;
  asino: string;
  totalHIOs: number;
  maxHoleScore: number;
  sdrogoCommentary: string;
  players: PlayerScorecard[];
}}

export interface PlayerProfile {{
  name: string;
  nickname: string;
  badge: string;
  color: string;
  accent: string;
  avatar: string;
  quote: string;
  bio: string;
  radar: {{
    precisione: number;
    clutch: number;
    sdroganza: number;
    tiltControl: number;
    fortuna: number;
  }};
  matchesPlayed: number;
  wins: number;
  winRate: number;
  podiums: number;
  podiumRate: number;
  avgScore: number;
  avgDiffPar: number;
  bestScore: number;
  worstScore: number;
  bestDiffPar: number;
  worstDiffPar: number;
  totalHoles: number;
  totalHIOs: number;
  hioRate: number;
  totalTwos: number;
  totalThrees: number;
  totalDisasters: number;
  totalCapped: number;
  nemesis: string;
}}

export interface H2HRecord {{
  sharedMatches: number;
  p1Wins: number;
  p2Wins: number;
  draws: number;
  p1AvgScore: number;
  p2AvgScore: number;
  sharedMatchIds: number[];
}}

export interface GlobalSummary {{
  totalMatches: number;
  totalVideos: number;
  totalScorecards: number;
  totalHolesPlayed: number;
  totalHIOs: number;
  totalDisasters: number;
  mostWinsPlayer: string;
  bestDiffParRecord: number;
  worstScoreRecord: number;
}}

export const GLOBAL_SUMMARY: GlobalSummary = {json.dumps(global_summary, indent=2, ensure_ascii=False)};

export const PLAYERS_DATA: Record<string, PlayerProfile> = {json.dumps(player_stats_map, indent=2, ensure_ascii=False)};

export const H2H_DATA: Record<string, Record<string, H2HRecord>> = {json.dumps(h2h_matrix, indent=2, ensure_ascii=False)};

export const MATCHES_DATA: GolfatinaMatch[] = {json.dumps(matches_list, indent=2, ensure_ascii=False)};
'''

with open('src/data/golfatineData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Master verified dataset written: {len(matches_list)} matches, {len(player_stats_map)} players!")
