import {ZomeBridge} from "@ddd-qc/dna-client";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {PlaysetEntry} from "./ludotheque.bindings";
import {CellId, HoloHashed} from "@holochain/client";


/**
 *
 */
export class LudothequeBridge extends ZomeBridge {
  zomeName = "where_ludotheque"

  async getPlayset(eh: EntryHashB64): Promise<PlaysetEntry> {
    return this.call('get_playset', eh);
  }

  async createPlayset(entry: PlaysetEntry): Promise<EntryHashB64> {
    return this.call('create_playset', entry);
  }

  async getAllPlaysets(): Promise<Array<HoloHashed<PlaysetEntry>>> {
    return this.call('get_all_playsets', null);
  }

  async exportPlayset(playsetEh: EntryHashB64, destinationCellId: CellId) : Promise<void> {
    return this.call('export_playset', {playsetEh, destinationCellId});
  }

}
