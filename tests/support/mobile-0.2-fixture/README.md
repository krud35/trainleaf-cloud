# Frozen Trainleaf 0.2.0 database fixture

`released-v5.sqlite` is a real SQLite database created through the frozen 0.2.0 repository and its original migrations, then populated using its public APIs. It was not reconstructed by dropping columns from a newer database. It contains synthetic profile, workout, actual load, exercise, template, period, wellness, goal and raw draft records. `backup-v3.json` was exported by that same old repository.

Every old TypeScript module loaded during generation was checked against the SHA256 values in the preserved 0.2.0 audit manifest. `provenance.json` records those files, the source manifest and source APK hashes, migration hashes, fixture hashes, real generation time and the deterministic fixture clock. The original audit artifact was not modified. Fixture creation used the local dependency runtime; this is a data migration test, not a claim of native device installation or a reproducible APK build.

The mobile data tests verify fixture hashes, copy the SQLite file to a temporary directory, and exercise upgrades from released DB5 and an events-only DB6 preview. They test rollback, unchanged original rows and raw drafts, preserved actual load and revisions, and repeated opening at DB7. Tests are self-contained and require no sibling `outputs` directory. Keep these fixture files together in source audit exports.
