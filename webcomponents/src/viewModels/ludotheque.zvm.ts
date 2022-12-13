import {Dictionary, EntryHashB64} from '@holochain-open-dev/core-types';
import {CellId} from "@holochain/client";
import {Playset} from "./ludotheque.bindings";
import {LudothequeProxy} from "./ludotheque.proxy";
import {ZomeViewModel} from "@ddd-qc/lit-happ";


/** */
export interface LudothequePerspective {
  playsets: Dictionary<Playset>;
}


/**
 *
 */
export class LudothequeZvm extends ZomeViewModel {

  static readonly ZOME_PROXY = LudothequeProxy;
  get zomeProxy(): LudothequeProxy {return this._zomeProxy as LudothequeProxy;}

  /* */
  protected hasChanged(): boolean {
    if (!this._previousPerspective) return true;
    let hasChanged = JSON.stringify(this.perspective.playsets) !== JSON.stringify(this._previousPerspective.playsets)
    return hasChanged;
  }

  /** */
  async probeAll() {
    await this.probePlaysets();
  }


  /** -- Perspective -- */

  /* */
  get perspective(): LudothequePerspective {
    return {playsets: this._playsets};
  }

  /** PlaysetEh -> Playset */
  private _playsets: Dictionary<Playset> = {};


  getPlayset(playsetEh: EntryHashB64): Playset | undefined {
    return this._playsets[playsetEh];
  }


  /** -- Methods -- */

  /** Probe */

  async probePlaysets(): Promise<Dictionary<Playset>> {
    const playsets = await this.zomeProxy.getAllPlaysets();
    for (const e of playsets) {
      this._playsets[e.hash] = e.content
    }
    return this._playsets;
  }


  /** Publish */

  /** */
  async publishPlayset(playset: Playset) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this.zomeProxy.createPlayset(playset)
    this._playsets[eh] = playset;
    this.notifySubscribers();
    return eh
  }


  /** */
  async exportPlayset(playsetEh: EntryHashB64, destinationCellId: CellId) : Promise<EntryHashB64[]> {
    return this.zomeProxy.exportPlayset({destinationCellId, playsetEh});
  }

}
