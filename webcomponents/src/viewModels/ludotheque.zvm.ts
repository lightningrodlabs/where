import {Dictionary, EntryHashB64} from '@holochain-open-dev/core-types';
import {CellId} from "@holochain/client";
import {PlaysetEntry} from "./ludotheque.bindings";
import {LudothequeBridge} from "./ludotheque.bridge";
import {DnaClient, ZomeViewModel} from "@ddd-qc/dna-client";
import {createContext} from "@lit-labs/context";

/** */
export interface LudothequePerspective {
  playsets: Dictionary<PlaysetEntry>;
}


/**
 *
 */
export class LudothequeViewModel extends ZomeViewModel<LudothequePerspective, LudothequeBridge> {

  /** Ctor */
  constructor(protected dnaClient: DnaClient) {
    super(new LudothequeBridge(dnaClient));
  }

  /** -- ZomeViewModel -- */

  static context = createContext<LudothequeViewModel>('zome_view_model/where_ludotheque');
  getContext(): any {return LudothequeViewModel.context}

  /* */
  protected hasChanged(): boolean {
    if (!this._previousPerspective) return true;
    let hasChanged = JSON.stringify(this.perspective.playsets) !== JSON.stringify(this._previousPerspective.playsets)
    return hasChanged;
  }

  /** */
  async probeDht() {
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
    const playsets = await this._bridge.getAllPlaysets();
    for (const e of playsets) {
      this._playsets[e.hash] = e.content
    }
    return this._playsets;
  }


  /** Publish */

  /** */
  async publishPlayset(playset: PlaysetEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this._bridge.createPlayset(playset)
    this._playsets[eh] = playset;
    this.notify();
    return eh
  }


  /** */
  async exportPlayset(playsetEh: EntryHashB64, cellId: CellId) : Promise<void> {
    return this._bridge.exportPlayset(playsetEh, cellId);
  }

}
