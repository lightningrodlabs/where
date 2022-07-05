
import { createContext } from "@lit-labs/context";
import { WhereStore } from "./where.store";
import {LudothequeStore} from "./ludotheque.store";

export const whereContext = createContext<WhereStore>('where/service');

export const ludothequeContext = createContext<LudothequeStore>('where/service');