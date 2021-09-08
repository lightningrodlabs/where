import { Orchestrator } from '@holochain/tryorama'

let orchestrator = new Orchestrator()
require('./where')(orchestrator)
orchestrator.run()
/*
orchestrator = new Orchestrator()
require('./profile')(orchestrator)
orchestrator.run()
*/
