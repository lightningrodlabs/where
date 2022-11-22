/** */
import {HappDef} from "@ddd-qc/dna-client";
import {WhereDvm} from "./where.dvm";
import {LudothequeDvm} from "./ludotheque.dvm";

export const WhereHappDef: HappDef = {
  id: "where",
  dvmDefs: [
    ["where", WhereDvm],
    ["ludotheque", LudothequeDvm],
  ]
}
