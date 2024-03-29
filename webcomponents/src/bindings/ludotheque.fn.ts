/* This file is generated by zits. Do not edit manually */

import {ZomeName, FunctionName} from '@holochain/client';


/** Array of all zome function names in "ludotheque" */
export const ludothequeFunctionNames: FunctionName[] = [
	"entry_defs", 
	"get_zome_info", 
	"get_dna_info",
	"export_playset",
	"create_playset",
	"get_playset",
	"get_all_playsets",];


/** Generate tuple array of function names with given zomeName */
export function generateLudothequeZomeFunctionsArray(zomeName: ZomeName): [ZomeName, FunctionName][] {
   const fns: [ZomeName, FunctionName][] = [];
   for (const fn of ludothequeFunctionNames) {
      fns.push([zomeName, fn]);
   }
   return fns;
}


/** Tuple array of all zome function names with default zome name "zLudotheque" */
export const ludothequeZomeFunctions: [ZomeName, FunctionName][] = generateLudothequeZomeFunctionsArray("zLudotheque");
