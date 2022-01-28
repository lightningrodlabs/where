import { Orchestrator, Config, InstallAgentsHapps } from "@holochain/tryorama";
import path from "path";
import * as _ from "lodash";
import {
  RETRY_DELAY,
  RETRY_COUNT,
  localConductorConfig,
  networkedConductorConfig,
  installAgents,
  awaitIntegration,
  delay,
} from "./common";
import { Base64 } from "js-base64";
import { HereEntry } from "@where/elements";

function serializeHash(hash: Uint8Array): string {
  return `u${Base64.fromUint8Array(hash, true)}`;
}
export default async (orchestrator) => {
  orchestrator.registerScenario("where basic tests", async (s, t) => {
    // Declare two players using the previously specified config, nicknaming them "alice" and "bob"
    // note that the first argument to players is just an array conductor configs that that will
    // be used to spin up the conductor processes which are returned in a matching array.
    const [a_and_b_conductor] = await s.players([localConductorConfig]);

    let template1 = {
      name: "Map",
      surface:
        "{\
        'url': '%ImageURL%',\
        'box': \"{'box':{'left':100,'top':10,'width':100,'height':50}\"\
      'title':'%String%'\
      }",
    };

    let space1 = {
      name: "mountain map",
      origin: "placeholder",
      /*      dimensionality: {
        type: "orthogonal",
        coords: {x: "integer", y:"integer"},
        range: {x: {min: 0, max: 1024}, y:{min:0, max: 1024}}
        },*/
      surface:
        "{\
        'url': 'https://mountain-map-images.com/cotopaxi',\
      'title':'mountain map'\
      }",
      meta: {},
    };

    a_and_b_conductor.setSignalHandler((signal) => {
      console.log("Received Signal:", signal);
      if (signal.data.payload.message.type == "NewSpace") {
        t.deepEqual(signal.data.payload.message.content, space1);
      } else {
        t.deepEqual(signal.data.payload.message.content[1], template1);
      }
    });

    // install your happs into the conductors and destructuring the returned happ data using the same
    // array structure as you created in your installation array.
    let [alice_where_happ /*, bobbo_where_happ*/] = await installAgents(
      a_and_b_conductor,
      ["alice" /*, 'bobbo'*/]
    );
    const [alice_where] = alice_where_happ.cells;
    //    const [bobbo_where] = bobbo_where_happ.cells

    // Create template

    const template1_eh64 = await alice_where.call(
      "hc_zome_where",
      "create_template",
      template1
    );
    t.ok(template1_eh64);
    console.log("template1_eh64", template1_eh64);

    const templates = await alice_where.call(
      "hc_zome_where",
      "get_templates",
      null
    );
    console.log(templates);
    t.deepEqual(templates, [{ hash: template1_eh64, content: template1 }]);

    // Create a space
    space1.origin = template1_eh64;

    const space1_hash = await alice_where.call(
      "hc_zome_where",
      "create_space",
      space1
    );
    t.ok(space1_hash);
    console.log("space1_hash", space1_hash);

    const spaces = await alice_where.call("hc_zome_where", "get_spaces", null);
    console.log(spaces);
    t.deepEqual(spaces, [{ hash: space1_hash, content: space1 }]);

    // Create a session
    const nextSession = {
      spaceEh: space1_hash,
      name: "first",
    };
    const session_eh = await alice_where.call(
      "hc_zome_where",
      "create_next_session",
      nextSession
    );
    t.ok(session_eh);
    console.log("session_eh", session_eh);

    // Create a Here
    let here1: HereEntry = {
      value: JSON.stringify({ x: 12354, y: 725 }),
      sessionEh: session_eh,
      meta: { tags: JSON.stringify(["personal summit", "feeling good"]) },
    };
    const addHereInput = {
      spaceEh: space1_hash,
      sessionIndex: 0,
      value: here1.value,
      meta: here1.meta,
    };
    const here1_link_hh = await alice_where.call(
      "hc_zome_where",
      "add_here",
      addHereInput
    );
    t.ok(here1_link_hh);
    console.log(here1_link_hh);

    let heres = await alice_where.call(
      "hc_zome_where",
      "get_heres",
      session_eh
    );
    t.ok(heres);
    t.deepEqual(heres[0].entry, here1);
    t.deepEqual(heres[0].linkHh, here1_link_hh);
    t.deepEqual(heres[0].author, serializeHash(alice_where.cellId[1]));

    await alice_where.call("hc_zome_where", "delete_here", here1_link_hh);

    heres = await alice_where.call("hc_zome_where", "get_heres", session_eh);
    t.ok(heres);
    t.equal(heres.length, 0);
  });
};
