/** */
import {HvmDef} from "@ddd-qc/lit-happ";
import {WhereDvm} from "./where.dvm";
import {LudothequeDvm} from "./ludotheque.dvm";
import {createContext} from "@lit-labs/context";
import {EntryHash} from "@holochain/client";

export const DEFAULT_WHERE_DEF: HvmDef = {
  id: "where",
  dvmDefs: [{ctor: WhereDvm, isClonable: false}, {ctor:LudothequeDvm, isClonable: true}],
}


export const DEFAULT_LUDOTHEQUE_DEF: HvmDef = {
  id: "ludotheque",
  dvmDefs: [{ctor:LudothequeDvm, isClonable: false}],
}

export const filesAppletContext = createContext<EntryHash>('we-applet/Files');

export const threadsAppletContext = createContext<EntryHash>('we-applet/Threads');
