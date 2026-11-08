import * as locales from './generated/locales.js';
import * as templates_app_fr_fr from './generated/fr-fr.js';
import {templates as templates_webcomp} from '@where/elements';

import {configureLocalization} from "@lit/localize";

/** Merge templates */
let templates_fr_fr: any = {templates: {...templates_app_fr_fr.templates, ...templates_webcomp}};
//let templates: any = templates_fr_fr!;
// console.log({templates_app_fr_fr})
// console.log({templates_webcomp_fr_fr})
// console.log({templates_fr_fr})

/** Setup templates */
export const localizedTemplates = new Map([
  ['fr-fr', templates_fr_fr],
]);


/** Do configuration */
export const {getLocale, setLocale} = configureLocalization({
  sourceLocale: locales.sourceLocale,
  targetLocales: locales.targetLocales,
  loadLocale: async (locale) => localizedTemplates.get(locale),
});
