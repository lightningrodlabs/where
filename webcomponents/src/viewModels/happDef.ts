/** */
import {HvmDef} from "@ddd-qc/dna-client";
import {WhereDvm} from "./where.dvm";
import {LudothequeDvm} from "./ludotheque.dvm";

export const DEFAULT_WHERE_DEF: HvmDef = {
  id: "where",
  dvmDefs: [WhereDvm, LudothequeDvm],
}


export const DEFAULT_LUDOTHEQUE_DEF: HvmDef = {
  id: "ludotheque",
  dvmDefs: [LudothequeDvm],
}
