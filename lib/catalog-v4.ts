import type {Exercise} from './domain';
import type {ExerciseType} from './exercise-types';
export const catalogV4:Exercise[]=[
  {
    "id": "v4-bird-dog",
    "name": "Bird dog: przeciwległa ręka i noga",
    "nameEn": "Bird dog",
    "category": "strength",
    "metric": "reps",
    "types": [
      "stability"
    ],
    "shares": [
      {
        "muscle": "abs",
        "weight": 0.4
      },
      {
        "muscle": "obliques",
        "weight": 0.3
      },
      {
        "muscle": "glutes",
        "weight": 0.2
      },
      {
        "muscle": "lower_back",
        "weight": 0.1
      }
    ],
    "video": "",
    "notes": "Kontrola tułowia przy niezależnym ruchu kończyn. Licz powtórzenia obu stron łącznie.",
    "notesEn": "Trunk control during independent limb movement. Count total repetitions across both sides.",
    "cues": "W klęku podpartym wydłuż przeciwległą rękę i nogę. Zachowaj spokojny tułów i równą miednicę.",
    "cuesEn": "From all fours, reach opposite arm and leg away. Keep the trunk quiet and pelvis level.",
    "variants": "Ruch jednej kończyny ułatwia kontrolę; dłuższa pauza zwiększa wymaganie utrzymania pozycji.",
    "variantsEn": "Moving one limb makes control easier; a longer pause adds a position-holding demand.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/14/bird-dog/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-child-pose",
    "name": "Pozycja dziecka",
    "nameEn": "Child’s pose",
    "category": "strength",
    "metric": "minutes",
    "types": [
      "stretching",
      "mobility"
    ],
    "shares": [],
    "video": "",
    "notes": "Łagodny zakres bioder i obręczy barkowej. Zapisuj czas w minutach.",
    "notesEn": "Gentle hip and shoulder range work. Record duration in minutes.",
    "cues": "W klęku cofnij biodra ku piętom i wyciągnij ręce. Oddychaj, wybierając wygodny zakres.",
    "cuesEn": "From kneeling, sit hips toward heels and reach the arms forward. Breathe within a comfortable range.",
    "variants": "Ręce wzdłuż ciała zmniejszają pozycję nad głową; szersze kolana zmieniają ustawienie bioder.",
    "variantsEn": "Arms by the sides reduce the overhead position; wider knees change hip positioning.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/227/childs-pose/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-band-ankle-dorsiflexion",
    "name": "Zgięcie grzbietowe stopy z gumą",
    "nameEn": "Band ankle dorsiflexion",
    "category": "strength",
    "metric": "reps",
    "types": [
      "strength"
    ],
    "shares": [],
    "video": "",
    "notes": "Praca przodu podudzia. Obecna mapa mięśni nie ma osobnego mięśnia piszczelowego przedniego.",
    "notesEn": "Anterior lower-leg work. The current muscle map has no separate tibialis anterior entry.",
    "cues": "Siedząc, zabezpiecz gumę na przodostopiu. Przyciągnij palce ku piszczeli i spokojnie wróć.",
    "cuesEn": "Seated, secure the band around the forefoot. Pull the toes toward the shin and return smoothly.",
    "variants": "Zmiana oporu zmienia trudność; zachowaj podobny zakres i nieruchome kolano podczas porównywania.",
    "variantsEn": "Changing resistance changes difficulty; keep a similar range and a quiet knee when comparing sessions.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/23/ankle-flexion/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-kneeling-hip-flexor-stretch",
    "name": "Rozciąganie zginaczy biodra w półklęku",
    "nameEn": "Half-kneeling hip-flexor stretch",
    "category": "strength",
    "metric": "minutes",
    "types": [
      "stretching"
    ],
    "shares": [],
    "video": "",
    "notes": "Zakres wyprostu biodra bez zastępowania go przeprostem lędźwi. Czas obu stron sumuj.",
    "notesEn": "Hip-extension range without substituting lumbar extension. Sum duration on both sides.",
    "cues": "W półklęku napnij pośladek nogi klęczącej i przesuń miednicę lekko w przód, nie unosząc żeber.",
    "cuesEn": "In half kneeling, engage the kneeling-side glute and move the pelvis slightly forward without flaring the ribs.",
    "variants": "Uniesienie ręki po stronie klęczącej dodaje wymaganie bocznej pozycji tułowia; podkładka zwiększa wygodę kolana.",
    "variantsEn": "Raising the kneeling-side arm adds a lateral trunk-position demand; padding improves knee comfort.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/142/kneeling-hip-flexor-stretch/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-standing-lat-stretch",
    "name": "Rozciąganie grzbietu z rękami na podparciu",
    "nameEn": "Standing supported lat stretch",
    "category": "strength",
    "metric": "minutes",
    "types": [
      "stretching"
    ],
    "shares": [],
    "video": "",
    "notes": "Zakres zgięcia barków i pozycja tułowia przy rękach nad głową.",
    "notesEn": "Shoulder-flexion range and trunk positioning with arms overhead.",
    "cues": "Oprzyj dłonie na stabilnym blacie i cofnij biodra. Wydłuż tułów, utrzymując wygodne ustawienie pleców.",
    "cuesEn": "Place hands on a stable surface and move hips back. Lengthen the trunk with a comfortable back position.",
    "variants": "Obrót dłoni ku górze zmienia ustawienie ramion; wysokość podparcia zmienia zakres.",
    "variantsEn": "Turning palms upward changes arm positioning; support height changes the range.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/198/90-lat-stretch/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-cat-cow",
    "name": "Kot–krowa w klęku podpartym",
    "nameEn": "Cat–cow",
    "category": "strength",
    "metric": "reps",
    "types": [
      "mobility"
    ],
    "shares": [],
    "video": "",
    "notes": "Spokojna praktyka zgięcia i wyprostu kręgosłupa. Jeden cykl to jedno powtórzenie.",
    "notesEn": "Gentle practice of spinal flexion and extension. One cycle counts as one repetition.",
    "cues": "W klęku podpartym powoli zaokrąglij plecy, potem łagodnie wróć przez pozycję neutralną do wyprostu.",
    "cuesEn": "On all fours, slowly round the back, then gently move through neutral toward extension.",
    "variants": "Krótszy zakres ułatwia komfort; krótkie pauzy pomagają rozpoznać pozycje końcowe.",
    "variantsEn": "A shorter range improves comfort; brief pauses help you recognize the end positions.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/15/cat-cow/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-cycled-split-squat-jump",
    "name": "Skok w wykroku ze zmianą nóg",
    "nameEn": "Cycled split-squat jump",
    "category": "strength",
    "metric": "reps",
    "types": [
      "power"
    ],
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.4
      },
      {
        "muscle": "glutes",
        "weight": 0.35
      },
      {
        "muscle": "calves",
        "weight": 0.25
      }
    ],
    "video": "",
    "notes": "Moc odbicia i kontrola lądowania w ustawieniu wykrocznym. Licz każde lądowanie.",
    "notesEn": "Takeoff power and landing control in a split stance. Count each landing.",
    "cues": "Odbij się z wykroku, zmień nogi w powietrzu i wyląduj z ugiętymi biodrami i kolanami.",
    "cuesEn": "Jump from a split stance, switch legs in the air, and land with hips and knees bent.",
    "variants": "Reset po każdym lądowaniu akcentuje kontrolę; kolejne skoki bez pauzy dodają wymaganie reaktywności.",
    "variantsEn": "Resetting after each landing emphasizes control; consecutive jumps add reactive demands.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/234/cycled-split-squat-jump/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-half-kneeling-hay-baler",
    "name": "Unoszenie piłki po skosie w półklęku",
    "nameEn": "Half-kneeling hay baler",
    "category": "strength",
    "metric": "kg",
    "types": [
      "strength",
      "stability"
    ],
    "shares": [
      {
        "muscle": "obliques",
        "weight": 0.5
      },
      {
        "muscle": "abs",
        "weight": 0.2
      },
      {
        "muscle": "shoulders",
        "weight": 0.3
      }
    ],
    "video": "",
    "notes": "Kontrolowana praca po skosie przez tułów i ramiona. Licz powtórzenia obu stron łącznie.",
    "notesEn": "Controlled diagonal work through trunk and arms. Count total repetitions across both sides.",
    "cues": "W półklęku prowadź piłkę od biodra nogi klęczącej nad przeciwległy bark. Obracaj się płynnie.",
    "cuesEn": "In half kneeling, move the ball from the kneeling-side hip toward the opposite shoulder. Rotate smoothly.",
    "variants": "Lżejsza piłka ułatwia kontrolę toru; stanie dodaje możliwość udziału nóg i bioder.",
    "variantsEn": "A lighter ball makes path control easier; standing adds the possibility of leg and hip contribution.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/97/half-kneeling-hay-baler/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-overhead-med-ball-slam",
    "name": "Uderzenie piłką w podłoże znad głowy",
    "nameEn": "Overhead medicine-ball slam",
    "category": "strength",
    "metric": "reps",
    "types": [
      "power"
    ],
    "shares": [
      {
        "muscle": "lats",
        "weight": 0.25
      },
      {
        "muscle": "abs",
        "weight": 0.25
      },
      {
        "muscle": "shoulders",
        "weight": 0.2
      },
      {
        "muscle": "glutes",
        "weight": 0.2
      },
      {
        "muscle": "quads",
        "weight": 0.1
      }
    ],
    "video": "",
    "notes": "Moc całego ciała. Masa piłki i liczba kontaktów powinny być zapisane oddzielnie od dystansu rzutu.",
    "notesEn": "Whole-body power. Record ball mass and repetition count separately from throw distance.",
    "cues": "Unieś piłkę i energicznie skieruj ją w podłoże. Ugnij biodra i kolana, utrzymując kontrolę tułowia.",
    "cuesEn": "Raise the ball and drive it into the ground. Bend hips and knees while controlling the trunk.",
    "variants": "Piłka bez odbicia wymaga zebrania przed kolejną próbą; odbijająca zmienia rytm i wymaga przewidywania odbicia.",
    "variantsEn": "A dead ball requires retrieval before the next effort; a bouncing ball changes rhythm and requires anticipating the rebound.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/182/overhead-slams/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-rotational-med-ball-slam",
    "name": "Uderzenie piłką w podłoże z rotacją",
    "nameEn": "Rotational medicine-ball slam",
    "category": "strength",
    "metric": "reps",
    "types": [
      "power"
    ],
    "shares": [
      {
        "muscle": "obliques",
        "weight": 0.35
      },
      {
        "muscle": "lats",
        "weight": 0.2
      },
      {
        "muscle": "shoulders",
        "weight": 0.15
      },
      {
        "muscle": "glutes",
        "weight": 0.2
      },
      {
        "muscle": "quads",
        "weight": 0.1
      }
    ],
    "video": "",
    "notes": "Wytwarzanie siły po skosie. Użyj piłki przeznaczonej do uderzania i wolnej przestrzeni.",
    "notesEn": "Diagonal force production. Use a ball designed for slams and clear space.",
    "cues": "Z pozycji z piłką nad głową obróć się i skieruj piłkę do podłoża obok ciała. Pracuj w obie strony.",
    "cuesEn": "From an overhead position, rotate and drive the ball into the ground beside the body. Work both directions.",
    "variants": "Zebranie piłki po każdej próbie daje reset; naprzemienna sekwencja z odbiciem zwiększa wymaganie koordynacji.",
    "variantsEn": "Retrieving the ball after each effort gives a reset; an alternating rebound sequence increases coordination demands.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/287/rotational-slam/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-forward-cone-jump",
    "name": "Skoki obunóż w przód przez niskie znaczniki",
    "nameEn": "Forward cone jumps",
    "category": "strength",
    "metric": "reps",
    "types": [
      "power"
    ],
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.35
      },
      {
        "muscle": "glutes",
        "weight": 0.35
      },
      {
        "muscle": "calves",
        "weight": 0.3
      }
    ],
    "video": "",
    "notes": "Odbicie w przód i kontrola kontaktów. Licz każde lądowanie.",
    "notesEn": "Forward propulsion and contact control. Count each landing.",
    "cues": "Przeskocz niski znacznik obunóż i przyjmij lądowanie przez ugięcie bioder i kolan.",
    "cuesEn": "Jump over a low marker with both feet and absorb landing through the hips and knees.",
    "variants": "Zatrzymanie po skoku uczy lądowania; połączenie skoków zmienia wymagania kolejnego odbicia.",
    "variantsEn": "Stopping after a jump trains landing; linked jumps change the demands of the next takeoff.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/118/forward-cone-jumps/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-lateral-cone-jump",
    "name": "Skoki obunóż bokiem przez niskie znaczniki",
    "nameEn": "Lateral cone jumps",
    "category": "strength",
    "metric": "reps",
    "types": [
      "power"
    ],
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.3
      },
      {
        "muscle": "glutes",
        "weight": 0.3
      },
      {
        "muscle": "calves",
        "weight": 0.25
      },
      {
        "muscle": "abductors",
        "weight": 0.15
      }
    ],
    "video": "",
    "notes": "Odbicie boczne i kontrola lądowania; odrębny ruch od skoku bocznego jednonóż.",
    "notesEn": "Lateral propulsion and landing control; distinct from a single-leg lateral bound.",
    "cues": "Odbij się obunóż w bok nad niskim znacznikiem. Wyląduj stabilnie i ćwicz oba kierunki.",
    "cuesEn": "Push sideways with both feet over a low marker. Land steadily and practice both directions.",
    "variants": "Pauza zwiększa akcent kontroli; ciągłe przeskoki zwiększają wymaganie krótkich kontaktów.",
    "variantsEn": "A pause emphasizes control; continuous jumps increase short-contact demands.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/120/lateral-cone-jumps/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-t-drill",
    "name": "Bieg i przemieszczanie bokiem po trasie T",
    "nameEn": "T drill",
    "category": "running",
    "metric": "meters",
    "types": [
      "agility",
      "speed"
    ],
    "shares": [],
    "video": "",
    "notes": "Zaplanowana zmiana kierunku z biegiem, ruchem bocznym i cofaniem. Dystans trasy zapisz przed sesją.",
    "notesEn": "Planned direction changes combining running, shuffling, and backpedaling. Define route distance before the session.",
    "cues": "Przyspiesz do środkowego znacznika, wyhamuj i przemieść się bokiem po ramionach T. Wróć kontrolowanym cofaniem.",
    "cuesEn": "Accelerate to the center marker, brake, and shuffle across the T arms. Return with controlled backpedaling.",
    "variants": "Krótsza trasa akcentuje częste przejścia; sygnał partnera dodaje wybór kierunku zamiast zapamiętanego wzoru.",
    "variantsEn": "A shorter route emphasizes frequent transitions; a partner cue adds direction choice instead of a memorized pattern.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/171/t-drill/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-double-kettlebell-push-press",
    "name": "Push press z dwoma kettlami",
    "nameEn": "Double kettlebell push press",
    "category": "strength",
    "metric": "kg",
    "types": [
      "power"
    ],
    "shares": [
      {
        "muscle": "shoulders",
        "weight": 0.35
      },
      {
        "muscle": "triceps",
        "weight": 0.2
      },
      {
        "muscle": "quads",
        "weight": 0.2
      },
      {
        "muscle": "glutes",
        "weight": 0.15
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "",
    "notes": "Moc w pionowym pchaniu z udziałem nóg. Wpisuj łączną masę obu kettli.",
    "notesEn": "Power in vertical pressing with leg contribution. Record the combined mass of both kettlebells.",
    "cues": "Z pozycji rack wykonaj krótkie ugięcie nóg i wypchnij ciężary nad głowę. Opuść je pod kontrolą.",
    "cuesEn": "From the rack, dip briefly through the legs and drive the weights overhead. Lower under control.",
    "variants": "Wyciskanie bez ugięcia nóg zwiększa akcent pracy barków; wariant jednorącz dodaje kontrolę asymetrii.",
    "variantsEn": "Pressing without a leg dip emphasizes shoulder work; a one-arm version adds asymmetry control.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/384/double-push-press/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-half-turkish-get-up",
    "name": "Połowa tureckiego wstawania",
    "nameEn": "Half Turkish get-up",
    "category": "strength",
    "metric": "kg",
    "types": [
      "stability",
      "strength"
    ],
    "shares": [
      {
        "muscle": "shoulders",
        "weight": 0.35
      },
      {
        "muscle": "obliques",
        "weight": 0.3
      },
      {
        "muscle": "abs",
        "weight": 0.2
      },
      {
        "muscle": "glutes",
        "weight": 0.15
      }
    ],
    "video": "",
    "notes": "Kontrola barku i tułowia w przejściu od leżenia do podporu z uniesieniem bioder.",
    "notesEn": "Shoulder and trunk control moving from lying to a supported position with hips raised.",
    "cues": "Trzymaj ciężar nad barkiem. Przejdź z leżenia na przeciwny łokieć, potem dłoń i unieś biodra. Cofnij sekwencję.",
    "cuesEn": "Keep the weight above the shoulder. Roll to the opposite elbow, then hand, and lift the hips. Reverse the sequence.",
    "variants": "Bez ciężaru można ćwiczyć kolejność; pełne tureckie wstawanie dodaje przejście do klęku i stania.",
    "variantsEn": "An unloaded version allows sequence practice; a full get-up adds transitions to kneeling and standing.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/381/half-turkish-get-up/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-kettlebell-halo",
    "name": "Halo: krążenie kettlem wokół głowy",
    "nameEn": "Kettlebell halo",
    "category": "strength",
    "metric": "reps",
    "types": [
      "mobility",
      "stability"
    ],
    "shares": [],
    "video": "",
    "notes": "Kontrolowany zakres ramion przy stabilnym tułowiu. Masa kettla to parametr zadania, nie pomiar zakresu.",
    "notesEn": "Controlled arm range with a steady trunk. Kettlebell mass is a task parameter rather than a range measurement.",
    "cues": "Trzymając kettla oburącz, prowadź go blisko głowy wokół niej. Oddychaj bez odchylania tułowia.",
    "cuesEn": "Hold the kettlebell with both hands and circle it close around the head. Breathe without leaning the trunk.",
    "variants": "Mniejszy ciężar ułatwia zakres; półklęk zmienia podparcie i wymaganie utrzymania miednicy.",
    "variantsEn": "A lighter load makes range easier; half kneeling changes the base of support and pelvic-control demand.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/394/halo/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-high-plank-rotation",
    "name": "Rotacja w wysokim podporze",
    "nameEn": "High-plank rotation",
    "category": "strength",
    "metric": "reps",
    "types": [
      "mobility",
      "stability"
    ],
    "shares": [
      {
        "muscle": "obliques",
        "weight": 0.35
      },
      {
        "muscle": "abs",
        "weight": 0.25
      },
      {
        "muscle": "shoulders",
        "weight": 0.4
      }
    ],
    "video": "",
    "notes": "Rotacja tułowia przy podparciu jednej ręki. Licz ruchy obu stron łącznie.",
    "notesEn": "Trunk rotation while supported by one arm. Count total movements across both sides.",
    "cues": "W wysokim podporze przenieś ciężar na jedną rękę, obróć biodra i barki, unosząc drugą rękę. Wróć spokojnie.",
    "cuesEn": "In a high plank, shift onto one hand and rotate hips and shoulders as the other arm rises. Return smoothly.",
    "variants": "Podwyższenie rąk zmniejsza obciążenie podporu; mniejszy obrót ułatwia kontrolę.",
    "variantsEn": "Elevating the hands reduces support load; a smaller turn makes control easier.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/330/high-plank-t-spine-rotation/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-standing-calf-stretch",
    "name": "Rozciąganie łydki przy ścianie",
    "nameEn": "Standing calf stretch",
    "category": "strength",
    "metric": "minutes",
    "types": [
      "stretching"
    ],
    "shares": [],
    "video": "",
    "notes": "Zakres zgięcia grzbietowego stawu skokowego. Sumuj czas obu stron.",
    "notesEn": "Ankle-dorsiflexion range. Sum duration across both sides.",
    "cues": "W wykroku oprzyj ręce na ścianie i zostaw tylną piętę na podłożu. Przesuń ciało łagodnie w przód.",
    "cuesEn": "In a split stance, place hands on a wall and keep the rear heel down. Move gently forward.",
    "variants": "Proste tylne kolano bardziej akcentuje mięsień brzuchaty; ugięte zmienia akcent w stronę płaszczkowatego.",
    "variantsEn": "A straight rear knee emphasizes gastrocnemius more; bending it shifts emphasis toward soleus.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/152/standing-dorsi-flexion-calf-stretch/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-standing-chest-stretch",
    "name": "Rozciąganie klatki piersiowej w staniu",
    "nameEn": "Standing chest stretch",
    "category": "strength",
    "metric": "minutes",
    "types": [
      "stretching"
    ],
    "shares": [],
    "video": "",
    "notes": "Pozycja otwarcia przedniej części barków i klatki.",
    "notesEn": "An opening position for the front shoulders and chest.",
    "cues": "Stań stabilnie, delikatnie cofnij ramiona i otwórz klatkę bez wypychania bioder ani wyginania lędźwi.",
    "cuesEn": "Stand steadily, gently bring the arms back, and open the chest without pushing hips forward or arching the lower back.",
    "variants": "Dłonie splecione z tyłu lub ręcznik zmieniają dźwignię ramion; wybierz wygodny chwyt.",
    "variantsEn": "Clasped hands behind the back or a towel change the arm lever; choose a comfortable grip.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/209/standing-chest-stretch/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-supine-wall-hamstring-stretch",
    "name": "Rozciąganie tyłu uda z nogą na ścianie",
    "nameEn": "Supine wall hamstring stretch",
    "category": "strength",
    "metric": "minutes",
    "types": [
      "stretching"
    ],
    "shares": [],
    "video": "",
    "notes": "Zakres biodra przy wydłużonej nodze. Sumuj czas obu stron.",
    "notesEn": "Hip range with a lengthened leg. Sum duration across both sides.",
    "cues": "Leżąc obok framugi, oprzyj jedną nogę na ścianie, drugą na podłodze. Utrzymuj wygodne ustawienie miednicy.",
    "cuesEn": "Lie beside a doorway with one leg against the wall and the other on the floor. Maintain comfortable pelvic positioning.",
    "variants": "Odsunięcie od ściany zmniejsza wymagany zakres; przyciągnięcie palców zwiększa udział rozciągania łydki.",
    "variantsEn": "Moving farther from the wall reduces the required range; drawing toes toward you adds calf stretch.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/235/supine-hamstrings-stretch/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-dumbbell-front-squat",
    "name": "Przysiad przedni z dwoma hantlami",
    "nameEn": "Dumbbell front squat",
    "category": "strength",
    "metric": "kg",
    "types": [
      "strength"
    ],
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.45
      },
      {
        "muscle": "glutes",
        "weight": 0.35
      },
      {
        "muscle": "abs",
        "weight": 0.1
      },
      {
        "muscle": "upper_back",
        "weight": 0.1
      }
    ],
    "video": "",
    "notes": "Obciążenie przy barkach i kontrola pozycji tułowia. Wpisuj łączną masę obu hantli.",
    "notesEn": "Shoulder-height loading and trunk-position control. Record the combined mass of both dumbbells.",
    "cues": "Trzymaj hantle przy barkach i zejdź do kontrolowanej głębokości, zachowując całe stopy na podłożu.",
    "cuesEn": "Hold dumbbells at the shoulders and descend to a controlled depth with whole feet grounded.",
    "variants": "Goblet zmienia chwyt i położenie ciężaru; pauza na dole zwiększa wymaganie kontroli pozycji.",
    "variantsEn": "A goblet hold changes grip and load positioning; a bottom pause increases position-control demand.",
    "sourceUrls": [
      "https://www.nasm.org/resource-center/exercise-library/dumbbell-front-squat"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-butterfly-stretch",
    "name": "Motylek: rozciąganie przywodzicieli w siadzie",
    "nameEn": "Seated butterfly stretch",
    "category": "strength",
    "metric": "minutes",
    "types": [
      "stretching"
    ],
    "shares": [],
    "video": "",
    "notes": "Zakres odwiedzenia i rotacji bioder w podpartym siadzie.",
    "notesEn": "Hip abduction and rotation range in a supported seated position.",
    "cues": "Usiądź, złącz podeszwy stóp i pozwól kolanom opaść na boki. Nie dociskaj kolan siłą.",
    "cuesEn": "Sit with the soles together and allow knees to move outward. Avoid forcing the knees down.",
    "variants": "Podwyższenie siedziska lub podparcie kolan ułatwia pozycję; odsunięcie stóp zmienia ustawienie bioder.",
    "variantsEn": "Raising the seat or supporting the knees makes the position easier; moving feet farther away changes hip positioning.",
    "sourceUrls": [
      "https://www.nasm.org/resource-center/exercise-library/static-butterfly-stretch"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-standing-adductor-stretch",
    "name": "Rozciąganie przywodzicieli w szerokim staniu",
    "nameEn": "Standing adductor stretch",
    "category": "strength",
    "metric": "minutes",
    "types": [
      "stretching"
    ],
    "shares": [],
    "video": "",
    "notes": "Statyczny zakres boczny biodra; nie traktuj utrzymania jako serii przysiadu bocznego.",
    "notesEn": "Static lateral hip range; do not treat the hold as a lateral-squat set.",
    "cues": "W szerokim rozkroku przenieś ciężar na jedną nogę, wydłużając drugą. Pozostań w wygodnej pozycji.",
    "cuesEn": "In a wide stance, shift weight onto one leg while lengthening the other. Stay in a comfortable position.",
    "variants": "Podparcie ręką ogranicza wymagania równowagi; naprzemienny ruch zmienia utrzymanie w ćwiczenie mobilności.",
    "variantsEn": "Hand support reduces balance demands; alternating movement changes the hold to mobility practice.",
    "sourceUrls": [
      "https://www.nasm.org/resource-center/exercise-library/static-standing-adductor-stretch"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-burpee",
    "name": "Burpee z pompką i wyskokiem",
    "nameEn": "Burpee with push-up and jump",
    "category": "conditioning",
    "metric": "reps",
    "types": [
      "conditioning"
    ],
    "shares": [],
    "video": "",
    "notes": "Wysiłek całego ciała z wieloma przejściami. Wybierz wariant przed liczeniem powtórzeń.",
    "notesEn": "Whole-body effort with repeated transitions. Define the variant before counting repetitions.",
    "cues": "Przejdź do podporu, wykonaj pompkę, wróć stopami do dłoni i wyskocz. Kontroluj lądowanie.",
    "cuesEn": "Move to a plank, perform a push-up, return feet toward hands, and jump. Control the landing.",
    "variants": "Wersja z krokami i bez skoku zmniejsza uderzenia; pominięcie pompki zmienia pracę górnej części ciała.",
    "variantsEn": "Stepping and omitting the jump reduces impact; removing the push-up changes upper-body work.",
    "sourceUrls": [
      "https://www.nasm.org/resource-center/exercise-library/squat-thrust-burpees"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-farmers-carry",
    "name": "Spacer farmera z dwoma ciężarami",
    "nameEn": "Farmer’s carry",
    "category": "strength",
    "metric": "meters",
    "types": [
      "strength",
      "stability"
    ],
    "shares": [
      {
        "muscle": "forearms",
        "weight": 0.4
      },
      {
        "muscle": "upper_back",
        "weight": 0.2
      },
      {
        "muscle": "abs",
        "weight": 0.2
      },
      {
        "muscle": "obliques",
        "weight": 0.2
      }
    ],
    "video": "",
    "notes": "Chwyt i kontrola tułowia podczas chodu. Metry są dystansem; masę ciężarów zapisuj w uwagach.",
    "notesEn": "Grip and trunk control during walking. Meters represent distance; record implement mass in notes.",
    "cues": "Podnieś ciężary, ustaw tułów pionowo i idź spokojnymi krokami bez kołysania.",
    "cuesEn": "Lift the weights, stand upright, and walk with controlled steps without swaying.",
    "variants": "Ciężar po jednej stronie zwiększa zadanie przeciw zgięciu bocznemu; ciężary w rack zmieniają wymagania barków.",
    "variantsEn": "A load on one side adds anti-lateral-flexion demand; rack-held weights change shoulder requirements.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/359/farmer-s-carry/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-dumbbell-step-up",
    "name": "Wejście na podest z hantlami",
    "nameEn": "Dumbbell step-up",
    "category": "strength",
    "metric": "kg",
    "types": [
      "strength",
      "stability"
    ],
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.45
      },
      {
        "muscle": "glutes",
        "weight": 0.4
      },
      {
        "muscle": "abductors",
        "weight": 0.15
      }
    ],
    "video": "",
    "notes": "Siła nogi na podeście. Wpisuj łączną masę obu hantli i powtórzenia obu stron.",
    "notesEn": "Strength through the elevated leg. Record combined dumbbell mass and total repetitions across both sides.",
    "cues": "Postaw całą stopę na podeście i wstań głównie tą nogą. Zejdź spokojnie, bez odbijania tylną stopą.",
    "cuesEn": "Place the whole foot on the step and rise mainly through that leg. Lower smoothly without pushing off the rear foot.",
    "variants": "Niższy podest ogranicza zakres; wyższy zwiększa zgięcie biodra i kolana, jeśli zachowujesz kontrolę.",
    "variantsEn": "A lower step reduces range; a higher step increases hip and knee flexion if control is maintained.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/28/step-up/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-seated-dumbbell-overhead-press",
    "name": "Wyciskanie hantli nad głowę siedząc",
    "nameEn": "Seated dumbbell overhead press",
    "category": "strength",
    "metric": "kg",
    "types": [
      "strength"
    ],
    "shares": [
      {
        "muscle": "shoulders",
        "weight": 0.65
      },
      {
        "muscle": "triceps",
        "weight": 0.3
      },
      {
        "muscle": "upper_back",
        "weight": 0.05
      }
    ],
    "video": "",
    "notes": "Pionowe pchanie bez rozpędu nóg. Wpisuj łączną masę obu hantli.",
    "notesEn": "Vertical pressing without leg drive. Record the combined mass of both dumbbells.",
    "cues": "Siedząc stabilnie, wyciśnij hantle z okolicy barków nad głowę bez odchylania lędźwi. Opuść pod kontrolą.",
    "cuesEn": "Seated securely, press dumbbells from shoulder height overhead without leaning through the lower back. Lower under control.",
    "variants": "Chwyt neutralny zmienia ustawienie ramion; wariant stojący zwiększa wymagania utrzymania całego tułowia.",
    "variantsEn": "A neutral grip changes arm positioning; standing adds whole-trunk postural demands.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/45/seated-overhead-press/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-supine-shoulder-mobility-series",
    "name": "Mobilność barków w leżeniu: I–Y–T–W",
    "nameEn": "Supine shoulder mobility: I–Y–T–W",
    "category": "strength",
    "metric": "reps",
    "types": [
      "mobility",
      "stretching"
    ],
    "shares": [],
    "video": "",
    "notes": "Kontrolowany zakres barków przy podpartym tułowiu. Jeden powrót z wybranej pozycji to powtórzenie.",
    "notesEn": "Controlled shoulder range with the trunk supported. Count one return from the chosen position as a repetition.",
    "cues": "Leżąc na plecach, prowadź ręce do pozycji I, Y, T lub W. Zatrzymaj zakres przed wygięciem lędźwi.",
    "cuesEn": "Lying on your back, move arms into an I, Y, T, or W. Stop the range before the lower back arches.",
    "variants": "Powolne przejścia akcentują mobilność; spokojne utrzymanie pozycji zmienia zadanie w stretching.",
    "variantsEn": "Slow transitions emphasize mobility; a relaxed position hold changes the task to stretching.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/237/shoulder-stability-mobility-series-i-y-t-w-formations/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-squat-jump",
    "name": "Wyskok obunóż z przysiadu",
    "nameEn": "Squat jump",
    "category": "strength",
    "metric": "reps",
    "types": [
      "power"
    ],
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.4
      },
      {
        "muscle": "glutes",
        "weight": 0.35
      },
      {
        "muscle": "calves",
        "weight": 0.25
      }
    ],
    "video": "",
    "notes": "Odbicie pionowe i kontrola lądowania. Licz lądowania; jakość określa długość serii.",
    "notesEn": "Vertical propulsion and landing control. Count landings; quality guides set length.",
    "cues": "Ugnij biodra i kolana, odbij się pionowo, a lądowanie przyjmij miękko przez nogi.",
    "cuesEn": "Bend hips and knees, jump vertically, and absorb landing smoothly through the legs.",
    "variants": "Reset po każdym skoku pozwala odtworzyć pozycję; ciągłe skoki zmieniają wymagania reaktywności.",
    "variantsEn": "Resetting between jumps restores the position; continuous jumps change reactive demands.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/222/squat-jump/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-kettlebell-swing",
    "name": "Swing oburącz z kettlem",
    "nameEn": "Two-hand kettlebell swing",
    "category": "strength",
    "metric": "kg",
    "types": [
      "power"
    ],
    "shares": [
      {
        "muscle": "glutes",
        "weight": 0.4
      },
      {
        "muscle": "hamstrings",
        "weight": 0.35
      },
      {
        "muscle": "abs",
        "weight": 0.15
      },
      {
        "muscle": "forearms",
        "weight": 0.1
      }
    ],
    "video": "",
    "notes": "Szybki wyprost biodra przy kontroli ciężaru. Naucz się zawiasu biodrowego przed ruchem dynamicznym.",
    "notesEn": "Fast hip extension with load control. Learn the hip hinge before the dynamic movement.",
    "cues": "Cofnij biodra, prowadząc kettla między nogi. Szybkim wyprostem bioder nadaj mu ruch; ramiona prowadzą tor.",
    "cuesEn": "Hinge with the kettlebell between the legs. Drive its movement with rapid hip extension; the arms guide the path.",
    "variants": "Wariant jednorącz dodaje kontrolę rotacji; martwy ciąg z kettlem ćwiczy wzorzec przy mniejszej prędkości.",
    "variantsEn": "A one-arm version adds rotation control; a kettlebell deadlift practices the pattern at lower speed.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/391/swing/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-standing-ankle-mobilization",
    "name": "Mobilizacja stawu skokowego z rotacją bioder",
    "nameEn": "Standing ankle mobilization with hip rotation",
    "category": "strength",
    "metric": "reps",
    "types": [
      "mobility",
      "stability"
    ],
    "shares": [],
    "video": "",
    "notes": "Kontrolowany ruch nad stopą podporową przy podparciu ściany.",
    "notesEn": "Controlled motion over the stance foot with wall support.",
    "cues": "Oprzyj dłonie na ścianie, unieś jedną nogę i prowadź ją łagodnie na boki. Piętę nogi podporowej utrzymaj na podłożu.",
    "cuesEn": "Place hands on a wall, raise one leg, and move it gently side to side. Keep the stance heel grounded.",
    "variants": "Mniejszy ruch wolnej nogi ułatwia kontrolę; większy zmienia rotację bioder nad stopą podporową.",
    "variantsEn": "A smaller free-leg motion makes control easier; a larger one changes hip rotation above the stance foot.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/224/standing-ankle-mobilization/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-box-jump",
    "name": "Skok obunóż na skrzynię",
    "nameEn": "Box jump",
    "category": "strength",
    "metric": "reps",
    "types": [
      "power"
    ],
    "shares": [
      {
        "muscle": "quads",
        "weight": 0.4
      },
      {
        "muscle": "glutes",
        "weight": 0.35
      },
      {
        "muscle": "calves",
        "weight": 0.25
      }
    ],
    "video": "",
    "notes": "Odbicie i lądowanie na podwyższeniu. Wysokość skrzyni nie jest pomiarem wysokości wyskoku.",
    "notesEn": "Takeoff and landing onto an elevated surface. Box height is not a measure of jump height.",
    "cues": "Odbij się i wyląduj całą stopą na stabilnej skrzyni. Zejdź krokiem i przygotuj kolejną próbę.",
    "cuesEn": "Jump and land with whole feet on a sturdy box. Step down and reset for the next effort.",
    "variants": "Niższa skrzynia ułatwia naukę; skok na podłodze zachowuje odbicie, ale zmienia warunki lądowania.",
    "variantsEn": "A lower box makes learning easier; a floor jump retains takeoff while changing landing conditions.",
    "sourceUrls": [
      "https://www.nasm.org/resource-center/exercise-library/box-jumps"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-pallof-press",
    "name": "Pallof press: wyprost ramion przeciw rotacji",
    "nameEn": "Pallof press",
    "category": "strength",
    "metric": "reps",
    "types": [
      "stability"
    ],
    "shares": [
      {
        "muscle": "obliques",
        "weight": 0.65
      },
      {
        "muscle": "abs",
        "weight": 0.35
      }
    ],
    "video": "",
    "notes": "Przeciwdziałanie rotacji tułowia. Opór gumy zapisuj opisowo; obciążenie stosu nie określa całego zadania.",
    "notesEn": "Resisting trunk rotation. Describe band resistance; stack load does not define the entire task.",
    "cues": "Stań bokiem do zaczepu i wyprostuj ręce z wysokości klatki. Utrzymaj miednicę i barki bez obracania.",
    "cuesEn": "Stand side-on to the anchor and extend hands from chest height. Keep pelvis and shoulders from rotating.",
    "variants": "Dłuższe utrzymanie zwiększa czas kontroli; wykrok lub półklęk zmienia podparcie i równowagę.",
    "variantsEn": "A longer hold adds control time; a split stance or half kneeling changes support and balance.",
    "sourceUrls": [
      "https://www.catalystathletics.com/exercise/526/Pallof-Press/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-prone-scapular-series",
    "name": "Unoszenie ramion w leżeniu przodem: I–Y–T–W",
    "nameEn": "Prone scapular raises: I–Y–T–W",
    "category": "strength",
    "metric": "reps",
    "types": [
      "stability",
      "strength"
    ],
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
    "video": "",
    "notes": "Kontrola łopatek przeciw grawitacji, odrębna od mobilności barków w leżeniu tyłem.",
    "notesEn": "Scapular control against gravity, distinct from supine shoulder mobility.",
    "cues": "Leżąc na brzuchu, lekko unieś ręce w wybranej formacji. Nie zastępuj ruchu ramion wysokim uniesieniem tułowia.",
    "cuesEn": "Lying prone, lift arms slightly in the chosen formation. Avoid substituting a large trunk lift for arm movement.",
    "variants": "Ustawienie I, Y, T lub W zmienia kierunek pracy barku i łopatki; krótsza pauza ogranicza czas utrzymania.",
    "variantsEn": "I, Y, T, or W positioning changes shoulder and scapular work direction; a shorter pause reduces hold time.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/249/prone-scapular-shoulder-stabilization-series-i-y-t-w-o-formation/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-cable-shoulder-external-rotation",
    "name": "Rotacja zewnętrzna barku z linką",
    "nameEn": "Cable shoulder external rotation",
    "category": "strength",
    "metric": "kg",
    "types": [
      "strength",
      "stability"
    ],
    "shares": [
      {
        "muscle": "shoulders",
        "weight": 1
      }
    ],
    "video": "",
    "notes": "Praca rotatorów zewnętrznych; mapa zapisuje je wspólnie w grupie barków.",
    "notesEn": "External-rotator work; the map records them in the broader shoulder group.",
    "cues": "Trzymaj łokieć przy boku i obracaj przedramię na zewnątrz. Opuść opór spokojnie, bez skręcania tułowia.",
    "cuesEn": "Keep the elbow beside the body and rotate the forearm outward. Return smoothly without trunk rotation.",
    "variants": "Guma zmienia profil oporu; łokieć uniesiony do boku tworzy inne zadanie barku i wymaga osobnej kontroli.",
    "variantsEn": "A band changes the resistance profile; raising the elbow sideways creates a different shoulder task requiring separate control.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/352/rotator-cuff-external-rotation/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-suitcase-carry",
    "name": "Spacer z ciężarem po jednej stronie",
    "nameEn": "Suitcase carry",
    "category": "strength",
    "metric": "meters",
    "types": [
      "strength",
      "stability"
    ],
    "shares": [
      {
        "muscle": "obliques",
        "weight": 0.45
      },
      {
        "muscle": "forearms",
        "weight": 0.35
      },
      {
        "muscle": "upper_back",
        "weight": 0.1
      },
      {
        "muscle": "abs",
        "weight": 0.1
      }
    ],
    "video": "",
    "notes": "Chwyt i przeciwdziałanie zgięciu bocznemu w chodzie. Masę ciężaru zapisuj w uwagach; sumuj metry obu stron.",
    "notesEn": "Grip and resisting lateral trunk bend during walking. Record load in notes; sum distance across both sides.",
    "cues": "Idź z ciężarem przy jednym boku, utrzymując barki i miednicę możliwie równo. Powtórz z drugą ręką.",
    "cuesEn": "Walk with a weight at one side, keeping shoulders and pelvis level. Repeat with the other hand.",
    "variants": "Dwa ciężary zmieniają asymetrię; pozycja rack przenosi obciążenie wyżej i zmienia wymagania barku.",
    "variantsEn": "Two weights change the asymmetry; a rack position places load higher and changes shoulder demands.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/358/suitcase-carry/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  },
  {
    "id": "v4-supine-hip-rotator-stretch",
    "name": "Rozciąganie pośladka w leżeniu: noga założona",
    "nameEn": "Supine hip-rotator stretch",
    "category": "strength",
    "metric": "minutes",
    "types": [
      "stretching"
    ],
    "shares": [],
    "video": "",
    "notes": "Zakres rotacji biodra przy podpartym tułowiu. Sumuj czas obu stron.",
    "notesEn": "Hip-rotation range with the trunk supported. Sum duration across both sides.",
    "cues": "Leżąc, oprzyj jedną stopę na podwyższeniu i połóż kostkę drugiej nogi na jej udzie. Wybierz wygodny zakres.",
    "cuesEn": "Lying down, place one foot on a support and rest the opposite ankle on that thigh. Choose a comfortable range.",
    "variants": "Wysokość podparcia zmienia kąt biodra; przyciągnięcie nogi podporowej zmienia intensywność rozciągania.",
    "variantsEn": "Support height changes hip angle; bringing the supported leg closer changes stretch intensity.",
    "sourceUrls": [
      "https://www.acefitness.org/resources/everyone/exercise-library/148/supine-90-90-hip-rotator-stretch/"
    ],
    "provenance": "Biblioteka Trainleaf · źródło sprawdzone 2026-10-03",
    "prescription": ""
  }
];
export const catalogTypeMap:Record<string,ExerciseType[]>={
  "catalog-back-squat": [
    "strength"
  ],
  "catalog-half-squat": [
    "strength"
  ],
  "catalog-quarter-box-squat": [
    "strength"
  ],
  "catalog-dumbbell-goblet-squat": [
    "strength"
  ],
  "catalog-bulgarian-split-squat": [
    "strength"
  ],
  "catalog-barbell-bulgarian-split-squat": [
    "strength"
  ],
  "catalog-dumbbell-split-squat": [
    "strength"
  ],
  "catalog-barbell-forward-lunge": [
    "strength"
  ],
  "catalog-dumbbell-forward-to-reverse-lunge": [
    "strength"
  ],
  "catalog-single-leg-landmine-squat": [
    "strength"
  ],
  "catalog-conventional-deadlift": [
    "strength"
  ],
  "catalog-trap-bar-deadlift": [
    "strength"
  ],
  "catalog-kettlebell-deadlift": [
    "strength"
  ],
  "catalog-single-leg-deadlift": [
    "strength"
  ],
  "catalog-dumbbell-single-leg-deadlift": [
    "strength"
  ],
  "catalog-barbell-single-leg-deadlift": [
    "strength"
  ],
  "catalog-hip-thrust": [
    "strength"
  ],
  "catalog-single-leg-barbell-hip-thrust": [
    "strength"
  ],
  "catalog-banded-single-leg-hip-thrust": [
    "strength"
  ],
  "catalog-hamstring-leg-curl": [
    "strength"
  ],
  "catalog-stability-ball-leg-curl": [
    "strength"
  ],
  "catalog-band-assisted-nordic-curl": [
    "strength"
  ],
  "catalog-machine-knee-extension": [
    "strength"
  ],
  "catalog-machine-hip-adduction": [
    "strength"
  ],
  "catalog-machine-hip-abduction": [
    "strength"
  ],
  "catalog-weighted-single-leg-calf-raise": [
    "strength"
  ],
  "catalog-barbell-calf-raise": [
    "strength"
  ],
  "catalog-barbell-bench-press": [
    "strength"
  ],
  "catalog-dumbbell-bench-press": [
    "strength"
  ],
  "catalog-single-arm-dumbbell-bench-press": [
    "strength"
  ],
  "catalog-push-up": [
    "strength"
  ],
  "catalog-plyometric-push-up": [
    "power"
  ],
  "catalog-landmine-shoulder-press": [
    "strength"
  ],
  "catalog-explosive-single-arm-landmine-press": [
    "power"
  ],
  "catalog-kneeling-single-arm-landmine-press": [
    "strength"
  ],
  "catalog-barbell-bent-over-row": [
    "strength"
  ],
  "catalog-single-arm-dumbbell-row": [
    "strength"
  ],
  "catalog-chin-up": [
    "strength"
  ],
  "catalog-eccentric-pull-up": [
    "strength"
  ],
  "catalog-lat-pulldown": [
    "strength"
  ],
  "catalog-suspension-row": [
    "strength"
  ],
  "catalog-scapular-pull-up": [
    "strength"
  ],
  "catalog-cable-hip-flexion": [
    "strength"
  ],
  "catalog-ghd-hip-extension": [
    "strength"
  ],
  "catalog-standing-cable-rotation": [
    "strength"
  ],
  "catalog-wall-drill-single-exchange": [
    "speed"
  ],
  "catalog-wall-drill-double-exchange": [
    "speed"
  ],
  "catalog-wall-drill-triple-exchange": [
    "speed"
  ],
  "catalog-wall-drill-lift-and-load-into-double-exchange": [
    "speed"
  ],
  "catalog-half-kneeling-acceleration-start": [
    "speed"
  ],
  "catalog-half-kneeling-lateral-acceleration-start": [
    "speed"
  ],
  "catalog-inverted-half-kneeling-lateral-start": [
    "speed"
  ],
  "catalog-two-point-acceleration-start": [
    "speed"
  ],
  "catalog-straight-line-sprint": [
    "speed"
  ],
  "catalog-curved-sprint": [
    "speed",
    "agility"
  ],
  "catalog-tempo-run-intervals": [
    "conditioning"
  ],
  "catalog-sprint-after-a-change-of-direction": [
    "speed",
    "agility"
  ],
  "catalog-two-foot-a-skip": [
    "speed"
  ],
  "catalog-ankle-dribble": [
    "speed"
  ],
  "catalog-scissor-into-knee-dribble": [
    "speed"
  ],
  "catalog-dead-bug": [
    "stability"
  ],
  "catalog-side-plank": [
    "stability"
  ],
  "catalog-copenhagen-plank": [
    "strength",
    "stability"
  ],
  "catalog-bear-crawl": [
    "stability"
  ],
  "catalog-plank-with-leg-lift": [
    "stability"
  ],
  "catalog-face-pull": [
    "strength"
  ],
  "catalog-wrist-movement-sequence": [
    "mobility"
  ],
  "catalog-hip-airplane": [
    "mobility",
    "stability"
  ],
  "catalog-counterbalanced-cossack-squat": [
    "mobility"
  ],
  "catalog-supine-shoulder-external-and-internal-rotation": [
    "mobility"
  ],
  "catalog-easy-throwing": [
    "throwing"
  ],
  "catalog-reaction-passes": [
    "throwing"
  ],
  "catalog-flat-forehand-and-backhand": [
    "throwing"
  ],
  "catalog-gentle-around-forehand-and-backhand": [
    "throwing"
  ],
  "catalog-gentle-inside-forehand-and-backhand": [
    "throwing"
  ],
  "catalog-leading-forehand-and-backhand-pass": [
    "throwing"
  ],
  "catalog-wide-pivot-around-forehand-and-backhand": [
    "throwing"
  ],
  "catalog-wide-pivot-inside-forehand-and-backhand": [
    "throwing"
  ],
  "catalog-forehand-pivot-progression": [
    "throwing"
  ],
  "catalog-backhand-without-a-pivot": [
    "throwing"
  ],
  "catalog-forehand-step-back": [
    "throwing"
  ],
  "catalog-backhand-torso-rotation-drill": [
    "throwing"
  ],
  "catalog-forehand-cross-step": [
    "throwing"
  ],
  "catalog-backhand-pop-wrist-pass": [
    "throwing"
  ],
  "catalog-forehand-snap-back": [
    "throwing"
  ],
  "catalog-backhand-snap-back": [
    "throwing"
  ],
  "catalog-steep-inside-out-forehand-balance-drill": [
    "throwing"
  ],
  "catalog-backhand-torso-rotation-progression": [
    "throwing"
  ],
  "catalog-single-leg-forehand": [
    "throwing"
  ],
  "catalog-backhand-pivot-progression": [
    "throwing"
  ],
  "catalog-forehand-extended-wrist-hold": [
    "throwing"
  ],
  "catalog-backhand-extended-wrist-hold": [
    "throwing"
  ],
  "catalog-backhand-compass": [
    "throwing"
  ],
  "catalog-forehand-compass": [
    "throwing"
  ],
  "catalog-scoober": [
    "throwing"
  ],
  "catalog-left-handed-scoober": [
    "throwing"
  ],
  "catalog-hammer": [
    "throwing"
  ],
  "catalog-thumber": [
    "throwing"
  ],
  "catalog-easy-aerobic-run": [
    "conditioning"
  ],
  "catalog-bike-steady": [
    "conditioning"
  ],
  "catalog-bike-intervals": [
    "conditioning"
  ],
  "catalog-rower-steady": [
    "conditioning"
  ],
  "catalog-rower-intervals": [
    "conditioning"
  ],
  "catalog-tempo-100m": [
    "conditioning"
  ],
  "catalog-repeated-sprint-conditioning": [
    "conditioning"
  ],
  "catalog-intermittent-shuttle-conditioning": [
    "conditioning"
  ],
  "catalog-ski-erg-conditioning": [
    "conditioning"
  ],
  "catalog-jump-rope-conditioning": [
    "conditioning"
  ],
  "squat": [
    "strength"
  ],
  "rdl": [
    "strength"
  ],
  "lunge": [
    "strength"
  ],
  "lateral": [
    "strength"
  ],
  "calf": [
    "strength"
  ],
  "pushup": [
    "strength"
  ],
  "row": [
    "strength"
  ],
  "press": [
    "strength"
  ],
  "easy": [
    "conditioning"
  ],
  "accel": [
    "speed"
  ],
  "shuttle": [
    "agility",
    "conditioning"
  ],
  "cut": [
    "agility"
  ],
  "shuffle": [
    "agility"
  ],
  "backhand": [
    "throwing"
  ],
  "forehand": [
    "throwing"
  ],
  "alternating": [
    "throwing"
  ],
  "pivot": [
    "throwing"
  ],
  "moving": [
    "throwing"
  ],
  "huck": [
    "throwing"
  ],
  "rope": [
    "conditioning"
  ],
  "plank": [
    "stability"
  ],
  "sideplank": [
    "stability"
  ],
  "bike": [
    "conditioning"
  ],
  "walk": [
    "conditioning"
  ]
};
