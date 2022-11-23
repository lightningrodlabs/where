import {Dictionary, EntryHashB64} from '@holochain-open-dev/core-types';
import {CellId} from "@holochain/client";
import {PlaysetEntry} from "./ludotheque.bindings";
import {LudothequeProxy} from "./ludotheque.proxy";
import {CellProxy, ZomeViewModel} from "@ddd-qc/dna-client";
import {createContext} from "@lit-labs/context";

/** */
export interface LudothequePerspective {
  playsets: Dictionary<PlaysetEntry>;
}


/**
 *
 */
export class LudothequeZvm extends ZomeViewModel<LudothequePerspective, LudothequeProxy> {

  /** Ctor */
  constructor(protected _cellProxy: CellProxy) {
    super(new LudothequeProxy(_cellProxy));
  }

  /** -- ZomeViewModel -- */

  // static context = createContext<LudothequeZvm>('zome_view_model/where_ludotheque');
  // getContext(): any {return LudothequeZvm.context}

  getContext(): any {return createContext<LudothequeZvm>('zvm/'+ this.zomeName +'/' + this._cellProxy.dnaHash)}

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
  private _playsets: Dictionary<PlaysetEntry> = {};


  getPlayset(playsetEh: EntryHashB64): PlaysetEntry | undefined {
    return this._playsets[playsetEh];
  }


  /** -- Methods -- */

  /** Probe */

  async probePlaysets(): Promise<Dictionary<PlaysetEntry>> {
    const playsets = await this._zomeProxy.getAllPlaysets();
    for (const e of playsets) {
      this._playsets[e.hash] = e.content
    }
    return this._playsets;
  }


  /** Publish */

  /** */
  async publishPlayset(playset: PlaysetEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this._zomeProxy.createPlayset(playset)
    this._playsets[eh] = playset;
    this.notifySubscribers();
    return eh
  }


  /** */
  async exportPlayset(playsetEh: EntryHashB64, cellId: CellId) : Promise<void> {
    return this._zomeProxy.exportPlayset(playsetEh, cellId);
  }

}
