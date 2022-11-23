import {ZomeProxy} from "@ddd-qc/dna-client";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {PlaysetEntry} from "./ludotheque.bindings";
import {CellId} from "@holochain/client";
import {HoloHashedB64} from "../utils";


/**
 *
 */
export class LudothequeProxy extends ZomeProxy {
  zomeName = "zLudotheque"

  async getPlayset(eh: EntryHashB64): Promise<PlaysetEntry> {
    return this.call('get_playset', eh, null);
  }

  async createPlayset(entry: PlaysetEntry): Promise<EntryHashB64> {
    return this.call('create_playset', entry, null);
  }

  async getAllPlaysets(): Promise<Array<HoloHashedB64<PlaysetEntry>>> {
    return this.call('get_all_playsets', null, null);
  }

  async exportPlayset(playsetEh: EntryHashB64, destinationCellId: CellId) : Promise<void> {
    return this.call('export_playset', {playsetEh, destinationCellId}, null);
  }

}
