import * as locales from './generated/locales.js';
import * as templates_fr_fr from './generated/fr-fr.js';
import {configureLocalization} from "@lit/localize";

let templates: any = templates_fr_fr!;
export const localizedTemplates = new Map([
  ['fr-fr', templates],
]);

export const {getLocale, setLocale} = configureLocalization({
  sourceLocale: locales.sourceLocale,
  targetLocales: locales.targetLocales,
  loadLocale: async (locale) => localizedTemplates.get(locale),
});
