import {PlaysetEntry} from "./ludotheque.bindings";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {MarkerType} from "./playset.perspective";
import {EmojiGroupVariant, SvgMarkerVariant} from "./playset.bindings";
import {DnaViewModel, HappViewModel} from "@ddd-qc/dna-client";
import {PlaysetZvm} from "./playset.zvm";
import {LudothequeZvm} from "./ludotheque.zvm";


/**
 * ViewModel fo the Ludotheque DNA
 * Holds two zomes:
 *  - Playset
 *  - Ludotheque
 */
export class LudothequeDvm extends DnaViewModel {

  static readonly DEFAULT_ROLE_ID = "rLudotheque";
  static readonly ZVM_DEFS = [PlaysetZvm, LudothequeZvm]
  readonly signalHandler = undefined;

  /** QoL Helpers */
  get playsetZvm(): PlaysetZvm { return this.getZomeViewModel(PlaysetZvm.DEFAULT_ZOME_NAME) as PlaysetZvm}
  get ludothequeZvm(): LudothequeZvm { return this.getZomeViewModel(LudothequeZvm.DEFAULT_ZOME_NAME) as LudothequeZvm}


  /** -- Perspective -- */

  protected hasChanged(): boolean {return true}
  get perspective(): unknown {return}

  /** -- Methods -- */

  /** Create new playset with starting spaces */
  async checkAndPublishPlayset(playset: PlaysetEntry): Promise<EntryHashB64> {
    console.log("addPlaysetWithCheck() before: ", playset)
    for (const spaceEh of playset.spaces) {
      const space = this.playsetZvm.getSpace(spaceEh)!;
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
    console.log("checkAndPublishPlayset(): " + playset.name + " | " + playsetEh)
    /* Done */
    return playsetEh;
  }
}
