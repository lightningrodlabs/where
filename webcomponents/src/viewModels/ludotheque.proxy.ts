import {ZomeProxy} from "@ddd-qc/lit-happ";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {Playset} from "./ludotheque.bindings";
import {CellId} from "@holochain/client";
import {HoloHashedB64} from "../utils";


export interface ExportPlaysetInput {
  destinationCellId: CellId
  playsetEh: EntryHashB64
}

/**
 *
 */
export class LudothequeProxy extends ZomeProxy {
  static readonly DEFAULT_ZOME_NAME = "zLudotheque"

  async getPlayset(eh: EntryHashB64): Promise<Playset> {
    return this.call('get_playset', eh);
  }

  async createPlayset(entry: Playset): Promise<EntryHashB64> {
    return this.call('create_playset', entry);
  }

  async getAllPlaysets(): Promise<Array<HoloHashedB64<Playset>>> {
    return this.call('get_all_playsets', null);
  }

  async exportPlayset(input: ExportPlaysetInput) : Promise<EntryHashB64[]> {
    // playsetEh: EntryHashB64, destinationCellId: CellId
    return this.call('export_playset', input);
  }

}
