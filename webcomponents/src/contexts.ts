import {createContext} from "@lit/context";
import {WeServicesEx} from "@ddd-qc/we-utils";

export const weClientContext = createContext<WeServicesEx>('we_client');

