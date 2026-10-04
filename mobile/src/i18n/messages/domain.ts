import { defineMessages } from '../core';

/** Labels for stored enum values. The stored IDs never change with the language. */
export const sport = defineMessages({
  en: { ultimate: 'Ultimate frisbee', running: 'Running', cycling: 'Cycling', strength: 'Strength training', swimming: 'Swimming', other: 'Other sport', football: 'Football', basketball: 'Basketball', volleyball: 'Volleyball', handball: 'Handball', rugby: 'Rugby', tennis: 'Tennis', badminton: 'Badminton', squash: 'Squash', 'table-tennis': 'Table tennis', triathlon: 'Triathlon', rowing: 'Rowing', 'martial-arts': 'Martial arts', climbing: 'Climbing', 'winter-sports': 'Winter sports', calisthenics: 'Calisthenics', yoga: 'Yoga', pilates: 'Pilates' },
  pl: { ultimate: 'Ultimate frisbee', running: 'Bieganie', cycling: 'Kolarstwo', strength: 'Trening siłowy', swimming: 'Pływanie', other: 'Inny sport', football: 'Piłka nożna', basketball: 'Koszykówka', volleyball: 'Siatkówka', handball: 'Piłka ręczna', rugby: 'Rugby', tennis: 'Tenis', badminton: 'Badminton', squash: 'Squash', 'table-tennis': 'Tenis stołowy', triathlon: 'Triathlon', rowing: 'Wioślarstwo', 'martial-arts': 'Sztuki walki', climbing: 'Wspinaczka', 'winter-sports': 'Sporty zimowe', calisthenics: 'Kalistenika', yoga: 'Joga', pilates: 'Pilates' },
  fr: { ultimate: 'Ultimate frisbee', running: 'Course à pied', cycling: 'Cyclisme', strength: 'Musculation', swimming: 'Natation', other: 'Autre sport', football: 'Football', basketball: 'Basket-ball', volleyball: 'Volley-ball', handball: 'Handball', rugby: 'Rugby', tennis: 'Tennis', badminton: 'Badminton', squash: 'Squash', 'table-tennis': 'Tennis de table', triathlon: 'Triathlon', rowing: 'Aviron', 'martial-arts': 'Arts martiaux', climbing: 'Escalade', 'winter-sports': 'Sports d’hiver', calisthenics: 'Callisthénie', yoga: 'Yoga', pilates: 'Pilates' },
  es: { ultimate: 'Ultimate frisbee', running: 'Carrera', cycling: 'Ciclismo', strength: 'Entrenamiento de fuerza', swimming: 'Natación', other: 'Otro deporte', football: 'Fútbol', basketball: 'Baloncesto', volleyball: 'Voleibol', handball: 'Balonmano', rugby: 'Rugby', tennis: 'Tenis', badminton: 'Bádminton', squash: 'Squash', 'table-tennis': 'Tenis de mesa', triathlon: 'Triatlón', rowing: 'Remo', 'martial-arts': 'Artes marciales', climbing: 'Escalada', 'winter-sports': 'Deportes de invierno', calisthenics: 'Calistenia', yoga: 'Yoga', pilates: 'Pilates' },
});
export const sportGroup = defineMessages({
  en: { team: 'Team sports', racket: 'Racket sports', endurance: 'Endurance', strength: 'Strength and movement', other: 'Other' },
  pl: { team: 'Zespołowe', racket: 'Rakietowe', endurance: 'Wytrzymałościowe', strength: 'Siła i ruch', other: 'Pozostałe' },
  fr: { team: 'Sports collectifs', racket: 'Sports de raquette', endurance: 'Endurance', strength: 'Force et mouvement', other: 'Autres' },
  es: { team: 'Deportes de equipo', racket: 'Deportes de raqueta', endurance: 'Resistencia', strength: 'Fuerza y movimiento', other: 'Otros' },
});
/** Workout kinds. `short_*` fits a calendar tile; `unknown` is a workout without a kind. */
export const trainingType = defineMessages({
  en: { strength: 'Strength', running: 'Running', endurance: 'Endurance', technical: 'Technical', team: 'Team', mental: 'Mental', unknown: 'Not set',
    short_strength: 'Strength', short_running: 'Run', short_endurance: 'Endur.', short_technical: 'Tech.', short_team: 'Team', short_mental: 'Mental', short_unknown: 'Not set' },
  pl: { strength: 'Siłowy', running: 'Biegowy', endurance: 'Wydolnościowy', technical: 'Techniczny', team: 'Drużynowy', mental: 'Mentalny', unknown: 'Nieustalony',
    short_strength: 'Siła', short_running: 'Bieg', short_endurance: 'Wydol.', short_technical: 'Techn.', short_team: 'Druż.', short_mental: 'Mental.', short_unknown: 'Nieust.' },
  fr: { strength: 'Force', running: 'Course', endurance: 'Endurance', technical: 'Technique', team: 'Collectif', mental: 'Mental', unknown: 'Non défini',
    short_strength: 'Force', short_running: 'Course', short_endurance: 'Endur.', short_technical: 'Techn.', short_team: 'Collec.', short_mental: 'Mental', short_unknown: 'N. déf.' },
  es: { strength: 'Fuerza', running: 'Carrera', endurance: 'Resistencia', technical: 'Técnico', team: 'Equipo', mental: 'Mental', unknown: 'Sin definir',
    short_strength: 'Fuerza', short_running: 'Carrera', short_endurance: 'Resist.', short_technical: 'Técn.', short_team: 'Equipo', short_mental: 'Mental', short_unknown: 'Sin def.' },
});
export const muscle = defineMessages({
  en: { quads: 'Quadriceps', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves', chest: 'Chest', shoulders: 'Deltoids', lats: 'Latissimus dorsi', upper_back: 'Upper back', lower_back: 'Spinal erectors', biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms', abs: 'Rectus abdominis', obliques: 'Obliques', adductors: 'Hip adductors', abductors: 'Hip abductors', hip_flexors: 'Hip flexors', back: 'Back · general', arms: 'Arms · general', core: 'Trunk · general' },
  pl: { quads: 'Czworogłowe uda', hamstrings: 'Tył uda', glutes: 'Pośladki', calves: 'Łydki', chest: 'Klatka piersiowa', shoulders: 'Barki', lats: 'Najszersze grzbietu', upper_back: 'Górna część pleców', lower_back: 'Prostowniki grzbietu', biceps: 'Biceps', triceps: 'Triceps', forearms: 'Przedramiona', abs: 'Prosty brzucha', obliques: 'Skośne brzucha', adductors: 'Przywodziciele uda', abductors: 'Odwodziciele biodra', hip_flexors: 'Zginacze biodra', back: 'Plecy · ogólnie', arms: 'Ramiona · ogólnie', core: 'Tułów · ogólnie' },
  fr: { quads: 'Quadriceps', hamstrings: 'Ischio-jambiers', glutes: 'Fessiers', calves: 'Mollets', chest: 'Pectoraux', shoulders: 'Deltoïdes', lats: 'Grand dorsal', upper_back: 'Haut du dos', lower_back: 'Érecteurs du rachis', biceps: 'Biceps', triceps: 'Triceps', forearms: 'Avant-bras', abs: 'Grand droit de l’abdomen', obliques: 'Obliques', adductors: 'Adducteurs de la hanche', abductors: 'Abducteurs de la hanche', hip_flexors: 'Fléchisseurs de la hanche', back: 'Dos · général', arms: 'Bras · général', core: 'Tronc · général' },
  es: { quads: 'Cuádriceps', hamstrings: 'Isquiotibiales', glutes: 'Glúteos', calves: 'Gemelos', chest: 'Pectorales', shoulders: 'Deltoides', lats: 'Dorsal ancho', upper_back: 'Parte alta de la espalda', lower_back: 'Erectores espinales', biceps: 'Bíceps', triceps: 'Tríceps', forearms: 'Antebrazos', abs: 'Recto abdominal', obliques: 'Oblicuos', adductors: 'Aductores de la cadera', abductors: 'Abductores de la cadera', hip_flexors: 'Flexores de la cadera', back: 'Espalda · general', arms: 'Brazos · general', core: 'Tronco · general' },
});
export const section = defineMessages({
  en: { warmup: 'Warm-up', main: 'Main part', cooldown: 'Cool-down', whole: 'Whole workout' },
  pl: { warmup: 'Rozgrzewka', main: 'Część główna', cooldown: 'Cooldown', whole: 'Cały trening' },
  fr: { warmup: 'Échauffement', main: 'Partie principale', cooldown: 'Retour au calme', whole: 'Séance complète' },
  es: { warmup: 'Calentamiento', main: 'Parte principal', cooldown: 'Vuelta a la calma', whole: 'Entrenamiento completo' },
});
/** Units of an exercise. `kg` counts repetitions with a weight entered separately. */
export const metric = defineMessages({
  en: { kg: 'kg·reps', reps: 'reps', meters: 'm', throws: 'throws', minutes: 'min' },
  pl: { kg: 'kg·powt.', reps: 'powt.', meters: 'm', throws: 'rzuty', minutes: 'min' },
  fr: { kg: 'kg·rép.', reps: 'rép.', meters: 'm', throws: 'lancers', minutes: 'min' },
  es: { kg: 'kg·rep.', reps: 'rep.', meters: 'm', throws: 'lanzamientos', minutes: 'min' },
});
export const exerciseCategory = defineMessages({
  en: { strength: 'Strength', running: 'Running', throwing: 'Throwing', conditioning: 'Conditioning' },
  pl: { strength: 'Siłowy', running: 'Biegowy', throwing: 'Rzutowy', conditioning: 'Wydolnościowy' },
  fr: { strength: 'Force', running: 'Course', throwing: 'Lancer', conditioning: 'Condition physique' },
  es: { strength: 'Fuerza', running: 'Carrera', throwing: 'Lanzamiento', conditioning: 'Acondicionamiento' },
});
export const exerciseType = defineMessages({
  en: { strength: 'Strength', power: 'Power', speed: 'Speed', agility: 'Change of direction / agility', conditioning: 'Conditioning', mobility: 'Mobility', stretching: 'Stretching', stability: 'Stability', throwing: 'Throwing technique' },
  pl: { strength: 'Siła', power: 'Moc · power', speed: 'Szybkość', agility: 'Zmiana kierunku / zwinność', conditioning: 'Wydolność', mobility: 'Mobilność', stretching: 'Rozciąganie', stability: 'Stabilizacja', throwing: 'Technika rzutu' },
  fr: { strength: 'Force', power: 'Puissance', speed: 'Vitesse', agility: 'Changement de direction / agilité', conditioning: 'Condition physique', mobility: 'Mobilité', stretching: 'Étirements', stability: 'Stabilité', throwing: 'Technique de lancer' },
  es: { strength: 'Fuerza', power: 'Potencia', speed: 'Velocidad', agility: 'Cambio de dirección / agilidad', conditioning: 'Acondicionamiento', mobility: 'Movilidad', stretching: 'Estiramientos', stability: 'Estabilidad', throwing: 'Técnica de lanzamiento' },
});
export const workoutStatus = defineMessages({
  en: { planned: 'Planned', completed: 'Completed', skipped: 'Skipped', futureCompleted: 'Completed entry with a future date' },
  pl: { planned: 'Zaplanowany', completed: 'Wykonany', skipped: 'Pominięty', futureCompleted: 'Zapis wykonania z przyszłą datą' },
  fr: { planned: 'Planifiée', completed: 'Réalisée', skipped: 'Annulée', futureCompleted: 'Séance réalisée avec une date future' },
  es: { planned: 'Planificado', completed: 'Realizado', skipped: 'Omitido', futureCompleted: 'Registro realizado con fecha futura' },
});
export const eventKind = defineMessages({
  en: { event: 'Event', competition: 'Competition', trip: 'Trip' },
  pl: { event: 'Wydarzenie', competition: 'Zawody', trip: 'Wyjazd' },
  fr: { event: 'Événement', competition: 'Compétition', trip: 'Déplacement' },
  es: { event: 'Evento', competition: 'Competición', trip: 'Viaje' },
});
export const availability = defineMessages({
  en: { available: 'Fully available', limited: 'Limited availability', unavailable: 'Not available' },
  pl: { available: 'Dostępność pełna', limited: 'Dostępność ograniczona', unavailable: 'Brak dostępności' },
  fr: { available: 'Pleinement disponible', limited: 'Disponibilité limitée', unavailable: 'Indisponible' },
  es: { available: 'Disponibilidad total', limited: 'Disponibilidad limitada', unavailable: 'Sin disponibilidad' },
});
export const shortcut = defineMessages({
  en: { history: 'Workout history', library: 'Exercise library', templates: 'Templates', wellness: 'Wellbeing', goals: 'Goals', periods: 'Training periods', backup: 'Backups and export' },
  pl: { history: 'Historia treningów', library: 'Baza ćwiczeń', templates: 'Szablony', wellness: 'Samopoczucie', goals: 'Cele', periods: 'Okresy treningowe', backup: 'Kopie i eksport' },
  fr: { history: 'Historique des séances', library: 'Bibliothèque d’exercices', templates: 'Modèles', wellness: 'Bien-être', goals: 'Objectifs', periods: 'Périodes d’entraînement', backup: 'Sauvegardes et export' },
  es: { history: 'Historial de entrenamientos', library: 'Biblioteca de ejercicios', templates: 'Plantillas', wellness: 'Bienestar', goals: 'Objetivos', periods: 'Periodos de entrenamiento', backup: 'Copias y exportación' },
});
