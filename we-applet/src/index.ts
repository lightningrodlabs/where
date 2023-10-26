import {setup} from "@ddd-qc/we-utils";
import {appletServices, whereNames} from "./appletServices/appletServices";
import {createWhereApplet} from "./createWhereApplet";
import {createWhereWeServicesMock} from "./createWhereWeServicesMock";


export default setupWhereApplet;

/** */
async function setupWhereApplet() {
  return setup(appletServices, createWhereApplet, whereNames, createWhereWeServicesMock);
}
