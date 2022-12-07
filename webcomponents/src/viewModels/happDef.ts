/** */
import {HvmDef} from "@ddd-qc/lit-happ";
import {WhereDvm} from "./where.dvm";
import {LudothequeDvm} from "./ludotheque.dvm";

export const DEFAULT_WHERE_DEF: HvmDef = {
  id: "where",
  dvmDefs: [{ctor: WhereDvm, isClonable: false}, {ctor:LudothequeDvm, isClonable: true}],
}


export const DEFAULT_LUDOTHEQUE_DEF: HvmDef = {
  id: "ludotheque",
  dvmDefs: [{ctor:LudothequeDvm, isClonable: false}],
}
