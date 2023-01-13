/* This file is generated by zits. Do not edit manually */

import {ZomeName, FunctionName} from '@holochain/client';


/** Array of all zome function names in "playset" */
export const playsetFunctionNames: FunctionName[] = [
	"entry_defs",
	"export_piece",
	"export_space",
	"get_inventory",
	"import_piece",
	"create_emoji_group",
	"get_emoji_group",
	"get_all_emoji_groups",
	"create_space",
	"get_space",
	"get_spaces",
	"create_svg_marker",
	"get_svg_marker",
	"get_svg_markers",
	"create_template",
	"get_template",
	"get_templates",];


/** Generate tuple array of function names with given zomeName */
export function generatePlaysetZomeFunctionsArray(zomeName: ZomeName): [ZomeName, FunctionName][] {
   let fns: [ZomeName, FunctionName][] = [];
   for (const fn of playsetFunctionNames) {
      fns.push([zomeName, fn]);
   }
   return fns;
}


/** Tuple array of all zome function names with default zome name "zPlayset" */
export const playsetZomeFunctions: [ZomeName, FunctionName][] = generatePlaysetZomeFunctionsArray("zPlayset");
