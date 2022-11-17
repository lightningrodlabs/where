import {PlaysetEntry} from "./ludotheque.bindings";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {MarkerType} from "./playset.perspective";
import {EmojiGroupVariant, SvgMarkerVariant} from "./playset.bindings";
import {DnaClient, DnaViewModel} from "@ddd-qc/dna-client";
import {ReactiveElement} from "lit";
import {PlaysetZvm} from "./playset.zvm";
import {LudothequeZvm} from "./ludotheque.zvm";
import {convertEntryToSpace} from "./where.perspective";
import {createContext} from "@lit-labs/context";


/**
 * ViewModel fo the Ludotheque DNA
 * Holds two zomes:
 *  - Playset
 *  - Ludotheque
 */
export class LudothequeDvm extends DnaViewModel {

  /** async factory */
  static async new(host: ReactiveElement, port: number, installedAppId: string): Promise<LudothequeDvm> {
    let dnaClient = await DnaClient.new(port, installedAppId);
    return new LudothequeDvm(host, dnaClient);
  }

  /** */
  private constructor(host: ReactiveElement, dnaClient: DnaClient) {
    super(host, dnaClient);
    this.addZomeViewModel(PlaysetZvm);
    this.addZomeViewModel(LudothequeZvm);
  }

  /** */
  static context = createContext<LudothequeDvm>('dvm/ludotheque');
  getContext(): any {return LudothequeDvm.context}


  /** */
  get playsetZvm(): PlaysetZvm { return this.getZomeViewModel("where_playset") as PlaysetZvm}
  get ludothequeZvm(): LudothequeZvm { return this.getZomeViewModel("where_ludotheque") as LudothequeZvm}


  /** -- Methods -- */

  /** Create new playset with starting spaces */
  async checkAndPublishPlayset(playset: PlaysetEntry): Promise<EntryHashB64> {
    console.log("addPlaysetWithCheck() before: ", playset)
    for (const spaceEh of playset.spaces) {
      const spaceEntry = this.playsetZvm.getSpace(spaceEh);
      console.log({space_entry: spaceEntry})
      let space = convertEntryToSpace(spaceEntry!);
      console.log({space})

      /* Get templates */
      if (!playset.templates.includes(space.origin)) {
        playset.templates.push(space.origin)
      }

      /* Get Markers */
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
    console.log("checkAndPublishPlayset() after:", playset)

    /* Commit PlaysetEntry */
    const playsetEh = await this.ludothequeZvm.publishPlayset(playset);
    // - Notify others
    // const newSpace: Signal = {maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: 'NewSpace', content: spaceEh}};
    // this.service.notify(newSpace, this.others());
    // - Add play to store
    console.log("checkAndPublishPlayset(): " + playset.name + " | " + playsetEh)

    /* Done */
    return playsetEh;
  }
}
