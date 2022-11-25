/** */
import {HappDef} from "@ddd-qc/dna-client";
import {WhereDvm} from "./where.dvm";
import {LudothequeDvm} from "./ludotheque.dvm";

export const whereHappDef: HappDef = {
  id: "where",
  dvmDefs: [WhereDvm, LudothequeDvm],
}


export const ludothequeHappDef: HappDef = {
  id: "ludotheque",
  dvmDefs: [LudothequeDvm],
}
