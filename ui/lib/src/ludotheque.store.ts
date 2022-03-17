import {AgentPubKeyB64, EntryHashB64, serializeHash} from '@holochain-open-dev/core-types';
import {CellClient} from '@holochain-open-dev/cell-client';
import {derived, get, Readable, Writable, writable} from 'svelte/store';
import {WhereService} from './where.service';
import {
  Dictionary,
  EmojiGroupEntry, EmojiGroupVariant, HoloHashed,
  MarkerType,
  PlaysetEntry,
  Signal,
  Space,
  SpaceEntry,
  SvgMarkerEntry, SvgMarkerVariant,
  TemplateEntry,
} from './types';
import {CellId} from "@holochain/client/lib/types/common";

const areEqual = (first: Uint8Array, second: Uint8Array) =>
      first.length === second.length && first.every((value, index) => value === second[index]);


export class LudothequeStore {
  /** Private */
  private service : WhereService

  /** SvgMarkerEh -> SvgMarker */
  private svgMarkerStore: Writable<Dictionary<SvgMarkerEntry>> = writable({});
  /** EmojiGroupEh -> EmojiGroup */
  private emojiGroupStore: Writable<Dictionary<EmojiGroupEntry>> = writable({});
  /** TemplateEh -> Template */
  private templateStore: Writable<Dictionary<TemplateEntry>> = writable({});
  /** SpaceEh -> Space */
  private spaceStore: Writable<Dictionary<SpaceEntry>> = writable({});
  /** PlaysetEh -> Playset */
  private playsetStore: Writable<Dictionary<PlaysetEntry>> = writable({});

  /** Static info */
  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
  public svgMarkers: Readable<Dictionary<SvgMarkerEntry>> = derived(this.svgMarkerStore, i => i)
  public emojiGroups: Readable<Dictionary<EmojiGroupEntry>> = derived(this.emojiGroupStore, i => i)
  public templates: Readable<Dictionary<TemplateEntry>> = derived(this.templateStore, i => i)
  public spaces: Readable<Dictionary<SpaceEntry>> = derived(this.spaceStore, i => i)
  public playsets: Readable<Dictionary<PlaysetEntry>> = derived(this.playsetStore, i => i)


  constructor(protected cellClient: CellClient) {
    this.myAgentPubKey = serializeHash(cellClient.cellId[1]);
    this.service = new WhereService(cellClient, "where");

    cellClient.addSignalHandler( appSignal => {
      if (! areEqual(cellClient.cellId[0],appSignal.data.cellId[0]) || !areEqual(cellClient.cellId[1], appSignal.data.cellId[1])) {
        return
      }
      const signal = appSignal.data.payload
      //if (signal.message.type != "Ping" && signal.message.type != "Pong") {
      //  console.debug(`SIGNAL: ${signal.message.type}`, appSignal)
      //}
      // Handle signal
      switch(signal.message.type) {
        case "Ping":
        case "Pong":
          break;
        case "NewSvgMarker":
          const svgEh = signal.message.content
          this.service.getSvgMarker(svgEh).then(svg => {
            this.svgMarkerStore.update(store => {
              store[svgEh] = svg
              return store
            })
          })
          break;
        case "NewEmojiGroup":
          const groupEh = signal.message.content
          this.service.getEmojiGroup(groupEh).then(group => {
            this.emojiGroupStore.update(emojiGroups => {
              emojiGroups[groupEh] = group
              return emojiGroups
            })
          })
          break;
      case "NewTemplate":
        const templateEh = signal.message.content
        this.service.getTemplate(templateEh).then(template => {
          this.templateStore.update(templates => {
            templates[templateEh] = template
            return templates
          })
        })
        break;
      case "NewSpace":
        const spaceEh = signal.message.content
        this.service.getSpace(spaceEh).then(space => {
          this.templateStore.update(spaces => {
            spaces[spaceEh] = space
            return spaces
          })
        })
        break;
      case "NewPlayset":
        const playsetEh = signal.message.content
        this.service.getPlayset(playsetEh).then(playset => {
          this.playsetStore.update(playsets => {
            playsets[playsetEh] = playset
            return playsets
          })
        })
        break;
      }
    })
  }


  /**
   * Get latest entries of each type and update local store accordingly
   */
  async pullDht() {
    const svgMarkers = await this.updateSvgMarkers();
    const emojiGroups = await this.updateEmojiGroups();
    const templates = await this.updateTemplates();
    const spaces = await this.updateSpaces();
    const playsets = await this.updatePlaysets();
    console.log(`Entries found in DHT: ${Object.keys(playsets).length} | ${Object.keys(spaces).length} | ${Object.keys(templates).length} | ${Object.keys(emojiGroups).length} | ${Object.keys(svgMarkers).length}`)
    //console.log({plays})
  }


  /** Update */

  async updateTemplates() : Promise<Dictionary<TemplateEntry>> {
    const templates = await this.service.getTemplates();
    for (const t of templates) {
      this.templateStore.update(templateStore => {
        templateStore[t.hash] = t.content
        return templateStore
      })
    }
    return get(this.templateStore)
  }

  async updateSvgMarkers() : Promise<Dictionary<SvgMarkerEntry>> {
    const markers = await this.service.getSvgMarkers();
    for (const e of markers) {
      this.svgMarkerStore.update(svgMarkers => {
        svgMarkers[e.hash] = e.content
        return svgMarkers
      })
    }
    return get(this.svgMarkerStore)
  }

  async updateEmojiGroups() : Promise<Dictionary<EmojiGroupEntry>> {
    const groups = await this.service.getEmojiGroups();
    for (const e of groups) {
      this.emojiGroupStore.update(emojiGroups => {
        emojiGroups[e.hash] = e.content
        return emojiGroups
      })
    }
    return get(this.emojiGroupStore)
  }

  async updateSpaces() : Promise<Dictionary<SpaceEntry>> {
    const spaces = await this.service.getSpaces();
    for (const e of spaces) {
      this.spaceStore.update(spaces => {
        spaces[e.hash] = e.content
        return spaces
      })
    }
    return get(this.spaceStore)
  }

  async updatePlaysets() : Promise<Dictionary<PlaysetEntry>> {
    const playsets = await this.service.getPlaysets();
    for (const e of playsets) {
      this.playsetStore.update(playsets => {
        playsets[e.hash] = e.content
        return playsets
      })
    }
    return get(this.playsetStore)
  }


  /** Add */

  async addTemplate(template: TemplateEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this.service.createTemplate(template)
    this.templateStore.update(templates => {
      templates[eh] = template
      return templates
    })
    // this.service.notify(
    //   {maybeSpaceHash: null, from: this.myAgentPubKey, message: {type:"NewTemplate", content: eh}}
    //   , this.others());
    return eh
  }

  async addEmojiGroup(emojiGroup: EmojiGroupEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this.service.createEmojiGroup(emojiGroup)
    this.emojiGroupStore.update(emojiGroups => {
      emojiGroups[eh] = emojiGroup
      return emojiGroups
    })
    // this.service.notify(
    //   {maybeSpaceHash: null, from: this.myAgentPubKey, message: {type:"NewEmojiGroup", content: eh}}
    //   , this.others());
    return eh
  }

  async addSvgMarker(svgMarker: SvgMarkerEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this.service.createSvgMarker(svgMarker)
    this.svgMarkerStore.update(svgMarkers => {
      svgMarkers[eh] = svgMarker
      return svgMarkers
    })
    // this.service.notify(
    //   {maybeSpaceHash: null, from: this.myAgentPubKey, message: {type:"NewSvgMarker", content:eh}}
    //   , this.others());
    return eh
  }

  async addSpace(space: SpaceEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this.service.createSpace(space)
    this.spaceStore.update(spaces => {
      spaces[eh] = space
      return spaces
    })
    // this.service.notify(
    //   {maybeSpaceHash: null, from: this.myAgentPubKey, message: {type:"NewSpace", content:eh}}
    //   , this.others());
    return eh
  }

  async addPlayset(playset: PlaysetEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this.service.createPlayset(playset)
    this.playsetStore.update(playsets => {
      playsets[eh] = playset
      return playsets
    })
    // this.service.notify(
    //   {maybeSpaceHash: null, from: this.myAgentPubKey, message: {type:"NewPlayset", content:eh}}
    //   , this.others());
    return eh
  }


  async newPlayset(name: string, spaces: HoloHashed<SpaceEntry>[]): Promise<EntryHashB64> {
    console.log("newPlayset() called:")
    console.log({spaces})
    // Get templates
    let templates = new Array();
    for (const space of spaces) {
      if (!templates.includes(space.content.origin)) {
        templates.push(space.content.origin)
      }
    }
    // Get markers
    let svgMarkers = new Array();
    let emojiGroups = new Array();
    for (const entry of spaces) {
      let space = this.service.spaceFromEntry(entry.content);
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
    // Get space hashes
    let spaceEhs = new Array();
    for (const space of spaces) {
      spaceEhs.push(space.hash)
    }
    // - Create and commit PlaysetEntry
    const playset: PlaysetEntry = {
      name,
      description: "",
      spaces: spaceEhs,
      templates,
      svgMarkers,
      emojiGroups,
    }
    const playsetEh = await this.addPlayset(playset);
    // - Notify others
    // const newSpace: Signal = {maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: 'NewSpace', content: spaceEh}};
    // this.service.notify(newSpace, this.others());
    // - Add play to store
    console.log("newPlayset(): " + name + " | " + playsetEh)

    // Done
    return playsetEh;
  }

  /**
   * Create new playset with starting spaces
   */
  async addPlaysetWithCheck(playset: PlaysetEntry): Promise<EntryHashB64> {
    console.log("addPlaysetWithCheck() before: " + JSON.stringify(playset))
    for (const spaceEh of playset.spaces) {
      const space_entry = this.space(spaceEh);
      console.log({space_entry})
      let space = this.service.spaceFromEntry(space_entry);
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
    const playsetEh = await this.addPlayset(playset);
    // - Notify others
    // const newSpace: Signal = {maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: 'NewSpace', content: spaceEh}};
    // this.service.notify(newSpace, this.others());
    // - Add play to store
    console.log("addPlaysetWithCheck(): " + playset.name + " | " + playsetEh)

    // Done
    return playsetEh;
  }

  /**
   * Create new empty space
   */
  async newSpace(space: Space): Promise<EntryHashB64> {
    // - Create and commit SpaceEntry
    const entry = this.service.spaceIntoEntry(space);
    const spaceEh: EntryHashB64 = await this.addSpace(entry)
    // - Notify others
    // const newSpace: Signal = {maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: 'NewSpace', content: spaceEh}};
    //this.service.notify(newSpace, this.others());
    // - Add play to store
    console.log("newSpace(): " + space.name + " | " + spaceEh)
    // Done
    return spaceEh;
  }


  /**
   *
   */
  async exportPlayset(playsetEh: EntryHashB64, cellId: CellId) : Promise<void> {
    return this.service.exportPlayset(playsetEh, cellId);
  }


  // async hidePlay(spaceEh: EntryHashB64) : Promise<boolean> {
  //   const _hh = await this.service.hideSpace(spaceEh);
  //   this.playStore.update(plays => {
  //     plays[spaceEh].visible = false
  //     return plays
  //   })
  //   return true;
  // }
  //
  // async unhidePlay(spaceEh: EntryHashB64) : Promise<boolean> {
  //   const _hh = await this.service.unhideSpace(spaceEh);
  //   this.playStore.update(plays => {
  //     plays[spaceEh].visible = true
  //     return plays
  //   })
  //   return true;
  // }


  spaceFromEh(eh: EntryHashB64): Space {
    const entry = this.space(eh)
    return this.service.spaceFromEntry(entry);
  }


  /** Getters */

  template(templateEh64: EntryHashB64): TemplateEntry {
      return get(this.templateStore)[templateEh64];
  }

  space(eh: EntryHashB64): SpaceEntry {
    return get(this.spaceStore)[eh];
  }

  playset(playsetEh: EntryHashB64): PlaysetEntry {
    return get(this.playsetStore)[playsetEh];
  }


}
