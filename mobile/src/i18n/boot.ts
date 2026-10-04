import { languageStore } from './index';
// Reads the saved language (English when nothing valid is stored) before the first render and before the database opens.
languageStore();
