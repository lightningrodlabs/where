import {EntryHashB64, HeaderHashB64, AgentPubKeyB64, serializeHash} from '@holochain-open-dev/core-types';
import {BaseClient, CellClient} from '@holochain-open-dev/cell-client';
import { writable, Writable, derived, Readable, get } from 'svelte/store';
import { WhereService } from './where.service';
import {
  Dictionary,
  Play,
  LocationInfo,
  Location,
  Coord,
  TemplateEntry, Signal, EmojiGroupEntry, SvgMarkerEntry, PlayMeta, PlacementSession, defaultPlayMeta, Space, Inventory,
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
  private templateStore: Writable<Dictionary<TemplateEntry>> = writable({});
  /** SpaceEh -> Play */
  private playStore: Writable<Dictionary<Play>> = writable({});
  /** SpaceEh -> zoomPct */
  private zoomStore: Writable<Dictionary<number>> = writable({});
  /** SpaceEh -> sessionEh */
  private currentSessionStore: Writable<Dictionary<EntryHashB64>> = writable({});
  /** agentPubKey -> timestamp */
  private agentPresenceStore: Writable<Dictionary<number>> = writable({});

  /** Static info */
  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
  public svgMarkers: Readable<Dictionary<SvgMarkerEntry>> = derived(this.svgMarkerStore, i => i)
  public emojiGroups: Readable<Dictionary<EmojiGroupEntry>> = derived(this.emojiGroupStore, i => i)
  public templates: Readable<Dictionary<TemplateEntry>> = derived(this.templateStore, i => i)
  public plays: Readable<Dictionary<Play>> = derived(this.playStore, i => i)
  public zooms: Readable<Dictionary<number>> = derived(this.zoomStore, i => i)
  public agentPresences: Readable<Dictionary<number>> = derived(this.agentPresenceStore, i => i)
  public currentSessions: Readable<Dictionary<EntryHashB64>> = derived(this.currentSessionStore, i => i)


  constructor(protected hcClient: BaseClient, profilesStore: ProfilesStore) {
    this.service = new WhereService(hcClient, "where");

    let cellClient = this.service.cellClient
    this.myAgentPubKey = this.service.myAgentPubKey;
    this.profiles = profilesStore;

    cellClient.addSignalHandler( appSignal => {
      if (! areEqual(cellClient.cellId[0],appSignal.data.cellId[0]) || !areEqual(cellClient.cellId[1], appSignal.data.cellId[1])) {
        return
      }
      const signal = appSignal.data.payload
      //if (signal.message.type != "Ping" && signal.message.type != "Pong") {
      //  console.debug(`SIGNAL: ${signal.message.type}`, appSignal)
      //}
      // Update agent's presence stat
      this.updatePresence(signal.from)
      // Send pong response
      if (signal.message.type != "Pong") {
        //console.log("PONGING ", payload.from)
        const pong: Signal = {
          maybeSpaceHash: signal.maybeSpaceHash,
          from: this.myAgentPubKey,
          message: {type: 'Pong', content: this.myAgentPubKey}
        };
        this.service.notify(pong, [signal.from])
      }
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
        if (!get(this.plays)[spaceEh]) {
          console.log("addPlay() from signal: " + spaceEh)
          /*await*/ this.addPlay(spaceEh)
        }
        break;
      case "NewHere":
        const hereInfo = signal.message.content;
        const newLocInfo: LocationInfo = this.service.locationFromHere(hereInfo)
        const newHereLinkHh = signal.message.content.linkHh;
        if (signal.maybeSpaceHash && get(this.plays)[signal.maybeSpaceHash]) {
          this.playStore.update(plays => {
            let locations = plays[signal.maybeSpaceHash].sessions[hereInfo.entry.sessionEh].locations
            const idx = locations.findIndex((locationInfo) => locationInfo!.linkHh == newHereLinkHh)
            if (idx > -1) {
              locations[idx] = newLocInfo
            } else {
              locations.push(newLocInfo)
            }
            return plays
          })
        }
        break;
      case "DeleteHere":
        const sessionEh = signal.message.content[0];
        const hereLinkHh = signal.message.content[1];
        if (signal.maybeSpaceHash && get(this.plays)[signal.maybeSpaceHash]) {
          this.playStore.update(plays => {
            let locations = plays[signal.maybeSpaceHash].sessions[sessionEh].locations
            const idx = locations.findIndex((locationInfo) => locationInfo && locationInfo.linkHh == hereLinkHh)
            if (idx > -1) {
              locations.splice(idx, 1);
            }
            return plays
          })
        }
        break;
      }
    })
  }

  
  pingOthers(spaceHash: EntryHashB64, myKey: AgentPubKeyB64) {
    const ping: Signal = {maybeSpaceHash: spaceHash, from: this.myAgentPubKey, message: {type: 'Ping', content: myKey}};
    // console.log({signal})
    this.service.notify(ping, this.others());
  }

  private others(): Array<AgentPubKeyB64> {
    return Object.keys(get(this.profiles.knownProfiles)).filter((key)=> key != this.myAgentPubKey)
  }

  private updatePresence(from: AgentPubKeyB64) {
    const currentTimeInSeconds: number = Math.floor(Date.now() / 1000);
    this.agentPresenceStore.update(agentPresences => {
      agentPresences[from] = currentTimeInSeconds;
      return agentPresences;
    })
    return from;
  }

  updateCurrentSession(spaceEh: EntryHashB64, sessionEh: EntryHashB64) {
    this.currentSessionStore.update(currentSessions => {
      currentSessions[spaceEh] = sessionEh;
      //console.log(" - updated current session for: " + spaceEh)
      //console.log({sessionEh})
      return currentSessions;
    })
  }

  async createNextSession(spaceEh: EntryHashB64, name: string): Promise<EntryHashB64> {
    const sessionEh = await this.service.createNextSession(spaceEh, name);
    this.updateCurrentSession(spaceEh, sessionEh);
    await this.updatePlays();
    return sessionEh;
  }

  private async addPlay(spaceEh: EntryHashB64): Promise<void>   {
    // - Check if already added
    if (get(this.plays)[spaceEh]) {
      console.log("addPlay() aborted. Already have this space")
      return;
    }
    // - Construct Play and add it to store
    const play: Play = await this.constructPlay(spaceEh)
    this.playStore.update(plays => {
      plays[spaceEh] = play
      //console.log({play})
      return plays
    })
    // - Set starting zoom for new Play
    if (!get(this.zoomStore)[spaceEh]) {
      this.zoomStore.update(zooms => {
        zooms[spaceEh] = 1.0
        return zooms
      })
    }
    // - Set currentSession for new Play
    const firstSessionEh = await this.service.getSessionAddress(spaceEh, 0);
    // console.log("addPlay() firstSessionEh: " + firstSessionEh)
    if (firstSessionEh) {
      this.updateCurrentSession(spaceEh, firstSessionEh)
    } else {
      console.error("No session found for Play " + play.space.name)
    }
  }

  async addTemplate(template: TemplateEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this.service.createTemplate(template)
    this.templateStore.update(templates => {
      templates[eh] = template
      return templates
    })
    this.service.notify(
      {maybeSpaceHash: null, from: this.myAgentPubKey, message: {type:"NewTemplate", content: eh}}
      , this.others());
    return eh
  }

  async updatePlays() : Promise<Dictionary<Play>> {
    const spaces = await this.service.getSpaces();
    //const hiddens = await this.service.getHiddenSpaceList();
    //console.log({hiddens})
    for (const space of spaces.values()) {
      //const visible = !hiddens.includes(space.hash)
      await this.addPlay(space.hash)
    }
    return get(this.playStore)
  }

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

  async addEmojiGroup(emojiGroup: EmojiGroupEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this.service.createEmojiGroup(emojiGroup)
    this.emojiGroupStore.update(emojiGroups => {
      emojiGroups[eh] = emojiGroup
      return emojiGroups
    })
    this.service.notify(
      {maybeSpaceHash: null, from: this.myAgentPubKey, message: {type:"NewEmojiGroup", content: eh}}
      , this.others());
    return eh
  }

  async addSvgMarker(svgMarker: SvgMarkerEntry) : Promise<EntryHashB64> {
    const eh: EntryHashB64 = await this.service.createSvgMarker(svgMarker)
    this.svgMarkerStore.update(svgMarkers => {
      svgMarkers[eh] = svgMarker
      return svgMarkers
    })
    this.service.notify(
      {maybeSpaceHash: null, from: this.myAgentPubKey, message: {type:"NewSvgMarker", content:eh}}
      , this.others());
    return eh
  }

  /** Get latest entries of each type and update local store accordingly */
  async pullDht() {
    console.log("pullDht()")
    const svgMarkers = await this.updateSvgMarkers();
    const emojiGroups = await this.updateEmojiGroups();
    const templates = await this.updateTemplates();
    const spaces = await this.updatePlays();
    console.log(`Entries found: ${Object.keys(spaces).length} | ${Object.keys(templates).length} | ${Object.keys(emojiGroups).length} | ${Object.keys(svgMarkers).length}`)
    //console.log({plays})
  }


  /**
   * Construct Play from all related DNA entries
   */
  async constructPlay(spaceEh: EntryHashB64): Promise<Play> {
    // - Space
    const spaceEntry = await this.service.getSpace(spaceEh)
    if (!spaceEntry) {
      console.error("Play not found")
      return Promise.reject("Play not found")
    }
    // - Sessions
    const sessionEhs = await this.service.getSpaceSessions(spaceEh);
    console.log("constructPlay() - session count: " + sessionEhs.length);
    if (sessionEhs.length == 0) {
      const session_eh = await this.service.createNextSession(spaceEh, "global");
      sessionEhs.push(session_eh)
    }
    let sessions: Dictionary<PlacementSession> = {};
    for (const sessionEh of sessionEhs) {
      const session = await this.service.sessionFromEntry(sessionEh);
      // - Heres
      const locations = await this.service.getLocations(sessionEh);
      session.locations = locations;
      Object.assign(sessions, {[sessionEh]: session})
    }
    // - Visible
    const visible = await this.service.isSpaceVisible(spaceEh);
    // - Done
    return {
      space: this.service.spaceFromEntry(spaceEntry),
      visible,
      sessions,
    } as Play;
  }


  /**
   * Create new empty play with starting space
   * Creates a default "global" session
   */
  async newPlay(space: Space, sessionNamesArray?: string[]): Promise<EntryHashB64> {
    let sessionNames = ["global"];
    if (sessionNamesArray && sessionNamesArray.length > 0 && sessionNamesArray[0] != "") {
      sessionNames = sessionNamesArray
    }
    // - Create and commit SpaceEntry
    const entry = this.service.spaceIntoEntry(space);
    const spaceEh: EntryHashB64 = await this.service.createSpaceWithSessions(entry, sessionNames)
    // - Notify others
    const newSpace: Signal = {maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: 'NewSpace', content: spaceEh}};
    this.service.notify(newSpace, this.others());
    // - Add play to store
    console.log("newPlay(): " + space.name + " | " + spaceEh)
    this.addPlay(spaceEh);
    // Done
    return spaceEh;
  }


  /**
   *
   */
  async hidePlay(spaceEh: EntryHashB64) : Promise<boolean> {
    const _hh = await this.service.hideSpace(spaceEh);
    this.playStore.update(plays => {
      plays[spaceEh].visible = false
      return plays
    })
    return true;
  }

  async unhidePlay(spaceEh: EntryHashB64) : Promise<boolean> {
    const _hh = await this.service.unhideSpace(spaceEh);
    this.playStore.update(plays => {
      plays[spaceEh].visible = true
      return plays
    })
    return true;
  }


  async addLocation(spaceEh: EntryHashB64, location: Location) : Promise<void> {
    const session = await this.service.getSession(location.sessionEh);
    const linkHh = await this.service.addLocation(location, spaceEh, session!.index)
    const locInfo: LocationInfo = { location, linkHh, authorPubKey: this.myAgentPubKey }
    this.playStore.update(spaces => {
      spaces[spaceEh].sessions[location.sessionEh].locations.push(locInfo)
      return spaces
    })
    // Notify peers
    const entry = this.service.hereFromLocation(location)
    this.service.notify({
      maybeSpaceHash: spaceEh,
      from: this.myAgentPubKey,
      message: {
        type: "NewHere",
        content: {entry, linkHh, author: this.myAgentPubKey}
      }}
      , this.others());
  }


  isCurrentSessionToday(spaceEh: EntryHashB64): boolean {
    const play = this.play(spaceEh);
    const currentSessionEh = this.currentSession(spaceEh);
    if (play.space.meta.canModifyPast) {
      return true;
    }
    let todaySessionEh = null;
    const today = new Intl.DateTimeFormat('en-GB', {timeZone: "America/New_York"}).format(new Date())
    Object.entries(play.sessions).map(
      ([key, session]) => {
        if (session.name == today /* "dummy-test-name" */) {
          todaySessionEh = key;
        }
      })
    return todaySessionEh == currentSessionEh;
  }

  async deleteAllMyLocations(spaceEh: EntryHashB64) {
    if (!this.isCurrentSessionToday(spaceEh)) {
      return;
    }
    const play = get(this.playStore)[spaceEh];
    const sessionEh = get(this.currentSessionStore)[spaceEh];
    let idx = 0;
    for (const locInfo of play.sessions[sessionEh].locations) {
      if (locInfo && locInfo.authorPubKey === this.myAgentPubKey) {
        await this.deleteLocation(spaceEh, idx);
      }
      idx += 1;
    }
  }


  async deleteLocation(spaceEh: EntryHashB64, idx: number) {
    const space = get(this.playStore)[spaceEh]
    const sessionEh = get(this.currentSessionStore)[spaceEh];
    const locInfo = space.sessions[sessionEh].locations[idx]!
    await this.service.deleteLocation(locInfo.linkHh)
    this.playStore.update(spaces => {
      spaces[spaceEh].sessions[sessionEh].locations[idx] = null
      return spaces
    })
    await this.service.notify({
        maybeSpaceHash: spaceEh,
        from: this.myAgentPubKey,
        message: {type: "DeleteHere", content: [locInfo.location.sessionEh, locInfo.linkHh]
        }},
      this.others());
  }


  async updateLocation(spaceEh: EntryHashB64, locIdx: number, c: Coord, tag?: string, emoji?: string) {
    const space = get(this.playStore)[spaceEh]
    const sessionEh = get(this.currentSessionStore)[spaceEh];
    const locInfo = space.sessions[sessionEh].locations[locIdx]!
    locInfo.location.coord = c
    if (tag != null) {
      locInfo.location.meta.tag = tag
    }
    if (emoji != null) {
      locInfo.location.meta.emoji = emoji
    }
    const session = await this.service.getSession(sessionEh);
    const newLinkHh: HeaderHashB64 = await this.service.addLocation(locInfo.location, spaceEh, session!.index)
    await this.service.deleteLocation(locInfo.linkHh)
    const oldHereHh = locInfo.linkHh;
    locInfo.linkHh = newLinkHh;
    const oldSessionEh = locInfo.location.sessionEh;
    this.playStore.update(spaces => {
      spaces[spaceEh].sessions[sessionEh].locations[locIdx] = locInfo
      return spaces
    })
    const entry = this.service.hereFromLocation(locInfo.location)
    await this.service.notify({maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: "DeleteHere", content: [oldSessionEh, oldHereHh]}}, this.others());
    await this.service.notify({maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: "NewHere", content: {entry, linkHh: newLinkHh, author: this.myAgentPubKey}}}, this.others());
  }

  /** Get locIdx of first location from agent with given name */
  getAgentLocIdx(spaceEh: EntryHashB64, agent: string) : number {
    const sessionEh = get(this.currentSessionStore)[spaceEh];
    return get(this.playStore)[spaceEh].sessions[sessionEh].locations.findIndex((locInfo) => locInfo && locInfo.location.meta.authorName == agent)
  }

  template(templateEh64: EntryHashB64): TemplateEntry {
      return get(this.templateStore)[templateEh64];
  }

  play(spaceEh: EntryHashB64): Play {
    return get(this.playStore)[spaceEh];
  }

  currentSession(spaceEh: EntryHashB64): EntryHashB64 {
    return get(this.currentSessionStore)[spaceEh];
  }

  zoom(spaceEh: EntryHashB64) : number {
    return get(this.zoomStore)[spaceEh]
  }

  updateZoom(spaceEh: EntryHashB64, delta: number) : void {
    this.zoomStore.update(zooms => {
      if (zooms[spaceEh] + delta < 0.1) {
        zooms[spaceEh] = 0.1
      } else {
        zooms[spaceEh] += delta;
      }
      return zooms
    })
  }
}
