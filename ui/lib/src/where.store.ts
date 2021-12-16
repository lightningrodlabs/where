import {EntryHashB64, HeaderHashB64, AgentPubKeyB64, serializeHash, HoloHashed} from '@holochain-open-dev/core-types';
import { CellClient } from '@holochain-open-dev/cell-client';
import { writable, Writable, derived, Readable, get } from 'svelte/store';

import { WhereService, locationFromHere, hereFromLocation } from './where.service';
import {
  Dictionary,
  Space,
  SpaceEntry,
  LocationInfo,
  Location,
  Coord,
  TemplateEntry, Signal, EmojiGroupEntry, SvgMarkerEntry,
} from './types';
import {
  ProfilesStore,
} from "@holochain-open-dev/profiles";

const areEqual = (first: Uint8Array, second: Uint8Array) =>
      first.length === second.length && first.every((value, index) => value === second[index]);

export class WhereStore {
  /** Private */
  private service : WhereService
  private profiles: ProfilesStore

  /** SvgMarkerEh -> SvgMarker */
  private svgMarkerStore: Writable<Dictionary<SvgMarkerEntry>> = writable({});
  /** EmojiGroupEh -> EmojiGroup */
  private emojiGroupStore: Writable<Dictionary<EmojiGroupEntry>> = writable({});
  /** TemplateEh -> Template */
  private templatesStore: Writable<Dictionary<TemplateEntry>> = writable({});
  /** SpaceEh -> Space */
  private spacesStore: Writable<Dictionary<Space>> = writable({});
  /** SpaceEh -> zoomPct */
  private zoomsStore: Writable<Dictionary<number>> = writable({});
  /** SpaceEh -> sessionEh */
  private currentSessionStore: Writable<Dictionary<EntryHashB64>> = writable({});
  /** agentPubKey -> timestamp */
  private agentPresenceStore: Writable<Dictionary<number>> = writable({});

  /** Static info */
  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
  public svgMarkers: Readable<Dictionary<SvgMarkerEntry>> = derived(this.svgMarkerStore, i => i)
  public emojiGroups: Readable<Dictionary<EmojiGroupEntry>> = derived(this.emojiGroupStore, i => i)
  public templates: Readable<Dictionary<TemplateEntry>> = derived(this.templatesStore, i => i)
  public spaces: Readable<Dictionary<Space>> = derived(this.spacesStore, i => i)
  public zooms: Readable<Dictionary<number>> = derived(this.zoomsStore, i => i)
  public agentPresences: Readable<Dictionary<number>> = derived(this.agentPresenceStore, i => i)
  public currentSessions: Readable<Dictionary<EntryHashB64>> = derived(this.currentSessionStore, i => i)


  constructor(
    protected cellClient: CellClient,
    profilesStore: ProfilesStore,
    zomeName: string = 'hc_zome_where')
  {
    this.myAgentPubKey = serializeHash(cellClient.cellId[1]);
    this.profiles = profilesStore;
    this.service = new WhereService(cellClient, zomeName);

    cellClient.addSignalHandler( signal => {
      if (! areEqual(cellClient.cellId[0],signal.data.cellId[0]) || !areEqual(cellClient.cellId[1], signal.data.cellId[1])) {
        return
      }
      console.debug("SIGNAL", signal)
      const payload = signal.data.payload
      // Update agent's presence stat
      this.updatePresence(payload.from)
      // Send pong response
      if (payload.message.type != "Pong") {
        //console.log("PONGING ", payload.from)
        const response: Signal = {
          maybeSpaceHash: payload.maybeSpaceHash,
          from: this.myAgentPubKey,
          message: {type: 'Pong', content: this.myAgentPubKey}
        };
        this.service.notify(response, [payload.from])
      }
      // Handle signal
      switch(payload.message.type) {
        case "Ping":
        case "Pong":
          break;
        case "NewSvgMarker":
          const svgEh = payload.message.content[0]
          if (!get(this.svgMarkers)[svgEh]) {
            this.svgMarkerStore.update(store => {
              store[svgEh] = payload.message.content[1]
              return store
            })
          }
          break;
        case "NewEmojiGroup":
          const groupEh = payload.message.content[0]
          if (!get(this.emojiGroups)[groupEh]) {
            this.emojiGroupStore.update(emojiGroups => {
              emojiGroups[groupEh] = payload.message.content[1]
              return emojiGroups
            })
          }
          break;
      case "NewTemplate":
        const templateEh = payload.message.content[0]
        if (!get(this.templates)[templateEh]) {
          this.templatesStore.update(templates => {
            templates[templateEh] = payload.message.content[1]
            return templates
          })
        }
        break;
      case "NewSpace":
        const spaceEh = payload.message.content[0]
        if (!get(this.spaces)[spaceEh]) {
          this.updateSpaceFromEntry(spaceEh, payload.message.content[1], true)
        }
        break;
      case "NewHere":
        const hereInfo = payload.message.content;
        if (get(this.spaces)[payload.maybeSpaceHash!]) {
          this.spacesStore.update(spaces => {
            let locations = spaces[payload.maybeSpaceHash].sessions[hereInfo.entry.sessionEh].locations
            const w : LocationInfo = locationFromHere(hereInfo)
            const idx = locations.findIndex((locationInfo) => locationInfo!.hh == payload.message.hh)
            if (idx > -1) {
              locations[idx] = w
            } else {
              locations.push(w)
            }
            return spaces
          })
        }
        break;
      case "DeleteHere":
        const sessionEh = payload.message.content[0];
        const hereHh = payload.message.content[1];
        if (get(this.spaces)[payload.maybeSpaceHash]) {
          this.spacesStore.update(spaces => {
            let locations = spaces[payload.maybeSpaceHash].sessions[sessionEh].locations
            const idx = locations.findIndex((locationInfo) => locationInfo && locationInfo.hh == hereHh)
            if (idx > -1) {
              locations.splice(idx, 1);
            }
            return spaces
          })
        }
        break;
      }
    })

  }

  private updatePresence(from: AgentPubKeyB64) {
    const currentTimeInSeconds: number = Math.floor(Date.now()/1000);
    this.agentPresenceStore.update(agentPresences => {
      agentPresences[from] = currentTimeInSeconds;
      return agentPresences;
    })
    return from;
  }

  private others(): Array<AgentPubKeyB64> {
    return Object.keys(get(this.profiles.knownProfiles)).filter((key)=> key != this.myAgentPubKey)
  }

  private updateCurrentSession(sessionEh: EntryHashB64, spaceEh: EntryHashB64) {
    this.currentSessionStore.update(currentSessions => {
      currentSessions[spaceEh] = sessionEh;
      return currentSessions;
    })
  }


  private async updateSpaceFromEntry(spaceHash: EntryHashB64, entry: SpaceEntry, visible: boolean): Promise<void>   {
    //console.log("updateSpaceFromEntry: " + hh)
    const space : Space = await this.service.spaceFromEntry(spaceHash, entry, visible)
    this.spacesStore.update(spaces => {
      spaces[spaceHash] = space
      return spaces
    })
    if (!get(this.zoomsStore)[spaceHash]) {
      this.zoomsStore.update(zooms => {
        zooms[spaceHash] = 1.0
        return zooms
      })
    }
  }

  pingOthers(spaceHash: EntryHashB64, myKey: AgentPubKeyB64) {
    const signal: Signal = {maybeSpaceHash: spaceHash, from: this.myAgentPubKey, message: {type: 'Ping', content: myKey}};
    // console.log({signal})
    this.service.notify(signal, this.others());
  }

  async updateTemplates() : Promise<Dictionary<TemplateEntry>> {
    const templates = await this.service.getTemplates();
    for (const t of templates) {
      this.templatesStore.update(templates => {
        templates[t.hash] = t.content
        return templates
      })
    }
    return get(this.templatesStore)
  }

  async addTemplate(template: TemplateEntry) : Promise<EntryHashB64> {
    const eh64: EntryHashB64 = await this.service.createTemplate(template)
    this.templatesStore.update(templates => {
      templates[eh64] = template
      return templates
    })
    // this.service.notify(
    //   {maybeSpaceHash: null, from: this.myAgentPubKey, message: {type:"NewTemplate", content:template}}
    //   , this.others());
    return eh64
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

  async addEmojiGroup(emojiGroup: EmojiGroupEntry) : Promise<EntryHashB64> {
    const eh64: EntryHashB64 = await this.service.createEmojiGroup(emojiGroup)
    this.emojiGroupStore.update(emojiGroups => {
      emojiGroups[eh64] = emojiGroup
      return emojiGroups
    })
    // this.service.notify(
    //   {maybeSpaceHash: null, from: this.myAgentPubKey, message: {type:"NewEmojiGroup", content:emojiGroup}}
    //   , this.others());
    return eh64
  }

  async addSvgMarker(svgMarker: SvgMarkerEntry) : Promise<EntryHashB64> {
    const eh64: EntryHashB64 = await this.service.createSvgMarker(svgMarker)
    this.svgMarkerStore.update(svgMarkers => {
      svgMarkers[eh64] = svgMarker
      return svgMarkers
    })
    // this.service.notify(
    //   {maybeSpaceHash: null, from: this.myAgentPubKey, message: {type:"NewSvgMarker", content:svgMarker}}
    //   , this.others());
    return eh64
  }

  async pullDht() : Promise<Dictionary<Space>> {
    const svgMarkers = await this.updateSvgMarkers();
    const emojiGroups = await this.updateEmojiGroups();
    const templates = await this.updateTemplates();

    const spaces = await this.service.getSpaces();
    console.log(`Entries found: ${Object.keys(spaces).length} | ${Object.keys(templates).length} | ${Object.keys(emojiGroups).length} | ${Object.keys(svgMarkers).length}`)
    //console.log({spaces})
    const hiddens = await this.service.getHiddenSpaceList();
    //console.log({hiddens})
    for (const s of spaces) {
      const visible = !hiddens.includes(s.hash)
      await this.updateSpaceFromEntry(s.hash, s.content, visible)
    }
    return get(this.spacesStore)
  }

  async addSpace(space: Space) : Promise<EntryHashB64> {
    const s = this.service.spaceIntoEntry(space)
    const spaceEh: EntryHashB64 = await this.service.createSpaceWithSessions(s, ["global"])
    // for (const locInfo of space.locations) {
    //   if (locInfo) {
    //     await this.service.addLocation(locInfo.location, spaceEh, 0)
    //   }
    // }

    const sessionEh: EntryHashB64 | null = await this.service.getSessionHash(spaceEh, 0);
    console.log("addSpace() sessionEh: " + sessionEh)
    if (sessionEh) {
      this.currentSessionStore.update(sessions => {
        sessions[spaceEh] = sessionEh
        return sessions
      })
    } else {
      console.log("No session found for newly created space");
    }
    this.spacesStore.update(spaces => {
      spaces[spaceEh] = space
      return spaces
    })
    this.zoomsStore.update(zooms => {
      zooms[spaceEh] = 1
      return zooms
    })
    // this.service.notify({maybeSpaceHash:spaceEh, from: this.myAgentPubKey, message: {type:"NewSpace", content:s}}, this.others());
    return spaceEh
  }

  async hideSpace(spaceEh: EntryHashB64) : Promise<boolean> {
    const _hh = await this.service.hideSpace(spaceEh);
    this.spacesStore.update(spaces => {
      spaces[spaceEh].visible = false
      return spaces
    })
    return true;
  }

  async unhideSpace(spaceEh: EntryHashB64) : Promise<boolean> {
    const _hh = await this.service.unhideSpace(spaceEh);
    this.spacesStore.update(spaces => {
      spaces[spaceEh].visible = true
      return spaces
    })
    return true;
  }


  async addLocation(spaceEh: EntryHashB64, location: Location) : Promise<void> {
    const hh = await this.service.addLocation(location, spaceEh, 0)
    const locInfo: LocationInfo = { location, hh, authorPubKey: this.myAgentPubKey }
    this.spacesStore.update(spaces => {
      spaces[spaceEh].sessions[location.sessionEh].locations.push(locInfo)
      return spaces
    })
    // Notify peers
    const entry = hereFromLocation(location)
    this.service.notify({
      maybeSpaceHash: spaceEh,
      from: this.myAgentPubKey,
      message: {
        type: "NewHere",
        content: {entry, hh, author: this.myAgentPubKey}
      }}
      , this.others());
  }


  async deleteAllMyLocations(spaceEh: EntryHashB64) {
    const space = get(this.spacesStore)[spaceEh];
    const sessionEh = get(this.currentSessionStore)[spaceEh];
    let idx = 0;
    for (const locInfo of space.sessions[sessionEh].locations) {
      if (locInfo && locInfo.authorPubKey === this.myAgentPubKey) {
        await this.deleteLocation(spaceEh, idx);
      }
      idx += 1;
    }
  }


  async deleteLocation(spaceEh: EntryHashB64, idx: number) {
    const space = get(this.spacesStore)[spaceEh]
    const sessionEh = get(this.currentSessionStore)[spaceEh];
    const locInfo = space.sessions[sessionEh].locations[idx]!
    await this.service.deleteLocation(locInfo.hh)
    this.spacesStore.update(spaces => {
      spaces[spaceEh].sessions[sessionEh].locations[idx] = null
      return spaces
    })
    await this.service.notify({
        maybeSpaceHash: spaceEh,
        from: this.myAgentPubKey,
        message: {type: "DeleteHere", content: [locInfo.location.sessionEh, locInfo.hh]
        }},
      this.others());
  }


  async updateLocation(spaceEh: EntryHashB64, idx: number, c: Coord, tag?: string, emoji?: string) {
    const space = get(this.spacesStore)[spaceEh]
    const sessionEh = get(this.currentSessionStore)[spaceEh];
    const locInfo = space.sessions[sessionEh].locations[idx]!
    locInfo.location.coord = c
    if (tag != null) {
      locInfo.location.meta.tag = tag
    }
    if (emoji != null) {
      locInfo.location.meta.emoji = emoji
    }
    const newHh: HeaderHashB64 = await this.service.addLocation(locInfo.location, spaceEh, 0)
    await this.service.deleteLocation(locInfo.hh)
    const oldHereHh = locInfo.hh;
    locInfo.hh = newHh;
    const oldSessionEh = locInfo.location.sessionEh;
    this.spacesStore.update(spaces => {
      spaces[spaceEh].sessions[sessionEh].locations[idx] = locInfo
      return spaces
    })
    const entry = hereFromLocation(locInfo.location)
    await this.service.notify({maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: "DeleteHere", content: [oldSessionEh, oldHereHh]}}, this.others());
    await this.service.notify({maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: "NewHere", content: {entry, hh: newHh, author: this.myAgentPubKey}}}, this.others());
  }

  getAgentIdx(spaceEh: EntryHashB64, agent: string) : number {
    const sessionEh = get(this.currentSessionStore)[spaceEh];
    return get(this.spacesStore)[spaceEh].sessions[sessionEh].locations.findIndex((locInfo) => locInfo && locInfo.location.meta.name == agent)
  }

  template(templateEh64: EntryHashB64): TemplateEntry {
      return get(this.templatesStore)[templateEh64];
  }

  space(spaceEh: EntryHashB64): Space {
    return get(this.spacesStore)[spaceEh];
  }

  currentSession(spaceEh: EntryHashB64): EntryHashB64 {
    return get(this.currentSessionStore)[spaceEh];
  }

  zoom(spaceEh: EntryHashB64) : number {
    return get(this.zoomsStore)[spaceEh]
  }

  updateZoom(spaceEh: EntryHashB64, delta: number) : void {
    this.zoomsStore.update(zooms => {
      if (zooms[spaceEh] + delta < 0.1) {
        zooms[spaceEh] = 0.1
      } else {
        zooms[spaceEh] += delta;
      }
      return zooms
    })
  }
}
