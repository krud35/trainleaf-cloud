# Frozen Trainleaf 0.4.0 database fixture

`released-v7.sqlite` (schema 7) and `backup-v4.json` (backup format 4) were written by the released 0.4.0 data layer
(commit in `provenance.json`) through its public repository API, before any change of 0.4.1. They were not produced by
downgrading a newer database. `build-fixture.mjs` is kept for provenance; running it on newer sources fails on purpose.

Contents (synthetic): a profile, seven workouts (performed with a saved load, performed without a survey, skipped,
planned with and without expected ratings, one deleted), two wellbeing entries, one readiness-v1 reference with confirmed
rest days, a period, an event, a goal and a raw draft.

`tests/mobile-quiz-data.test.mjs` verifies the hashes, copies the database to a temporary directory and checks the
migration 7 -> 8 (atomic, additive, rows unchanged) and the import of the older backup.
