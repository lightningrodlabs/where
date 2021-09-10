import { Orchestrator } from "@holochain/tryorama";
import where from "./where";

let orchestrator = new Orchestrator();
where(orchestrator);
orchestrator.run();
/*
orchestrator = new Orchestrator()
require('./profile')(orchestrator)
orchestrator.run()
*/
