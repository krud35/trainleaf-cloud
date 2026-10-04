import type { Exercise } from './domain';

// Shares are editable accounting choices, never measured muscle activation or physiological percentages.
// Imported IDs, filmed variants and original source references are preserved.
const catalog = [
  {
    "id": "catalog-back-squat",
    "name": "Przysiad ze sztangą na plecach",
    "nameEn": "Back squat",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.5
      },
      {
        "muscle": "glutes",
        "weight": 0.35
      },
      {
        "muscle": "abs",
        "weight": 0.15
      }
    ],
    "video": "",
    "notes": "W źródłach są różne filmy; daty planu nie pozwalają ustalić najnowszego. Wybierz film z linków źródłowych.",
    "cues": "Ugnij biodra i kolana ze sztangą opartą na górze pleców. Wstań, utrzymując stabilne podparcie stóp.",
    "cuesEn": "Bend your hips and knees with the bar on your upper back. Stand up with stable foot contact.",
    "variants": "Przysiad przedni zmienia położenie obciążenia; pauza rozwija kontrolę. Dobierz głębokość do możliwości.",
    "variantsEn": "Front loading changes balance demands; a pause develops control. Choose an appropriate depth.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=-bJIpOq-LWk",
      "https://www.youtube.com/shorts/PPmvh7gBTi0",
      "https://www.acefitness.org/resources/everyone/exercise-library/11/back-squat/"
    ],
    "provenance": "Plan treningowy · WEEK 2 (O) · B9",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 8; obciążenie / wysiłek: T; przerwa: 2-3min. Wartości można zmienić."
  },
  {
    "id": "catalog-half-squat",
    "name": "Półprzysiad",
    "nameEn": "Half squat",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.5
      },
      {
        "muscle": "glutes",
        "weight": 0.35
      },
      {
        "muscle": "abs",
        "weight": 0.15
      }
    ],
    "video": "https://www.youtube.com/shorts/1JEDVloIubk",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Wykonaj przysiad do ustalonej połowy zakresu. Zachowaj ten sam zakres w kolejnych powtórzeniach.",
    "cuesEn": "Squat to the chosen half-depth and use the same range on each repetition.",
    "variants": "Ograniczony zakres ćwiczy siłę w wybranych pozycjach. Pełniejszy przysiad stanowi osobny wariant; porównuj wyniki przy takim samym zakresie.",
    "variantsEn": "A limited range trains strength in chosen positions. A deeper squat is a separate variation; compare results at the same depth.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/1JEDVloIubk",
      "https://www.acefitness.org/resources/everyone/exercise-library/11/back-squat/"
    ],
    "provenance": "Plan treningowy · WEEK 2 (O) · B15",
    "prescription": "Przykład zapisu z planu: serie: 2; powt.: 2; obciążenie / wysiłek: RIR 2-3; przerwa: 2min. Wartości można zmienić."
  },
  {
    "id": "catalog-quarter-box-squat",
    "name": "Ćwierćprzysiad do skrzyni",
    "nameEn": "Quarter box squat",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.5
      },
      {
        "muscle": "glutes",
        "weight": 0.35
      },
      {
        "muscle": "abs",
        "weight": 0.15
      }
    ],
    "video": "https://www.youtube.com/shorts/BbaryZJtRSk",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Cofnij biodra do wysokiej skrzyni i wróć do stania. Wysokość skrzyni wyznacza zakres.",
    "cuesEn": "Sit your hips back to a high box and return to standing. The box sets the movement range.",
    "variants": "Wysokość skrzyni określa krótki zakres. Pauza na skrzyni i lekkie dotknięcie mają inne wymagania; zachowaj jednakowy wariant przy porównywaniu obciążeń.",
    "variantsEn": "Box height defines the short range. A pause on the box and a light touch have different demands; use the same variant when comparing loads.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/BbaryZJtRSk",
      "https://www.acefitness.org/resources/everyone/exercise-library/11/back-squat/"
    ],
    "provenance": "Plan treningowy · WEEK 17 (P) · B62",
    "prescription": "Przykład zapisu z planu: serie: 2; powt.: 4; obciążenie / wysiłek: RIR 1-2; przerwa: 2min. Wartości można zmienić."
  },
  {
    "id": "catalog-dumbbell-goblet-squat",
    "name": "Przysiad goblet z hantlem",
    "nameEn": "Dumbbell goblet squat",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.5
      },
      {
        "muscle": "glutes",
        "weight": 0.35
      },
      {
        "muscle": "abs",
        "weight": 0.15
      }
    ],
    "video": "https://www.youtube.com/shorts/yTDROg8zZsU",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Trzymaj hantel przed klatką, ugnij biodra i kolana, następnie wstań.",
    "cuesEn": "Hold a dumbbell at your chest, bend your hips and knees, then stand up.",
    "variants": "Pauza uczy pozycji dolnej; ciężar z przodu pomaga ćwiczyć równowagę i kontrolę przysiadu.",
    "variantsEn": "A pause trains the bottom position; front loading helps practice balance and squat control.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/yTDROg8zZsU",
      "https://www.acefitness.org/resources/everyone/exercise-library/362/goblet-squat/"
    ],
    "provenance": "Plan treningowy · WEEK 1 (O) · B3",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 10; obciążenie / wysiłek: T; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-bulgarian-split-squat",
    "name": "Przysiad bułgarski",
    "nameEn": "Bulgarian split squat",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.4
      },
      {
        "muscle": "glutes",
        "weight": 0.4
      },
      {
        "muscle": "adductors",
        "weight": 0.1
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/shorts/uODWo4YqbT8",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Oprzyj tylną stopę na podwyższeniu. Uginaj przednią nogę i wracaj do góry.",
    "cuesEn": "Rest the rear foot on an elevated support. Bend the front leg and return upwards.",
    "variants": "Lekki skłon może zwiększać wymagania biodra; bardziej pionowy tułów zmienia akcent. Podparcie pomaga równowadze.",
    "variantsEn": "A slight forward lean can increase hip demands; a more upright trunk changes emphasis. Support helps balance.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/uODWo4YqbT8",
      "https://www.acefitness.org/resources/everyone/exercise-library/366/bulgarian-split-squat/"
    ],
    "provenance": "Plan treningowy · WEEK 8 (O) · B12",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 8/str; obciążenie / wysiłek: RIR 2; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-barbell-bulgarian-split-squat",
    "name": "Przysiad bułgarski ze sztangą",
    "nameEn": "Barbell Bulgarian split squat",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.4
      },
      {
        "muscle": "glutes",
        "weight": 0.4
      },
      {
        "muscle": "adductors",
        "weight": 0.1
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/shorts/bRFohIMjQ7A",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Wykonaj przysiad bułgarski ze sztangą. Wpisz łączne powtórzenia obu stron.",
    "cuesEn": "Perform a Bulgarian split squat with a barbell. Record total repetitions across both sides.",
    "variants": "Lekki skłon może zwiększać wymagania biodra; bardziej pionowy tułów zmienia akcent. Podparcie pomaga równowadze.",
    "variantsEn": "A slight forward lean can increase hip demands; a more upright trunk changes emphasis. Support helps balance.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/bRFohIMjQ7A",
      "https://www.acefitness.org/resources/everyone/exercise-library/366/bulgarian-split-squat/"
    ],
    "provenance": "Plan treningowy · WEEK 12 (O) · B8",
    "prescription": "Przykład zapisu z planu: serie: 4; powt.: 4/str; obciążenie / wysiłek: T; przerwa: 3min. Wartości można zmienić."
  },
  {
    "id": "catalog-dumbbell-split-squat",
    "name": "Przysiad w wykroku z hantlami",
    "nameEn": "Dumbbell split squat",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.4
      },
      {
        "muscle": "glutes",
        "weight": 0.4
      },
      {
        "muscle": "adductors",
        "weight": 0.1
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/shorts/e2yTsw-Yjss",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Z wykrocznej pozycji obniż tułów i wróć do góry, trzymając hantle przy bokach.",
    "cuesEn": "Lower and raise your body in a split stance with dumbbells at your sides.",
    "variants": "Lekki skłon może zwiększać wymagania biodra; bardziej pionowy tułów zmienia akcent. Podparcie pomaga równowadze.",
    "variantsEn": "A slight forward lean can increase hip demands; a more upright trunk changes emphasis. Support helps balance.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/e2yTsw-Yjss",
      "https://www.acefitness.org/resources/everyone/exercise-library/366/bulgarian-split-squat/"
    ],
    "provenance": "Plan treningowy · WEEK 4 (O) · B18",
    "prescription": "Przykład zapisu z planu: serie: 2; powt.: 8/str; obciążenie / wysiłek: RIR 2; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-barbell-forward-lunge",
    "name": "Wykrok w przód ze sztangą",
    "nameEn": "Barbell forward lunge",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.4
      },
      {
        "muscle": "glutes",
        "weight": 0.4
      },
      {
        "muscle": "adductors",
        "weight": 0.1
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/watch?v=9sqrsMfUNTU",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Zrób krok w przód, ugnij nogi i wróć do pozycji wyjściowej.",
    "cuesEn": "Step forwards, bend both legs and return to the starting position.",
    "variants": "Dłuższy krok zmienia wymagania biodra; krótszy zmienia zgięcie kolana. Nie traktuj długości kroku jako izolacji mięśnia.",
    "variantsEn": "A longer step changes hip demands; a shorter step changes knee bend. Step length does not isolate a muscle.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=9sqrsMfUNTU",
      "https://www.acefitness.org/resources/everyone/exercise-library/366/bulgarian-split-squat/"
    ],
    "provenance": "Plan treningowy · WEEK 13 (O) · B38",
    "prescription": "Przykład zapisu z planu: serie: 1+4; powt.: 4/str; obciążenie / wysiłek: T; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-dumbbell-forward-to-reverse-lunge",
    "name": "Wykrok w przód i zakrok z hantlami",
    "nameEn": "Dumbbell forward-to-reverse lunge",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.4
      },
      {
        "muscle": "glutes",
        "weight": 0.4
      },
      {
        "muscle": "adductors",
        "weight": 0.1
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/shorts/APICypPdFtA",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Połącz wykrok w przód z wykrokiem w tył tej samej nogi. Ustal sposób liczenia całej sekwencji.",
    "cuesEn": "Combine a forward and reverse lunge on the same leg. Define how you count the full sequence.",
    "variants": "Dłuższy krok zmienia wymagania biodra; krótszy zmienia zgięcie kolana. Nie traktuj długości kroku jako izolacji mięśnia.",
    "variantsEn": "A longer step changes hip demands; a shorter step changes knee bend. Step length does not isolate a muscle.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/APICypPdFtA",
      "https://www.acefitness.org/resources/everyone/exercise-library/366/bulgarian-split-squat/"
    ],
    "provenance": "Plan treningowy · WEEK 19 (O) · B43",
    "prescription": "Przykład zapisu z planu: serie: 4; powt.: 6/str; obciążenie / wysiłek: RIR 3; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-single-leg-landmine-squat",
    "name": "Przysiad jednonóż z landmine",
    "nameEn": "Single-leg landmine squat",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.5
      },
      {
        "muscle": "glutes",
        "weight": 0.35
      },
      {
        "muscle": "abs",
        "weight": 0.15
      }
    ],
    "video": "https://www.youtube.com/watch?v=izyN10kKdeM",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Trzymaj koniec sztangi przy klatce i wykonaj przysiad na jednej nodze.",
    "cuesEn": "Hold the free end of a landmine bar at your chest and perform a single-leg squat.",
    "variants": "Sztanga landmine daje punkt podparcia i inny tor obciążenia. Mniejsze wsparcie zwiększa wymagania równowagi; nie musi zwiększać bodźca siłowego.",
    "variantsEn": "The landmine provides support and a different load path. Less support increases balance demands; it does not necessarily increase the strength stimulus.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=izyN10kKdeM"
    ],
    "provenance": "Plan treningowy · WEEK 17 (P) · B63",
    "prescription": "Przykład zapisu z planu: serie: 2; powt.: 6/str; obciążenie / wysiłek: T; przerwa: 2min. Wartości można zmienić."
  },
  {
    "id": "catalog-conventional-deadlift",
    "name": "Martwy ciąg klasyczny",
    "nameEn": "Conventional deadlift",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.35
      },
      {
        "muscle": "hamstrings",
        "weight": 0.3
      },
      {
        "muscle": "quads",
        "weight": 0.2
      },
      {
        "muscle": "lower_back",
        "weight": 0.15
      }
    ],
    "video": "",
    "notes": "W źródłach są różne filmy; daty planu nie pozwalają ustalić najnowszego. Wybierz film z linków źródłowych.",
    "cues": "Podnieś sztangę z podłoża, prostując biodra i kolana. Odłóż ją w kontrolowany sposób.",
    "cuesEn": "Lift the bar from the floor by extending your hips and knees. Lower it with control.",
    "variants": "Podwyższenie ciężaru skraca zakres; wariant rumuński przenosi akcent na zawias biodrowy.",
    "variantsEn": "Raising the load shortens the range; the Romanian variation emphasizes hip hinging.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=1ZXobu7JvvE",
      "https://www.youtube.com/shorts/ZaTM37cfiDs",
      "https://www.acefitness.org/resources/everyone/exercise-library/6/deadlift/"
    ],
    "provenance": "Plan treningowy · WEEK 2 (O) · B10",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 8; obciążenie / wysiłek: T; przerwa: 2-3min. Wartości można zmienić."
  },
  {
    "id": "catalog-trap-bar-deadlift",
    "name": "Martwy ciąg z trap barem",
    "nameEn": "Trap-bar deadlift",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.35
      },
      {
        "muscle": "hamstrings",
        "weight": 0.3
      },
      {
        "muscle": "quads",
        "weight": 0.2
      },
      {
        "muscle": "lower_back",
        "weight": 0.15
      }
    ],
    "video": "",
    "notes": "W źródłach są różne filmy; daty planu nie pozwalają ustalić najnowszego. Wybierz film z linków źródłowych.",
    "cues": "Stań wewnątrz trap bara i podnieś go za uchwyty, prostując biodra i kolana.",
    "cuesEn": "Stand inside the trap bar and lift its handles by extending your hips and knees.",
    "variants": "Wyższe uchwyty skracają zakres. Większe zgięcie kolan zmienia udział ruchu kolana względem biodra.",
    "variantsEn": "High handles shorten the range. Greater knee bend changes the balance of knee and hip motion.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/tsIQqdJfoV0",
      "https://www.youtube.com/watch?v=FYx76NSijfU",
      "https://www.youtube.com/shorts/oGVgO4wWmu4",
      "https://www.nasm.org/resource-center/exercise-library/barbell-deadlift"
    ],
    "provenance": "Plan treningowy · WEEK 12 (O) · B10",
    "prescription": "Przykład zapisu z planu: serie: 4; powt.: 4; obciążenie / wysiłek: RIR 2; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-kettlebell-deadlift",
    "name": "Martwy ciąg z kettlebellem",
    "nameEn": "Kettlebell deadlift",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.35
      },
      {
        "muscle": "hamstrings",
        "weight": 0.3
      },
      {
        "muscle": "quads",
        "weight": 0.2
      },
      {
        "muscle": "lower_back",
        "weight": 0.15
      }
    ],
    "video": "",
    "notes": "W źródłach są różne filmy; daty planu nie pozwalają ustalić najnowszego. Wybierz film z linków źródłowych.",
    "cues": "Podnieś kettlebell ustawiony pomiędzy stopami, prostując biodra i kolana.",
    "cuesEn": "Lift a kettlebell between your feet by extending your hips and knees.",
    "variants": "Podwyższenie ciężaru skraca zakres; wariant rumuński przenosi akcent na zawias biodrowy.",
    "variantsEn": "Raising the load shortens the range; the Romanian variation emphasizes hip hinging.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=YZVuWuvXpVU",
      "https://www.youtube.com/watch?v=1ZXobu7JvvE",
      "https://www.acefitness.org/resources/everyone/exercise-library/6/deadlift/"
    ],
    "provenance": "Plan treningowy · WEEK 1 (O) · B5",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 10; obciążenie / wysiłek: T; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-single-leg-deadlift",
    "name": "Martwy ciąg jednonóż",
    "nameEn": "Single-leg deadlift",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "hamstrings",
        "weight": 0.4
      },
      {
        "muscle": "glutes",
        "weight": 0.4
      },
      {
        "muscle": "lower_back",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "W źródłach są różne filmy; daty planu nie pozwalają ustalić najnowszego. Wybierz film z linków źródłowych.",
    "cues": "Cofnij biodro nogi podporowej i pochyl tułów, unosząc drugą nogę w tył.",
    "cuesEn": "Hinge at the supporting hip and lean forwards as the other leg reaches back.",
    "variants": "Podparcie ręką ogranicza wymagania równowagi; wariant kickstand ułatwia skupienie na sile biodra.",
    "variantsEn": "Hand support reduces balance demands; a kickstand stance makes hip strength easier to emphasize.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=rnicPfTq2Hs",
      "https://www.youtube.com/shorts/s32cCgmRV3I",
      "https://www.nasm.org/resource-center/exercise-library/romanian-deadlift-barbell"
    ],
    "provenance": "Plan treningowy · WEEK 3 (O) · B9",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 8/strone; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-dumbbell-single-leg-deadlift",
    "name": "Martwy ciąg jednonóż z hantlami",
    "nameEn": "Dumbbell single-leg deadlift",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "hamstrings",
        "weight": 0.4
      },
      {
        "muscle": "glutes",
        "weight": 0.4
      },
      {
        "muscle": "lower_back",
        "weight": 0.2
      }
    ],
    "video": "https://www.youtube.com/shorts/KvhOlSV1qDc",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Wykonaj zawias biodrowy na jednej nodze z hantlami. Zapisz łączny ciężar hantli.",
    "cuesEn": "Perform a single-leg hip hinge with dumbbells. Record their combined weight.",
    "variants": "Podparcie ręką ogranicza wymagania równowagi; wariant kickstand ułatwia skupienie na sile biodra.",
    "variantsEn": "Hand support reduces balance demands; a kickstand stance makes hip strength easier to emphasize.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/KvhOlSV1qDc",
      "https://www.nasm.org/resource-center/exercise-library/romanian-deadlift-barbell"
    ],
    "provenance": "Plan treningowy · WEEK 15 (O) · B9",
    "prescription": "Przykład zapisu z planu: serie: 4; powt.: 6/str; obciążenie / wysiłek: RIR 2; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-barbell-single-leg-deadlift",
    "name": "Martwy ciąg jednonóż ze sztangą",
    "nameEn": "Barbell single-leg deadlift",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "hamstrings",
        "weight": 0.4
      },
      {
        "muscle": "glutes",
        "weight": 0.4
      },
      {
        "muscle": "lower_back",
        "weight": 0.2
      }
    ],
    "video": "https://www.youtube.com/shorts/25VoqYEUC0Y",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Wykonaj zawias biodrowy na jednej nodze ze sztangą prowadzoną blisko nogi.",
    "cuesEn": "Perform a single-leg hip hinge with the bar close to the supporting leg.",
    "variants": "Podparcie ręką ogranicza wymagania równowagi; wariant kickstand ułatwia skupienie na sile biodra.",
    "variantsEn": "Hand support reduces balance demands; a kickstand stance makes hip strength easier to emphasize.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/25VoqYEUC0Y",
      "https://www.nasm.org/resource-center/exercise-library/romanian-deadlift-barbell"
    ],
    "provenance": "Plan treningowy · WEEK 13 (O) · B40",
    "prescription": "Przykład zapisu z planu: serie: 1+4; powt.: 4/str; obciążenie / wysiłek: T; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-hip-thrust",
    "name": "Unoszenie bioder · hip thrust",
    "nameEn": "Hip thrust",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.7
      },
      {
        "muscle": "hamstrings",
        "weight": 0.2
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/watch?v=5S8SApGU_Lk",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Oprzyj górę pleców o ławkę i unieś biodra. Zatrzymaj ruch przy wyproście bioder.",
    "cuesEn": "Support your upper back on a bench and raise your hips to hip extension.",
    "variants": "Most na podłodze skraca zakres; wariant jednonóż zwiększa wymagania kontroli miednicy.",
    "variantsEn": "A floor bridge shortens the range; a single-leg version adds pelvic-control demands.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=5S8SApGU_Lk",
      "https://www.acefitness.org/resources/everyone/exercise-library/318/hip-bridge/"
    ],
    "provenance": "Plan treningowy · WEEK 7 (O) · B39",
    "prescription": "Przykład zapisu z planu: serie: 4; powt.: 6; obciążenie / wysiłek: RIR 2; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-single-leg-barbell-hip-thrust",
    "name": "Hip thrust jednonóż ze sztangą",
    "nameEn": "Single-leg barbell hip thrust",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.7
      },
      {
        "muscle": "hamstrings",
        "weight": 0.2
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/watch?v=nEppV-EZzvA",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Unieś biodra z jedną stopą opartą o podłoże i sztangą na biodrach.",
    "cuesEn": "Raise your hips with one foot on the floor and the bar supported across your hips.",
    "variants": "Most na podłodze skraca zakres; wariant jednonóż zwiększa wymagania kontroli miednicy.",
    "variantsEn": "A floor bridge shortens the range; a single-leg version adds pelvic-control demands.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=nEppV-EZzvA",
      "https://www.acefitness.org/resources/everyone/exercise-library/318/hip-bridge/"
    ],
    "provenance": "Plan treningowy · WEEK 6 (O) · B23",
    "prescription": "Przykład zapisu z planu: serie: 4; powt.: 6/str; obciążenie / wysiłek: RIR 2; przerwa: 3min. Wartości można zmienić."
  },
  {
    "id": "catalog-banded-single-leg-hip-thrust",
    "name": "Hip thrust jednonóż z gumą",
    "nameEn": "Banded single-leg hip thrust",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.7
      },
      {
        "muscle": "hamstrings",
        "weight": 0.2
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/shorts/YAVrIO5VAWA",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Unieś biodra na jednej nodze z oporem gumy. Wpisz powtórzenia obu stron.",
    "cuesEn": "Raise your hips on one leg against a resistance band. Record repetitions on both sides.",
    "variants": "Most na podłodze skraca zakres; wariant jednonóż zwiększa wymagania kontroli miednicy.",
    "variantsEn": "A floor bridge shortens the range; a single-leg version adds pelvic-control demands.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/YAVrIO5VAWA",
      "https://www.acefitness.org/resources/everyone/exercise-library/318/hip-bridge/"
    ],
    "provenance": "Plan treningowy · WARMUP SIŁKA 2 · B10",
    "prescription": "Przykład zapisu z planu: ilość / czas: 10/str. Wartości można zmienić."
  },
  {
    "id": "catalog-hamstring-leg-curl",
    "name": "Uginanie nóg na tył uda",
    "nameEn": "Hamstring leg curl",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "hamstrings",
        "weight": 1
      }
    ],
    "video": "",
    "notes": "",
    "cues": "Ugnij kolana przeciw oporowi maszyny, a następnie wróć do pozycji wyjściowej.",
    "cuesEn": "Bend your knees against the machine resistance, then return to the starting position.",
    "variants": "Wariant siedzący zmienia ustawienie biodra; jednonóż pozwala śledzić każdą stronę osobno.",
    "variantsEn": "The seated version changes hip position; single-leg work lets you track sides separately.",
    "sourceUrls": [
      "https://www.nasm.org/resource-center/exercise-library/lying-leg-curl"
    ],
    "provenance": "Plan treningowy · WEEK 2 (O) · B27",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 10; obciążenie / wysiłek: RIR 1-2; przerwa: 30s. Wartości można zmienić."
  },
  {
    "id": "catalog-stability-ball-leg-curl",
    "name": "Uginanie nóg na piłce",
    "nameEn": "Stability-ball leg curl",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "hamstrings",
        "weight": 0.6
      },
      {
        "muscle": "glutes",
        "weight": 0.3
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/shorts/jtB9f2TBdVU",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Oprzyj pięty na piłce i przyciągnij ją, uginając kolana i utrzymując biodra uniesione.",
    "cuesEn": "Place your heels on a stability ball and draw it in while keeping your hips raised.",
    "variants": "Most z uginaniem kolan dodaje utrzymanie wyprostu bioder. Praca jednonóż zwiększa wymagania pojedynczej nogi i kontroli miednicy.",
    "variantsEn": "A bridge with knee flexion adds sustained hip extension. Single-leg work raises individual-leg and pelvic-control demands.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/jtB9f2TBdVU",
      "https://www.nasm.org/resource-center/exercise-library/lying-leg-curl"
    ],
    "provenance": "Plan treningowy · WEEK 2 (O) · B14",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 8; przerwa: 1 min. Wartości można zmienić."
  },
  {
    "id": "catalog-band-assisted-nordic-curl",
    "name": "Uginanie nordyckie z pomocą gumy",
    "nameEn": "Band-assisted Nordic curl",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "hamstrings",
        "weight": 0.9
      },
      {
        "muscle": "glutes",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/shorts/imqh_lW1i9k",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Z klęku pochyl ciało w przód przy ustabilizowanych stopach. Guma wspomaga ruch.",
    "cuesEn": "Lean forwards from kneeling with your feet secured. The band assists the movement.",
    "variants": "Guma lub krótszy zakres ułatwia kontrolowane opuszczanie. Wprowadzaj objętość stopniowo.",
    "variantsEn": "A band or shorter range helps controlled lowering. Introduce volume gradually.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/imqh_lW1i9k",
      "https://www.nsca.com/education/articles/nsca-coach/exercise-progressions-for-resuming-strength-training-following-posterior-chain-muscle-injury/"
    ],
    "provenance": "Plan treningowy · WEEK 7 (O) · B16",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 10; obciążenie / wysiłek: RIR 3; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-machine-knee-extension",
    "name": "Prostowanie kolan na maszynie",
    "nameEn": "Machine knee extension",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "quads",
        "weight": 1
      }
    ],
    "video": "https://www.youtube.com/shorts/iQ92TuvBqRo",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Wyprostuj kolana przeciw oporowi maszyny i wróć do zgięcia.",
    "cuesEn": "Extend your knees against the machine resistance and return to the bent position.",
    "variants": "Wariant jednonóż pozwala śledzić każdą stronę. Dobór zakresu zmienia trenowane pozycje kolana; zachowuj kontrolę ruchu i dopasowanie maszyny.",
    "variantsEn": "Single-leg work lets you track sides. Range selection changes trained knee positions; maintain control and adjust the machine.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/iQ92TuvBqRo"
    ],
    "provenance": "Plan treningowy · WEEK 1 (O) · B19",
    "prescription": "Przykład zapisu z planu: obciążenie / wysiłek: RIR 2; przerwa: 1,5min. Wartości można zmienić."
  },
  {
    "id": "catalog-machine-hip-adduction",
    "name": "Przywodzenie bioder na maszynie",
    "nameEn": "Machine hip adduction",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "adductors",
        "weight": 1
      }
    ],
    "video": "",
    "notes": "",
    "cues": "Zbliż uda przeciw oporowi maszyny i wróć do pozycji wyjściowej.",
    "cuesEn": "Bring your thighs together against machine resistance, then return to the starting position.",
    "variants": "Przywodzenie bezpośrednio ćwiczy ruch uda do środka. Zmiana pozycji biodra i zakresu zmienia zadanie; przysiad nie zastępuje go we wszystkich zakresach.",
    "variantsEn": "Adduction directly trains moving the thigh inward. Hip position and range change the task; a squat does not replace it across all ranges.",
    "sourceUrls": [
      "https://www.nsca.com/education/articles/ptq/are-the-seated-leg-extension-leg-curl-and-adduction-machine-exercises-non-functional-or-risky/"
    ],
    "provenance": "Plan treningowy · WEEK 1 (O) · B32",
    "prescription": "Przykład zapisu z planu: obciążenie / wysiłek: RIR 2-3; przerwa: 1-2min. Wartości można zmienić."
  },
  {
    "id": "catalog-machine-hip-abduction",
    "name": "Odwodzenie bioder na maszynie",
    "nameEn": "Machine hip abduction",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "abductors",
        "weight": 0.7
      },
      {
        "muscle": "glutes",
        "weight": 0.3
      }
    ],
    "video": "",
    "notes": "",
    "cues": "Rozsuń uda przeciw oporowi maszyny i wróć do pozycji wyjściowej.",
    "cuesEn": "Move your thighs apart against machine resistance, then return to the starting position.",
    "variants": "Maszyna stabilizuje tułów podczas odwodzenia. Wariant stojący z gumą dodaje kontrolę nogi podporowej; nie porównuj oporu między urządzeniami jak tej samej miary.",
    "variantsEn": "The machine supports the trunk during abduction. Standing band work adds stance-leg control; resistance across devices is not directly comparable.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/"
    ],
    "provenance": "Plan treningowy · WEEK 1 (O) · B31",
    "prescription": "Przykład zapisu z planu: serie: 3; obciążenie / wysiłek: RIR 2-3; przerwa: 1-2min. Wartości można zmienić."
  },
  {
    "id": "catalog-weighted-single-leg-calf-raise",
    "name": "Wspięcia na palce jednonóż z obciążeniem",
    "nameEn": "Weighted single-leg calf raise",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "calves",
        "weight": 0.9
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "",
    "notes": "W źródłach są różne filmy; daty planu nie pozwalają ustalić najnowszego. Wybierz film z linków źródłowych.",
    "cues": "Unieś piętę nogi podporowej i opuść ją. Zapisz dodatkowy ciężar i powtórzenia obu stron.",
    "cuesEn": "Raise and lower the heel of the supporting leg. Record added weight and total repetitions.",
    "variants": "Proste kolano bardziej angażuje brzuchaty łydki; zgięte zmienia akcent w stronę płaszczkowatego.",
    "variantsEn": "A straight knee emphasizes gastrocnemius more; a bent knee shifts emphasis toward soleus.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/Bfl5du8ehao",
      "https://www.youtube.com/shorts/gbXcd-tVH2Q",
      "https://www.acefitness.org/resources/everyone/exercise-library/51/calf-raises/"
    ],
    "provenance": "Plan treningowy · WARMUP MOBILITY 2 · B17",
    "prescription": "Przykład zapisu z planu: ilość / czas: 10/str. Wartości można zmienić."
  },
  {
    "id": "catalog-barbell-calf-raise",
    "name": "Wspięcia na palce ze sztangą",
    "nameEn": "Barbell calf raise",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "calves",
        "weight": 0.9
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/shorts/7rYNCgQit-U",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Ze sztangą unieś obie pięty, następnie je opuść.",
    "cuesEn": "With a barbell, raise both heels and lower them again.",
    "variants": "Proste kolano bardziej angażuje brzuchaty łydki; zgięte zmienia akcent w stronę płaszczkowatego.",
    "variantsEn": "A straight knee emphasizes gastrocnemius more; a bent knee shifts emphasis toward soleus.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/7rYNCgQit-U",
      "https://www.acefitness.org/resources/everyone/exercise-library/51/calf-raises/"
    ],
    "provenance": "Plan treningowy · WEEK 11 (O) · B33",
    "prescription": "Przykład zapisu z planu: serie: 2; powt.: 8; obciążenie / wysiłek: RIR 5-6 (lekko); przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-barbell-bench-press",
    "name": "Wyciskanie sztangi leżąc",
    "nameEn": "Barbell bench press",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "chest",
        "weight": 0.5
      },
      {
        "muscle": "triceps",
        "weight": 0.3
      },
      {
        "muscle": "shoulders",
        "weight": 0.2
      }
    ],
    "video": "https://www.youtube.com/watch?v=SCVCLChPQFY",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Leżąc na ławce, opuść sztangę w stronę klatki i wyciśnij ją w górę.",
    "cuesEn": "Lie on a bench, lower the bar towards your chest and press it up.",
    "variants": "Węższy chwyt zmienia wymagania tricepsa; hantle dają inne możliwości chwytu i niezależną pracę ramion.",
    "variantsEn": "A closer grip changes triceps demands; dumbbells offer grip choices and independent arm work.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=SCVCLChPQFY",
      "https://www.acefitness.org/resources/everyone/exercise-library/5/chest-press/"
    ],
    "provenance": "Plan treningowy · WEEK 2 (O) · B11",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 8; obciążenie / wysiłek: T; przerwa: 2-3min. Wartości można zmienić."
  },
  {
    "id": "catalog-dumbbell-bench-press",
    "name": "Wyciskanie hantli leżąc",
    "nameEn": "Dumbbell bench press",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "chest",
        "weight": 0.5
      },
      {
        "muscle": "triceps",
        "weight": 0.3
      },
      {
        "muscle": "shoulders",
        "weight": 0.2
      }
    ],
    "video": "https://www.youtube.com/watch?v=YQ2s_Y7g5Qk",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Leżąc na ławce, opuść hantle i wyciśnij je. Wpisz łączny ciężar obu hantli.",
    "cuesEn": "Lie on a bench and lower and press the dumbbells. Record their combined weight.",
    "variants": "Węższy chwyt zmienia wymagania tricepsa; hantle dają inne możliwości chwytu i niezależną pracę ramion.",
    "variantsEn": "A closer grip changes triceps demands; dumbbells offer grip choices and independent arm work.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=YQ2s_Y7g5Qk",
      "https://www.acefitness.org/resources/everyone/exercise-library/5/chest-press/"
    ],
    "provenance": "Plan treningowy · WEEK 1 (O) · B7",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 10; obciążenie / wysiłek: T; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-single-arm-dumbbell-bench-press",
    "name": "Wyciskanie hantla leżąc jednorącz",
    "nameEn": "Single-arm dumbbell bench press",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "chest",
        "weight": 0.5
      },
      {
        "muscle": "triceps",
        "weight": 0.3
      },
      {
        "muscle": "shoulders",
        "weight": 0.2
      }
    ],
    "video": "https://www.youtube.com/shorts/Cs2uNF-jW5s",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Wyciskaj jeden hantel w leżeniu na ławce. Zapisz powtórzenia obu stron.",
    "cuesEn": "Press one dumbbell while lying on a bench. Record repetitions on both sides.",
    "variants": "Węższy chwyt zmienia wymagania tricepsa; hantle dają inne możliwości chwytu i niezależną pracę ramion.",
    "variantsEn": "A closer grip changes triceps demands; dumbbells offer grip choices and independent arm work.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/Cs2uNF-jW5s",
      "https://www.acefitness.org/resources/everyone/exercise-library/5/chest-press/"
    ],
    "provenance": "Plan treningowy · WEEK 12 (O) · B9",
    "prescription": "Przykład zapisu z planu: serie: 4; powt.: 6/str; obciążenie / wysiłek: RIR 3. Wartości można zmienić."
  },
  {
    "id": "catalog-push-up",
    "name": "Pompki",
    "nameEn": "Push-up",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "chest",
        "weight": 0.5
      },
      {
        "muscle": "triceps",
        "weight": 0.3
      },
      {
        "muscle": "shoulders",
        "weight": 0.2
      }
    ],
    "video": "https://www.youtube.com/watch?v=WDIpL0pjun0",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "W podporze ugnij łokcie, opuść tułów i odepchnij się od podłoża.",
    "cuesEn": "Bend your elbows in a plank, lower your body and push away from the floor.",
    "variants": "Ręce na podwyższeniu zmniejszają obciążenie; stopy na podwyższeniu zmieniają wymagania barków.",
    "variantsEn": "Elevating the hands reduces resistance; elevating the feet changes shoulder demands.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=WDIpL0pjun0",
      "https://www.nasm.org/resource-center/exercise-library/push-up"
    ],
    "provenance": "Plan treningowy · WEEK 1 (O) · B27",
    "prescription": "Przykład zapisu z planu: powt.: 8; obciążenie / wysiłek: T; przerwa: 1-2min. Wartości można zmienić."
  },
  {
    "id": "catalog-plyometric-push-up",
    "name": "Pompki z odbiciem",
    "nameEn": "Plyometric push-up",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "chest",
        "weight": 0.5
      },
      {
        "muscle": "triceps",
        "weight": 0.3
      },
      {
        "muscle": "shoulders",
        "weight": 0.2
      }
    ],
    "video": "https://www.youtube.com/watch?v=xXE3nbL-ae0",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Z dolnej pozycji pompki odepchnij podłoże, aby dłonie krótko straciły kontakt z ziemią.",
    "cuesEn": "Push explosively from the bottom of a push-up so the hands briefly leave the floor.",
    "variants": "Odbicie dodaje cel mocy. Zacznij od krótkiego oderwania dłoni lub podwyższenia; zwykła pompka rozwija kontrolowany wzorzec pchania.",
    "variantsEn": "The takeoff adds a power goal. Start with brief hand clearance or elevation; a regular push-up trains controlled pushing.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=xXE3nbL-ae0",
      "https://www.nasm.org/resource-center/exercise-library/push-up"
    ],
    "provenance": "Plan treningowy · WEEK 1 (O) · B10",
    "prescription": "Przykład zapisu z planu: serie: 2; powt.: 3; przerwa: 2min. Wartości można zmienić."
  },
  {
    "id": "catalog-landmine-shoulder-press",
    "name": "Wyciskanie landmine",
    "nameEn": "Landmine shoulder press",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "shoulders",
        "weight": 0.6
      },
      {
        "muscle": "triceps",
        "weight": 0.3
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "",
    "notes": "W źródłach są różne filmy; daty planu nie pozwalają ustalić najnowszego. Wybierz film z linków źródłowych.",
    "cues": "Wyciśnij wolny koniec sztangi w przód i w górę, a następnie go opuść.",
    "cuesEn": "Press the free end of a landmine bar forwards and upwards, then lower it.",
    "variants": "Tor sztangi jest ukośny względem pionowego wyciskania. Klęk ogranicza udział nóg; pozycja stojąca i wariant eksplozywny mogą dodać napęd z bioder i nóg.",
    "variantsEn": "The bar follows an angled path compared with vertical pressing. Kneeling limits leg involvement; standing and explosive variations can add hip and leg drive.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=sjTytMaBsdQ",
      "https://www.youtube.com/watch?v=t9GuiNQo1O4"
    ],
    "provenance": "Plan treningowy · WEEK 20 (P) · B26",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 6; obciążenie / wysiłek: RIR 2-3; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-explosive-single-arm-landmine-press",
    "name": "Dynamiczne wyciskanie landmine jednorącz",
    "nameEn": "Explosive single-arm landmine press",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "shoulders",
        "weight": 0.6
      },
      {
        "muscle": "triceps",
        "weight": 0.3
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/shorts/gKdmAu3yqcc",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Wyciskaj koniec sztangi jedną ręką dynamicznym ruchem. Zapisz powtórzenia obu stron.",
    "cuesEn": "Press the free end of a landmine bar dynamically with one arm. Record both sides.",
    "variants": "Tor sztangi jest ukośny względem pionowego wyciskania. Klęk ogranicza udział nóg; pozycja stojąca i wariant eksplozywny mogą dodać napęd z bioder i nóg.",
    "variantsEn": "The bar follows an angled path compared with vertical pressing. Kneeling limits leg involvement; standing and explosive variations can add hip and leg drive.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/gKdmAu3yqcc"
    ],
    "provenance": "Plan treningowy · WEEK 17 (P) · B61",
    "prescription": "Przykład zapisu z planu: serie: 2; powt.: 3/str; obciążenie / wysiłek: 5kg; przerwa: 2min. Wartości można zmienić."
  },
  {
    "id": "catalog-kneeling-single-arm-landmine-press",
    "name": "Wyciskanie landmine jednorącz w klęku",
    "nameEn": "Kneeling single-arm landmine press",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "shoulders",
        "weight": 0.6
      },
      {
        "muscle": "triceps",
        "weight": 0.3
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/watch?v=toOXXk7UTrQ",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "W klęku wyciśnij koniec sztangi jedną ręką i wróć do początku ruchu.",
    "cuesEn": "From kneeling, press the end of a landmine bar with one arm and lower it again.",
    "variants": "Tor sztangi jest ukośny względem pionowego wyciskania. Klęk ogranicza udział nóg; pozycja stojąca i wariant eksplozywny mogą dodać napęd z bioder i nóg.",
    "variantsEn": "The bar follows an angled path compared with vertical pressing. Kneeling limits leg involvement; standing and explosive variations can add hip and leg drive.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=toOXXk7UTrQ"
    ],
    "provenance": "Plan treningowy · WEEK 8 (O) · B12",
    "prescription": "Przykład zapisu z planu: serie: 4; powt.: 6/str; obciążenie / wysiłek: RIR 2; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-barbell-bent-over-row",
    "name": "Wiosłowanie sztangą w opadzie",
    "nameEn": "Barbell bent-over row",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "lats",
        "weight": 0.4
      },
      {
        "muscle": "upper_back",
        "weight": 0.4
      },
      {
        "muscle": "biceps",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "",
    "cues": "W pochyleniu przyciągnij sztangę do tułowia i opuść ją, utrzymując pozycję bioder.",
    "cuesEn": "In a hip hinge, pull the bar towards your torso and lower it while keeping your hip position.",
    "variants": "Podparcie klatki zmniejsza pracę stabilizacyjną lędźwi; tor łokcia zmienia akcent przyciągania.",
    "variantsEn": "Chest support reduces lumbar stabilization demands; elbow path changes pulling emphasis.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/12/bent-over-row/"
    ],
    "provenance": "Plan treningowy · WEEK 1 (O) · B40",
    "prescription": "Przykład zapisu z planu: serie: 3; obciążenie / wysiłek: RIR 3-4; przerwa: 2-3min. Wartości można zmienić."
  },
  {
    "id": "catalog-single-arm-dumbbell-row",
    "name": "Wiosłowanie hantlem jednorącz",
    "nameEn": "Single-arm dumbbell row",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "lats",
        "weight": 0.4
      },
      {
        "muscle": "upper_back",
        "weight": 0.4
      },
      {
        "muscle": "biceps",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "W źródłach są różne filmy; daty planu nie pozwalają ustalić najnowszego. Wybierz film z linków źródłowych.",
    "cues": "Przyciągnij hantel w stronę biodra, następnie opuść go. Zapisz obie strony.",
    "cuesEn": "Pull the dumbbell towards your hip and lower it again. Record both sides.",
    "variants": "Bez podparcia rośnie wymaganie kontroli tułowia; tor do biodra lub klatki zmienia akcent.",
    "variantsEn": "Removing support increases trunk-control demands; pulling toward hip or chest changes emphasis.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=DMo3HJoawrU",
      "https://drive.google.com/file/d/1QZxWk9jqHsrZAYocU_dav43klu9uSuPH/view?usp=drive_link",
      "https://www.acefitness.org/resources/everyone/exercise-library/12/bent-over-row/"
    ],
    "provenance": "Plan treningowy · WEEK 1 (O) · B28",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 10/stronę; obciążenie / wysiłek: T; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-chin-up",
    "name": "Podciąganie podchwytem",
    "nameEn": "Chin-up",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "lats",
        "weight": 0.5
      },
      {
        "muscle": "biceps",
        "weight": 0.3
      },
      {
        "muscle": "upper_back",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "W źródłach są różne filmy; daty planu nie pozwalają ustalić najnowszego. Wybierz film z linków źródłowych.",
    "cues": "Chwyć drążek podchwytem, podciągnij tułów i opuść się.",
    "cuesEn": "Use an underhand grip to pull yourself up to the bar and lower yourself again.",
    "variants": "Pomoc gumy lub maszyny zmniejsza opór; podchwyt zmienia ustawienie i wymagania zginaczy łokcia.",
    "variantsEn": "Band or machine assistance reduces resistance; an underhand grip changes elbow-flexor demands.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/H2YH7zMIJm8",
      "https://www.youtube.com/watch?v=8mryJ3w2S78",
      "https://www.nasm.org/resource-center/exercise-library/pull-up"
    ],
    "provenance": "Plan treningowy · WEEK 2 (O) · B44",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 8; obciążenie / wysiłek: RIR 2; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-eccentric-pull-up",
    "name": "Podciąganie · kontrolowane opuszczanie",
    "nameEn": "Eccentric pull-up",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "lats",
        "weight": 0.5
      },
      {
        "muscle": "biceps",
        "weight": 0.3
      },
      {
        "muscle": "upper_back",
        "weight": 0.2
      }
    ],
    "video": "https://www.youtube.com/watch?v=EkpJkHpJXmM",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Rozpocznij w górnej pozycji podciągania i opuść ciało w ustalonym tempie.",
    "cuesEn": "Start at the top of a pull-up and lower your body at the chosen tempo.",
    "variants": "Pomoc gumy lub maszyny zmniejsza opór; podchwyt zmienia ustawienie i wymagania zginaczy łokcia.",
    "variantsEn": "Band or machine assistance reduces resistance; an underhand grip changes elbow-flexor demands.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=EkpJkHpJXmM",
      "https://www.nasm.org/resource-center/exercise-library/pull-up"
    ],
    "provenance": "Plan treningowy · WEEK 1 (O) · B4",
    "prescription": "Przykład zapisu z planu: powt.: 8; obciążenie / wysiłek: T; przerwa: 2-3min. Wartości można zmienić."
  },
  {
    "id": "catalog-lat-pulldown",
    "name": "Ściąganie drążka wyciągu górnego",
    "nameEn": "Lat pulldown",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "lats",
        "weight": 0.5
      },
      {
        "muscle": "biceps",
        "weight": 0.3
      },
      {
        "muscle": "upper_back",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "",
    "cues": "Przyciągnij uchwyt wyciągu w stronę górnej części klatki i wróć do góry.",
    "cuesEn": "Pull the cable handle towards your upper chest and let it rise again.",
    "variants": "Maszyna umożliwia dobór oporu niezależnie od masy ciała. Chwyt i tor łokcia zmieniają ustawienie barku; ściągaj uchwyt przed głowę.",
    "variantsEn": "The machine permits resistance independent of body mass. Grip and elbow path change shoulder position; pull the handle in front of the head.",
    "sourceUrls": [
      "https://www.nasm.org/resource-center/exercise-library/pull-up"
    ],
    "provenance": "Plan treningowy · WEEK 1 (O) · B16",
    "prescription": "Przykład zapisu z planu: powt.: 10; obciążenie / wysiłek: RIR 2-3; przerwa: 2 min. Wartości można zmienić."
  },
  {
    "id": "catalog-suspension-row",
    "name": "Wiosłowanie na TRX",
    "nameEn": "Suspension row",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "lats",
        "weight": 0.4
      },
      {
        "muscle": "upper_back",
        "weight": 0.4
      },
      {
        "muscle": "biceps",
        "weight": 0.2
      }
    ],
    "video": "https://www.youtube.com/shorts/Cpn2P7vn2vs",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Trzymając uchwyty, przyciągnij klatkę w ich stronę. Kąt tułowia zmienia trudność.",
    "cuesEn": "Hold the suspension handles and pull your chest towards them. Body angle changes difficulty.",
    "variants": "Bardziej pozioma sylwetka zwiększa opór. Ustawienie łokci blisko tułowia lub szerzej zmienia akcent przyciągania; utrzymuj stabilne biodra.",
    "variantsEn": "A more horizontal body increases resistance. A tucked or wider elbow path changes pulling emphasis; maintain stable hips.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/Cpn2P7vn2vs",
      "https://www.acefitness.org/resources/everyone/exercise-library/12/bent-over-row/"
    ],
    "provenance": "Plan treningowy · WEEK 2 (O) · B42",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 10; obciążenie / wysiłek: RIR 2; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-scapular-pull-up",
    "name": "Podciąganie łopatkowe",
    "nameEn": "Scapular pull-up",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "upper_back",
        "weight": 0.55
      },
      {
        "muscle": "lats",
        "weight": 0.35
      },
      {
        "muscle": "shoulders",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/shorts/9M8ylnbriB0",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "W zwisie wykonaj mały ruch łopatek, pozostawiając łokcie wyprostowane.",
    "cuesEn": "Make a small scapular movement while hanging with straight elbows.",
    "variants": "W tym wariancie łokcie pozostają proste, a zakres jest mały. Pełne podciąganie dodaje zgięcie łokci i stanowi odrębne zadanie.",
    "variantsEn": "Elbows remain straight in this small-range variation. A full pull-up adds elbow flexion and is a separate task.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/9M8ylnbriB0"
    ],
    "provenance": "Plan treningowy · WEEK 2 (O) · B43",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 8; obciążenie / wysiłek: T; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-cable-hip-flexion",
    "name": "Zginanie biodra z wyciągiem",
    "nameEn": "Cable hip flexion",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "hip_flexors",
        "weight": 0.8
      },
      {
        "muscle": "abs",
        "weight": 0.2
      }
    ],
    "video": "https://www.youtube.com/shorts/ONCg73p8WgE",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Przyciągnij kolano w przód przeciw oporowi wyciągu, a następnie opuść nogę.",
    "cuesEn": "Bring your knee forwards against cable resistance and lower the leg again.",
    "variants": "Ugięte kolano skraca dźwignię; bardziej prosta noga zmienia wymagania. Podparcie ręką pozwala skupić się na zginaniu biodra bez chwiania tułowia.",
    "variantsEn": "A bent knee shortens the lever; a straighter leg changes demands. Hand support lets you focus on hip flexion without trunk sway.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/ONCg73p8WgE"
    ],
    "provenance": "Plan treningowy · WEEK 22 (P) · B13",
    "prescription": "Przykład zapisu z planu: serie: 2; powt.: 8/str; obciążenie / wysiłek: RIR 2-3; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-ghd-hip-extension",
    "name": "Prostowanie bioder na GHD",
    "nameEn": "GHD hip extension",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.5
      },
      {
        "muscle": "hamstrings",
        "weight": 0.35
      },
      {
        "muscle": "lower_back",
        "weight": 0.15
      }
    ],
    "video": "https://www.youtube.com/shorts/LCQInKbiLxQ",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Ustaw podparcie tak, aby móc zginać biodra. Utrzymuj stabilny tułów i prostuj biodra bez przeprostu lędźwi.",
    "cuesEn": "Position the pad to allow hip hinging. Keep the trunk stable and extend the hips without overextending the lower back.",
    "variants": "Przy stabilnym kręgosłupie ruch z biodra akcentuje pośladki i tył uda. Ruch prostowania kręgosłupa jest innym ćwiczeniem, które wymaga osobnego przypisania.",
    "variantsEn": "With a stable spine, hip hinging emphasizes glutes and hamstrings. Spinal extension is a different exercise and needs separate attribution.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/LCQInKbiLxQ",
      "https://www.nsca.com/education/articles/ptq/teaching-resistance-training-movement-patterns/"
    ],
    "provenance": "Plan treningowy · WEEK 2 (O) · B32",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 10; obciążenie / wysiłek: RIR 1; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-standing-cable-rotation",
    "name": "Rotacja tułowia z wyciągiem w staniu",
    "nameEn": "Standing cable rotation",
    "category": "strength",
    "metric": "kg",
    "shares": [
      {
        "muscle": "obliques",
        "weight": 0.55
      },
      {
        "muscle": "abs",
        "weight": 0.2
      },
      {
        "muscle": "shoulders",
        "weight": 0.15
      },
      {
        "muscle": "glutes",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/shorts/tP3S7tAVXy8",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Trzymając uchwyt wyciągu, obróć tułów i wróć do pozycji wyjściowej.",
    "cuesEn": "Hold the cable handle, rotate your torso and return to the starting position.",
    "variants": "Obrót z ruchem stóp i bioder jest innym zadaniem niż rotacja przy stabilnej miednicy. Pallof press rozwija opór przeciw rotacji, zamiast samej rotacji.",
    "variantsEn": "Rotation with foot and hip movement differs from rotation with a stable pelvis. A Pallof press trains resistance to rotation rather than rotation itself.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/tP3S7tAVXy8"
    ],
    "provenance": "Plan treningowy · WEEK 22 (P) · B11",
    "prescription": "Przykład zapisu z planu: serie: 2; powt.: 6/str; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-wall-drill-single-exchange",
    "name": "Ćwiczenie przy ścianie · pojedyncza zmiana",
    "nameEn": "Wall drill: single exchange",
    "category": "running",
    "metric": "reps",
    "shares": [
      {
        "muscle": "hip_flexors",
        "weight": 0.8
      },
      {
        "muscle": "abs",
        "weight": 0.2
      }
    ],
    "video": "https://youtu.be/VN0TqxqFsrg",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Oprzyj dłonie o ścianę w pozycji pochylonej i wykonuj pojedyncze wymiany nóg.",
    "cuesEn": "Lean into a wall with your hands supported and perform single leg exchanges.",
    "variants": "Wolniejsza próba pomaga ćwiczyć pozycje; szybsza zmienia wymagania rytmu i kontaktu z podłożem. Ćwicz obie strony. Większe zmęczenie nie zastępuje jakości ruchu.",
    "variantsEn": "A slower trial helps practice positions; higher speed changes rhythm and ground-contact demands. Practice both sides. More fatigue does not replace movement quality.",
    "sourceUrls": [
      "https://youtu.be/VN0TqxqFsrg"
    ],
    "provenance": "Plan treningowy · WARMUP SPRINTS · A11",
    "prescription": "Przykład zapisu z planu: ilość / czas: 3/str. Wartości można zmienić."
  },
  {
    "id": "catalog-wall-drill-double-exchange",
    "name": "Ćwiczenie przy ścianie · podwójna zmiana",
    "nameEn": "Wall drill: double exchange",
    "category": "running",
    "metric": "reps",
    "shares": [
      {
        "muscle": "hip_flexors",
        "weight": 0.8
      },
      {
        "muscle": "abs",
        "weight": 0.2
      }
    ],
    "video": "https://youtu.be/8fJlrx5O__Y",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "W oparciu o ścianę wykonaj dwie kolejne wymiany nóg i zatrzymaj pozycję.",
    "cuesEn": "With your hands against a wall, perform two leg exchanges and hold the final position.",
    "variants": "Wolniejsza próba pomaga ćwiczyć pozycje; szybsza zmienia wymagania rytmu i kontaktu z podłożem. Ćwicz obie strony. Większe zmęczenie nie zastępuje jakości ruchu.",
    "variantsEn": "A slower trial helps practice positions; higher speed changes rhythm and ground-contact demands. Practice both sides. More fatigue does not replace movement quality.",
    "sourceUrls": [
      "https://youtu.be/8fJlrx5O__Y"
    ],
    "provenance": "Plan treningowy · WARMUP SPRINTS · A12",
    "prescription": "Przykład zapisu z planu: ilość / czas: 2/str. Wartości można zmienić."
  },
  {
    "id": "catalog-wall-drill-triple-exchange",
    "name": "Ćwiczenie przy ścianie · potrójna zmiana",
    "nameEn": "Wall drill: triple exchange",
    "category": "running",
    "metric": "reps",
    "shares": [
      {
        "muscle": "hip_flexors",
        "weight": 0.8
      },
      {
        "muscle": "abs",
        "weight": 0.2
      }
    ],
    "video": "https://www.youtube.com/watch?v=SCVCLChPQFY",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "W oparciu o ścianę wykonaj trzy kolejne wymiany nóg.",
    "cuesEn": "With your hands against a wall, perform three consecutive leg exchanges.",
    "variants": "Wolniejsza próba pomaga ćwiczyć pozycje; szybsza zmienia wymagania rytmu i kontaktu z podłożem. Ćwicz obie strony. Większe zmęczenie nie zastępuje jakości ruchu.",
    "variantsEn": "A slower trial helps practice positions; higher speed changes rhythm and ground-contact demands. Practice both sides. More fatigue does not replace movement quality.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=SCVCLChPQFY"
    ],
    "provenance": "Plan treningowy · WEEK 16 (O) · B8",
    "prescription": "Przykład zapisu z planu: serie: 1; powt.: 1/stronę; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-wall-drill-lift-and-load-into-double-exchange",
    "name": "Ćwiczenie przy ścianie · uniesienie, nacisk i dwie zmiany",
    "nameEn": "Wall drill: lift and load into double exchange",
    "category": "running",
    "metric": "reps",
    "shares": [
      {
        "muscle": "hip_flexors",
        "weight": 0.8
      },
      {
        "muscle": "abs",
        "weight": 0.2
      }
    ],
    "video": "https://youtube.com/shorts/5evqdSbSMeM",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Unieś i ustaw nogę w pozycji startowej, następnie wykonaj podwójną wymianę.",
    "cuesEn": "Lift and load the leg into the start position, then perform a double exchange.",
    "variants": "Wolniejsza próba pomaga ćwiczyć pozycje; szybsza zmienia wymagania rytmu i kontaktu z podłożem. Ćwicz obie strony. Większe zmęczenie nie zastępuje jakości ruchu.",
    "variantsEn": "A slower trial helps practice positions; higher speed changes rhythm and ground-contact demands. Practice both sides. More fatigue does not replace movement quality.",
    "sourceUrls": [
      "https://youtube.com/shorts/5evqdSbSMeM"
    ],
    "provenance": "Plan treningowy · WARMUP SPRINTS · A13",
    "prescription": "Przykład zapisu z planu: ilość / czas: 2/str. Wartości można zmienić."
  },
  {
    "id": "catalog-half-kneeling-acceleration-start",
    "name": "Start z klęku jednonóż",
    "nameEn": "Half-kneeling acceleration start",
    "category": "running",
    "metric": "meters",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.3
      },
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "W źródłach są różne filmy; daty planu nie pozwalają ustalić najnowszego. Wybierz film z linków źródłowych.",
    "cues": "Rozpocznij przyspieszenie z klęku jednonóż. Metry oznaczają dystans jednej próby.",
    "cuesEn": "Accelerate from a half-kneeling start. Metres represent the distance of one attempt.",
    "variants": "Wolniejsza próba pomaga ćwiczyć pozycje; szybsza zmienia wymagania rytmu i kontaktu z podłożem. Ćwicz obie strony. Większe zmęczenie nie zastępuje jakości ruchu.",
    "variantsEn": "A slower trial helps practice positions; higher speed changes rhythm and ground-contact demands. Practice both sides. More fatigue does not replace movement quality.",
    "sourceUrls": [
      "https://youtu.be/hUIqIaL26TY",
      "https://www.youtube.com/shorts/Wrda210YADk"
    ],
    "provenance": "Plan treningowy · WARMUP SPRINTS · A14",
    "prescription": "Przykład zapisu z planu: ilość / czas: 1/str. Wartości można zmienić."
  },
  {
    "id": "catalog-half-kneeling-lateral-acceleration-start",
    "name": "Start boczny z klęku jednonóż",
    "nameEn": "Half-kneeling lateral acceleration start",
    "category": "running",
    "metric": "meters",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.3
      },
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "W źródłach są różne filmy; daty planu nie pozwalają ustalić najnowszego. Wybierz film z linków źródłowych.",
    "cues": "Z klęku jednonóż rozpocznij przyspieszenie w bok od pozycji wyjściowej.",
    "cuesEn": "Accelerate laterally from a half-kneeling starting position.",
    "variants": "Wolniejsza próba pomaga ćwiczyć pozycje; szybsza zmienia wymagania rytmu i kontaktu z podłożem. Ćwicz obie strony. Większe zmęczenie nie zastępuje jakości ruchu.",
    "variantsEn": "A slower trial helps practice positions; higher speed changes rhythm and ground-contact demands. Practice both sides. More fatigue does not replace movement quality.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/MjPoovuHEHE",
      "https://www.youtube.com/watch?v=0YevHDRR1eE"
    ],
    "provenance": "Plan treningowy · WARMUP SPRINTS · A15",
    "prescription": "Przykład zapisu z planu: ilość / czas: 1/str. Wartości można zmienić."
  },
  {
    "id": "catalog-inverted-half-kneeling-lateral-start",
    "name": "Odwrócony start boczny z klęku jednonóż",
    "nameEn": "Inverted half-kneeling lateral start",
    "category": "running",
    "metric": "meters",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.3
      },
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "",
    "cues": "Ustaw odwróconą względem standardowego wariantu pozycję nóg i rozpocznij bieg w bok.",
    "cuesEn": "Reverse the leg position used in the standard variation and start accelerating laterally.",
    "variants": "Wolniejsza próba pomaga ćwiczyć pozycje; szybsza zmienia wymagania rytmu i kontaktu z podłożem. Ćwicz obie strony. Większe zmęczenie nie zastępuje jakości ruchu.",
    "variantsEn": "A slower trial helps practice positions; higher speed changes rhythm and ground-contact demands. Practice both sides. More fatigue does not replace movement quality.",
    "sourceUrls": [
      "https://www.nsca.com/education/articles/kinetic-select/sprinting-mechanics-and-technique/"
    ],
    "provenance": "Plan treningowy · WARMUP SPRINTS · A16",
    "prescription": "Przykład zapisu z planu: ilość / czas: 1/str. Wartości można zmienić."
  },
  {
    "id": "catalog-two-point-acceleration-start",
    "name": "Start z pozycji dwupunktowej",
    "nameEn": "Two-point acceleration start",
    "category": "running",
    "metric": "meters",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.3
      },
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.2
      }
    ],
    "video": "https://www.youtube.com/watch?v=sz6EDChjIiQ",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Rozpocznij bieg z pozycji stojącej o dwóch punktach podparcia.",
    "cuesEn": "Accelerate from a standing start with both feet on the ground.",
    "variants": "Wolniejsza próba pomaga ćwiczyć pozycje; szybsza zmienia wymagania rytmu i kontaktu z podłożem. Ćwicz obie strony. Większe zmęczenie nie zastępuje jakości ruchu.",
    "variantsEn": "A slower trial helps practice positions; higher speed changes rhythm and ground-contact demands. Practice both sides. More fatigue does not replace movement quality.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=sz6EDChjIiQ"
    ],
    "provenance": "Plan treningowy · WEEK 1 (O) · B39",
    "prescription": "Przykład zapisu z planu: serie: 2; powt.: 1/stronę; obciążenie / wysiłek: 3 mocne kroki; przerwa: 2min. Wartości można zmienić."
  },
  {
    "id": "catalog-straight-line-sprint",
    "name": "Sprint po prostej",
    "nameEn": "Straight-line sprint",
    "category": "running",
    "metric": "meters",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.3
      },
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.2
      }
    ],
    "video": "https://www.youtube.com/shorts/wVhH1nwZDwc",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Pokonaj oznaczony prosty odcinek. Jedna seria oznacza jeden odcinek.",
    "cuesEn": "Run the marked straight segment. Each set represents one segment.",
    "variants": "Krótki start akcentuje przyspieszenie; dłuższy odcinek pozwala osiągnąć większą prędkość.",
    "variantsEn": "Short starts emphasize acceleration; longer runs allow higher speed.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/wVhH1nwZDwc",
      "https://www.nsca.com/education/articles/kinetic-select/sprinting-mechanics-and-technique/"
    ],
    "provenance": "Plan treningowy · WEEK 23 (P) · B32",
    "prescription": "Przykład zapisu z planu: serie: 1; powt.: 10m; przerwa: 2min. Wartości można zmienić."
  },
  {
    "id": "catalog-curved-sprint",
    "name": "Sprint po łuku",
    "nameEn": "Curved sprint",
    "category": "running",
    "metric": "meters",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.3
      },
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "W źródłach są różne filmy; daty planu nie pozwalają ustalić najnowszego. Wybierz film z linków źródłowych.",
    "cues": "Biegnij po wyznaczonym łuku. Zapisz długość całej trasy jednej próby.",
    "cuesEn": "Run along a marked curve. Record the full route distance of one attempt.",
    "variants": "Większy promień łuku zbliża ruch do biegu po prostej; mniejszy zwiększa wymagania kontroli kierunku. Ćwicz łuki w obie strony.",
    "variantsEn": "A larger curve approaches straight running; a tighter curve raises directional-control demands. Practice curves both ways.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/pn0KbiPbhmI",
      "https://www.youtube.com/shorts/aMHHQeTZltk"
    ],
    "provenance": "Plan treningowy · WEEK 23 (P) · B34",
    "prescription": "Przykład zapisu z planu: serie: 6; powt.: 45m; przerwa: 3min. Wartości można zmienić."
  },
  {
    "id": "catalog-tempo-run-intervals",
    "name": "Interwały tempowe",
    "nameEn": "Tempo run intervals",
    "category": "running",
    "metric": "meters",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.3
      },
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "",
    "cues": "Pokonuj odcinki w ustalonym tempie z zaplanowanymi przerwami.",
    "cuesEn": "Run repeated segments at the selected pace with planned recovery periods.",
    "variants": "Zmiana długości pracy i odpoczynku zmienia cel wydolnościowy; tempo nie oznacza automatycznie sprintu.",
    "variantsEn": "Changing work and recovery duration changes conditioning emphasis; tempo does not automatically mean sprinting.",
    "sourceUrls": [
      "https://www.theuap.com/blog/how-to-get-in-shape-fast-for-your-ultimate-season"
    ],
    "provenance": "Plan treningowy · WEEK 8 (O) · B35",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 3; obciążenie / wysiłek: 70m; przerwa: 2min. Wartości można zmienić."
  },
  {
    "id": "catalog-sprint-after-a-change-of-direction",
    "name": "Sprint po zmianie kierunku",
    "nameEn": "Sprint after a change of direction",
    "category": "running",
    "metric": "meters",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.3
      },
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "",
    "cues": "Po wykonaniu ustalonej zmiany kierunku przyspiesz na oznaczonym odcinku.",
    "cuesEn": "Accelerate along a marked segment after the chosen change of direction.",
    "variants": "Zaplanowany zwrot ćwiczy ruch; sygnał partnera dodaje percepcję i decyzję.",
    "variantsEn": "A planned cut trains movement; a partner cue adds perception and decision-making.",
    "sourceUrls": [
      "https://www.nsca.com/education/articles/kinetic-select/transfer-of-training-for-agility/",
      "https://www.nsca.com/education/articles/kinetic-select/effective-deceleration-technique-for-court-and-field-sports/"
    ],
    "provenance": "Plan treningowy · WEEK 17 (P) · B50",
    "prescription": "Przykład zapisu z planu: serie: 1; powt.: 5m+10m; przerwa: 2min. Wartości można zmienić."
  },
  {
    "id": "catalog-two-foot-a-skip",
    "name": "Skip A · wariant obunóż",
    "nameEn": "Two-foot A-skip",
    "category": "running",
    "metric": "meters",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.3
      },
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.2
      }
    ],
    "video": "https://youtu.be/Ij_qcX--ogE",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Wykonuj skip na oznaczonym dystansie, utrzymując wybraną sekwencję kontaktów stóp.",
    "cuesEn": "Perform the skip over a marked distance using the chosen foot-contact sequence.",
    "variants": "Wolniejsze wykonanie ćwiczy rytm i pozycje. Szybszy rytm zmienia czas kontaktu z podłożem; skip pozostaje ćwiczeniem technicznym, nie testem prędkości.",
    "variantsEn": "Slower execution practices rhythm and positions. A faster rhythm changes ground-contact time; skipping remains a technical drill, not a speed test.",
    "sourceUrls": [
      "https://youtu.be/Ij_qcX--ogE"
    ],
    "provenance": "Plan treningowy · WARMUP SPRINTS · A3",
    "prescription": "Przykład zapisu z planu: ilość / czas: 10m. Wartości można zmienić."
  },
  {
    "id": "catalog-ankle-dribble",
    "name": "Drobne kroki z pracą stawu skokowego",
    "nameEn": "Ankle dribble",
    "category": "running",
    "metric": "meters",
    "shares": [
      {
        "muscle": "calves",
        "weight": 0.9
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "https://youtu.be/X5P3Y2tGqMs",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Przemieszczaj się krótkimi krokami z niskim unoszeniem stóp.",
    "cuesEn": "Move forwards with short steps and a low foot recovery.",
    "variants": "Mniejsza amplituda akcentuje rytm pracy stóp. Większa amplituda i przejście do biegu zmieniają zadanie; dobieraj je do celu rozgrzewki.",
    "variantsEn": "Smaller amplitude emphasizes foot rhythm. Larger amplitude and transition into running change the task; match it to the warm-up goal.",
    "sourceUrls": [
      "https://youtu.be/X5P3Y2tGqMs"
    ],
    "provenance": "Plan treningowy · WARMUP SPRINTS · A4",
    "prescription": "Przykład zapisu z planu: ilość / czas: 10m. Wartości można zmienić."
  },
  {
    "id": "catalog-scissor-into-knee-dribble",
    "name": "Ruch nożycowy i drobne kroki z unoszeniem kolana",
    "nameEn": "Scissor into knee dribble",
    "category": "running",
    "metric": "meters",
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.3
      },
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.2
      }
    ],
    "video": "https://youtu.be/bVGs_2eVFKk",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Połącz odcinek pracy prostymi nogami z odcinkiem dribble z wyższym unoszeniem kolan.",
    "cuesEn": "Combine a straight-leg scissor segment with a higher knee-dribble segment.",
    "variants": "Ćwicz elementy osobno przed łączeniem ich w sekwencję. Przejście do biegu dodaje wymagania rytmu i przyspieszenia.",
    "variantsEn": "Practice components separately before combining the sequence. Transitioning into running adds rhythm and acceleration demands.",
    "sourceUrls": [
      "https://youtu.be/bVGs_2eVFKk"
    ],
    "provenance": "Plan treningowy · WARMUP SPRINTS · A8",
    "prescription": "Przykład zapisu z planu: ilość / czas: 10+10m. Wartości można zmienić."
  },
  {
    "id": "catalog-dead-bug",
    "name": "Martwy robak · dead bug",
    "nameEn": "Dead bug",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "abs",
        "weight": 0.7
      },
      {
        "muscle": "obliques",
        "weight": 0.2
      },
      {
        "muscle": "hip_flexors",
        "weight": 0.1
      }
    ],
    "video": "https://www.youtube.com/watch?v=o4GKiEoYClI",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "W leżeniu na plecach naprzemiennie wyprostuj przeciwległą rękę i nogę.",
    "cuesEn": "Lying on your back, extend the opposite arm and leg in turn.",
    "variants": "Krótka dźwignia ułatwia kontrolę; prostowanie nogi zwiększa wymagania stabilizacji.",
    "variantsEn": "A short lever helps control; straightening the leg increases stabilization demands.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=o4GKiEoYClI",
      "https://www.nasm.org/resource-center/exercise-library/dead-bug"
    ],
    "provenance": "Plan treningowy · WEEK 3 (O) · B8",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 10/strone; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-side-plank",
    "name": "Podpór bokiem",
    "nameEn": "Side plank",
    "category": "strength",
    "metric": "minutes",
    "shares": [
      {
        "muscle": "obliques",
        "weight": 0.55
      },
      {
        "muscle": "abductors",
        "weight": 0.25
      },
      {
        "muscle": "shoulders",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "W źródłach są różne filmy; daty planu nie pozwalają ustalić najnowszego. Wybierz film z linków źródłowych.",
    "cues": "Utrzymuj podpór bokiem na przedramieniu. Wpisz łączny czas obu stron.",
    "cuesEn": "Hold a side plank on your forearm. Record the combined time on both sides.",
    "variants": "Podparcie kolan skraca dźwignię; uniesienie górnej nogi dodaje pracę odwodzicieli biodra.",
    "variantsEn": "Knee support shortens the lever; lifting the top leg adds hip-abductor work.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/GIDLif1n0bM",
      "https://www.youtube.com/shorts/fzLeV8X0Gb8",
      "https://www.nasm.org/resource-center/exercise-library/side-plank"
    ],
    "provenance": "Plan treningowy · WEEK 2 (O) · B33",
    "prescription": "Przykład zapisu z planu: serie: 3; powt.: 1/str; obciążenie / wysiłek: RIR 5s; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-copenhagen-plank",
    "name": "Podpór kopenhaski",
    "nameEn": "Copenhagen plank",
    "category": "strength",
    "metric": "minutes",
    "shares": [
      {
        "muscle": "adductors",
        "weight": 0.5
      },
      {
        "muscle": "obliques",
        "weight": 0.35
      },
      {
        "muscle": "shoulders",
        "weight": 0.15
      }
    ],
    "video": "https://www.youtube.com/watch?v=aDsaGBnvDQo",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "W podporze bokiem oprzyj górną nogę na podwyższeniu i utrzymuj uniesiony tułów.",
    "cuesEn": "In a side plank, support the upper leg on an elevated surface and hold your body raised.",
    "variants": "Podparcie kolana zmniejsza trudność; podparcie stopy wydłuża dźwignię i zwiększa wymagania przywodzicieli.",
    "variantsEn": "Knee support reduces difficulty; foot support lengthens the lever and increases adductor demands.",
    "sourceUrls": [
      "https://www.youtube.com/watch?v=aDsaGBnvDQo",
      "https://www.nsca.com/education/articles/ptq/are-the-seated-leg-extension-leg-curl-and-adduction-machine-exercises-non-functional-or-risky/"
    ],
    "provenance": "Plan treningowy · WEEK 22 (P) · B12",
    "prescription": "Przykład zapisu z planu: serie: 2; powt.: 1/str; obciążenie / wysiłek: RIR 2-3s; przerwa: 1min. Wartości można zmienić."
  },
  {
    "id": "catalog-bear-crawl",
    "name": "Chód niedźwiedzia",
    "nameEn": "Bear crawl",
    "category": "strength",
    "metric": "meters",
    "shares": [
      {
        "muscle": "abs",
        "weight": 0.35
      },
      {
        "muscle": "shoulders",
        "weight": 0.3
      },
      {
        "muscle": "quads",
        "weight": 0.2
      },
      {
        "muscle": "triceps",
        "weight": 0.15
      }
    ],
    "video": "",
    "notes": "",
    "cues": "Przemieszczaj się na dłoniach i stopach z kolanami uniesionymi nad podłożem.",
    "cuesEn": "Move on your hands and feet with the knees raised from the floor.",
    "variants": "Zatrzymany podpór ułatwia kontrolę; marsz przód–tył lub bokiem dodaje koordynację kończyn. Nie zamieniaj tego automatycznie na trening tlenowy.",
    "variantsEn": "A static hold helps control; forward–backward or lateral crawling adds limb coordination. It is not automatically an aerobic session.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/150/bear-crawl/"
    ],
    "provenance": "Plan treningowy · WARMUP MOBILITY 2 · B12",
    "prescription": ""
  },
  {
    "id": "catalog-plank-with-leg-lift",
    "name": "Podpór z unoszeniem nogi",
    "nameEn": "Plank with leg lift",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "abs",
        "weight": 0.6
      },
      {
        "muscle": "obliques",
        "weight": 0.2
      },
      {
        "muscle": "shoulders",
        "weight": 0.2
      }
    ],
    "video": "https://www.youtube.com/shorts/SYfo1o0bkbM",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "W podporze naprzemiennie unieś nogę, utrzymując pozycję tułowia.",
    "cuesEn": "Lift one leg at a time from a plank while maintaining your torso position.",
    "variants": "Podwyższenie rąk ułatwia; dłuższa dźwignia zwiększa wymagania przeciwdziałania wyprostowi tułowia.",
    "variantsEn": "Elevating the hands helps; a longer lever increases anti-extension demands.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/SYfo1o0bkbM",
      "https://www.nasm.org/resource-center/exercise-library/plank"
    ],
    "provenance": "Plan treningowy · WARMUP MOBILITY · B16",
    "prescription": "Przykład zapisu z planu: ilość / czas: 10x/stronę. Wartości można zmienić."
  },
  {
    "id": "catalog-face-pull",
    "name": "Przyciąganie liny do twarzy",
    "nameEn": "Face pull",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "upper_back",
        "weight": 0.6
      },
      {
        "muscle": "shoulders",
        "weight": 0.4
      }
    ],
    "video": "https://youtu.be/JPqkcxSv4Y4",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Przyciągnij linę lub gumę w stronę twarzy, prowadząc łokcie na boki.",
    "cuesEn": "Pull a rope or band towards your face with the elbows moving outwards.",
    "variants": "Wysokość linki i rotacja ramienia zmieniają zadanie barku; większy ciężar nie zastępuje kontroli.",
    "variantsEn": "Cable height and arm rotation change the shoulder task; more weight does not replace control.",
    "sourceUrls": [
      "https://youtu.be/JPqkcxSv4Y4",
      "https://www.nasm.org/resource-center/exercise-library/face-pull"
    ],
    "provenance": "Plan treningowy · WARMUP MOBILITY · B18",
    "prescription": "Przykład zapisu z planu: ilość / czas: 10x. Wartości można zmienić."
  },
  {
    "id": "catalog-wrist-movement-sequence",
    "name": "Sekwencja ćwiczeń nadgarstka",
    "nameEn": "Wrist movement sequence",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "forearms",
        "weight": 1
      }
    ],
    "video": "https://www.youtube.com/shorts/xENVg7RX_O8",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Wykonaj wybrany zestaw zgięcia, wyprostu i rotacji nadgarstka. Zapisz sposób liczenia sekwencji.",
    "cuesEn": "Perform the chosen wrist flexion, extension and rotation sequence. Define how the sequence is counted.",
    "variants": "Zginanie, prostowanie i obracanie przedramienia to różne zadania. Wariant bez ciężaru ćwiczy zakres; lekki opór dodaje pracę siłową.",
    "variantsEn": "Wrist flexion, extension, and forearm rotation are different tasks. Unloaded work explores range; light resistance adds strength work.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/xENVg7RX_O8"
    ],
    "provenance": "Plan treningowy · WARMUP MOBILITY · B12",
    "prescription": "Przykład zapisu z planu: ilość / czas: SET x10 każde ćwiczenie. Wartości można zmienić."
  },
  {
    "id": "catalog-hip-airplane",
    "name": "Rotacja biodra w staniu jednonóż · hip airplane",
    "nameEn": "Hip airplane",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "abductors",
        "weight": 0.7
      },
      {
        "muscle": "glutes",
        "weight": 0.3
      }
    ],
    "video": "https://www.youtube.com/shorts/U5f8h7FDEa0%5C",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Na jednej nodze pochyl tułów i obracaj miednicę wokół biodra nogi podporowej.",
    "cuesEn": "Hinge on one leg and rotate the pelvis around the supporting hip.",
    "variants": "Podparcie ręką ułatwia kontrolę rotacji miednicy nad nogą podporową. Wariant bez podparcia zwiększa wymagania równowagi, nie izolację pośladka.",
    "variantsEn": "Hand support helps control pelvic rotation over the stance leg. Removing support increases balance demands, not glute isolation.",
    "sourceUrls": [
      "https://www.youtube.com/shorts/U5f8h7FDEa0%5C"
    ],
    "provenance": "Plan treningowy · WEEK 19 (P) · B9",
    "prescription": "Przykład zapisu z planu: serie: 2; powt.: 5/str; przerwa: 30-60s. Wartości można zmienić."
  },
  {
    "id": "catalog-counterbalanced-cossack-squat",
    "name": "Przysiad kozacki z przeciwwagą",
    "nameEn": "Counterbalanced Cossack squat",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.35
      },
      {
        "muscle": "glutes",
        "weight": 0.3
      },
      {
        "muscle": "adductors",
        "weight": 0.25
      },
      {
        "muscle": "abductors",
        "weight": 0.1
      }
    ],
    "video": "https://youtube.com/shorts/Oe4T6ANhPNs",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Przenieś ciężar w bok na ugiętą nogę, trzymając lekki ciężar przed sobą dla równowagi.",
    "cuesEn": "Shift sideways onto a bent leg while holding a light counterweight in front of you.",
    "variants": "Przeciwwaga pomaga równowadze. Głębszy zakres zwiększa wymagania ruchomości; płytszy pozwala skupić się na kontroli nogi podporowej.",
    "variantsEn": "A counterweight assists balance. Greater depth raises mobility demands; a shallower range emphasizes stance-leg control.",
    "sourceUrls": [
      "https://youtube.com/shorts/Oe4T6ANhPNs"
    ],
    "provenance": "Plan treningowy · WARMUP MOBILITY · B14",
    "prescription": "Przykład zapisu z planu: ilość / czas: 10x. Wartości można zmienić."
  },
  {
    "id": "catalog-supine-shoulder-external-and-internal-rotation",
    "name": "Rotacja barku na zewnątrz i do wewnątrz w leżeniu",
    "nameEn": "Supine shoulder external and internal rotation",
    "category": "strength",
    "metric": "reps",
    "shares": [
      {
        "muscle": "shoulders",
        "weight": 1
      }
    ],
    "video": "https://youtube.com/shorts/AZXsV0NH-Ac",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "W leżeniu na plecach obracaj ramię na zewnątrz i do wewnątrz w ustalonym zakresie.",
    "cuesEn": "Lying on your back, rotate the shoulder externally and internally through the chosen range.",
    "variants": "Wariant bez oporu ćwiczy dostępny zakres; guma lub lekki ciężar dodają zadanie siłowe. Region barków obejmuje ten ruch umownie, bez osobnego pomiaru stożka rotatorów.",
    "variantsEn": "The unloaded version explores available range; a band or light load adds resistance. The shoulder region represents this movement schematically, without a separate rotator-cuff measurement.",
    "sourceUrls": [
      "https://youtube.com/shorts/AZXsV0NH-Ac"
    ],
    "provenance": "Plan treningowy · WARMUP MOBILITY · B10",
    "prescription": "Przykład zapisu z planu: ilość / czas: 10x + 10x. Wartości można zmienić."
  },
  {
    "id": "catalog-easy-throwing",
    "name": "Swobodne rzucanie",
    "nameEn": "Easy throwing",
    "category": "throwing",
    "metric": "minutes",
    "shares": [],
    "video": "",
    "notes": "",
    "cues": "Rzucaj do partnera wybranymi technikami przez ustalony czas.",
    "cuesEn": "Throw to a partner using the selected techniques for the chosen duration.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B5",
    "prescription": "Przykład zapisu z planu: czas: 5-10 min. Wartości można zmienić."
  },
  {
    "id": "catalog-reaction-passes",
    "name": "Podania na sygnał",
    "nameEn": "Reaction passes",
    "category": "throwing",
    "metric": "minutes",
    "shares": [],
    "video": "",
    "notes": "",
    "cues": "Z bliskiej odległości odrzucaj dysk po złapaniu, zachowując wybrany chwyt.",
    "cuesEn": "From a short distance, return the disc after catching it while retaining the chosen grip.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B6",
    "prescription": "Przykład zapisu z planu: czas: 2 min. Wartości można zmienić."
  },
  {
    "id": "catalog-flat-forehand-and-backhand",
    "name": "Płaski forehand i backhand",
    "nameEn": "Flat forehand and backhand",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "",
    "notes": "",
    "cues": "Wykonuj płaskie rzuty forehandem i backhandem do partnera.",
    "cuesEn": "Throw flat forehands and backhands to a partner.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B7",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 3. Wartości można zmienić."
  },
  {
    "id": "catalog-gentle-around-forehand-and-backhand",
    "name": "Lekki around · forehand i backhand",
    "nameEn": "Gentle around forehand and backhand",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "",
    "notes": "",
    "cues": "Ćwicz rzuty around obiema technikami, obserwując tor lotu.",
    "cuesEn": "Practise around throws with both techniques and observe the flight path.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B8",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 3. Wartości można zmienić."
  },
  {
    "id": "catalog-gentle-inside-forehand-and-backhand",
    "name": "Lekki inside · forehand i backhand",
    "nameEn": "Gentle inside forehand and backhand",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "",
    "notes": "",
    "cues": "Ćwicz rzuty inside obiema technikami.",
    "cuesEn": "Practise inside throws with both techniques.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B9",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 3. Wartości można zmienić."
  },
  {
    "id": "catalog-leading-forehand-and-backhand-pass",
    "name": "Podanie prowadzące · forehand i backhand",
    "nameEn": "Leading forehand and backhand pass",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "",
    "notes": "",
    "cues": "Kieruj podanie przed wyobrażanego lub poruszającego się odbiorcę.",
    "cuesEn": "Lead an imagined or moving receiver with the pass.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B10",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 3. Wartości można zmienić."
  },
  {
    "id": "catalog-wide-pivot-around-forehand-and-backhand",
    "name": "Around z szerokiego pivota · forehand i backhand",
    "nameEn": "Wide-pivot around forehand and backhand",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1ju648vs2JGfdpwQYgyBIpF9BGPoy5Cwa/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Wykonuj rzuty around z szerokiego wykroku.",
    "cuesEn": "Throw around passes from a wide pivot.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1ju648vs2JGfdpwQYgyBIpF9BGPoy5Cwa/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B11",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 3. Wartości można zmienić."
  },
  {
    "id": "catalog-wide-pivot-inside-forehand-and-backhand",
    "name": "Inside z szerokiego pivota · forehand i backhand",
    "nameEn": "Wide-pivot inside forehand and backhand",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/19SIFZ7I7PoguFGN-6k9SNzTn9sKg8QhW/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Wykonuj rzuty inside z szerokiego wykroku.",
    "cuesEn": "Throw inside passes from a wide pivot.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/19SIFZ7I7PoguFGN-6k9SNzTn9sKg8QhW/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B12",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 3. Wartości można zmienić."
  },
  {
    "id": "catalog-forehand-pivot-progression",
    "name": "Forehand · progresja pivota",
    "nameEn": "Forehand pivot progression",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1ju648vs2JGfdpwQYgyBIpF9BGPoy5Cwa/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Stopniowo rozszerzaj pivot, obserwując ułożenie barków i równowagę.",
    "cuesEn": "Gradually widen the pivot while observing shoulder position and balance.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1ju648vs2JGfdpwQYgyBIpF9BGPoy5Cwa/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B13",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 8. Wartości można zmienić."
  },
  {
    "id": "catalog-backhand-without-a-pivot",
    "name": "Backhand bez pivota",
    "nameEn": "Backhand without a pivot",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/19SIFZ7I7PoguFGN-6k9SNzTn9sKg8QhW/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Rzucaj backhand bez pivotu, koncentrując się na ruchu łokcia i nadgarstka.",
    "cuesEn": "Throw a backhand without pivoting, focusing on the elbow and wrist movement.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/19SIFZ7I7PoguFGN-6k9SNzTn9sKg8QhW/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B14",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 8. Wartości można zmienić."
  },
  {
    "id": "catalog-forehand-step-back",
    "name": "Forehand z krokiem w tył",
    "nameEn": "Forehand step-back",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1seBBNBbThoeGtwMtPlTgWvhCcEr59gjP/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Wykonaj krok w tył i rzut forehandem do partnera.",
    "cuesEn": "Step backwards and throw a forehand to a partner.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1seBBNBbThoeGtwMtPlTgWvhCcEr59gjP/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B15",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 8. Wartości można zmienić."
  },
  {
    "id": "catalog-backhand-torso-rotation-drill",
    "name": "Backhand · praca tułowia",
    "nameEn": "Backhand torso-rotation drill",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1d87IiL90d7G1mqE1fBpT9vB_1_xQFcka/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Ćwicz obrót tułowia połączony z ruchem łokcia podczas backhandu.",
    "cuesEn": "Practise torso rotation coordinated with elbow movement in the backhand.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1d87IiL90d7G1mqE1fBpT9vB_1_xQFcka/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B16",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 6. Wartości można zmienić."
  },
  {
    "id": "catalog-forehand-cross-step",
    "name": "Forehand z krokiem skrzyżnym",
    "nameEn": "Forehand cross-step",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1seBBNBbThoeGtwMtPlTgWvhCcEr59gjP/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Wykonaj pivot w stronę backhandu, następnie rzuć forehandem.",
    "cuesEn": "Pivot towards the backhand side and then throw a forehand.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1seBBNBbThoeGtwMtPlTgWvhCcEr59gjP/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B17",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 6. Wartości można zmienić."
  },
  {
    "id": "catalog-backhand-pop-wrist-pass",
    "name": "Backhand · krótki rzut z nadgarstka",
    "nameEn": "Backhand pop wrist pass",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1d87IiL90d7G1mqE1fBpT9vB_1_xQFcka/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Połącz ruch nadgarstka z unoszeniem ręki podczas krótkiego backhandu.",
    "cuesEn": "Coordinate wrist movement with lifting the arm during a short backhand pass.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1d87IiL90d7G1mqE1fBpT9vB_1_xQFcka/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B18",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 8. Wartości można zmienić."
  },
  {
    "id": "catalog-forehand-snap-back",
    "name": "Forehand · snap back",
    "nameEn": "Forehand snap-back",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1kE58IldaSxhhjR7WYPHqfkWRRxwUBavA/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Ćwicz krótki ruch nadgarstka, obserwując rotację dysku.",
    "cuesEn": "Practise a short wrist movement while observing disc spin.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1kE58IldaSxhhjR7WYPHqfkWRRxwUBavA/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B19",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 8. Wartości można zmienić."
  },
  {
    "id": "catalog-backhand-snap-back",
    "name": "Backhand · snap back",
    "nameEn": "Backhand snap-back",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "",
    "notes": "Link źródłowy prowadzi do folderu Google Drive. Wybierz w nim właściwe nagranie.",
    "cues": "Ćwicz krótki ruch nadgarstka w backhandzie, obserwując rotację dysku.",
    "cuesEn": "Practise a short backhand wrist movement while observing disc spin.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/drive/folders/1w3m-dfvtOCPo9m5jNxtAUZ9aUrrVlQrG?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B20",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 8. Wartości można zmienić."
  },
  {
    "id": "catalog-steep-inside-out-forehand-balance-drill",
    "name": "Forehand z dużym kątem inside-out · równowaga",
    "nameEn": "Steep inside-out forehand balance drill",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1Cv5Bnd2DbADwSgb-Kc6qyVfpWkbF8U0F/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Ćwicz wyraźny kąt inside-out i pozycję równowagi podczas forehandu.",
    "cuesEn": "Practise a pronounced inside-out angle and balanced forehand position.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1Cv5Bnd2DbADwSgb-Kc6qyVfpWkbF8U0F/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B21",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 6. Wartości można zmienić."
  },
  {
    "id": "catalog-backhand-torso-rotation-progression",
    "name": "Backhand · progresja pracy tułowia",
    "nameEn": "Backhand torso-rotation progression",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "",
    "notes": "Link źródłowy prowadzi do folderu Google Drive. Wybierz w nim właściwe nagranie.",
    "cues": "Rozwiń wariant backhand core zgodnie z wybraną progresją.",
    "cuesEn": "Progress the backhand torso-rotation drill using the chosen variation.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/drive/folders/1w3m-dfvtOCPo9m5jNxtAUZ9aUrrVlQrG?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B22",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 6. Wartości można zmienić."
  },
  {
    "id": "catalog-single-leg-forehand",
    "name": "Forehand jednonóż",
    "nameEn": "Single-leg forehand",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1fneXOgjVQVpTcs4iWCBt-KeAiFoitrI4/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Rzucaj forehand stojąc na jednej nodze, zmieniając wybrany kąt dysku.",
    "cuesEn": "Throw a forehand while standing on one leg and vary the chosen disc angle.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1fneXOgjVQVpTcs4iWCBt-KeAiFoitrI4/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B23",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 8. Wartości można zmienić."
  },
  {
    "id": "catalog-backhand-pivot-progression",
    "name": "Backhand · progresja pivota",
    "nameEn": "Backhand pivot progression",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1Ooo3IwVChNf9pFWTUZn5-27UquyEyBfy/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Ćwicz kolejne pozycje pivotu i kontrolę kąta around podczas backhandu.",
    "cuesEn": "Practise progressive pivot positions and control the around angle on the backhand.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1Ooo3IwVChNf9pFWTUZn5-27UquyEyBfy/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B24",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 8. Wartości można zmienić."
  },
  {
    "id": "catalog-forehand-extended-wrist-hold",
    "name": "Forehand · utrzymanie wyprostowanego nadgarstka",
    "nameEn": "Forehand extended-wrist hold",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1zFphyEdPP6gtAuNUwsWZ6MpLjVdMO9X9/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Zatrzymaj dysk w pozycji wyrzutu, ustaw jego kąt i wykonaj rzut forehandem.",
    "cuesEn": "Hold the disc at the release point, set its angle and throw a forehand.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1zFphyEdPP6gtAuNUwsWZ6MpLjVdMO9X9/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B25",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 6. Wartości można zmienić."
  },
  {
    "id": "catalog-backhand-extended-wrist-hold",
    "name": "Backhand · utrzymanie wyprostowanego nadgarstka",
    "nameEn": "Backhand extended-wrist hold",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "",
    "notes": "",
    "cues": "Zatrzymaj dysk w pozycji wyrzutu, ustaw jego kąt i wykonaj rzut backhandem.",
    "cuesEn": "Hold the disc at the release point, set its angle and throw a backhand.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B26",
    "prescription": "Przykład zapisu z planu: powt. / stronę: 6. Wartości można zmienić."
  },
  {
    "id": "catalog-backhand-compass",
    "name": "Backhand · kompas",
    "nameEn": "Backhand compass",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1ibO5zKkLz6EczJhYoan3rxb9szk_DCCe/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Łącz backhand z wykrokami w różne kierunki. Jedna sekwencja obejmuje wybrany zestaw kierunków.",
    "cuesEn": "Combine backhands with pivots in different directions. A sequence covers the selected directions.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1ibO5zKkLz6EczJhYoan3rxb9szk_DCCe/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B27",
    "prescription": "Przykład zapisu z planu: serie: 1. Wartości można zmienić."
  },
  {
    "id": "catalog-forehand-compass",
    "name": "Forehand · kompas",
    "nameEn": "Forehand compass",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1Gzdv9ACaLbUR9AUpgbzNCUZioKyEYEf_/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Łącz forehand z wykrokami w różne kierunki. Jedna sekwencja obejmuje wybrany zestaw kierunków.",
    "cuesEn": "Combine forehands with pivots in different directions. A sequence covers the selected directions.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1Gzdv9ACaLbUR9AUpgbzNCUZioKyEYEf_/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B28",
    "prescription": "Przykład zapisu z planu: serie: 1. Wartości można zmienić."
  },
  {
    "id": "catalog-scoober",
    "name": "Scoober",
    "nameEn": "Scoober",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1Kzo57Ej5RYPG3VOOUl3P9KV78mUdRdEL/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Ćwicz rzut scoober, łącząc ruch ręki nad dyskiem z pracą nadgarstka.",
    "cuesEn": "Practise the scoober by coordinating the arm motion over the disc with wrist action.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1Kzo57Ej5RYPG3VOOUl3P9KV78mUdRdEL/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B29",
    "prescription": ""
  },
  {
    "id": "catalog-left-handed-scoober",
    "name": "Scoober lewą ręką",
    "nameEn": "Left-handed scoober",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "https://drive.google.com/file/d/1Gzdv9ACaLbUR9AUpgbzNCUZioKyEYEf_/view?usp=drive_link",
    "notes": "Film pochodzi z planu. Brak jednoznacznej daty pozwalającej potwierdzić, że jest najnowszy.",
    "cues": "Ćwicz rzut scoober lewą ręką.",
    "cuesEn": "Practise the scoober with the left hand.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://drive.google.com/file/d/1Gzdv9ACaLbUR9AUpgbzNCUZioKyEYEf_/view?usp=drive_link",
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B30",
    "prescription": ""
  },
  {
    "id": "catalog-hammer",
    "name": "Hammer",
    "nameEn": "Hammer",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "",
    "notes": "",
    "cues": "Ćwicz rzut hammer wybraną ręką, obserwując kąt dysku i tor lotu.",
    "cuesEn": "Practise a hammer with the chosen hand, observing disc angle and flight path.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B31",
    "prescription": ""
  },
  {
    "id": "catalog-thumber",
    "name": "Thumber",
    "nameEn": "Thumber",
    "category": "throwing",
    "metric": "throws",
    "shares": [],
    "video": "",
    "notes": "",
    "cues": "Ćwicz rzut thumber zgodnie z indywidualnie ustaloną techniką.",
    "cuesEn": "Practise a thumber using the individually selected technique.",
    "variants": "Zmieniaj pojedynczo dystans, punkt wypuszczenia lub pozycję pivota. Cel nieruchomy rozwija kontrolę toru; partner w ruchu dodaje timing. Warunki i wiatr zmieniają wymagania zadania.",
    "variantsEn": "Vary distance, release point, or pivot position one at a time. A stationary target trains flight control; a moving partner adds timing. Conditions and wind change the task.",
    "sourceUrls": [
      "https://www.theuap.com/blog/one-step-to-better-throwing-practice"
    ],
    "provenance": "Plan treningowy · Arkusz1 · B32",
    "prescription": ""
  },
  {
    "id": "catalog-easy-aerobic-run",
    "name": "Spokojny bieg tlenowy",
    "nameEn": "Easy aerobic run",
    "category": "conditioning",
    "metric": "minutes",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "glutes",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      }
    ],
    "video": "",
    "notes": "Udziały są edytowalnym podziałem do planowania, nie proporcjami fizjologicznymi. Czas, dystans i RPE porównuj w ich własnych jednostkach.",
    "cues": "Utrzymuj spokojny wysiłek i naturalny rytm kroku. Zapisuj czas oraz odczuwany wysiłek.",
    "cuesEn": "Maintain an easy effort and natural stride. Record duration and perceived effort.",
    "variants": "Marszobieg ułatwia powrót. Ciągły bieg i przerywane bloki mają odmienny rozkład odpoczynku.",
    "variantsEn": "Run–walk work helps a return to training. Continuous running and intermittent blocks distribute recovery differently.",
    "sourceUrls": [
      "https://www.nsca.com/education/articles/kinetic-select/aerobic-endurance-training-strategies/"
    ],
    "provenance": "Biblioteka ogólna · wydolność · zweryfikowane źródła",
    "prescription": ""
  },
  {
    "id": "catalog-bike-steady",
    "name": "Rower stacjonarny · praca ciągła",
    "nameEn": "Stationary bike · steady riding",
    "category": "conditioning",
    "metric": "minutes",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "glutes",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.25
      }
    ],
    "video": "",
    "notes": "Udziały są edytowalnym podziałem do planowania, nie proporcjami fizjologicznymi. Czas, dystans i RPE porównuj w ich własnych jednostkach.",
    "cues": "Ustaw siodło do wygodnego ruchu kolana i pedałuj płynnie. Zapisuj czas i RPE.",
    "cuesEn": "Set the saddle for comfortable knee motion and pedal smoothly. Record duration and RPE.",
    "variants": "Niższy opór ułatwia spokojną jazdę; wyższy zmienia nacisk na pedał. Dobierz wysiłek do celu sesji.",
    "variantsEn": "Lower resistance supports easy riding; higher resistance changes pedal-force demands. Match effort to the session goal.",
    "sourceUrls": [
      "https://www.nsca.com/education/articles/kinetic-select/aerobic-endurance-training-strategies/"
    ],
    "provenance": "Biblioteka ogólna · wydolność · zweryfikowane źródła",
    "prescription": ""
  },
  {
    "id": "catalog-bike-intervals",
    "name": "Rower stacjonarny · interwały",
    "nameEn": "Stationary bike · intervals",
    "category": "conditioning",
    "metric": "minutes",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "glutes",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.25
      }
    ],
    "video": "",
    "notes": "Udziały są edytowalnym podziałem do planowania, nie proporcjami fizjologicznymi. Czas, dystans i RPE porównuj w ich własnych jednostkach.",
    "cues": "Zmieniaj wysiłek zgodnie z planem pracy i odpoczynku. Utrzymuj kontrolowaną kadencję.",
    "cuesEn": "Follow the planned work and recovery pattern. Maintain a controlled cadence.",
    "variants": "Krótsze i dłuższe odcinki pracy zmieniają wymagania sesji. Oddziel czas pracy od całego czasu treningu.",
    "variantsEn": "Shorter and longer work bouts change session demands. Distinguish work duration from total session duration.",
    "sourceUrls": [
      "https://www.nsca.com/education/articles/kinetic-select/aerobic-endurance-training-strategies/"
    ],
    "provenance": "Biblioteka ogólna · wydolność · zweryfikowane źródła",
    "prescription": ""
  },
  {
    "id": "catalog-rower-steady",
    "name": "Ergometr wioślarski · praca ciągła",
    "nameEn": "Rowing ergometer · steady work",
    "category": "conditioning",
    "metric": "minutes",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.2
      },
      {
        "muscle": "glutes",
        "weight": 0.2
      },
      {
        "muscle": "lats",
        "weight": 0.2
      },
      {
        "muscle": "upper_back",
        "weight": 0.2
      },
      {
        "muscle": "biceps",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "Udziały są edytowalnym podziałem do planowania, nie proporcjami fizjologicznymi. Czas, dystans i RPE porównuj w ich własnych jednostkach.",
    "cues": "W napędzie połącz pracę nóg, tułowia i ramion. W powrocie odwróć kolejność i przesuń siedzisko pod kontrolą.",
    "cuesEn": "Sequence legs, trunk, and arms during the drive. Reverse the sequence in recovery and control the seat.",
    "variants": "Spokojna praca pozwala ćwiczyć rytm. Zmiana tempa pociągnięć i siły napędu zmienia wysiłek; ustawienie tłumika nie jest miarą intensywności.",
    "variantsEn": "Steady work lets you practice rhythm. Stroke rate and drive force change effort; the damper setting is not an intensity measure.",
    "sourceUrls": [
      "https://www.concept2.com/training/rowing-technique",
      "https://www.concept2.com/training/articles/rowing-muscles-used"
    ],
    "provenance": "Biblioteka ogólna · wydolność · zweryfikowane źródła",
    "prescription": ""
  },
  {
    "id": "catalog-rower-intervals",
    "name": "Ergometr wioślarski · interwały",
    "nameEn": "Rowing ergometer · intervals",
    "category": "conditioning",
    "metric": "minutes",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.2
      },
      {
        "muscle": "glutes",
        "weight": 0.2
      },
      {
        "muscle": "lats",
        "weight": 0.2
      },
      {
        "muscle": "upper_back",
        "weight": 0.2
      },
      {
        "muscle": "biceps",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "Udziały są edytowalnym podziałem do planowania, nie proporcjami fizjologicznymi. Czas, dystans i RPE porównuj w ich własnych jednostkach.",
    "cues": "Zachowaj kolejność napędu i kontrolę ruchu także w szybszych odcinkach. Zapisuj długość pracy i odpoczynku.",
    "cuesEn": "Maintain drive sequence and movement control during faster bouts. Record work and recovery duration.",
    "variants": "Krótszy odpoczynek zwiększa wymagania powtarzania wysiłku; dłuższy ułatwia utrzymanie jakości napędu.",
    "variantsEn": "Shorter recovery raises repeated-effort demands; longer recovery supports drive quality.",
    "sourceUrls": [
      "https://www.concept2.com/training/rowing-technique",
      "https://www.nsca.com/education/articles/kinetic-select/aerobic-endurance-training-strategies/"
    ],
    "provenance": "Biblioteka ogólna · wydolność · zweryfikowane źródła",
    "prescription": ""
  },
  {
    "id": "catalog-tempo-100m",
    "name": "Interwały tempowe · odcinki 100 m",
    "nameEn": "Tempo intervals · 100 m repeats",
    "category": "conditioning",
    "metric": "meters",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "glutes",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      }
    ],
    "video": "",
    "notes": "Udziały są edytowalnym podziałem do planowania, nie proporcjami fizjologicznymi. Czas, dystans i RPE porównuj w ich własnych jednostkach.",
    "cues": "Biegnij odcinki w ustalonym tempie, które pozwala powtarzać próby. Zapisuj wykonany dystans i przerwy.",
    "cuesEn": "Run at a planned pace that allows repeatable efforts. Record completed distance and recoveries.",
    "variants": "100 m opisuje długość odcinka. Tempo, liczba prób i odpoczynek określają cel; ten wariant nie wymaga maksymalnego sprintu.",
    "variantsEn": "100 m describes bout length. Pace, repetition count, and recovery define the goal; this variation does not require maximal sprinting.",
    "sourceUrls": [
      "https://www.theuap.com/blog/how-to-get-in-shape-fast-for-your-ultimate-season"
    ],
    "provenance": "Biblioteka ogólna · wydolność · zweryfikowane źródła",
    "prescription": ""
  },
  {
    "id": "catalog-repeated-sprint-conditioning",
    "name": "Powtarzane sprinty · wydolność",
    "nameEn": "Repeated-sprint conditioning",
    "category": "conditioning",
    "metric": "meters",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.25
      },
      {
        "muscle": "glutes",
        "weight": 0.25
      },
      {
        "muscle": "hamstrings",
        "weight": 0.25
      },
      {
        "muscle": "calves",
        "weight": 0.25
      }
    ],
    "video": "",
    "notes": "Udziały są edytowalnym podziałem do planowania, nie proporcjami fizjologicznymi. Czas, dystans i RPE porównuj w ich własnych jednostkach.",
    "cues": "Zapisuj czasy szybkich prób oraz przerwy. Zaplanuj miejsce na kontrolowane hamowanie.",
    "cuesEn": "Record fast repetition times and recoveries. Leave space for controlled braking.",
    "variants": "Niepełny odpoczynek zmienia zadanie względem treningu maksymalnej prędkości. Długość odcinka i spadek jakości pomagają oceniać sesję.",
    "variantsEn": "Incomplete recovery changes the task compared with maximum-speed training. Bout length and declining quality help assess the session.",
    "sourceUrls": [
      "https://www.nsca.com/education/articles/kinetic-select/anaerobic-and-muscle-endurance-development/",
      "https://www.nsca.com/education/articles/kinetic-select/sprinting-mechanics-and-technique/"
    ],
    "provenance": "Biblioteka ogólna · wydolność · zweryfikowane źródła",
    "prescription": ""
  },
  {
    "id": "catalog-intermittent-shuttle-conditioning",
    "name": "Bieg wahadłowy · interwały wydolnościowe",
    "nameEn": "Intermittent shuttle conditioning",
    "category": "conditioning",
    "metric": "meters",
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.2
      },
      {
        "muscle": "glutes",
        "weight": 0.2
      },
      {
        "muscle": "calves",
        "weight": 0.2
      },
      {
        "muscle": "adductors",
        "weight": 0.2
      },
      {
        "muscle": "abductors",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "Udziały są edytowalnym podziałem do planowania, nie proporcjami fizjologicznymi. Czas, dystans i RPE porównuj w ich własnych jednostkach.",
    "cues": "Hamuj przed zwrotem, następnie przyspieszaj. Przeplataj pracę z zaplanowanym odpoczynkiem.",
    "cuesEn": "Brake before turning, then accelerate. Alternate work with planned recovery.",
    "variants": "Krótszy dystans dodaje więcej zwrotów. Dłuższy dystans daje więcej biegu po prostej; kierunek zwrotu ćwicz po obu stronach.",
    "variantsEn": "Shorter distances add turns. Longer distances add straight running; practice turning on both sides.",
    "sourceUrls": [
      "https://www.nsca.com/education/articles/kinetic-select/effective-deceleration-technique-for-court-and-field-sports/",
      "https://www.theuap.com/blog/how-to-get-in-shape-fast-for-your-ultimate-season"
    ],
    "provenance": "Biblioteka ogólna · wydolność · zweryfikowane źródła",
    "prescription": ""
  },
  {
    "id": "catalog-ski-erg-conditioning",
    "name": "SkiErg · praca ciągła lub interwały",
    "nameEn": "SkiErg · steady or interval work",
    "category": "conditioning",
    "metric": "minutes",
    "shares": [
      {
        "muscle": "lats",
        "weight": 0.25
      },
      {
        "muscle": "triceps",
        "weight": 0.25
      },
      {
        "muscle": "abs",
        "weight": 0.25
      },
      {
        "muscle": "glutes",
        "weight": 0.25
      }
    ],
    "video": "",
    "notes": "Udziały są edytowalnym podziałem do planowania, nie proporcjami fizjologicznymi. Czas, dystans i RPE porównuj w ich własnych jednostkach.",
    "cues": "Prowadź uchwyty w dół, łącząc pracę ramion i bioder. Wróć płynnie bez szarpania.",
    "cuesEn": "Drive the handles downward with coordinated arm and hip action. Recover smoothly without jerking.",
    "variants": "Podwójne pociągnięcie i naprzemienna praca ramion różnią się rytmem. Długość pracy i odpoczynku zmienia cel wydolnościowy.",
    "variantsEn": "Double-poling and alternating-arm work differ in rhythm. Work and recovery duration change conditioning emphasis.",
    "sourceUrls": [
      "https://www.concept2.com/training/skierg-technique"
    ],
    "provenance": "Biblioteka ogólna · wydolność · zweryfikowane źródła",
    "prescription": ""
  },
  {
    "id": "catalog-jump-rope-conditioning",
    "name": "Skakanka · wydolność",
    "nameEn": "Jump rope · conditioning",
    "category": "conditioning",
    "metric": "minutes",
    "shares": [
      {
        "muscle": "calves",
        "weight": 0.3333333333333333
      },
      {
        "muscle": "quads",
        "weight": 0.3333333333333333
      },
      {
        "muscle": "forearms",
        "weight": 0.3333333333333333
      }
    ],
    "video": "",
    "notes": "Udziały są edytowalnym podziałem do planowania, nie proporcjami fizjologicznymi. Czas, dystans i RPE porównuj w ich własnych jednostkach.",
    "cues": "Skacz nisko i rytmicznie. Zachowaj kontrolę lądowania oraz swobodne barki.",
    "cuesEn": "Jump low and rhythmically. Maintain controlled landings and relaxed shoulders.",
    "variants": "Praca ciągła i krótkie interwały różnią się rozkładem odpoczynku. Wariant jednonóż zwiększa wymagania pojedynczej nogi.",
    "variantsEn": "Continuous work and short intervals distribute recovery differently. Single-leg work increases individual-leg demands.",
    "sourceUrls": [
      "https://www.theuap.com/blog/plyometrics-3-mistakes-that-increase-your-risk-of-injury"
    ],
    "provenance": "Biblioteka ogólna · wydolność · zweryfikowane źródła",
    "prescription": ""
  }
];

/** Return a fresh copy so user edits cannot mutate the shared catalogue. */
export function catalogExercises(): Exercise[] {
  return JSON.parse(JSON.stringify(catalog)) as Exercise[];
}
