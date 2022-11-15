import {Dictionary, EntryHashB64} from '@holochain-open-dev/core-types';
import {CellId} from "@holochain/client";
import {PlaysetEntry} from "./ludotheque.bindings";
import {LudothequeBridge} from "./ludotheque.bridge";
import {DnaClient, ZomeViewModel} from "@ddd-qc/dna-client";
import {createContext} from "@lit-labs/context";
import {serializeHash} from "@holochain-open-dev/utils";
import {MarkerType} from "./playset.perspective";
import {EmojiGroupVariant, SvgMarkerVariant} from "./playset.bindings";


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
      const b64 = serializeHash(e.hash)
        this._playsets[b64] = e.content
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



  /**
   * Create new playset with starting spaces
   */
  async addPlaysetWithCheck(playset: PlaysetEntry): Promise<EntryHashB64> {
    console.log("addPlaysetWithCheck() before: " + JSON.stringify(playset))
    for (const spaceEh of playset.spaces) {
      const space_entry = this.space(spaceEh);
      console.log({space_entry})
      let space = this._bridge.spaceFromEntry(space_entry);
      console.log({space})

      // Get templates
      if (!playset.templates.includes(space.origin)) {
        playset.templates.push(space.origin)
      }

      // Get Markers
      if (space.meta.markerType == MarkerType.SvgMarker) {
        let markerEh = (space.maybeMarkerPiece! as SvgMarkerVariant).svg;
        if (markerEh && !playset.svgMarkers.includes(markerEh)) {
          playset.svgMarkers.push(markerEh)
        }
      } else {
        if (space.meta.markerType == MarkerType.EmojiGroup) {
          let eh = (space.maybeMarkerPiece! as EmojiGroupVariant).emojiGroup!;
          if (eh && !playset.emojiGroups.includes(eh)) {
            playset.emojiGroups.push(eh)
          }
        }
      }
    }

    console.log("addPlaysetWithCheck() after: " + JSON.stringify(playset))

    // - Commit PlaysetEntry
    const playsetEh = await this.publishPlayset(playset);
    // - Notify others
    // const newSpace: Signal = {maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: 'NewSpace', content: spaceEh}};
    // this.service.notify(newSpace, this.others());
    // - Add play to store
    console.log("addPlaysetWithCheck(): " + playset.name + " | " + playsetEh)

    // Done
    return playsetEh;
  }

  

  /** */
  async exportPlayset(playsetEh: EntryHashB64, cellId: CellId) : Promise<void> {
    return this._bridge.exportPlayset(playsetEh, cellId);
  }

}
