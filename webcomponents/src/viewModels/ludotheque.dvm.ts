import {PlaysetEntry} from "./ludotheque.bindings";
import {Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";
import {MarkerType} from "./playset.perspective";
import {EmojiGroupVariant, SpaceEntry, SvgMarkerVariant} from "./playset.bindings";
import {HoloHashed} from "@holochain/client";
import {DnaViewModel} from "@ddd-qc/dna-client";
import {ReactiveElement} from "lit";
import {PlaysetViewModel} from "./playset.vm";
import {LudothequeViewModel} from "./ludotheque.zvm";
import {defaultPlayMeta, PlayMeta, Space} from "./where.perspective";
import {mapReviver} from "../utils";


/**
 *
 */
export class LudothequeDnaViewModel extends ReactiveElement {
  constructor(port: number, appId: string) {
    super();
    DnaViewModel.new(this, port, appId).then((dvm) => {
      this._dnaViewModel = dvm
      this._dnaViewModel.addZomeViewModel(PlaysetViewModel);
      this._dnaViewModel.addZomeViewModel(LudothequeViewModel);
    })
  }

  private _dnaViewModel!: DnaViewModel;

  get playsetViewModel(): PlaysetViewModel { return this._dnaViewModel.getViewModel("where_playset") as PlaysetViewModel}
  get ludothequeViewModel(): LudothequeViewModel { return this._dnaViewModel.getViewModel("where_ludotheque") as LudothequeViewModel}


  /** */
  async newPlayset(name: string, spaces: HoloHashed<SpaceEntry>[]): Promise<EntryHashB64> {
    console.log("newPlayset() called:")
    console.log({spaces})
    /* Get templates */
    let templates = new Array();
    for (const space of spaces) {
      if (!templates.includes(space.content.origin)) {
        templates.push(space.content.origin)
      }
    }
    /* Get markers */
    let svgMarkers = new Array();
    let emojiGroups = new Array();
    for (const entry of spaces) {
      let space = this.spaceFromEntry(entry.content);
      if (space.meta.markerType == MarkerType.SvgMarker) {
        let markerEh = (space.maybeMarkerPiece! as SvgMarkerVariant).svg;
        if (markerEh && !svgMarkers.includes(markerEh)) {
          svgMarkers.push(markerEh)
        }
      } else {
        if (space.meta.markerType == MarkerType.EmojiGroup) {
          let eh = (space.maybeMarkerPiece! as EmojiGroupVariant).emojiGroup;
          if (eh && !svgMarkers.includes(eh)) {
            emojiGroups.push(eh)
          }
        }
      }

    }
    /* Get space hashes */
    let spaceEhs = new Array();
    for (const space of spaces) {
      spaceEhs.push(space.hash)
    }
    /* - Create and commit PlaysetEntry */
    const playset: PlaysetEntry = {
      name,
      description: "",
      spaces: spaceEhs,
      templates,
      svgMarkers,
      emojiGroups,
    }
    const playsetEh = await this.ludothequeViewModel.publishPlayset(playset);
    // - Notify others
    // const newSpace: Signal = {maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: 'NewSpace', content: spaceEh}};
    // this.service.notify(newSpace, this.others());
    // - Add play to store
    console.log("newPlayset(): " + name + " | " + playsetEh)

    /* Done */
    return playsetEh;
  }


  /**
   * Create new playset with starting spaces
   */
  async addPlaysetWithCheck(playset: PlaysetEntry): Promise<EntryHashB64> {
    console.log("addPlaysetWithCheck() before: " + JSON.stringify(playset))
    for (const spaceEh of playset.spaces) {
      const spaceEntry = this.playsetViewModel.getSpace(spaceEh);
      console.log({space_entry: spaceEntry})
      let space = this.spaceFromEntry(spaceEntry!);
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
    console.log("addPlaysetWithCheck() after: " + JSON.stringify(playset))

    /* Commit PlaysetEntry */
    const playsetEh = await this.ludothequeViewModel.publishPlayset(playset);
    // - Notify others
    // const newSpace: Signal = {maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: 'NewSpace', content: spaceEh}};
    // this.service.notify(newSpace, this.others());
    // - Add play to store
    console.log("addPlaysetWithCheck(): " + playset.name + " | " + playsetEh)

    /* Done */
    return playsetEh;
  }


  /** */
  private spaceFromEntry(entry: SpaceEntry): Space {
    return {
      name: entry.name,
      origin: entry.origin,
      surface: JSON.parse(entry.surface),
      maybeMarkerPiece: entry.maybeMarkerPiece,
      meta: entry.meta ? this.metaFromEntry(entry.meta) : defaultPlayMeta(),
    }
  }


  /** */
  private metaFromEntry(meta: Dictionary<string>): PlayMeta {
    let spaceMeta: any = {};
    try {
      for (const [key, value] of Object.entries(meta)) {
        Object.assign(spaceMeta, {[key]: JSON.parse(value, mapReviver)})
      }
    } catch (e) {
      console.error("Failed parsing meta filed into PlayMeta")
      console.error(e)
    }
    //console.log({spaceMeta})
    return spaceMeta as PlayMeta;
  }
}
