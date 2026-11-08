import {CellId, EntryHashB64} from "@holochain/client";
import {Playset} from "../bindings/ludotheque.types";
import {LudothequeProxy} from "../bindings/ludotheque.proxy";
import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {GetStrategy} from "@holochain-open-dev/core-types";
import {isLocal} from "../utils";


/** */
export interface LudothequePerspective {
  playsets: Record<string, Playset>;
}


/**
 *
 */
export class LudothequeZvm extends ZomeViewModel {

  static readonly ZOME_PROXY = LudothequeProxy;
  get zomeProxy(): LudothequeProxy {return this._zomeProxy as LudothequeProxy;}

  /* */
  protected hasChanged(): boolean {
    if (!this._previousPerspective) {
      return true;
    }
    let hasChanged = JSON.stringify(this.perspective.playsets) !== JSON.stringify((this._previousPerspective as LudothequePerspective).playsets)
    return hasChanged;
  }


  /** */
  override async initializePerspectiveFromLocal(): Promise<void> {
    await this.probePlaysets(GetStrategy.Local);
  }

  /** */
  override async initializePerspectiveFromNetwork(): Promise<void> {
    await this.probePlaysets(GetStrategy.Network);
  }

  /** */
  override probeAllInner(strategy: GetStrategy) {
    this.probePlaysets(strategy);
  }


  /** -- Perspective -- */

  /* */
  get perspective(): LudothequePerspective {
    return {playsets: this._playsets};
  }

  /** PlaysetEh -> Playset */
  private _playsets: Record<string, Playset> = {};


  getPlayset(playsetEh: EntryHashB64): Playset | undefined {
    return this._playsets[playsetEh];
  }


  /** -- Methods -- */

  /** Probe */

  async probePlaysets(strategy: GetStrategy = GetStrategy.Local): Promise<Record<string, Playset>> {
    const playsets = await this.zomeProxy.getAllPlaysets({input: null, local: isLocal(strategy)});
    for (const e of playsets) {
      this._playsets[e.hash] = e.content
    }
    this.notifySubscribers();
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
