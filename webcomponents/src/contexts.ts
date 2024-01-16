import {createContext} from "@lit/context";
import {WeServices} from "@lightningrodlabs/we-applet";

export const weClientContext = createContext<WeServices>('we_client');

