import {AgentPubKeyB64, Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";
import {HoloHashed} from "@holochain/client";
import {serializeHash} from "@holochain-open-dev/utils";
import {Location, Play, Space, WhereSignal} from "./where.perspective";
import {AppSignal} from "@holochain/client/lib/api/app/types";
import {areCellsEqual} from "../utils";
import {ProfilesStore} from "@holochain-open-dev/profiles";
import {DnaClient} from "@ddd-qc/dna-client";
import {WhereBridge} from "./where.bridge";
import {SpaceEntry} from "./playset.bindings";

/** */
export interface WhereDnaPerspective {
  plays: Dictionary<Play>,
  currentSessions: Dictionary<EntryHashB64>,
  zooms: Dictionary<number>,
  agentPresences: Dictionary<number>,
}



export class WhereDnaViewModel {
  /** Ctor */
  constructor(protected _dnaClient: DnaClient, profilesStore: ProfilesStore) {
    //super(new WhereBridge(_dnaClient));
    this.profiles = profilesStore;
    _dnaClient.addSignalHandler(this.handleSignal)
  }

  /** Private */
  private profiles: ProfilesStore



  /** SpaceEh -> zoomPct */
  private _zooms: Dictionary<number> = {};
  /** agentPubKey -> timestamp */
  private _agentPresences: Dictionary<number> = {};


  /** */
  handleSignal(appSignal: AppSignal): void {
    if (!areCellsEqual(this._dnaClient.cellId, appSignal.data.cellId)) {
      console.trace("Rejected Signal not for this Cell");
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
      const pong: WhereSignal = {
        maybeSpaceHash: signal.maybeSpaceHash,
        from: this._dnaClient.myAgentPubKey,
        message: {type: 'Pong', content: this._dnaClient.myAgentPubKey}
      };
      this.sendSignal(pong, [signal.from])
    }
    // Handle signal
    switch(signal.message.type) {
      case "Ping":
      case "Pong":
        break;
      case "NewSvgMarker":
        const svgEh = signal.message.content
        this.bridge.getSvgMarker(svgEh).then(svg => {
          this.svgMarkerStore.update(store => {
            store[svgEh] = svg
            return store
          })
        })
        break;
      case "NewEmojiGroup":
        const groupEh = signal.message.content
        this.bridge.getEmojiGroup(groupEh).then(group => {
          this.emojiGroupStore.update(emojiGroups => {
            emojiGroups[groupEh] = group
            return emojiGroups
          })
        })
        break;
      case "NewTemplate":
        const templateEh = signal.message.content
        this.bridge.getTemplate(templateEh).then(template => {
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
        const newLocInfo: LocationInfo = this.bridge.locationFromHere(hereInfo)
        const newHereLinkHh = signal.message.content.linkHh;
        if (signal.maybeSpaceHash && get(this.plays)[signal.maybeSpaceHash]) {
          this._plays.update(plays => {
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
          this._plays.update(plays => {
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
  }


  async sendSignal(signal: WhereSignal, folks: Array<AgentPubKeyB64>): Promise<void> {
    if (signal.message.type != "Ping" && signal.message.type != "Pong") {
      console.debug(`NOTIFY ${signal.message.type}`, signal, folks)
    }
    /* Skip if no recipients or sending to self only */
    if (!folks || folks.length == 1 && folks[0] === this.myAgentPubKey) {
      console.log("notify() aborted: No recipients for notification")
      return;
    }
    return this._bridge.notify(signal, folks);
  }

  async pingOthers(spaceHash: EntryHashB64, myKey: AgentPubKeyB64) {
    const ping: WhereSignal = {maybeSpaceHash: spaceHash, from: this._dnaClient.myAgentPubKey, message: {type: 'Ping', content: myKey}};
    // console.log({signal})
    this.notify(ping, await this.others());
  }

  private async others(): Promise<Array<AgentPubKeyB64>> {
    const profiles = get(await this.profiles.fetchAllProfiles());
    console.log({profiles})
    const keysB64 = profiles.keys()
      .map(key => serializeHash(key))
      .filter((key)=> key != this.myAgentPubKey)
    console.log({keysB64})
    return keysB64
  }

  private updatePresence(from: AgentPubKeyB64) {
    const currentTimeInSeconds: number = Math.floor(Date.now() / 1000);
    this._agentPresences.update(agentPresences => {
      agentPresences[from] = currentTimeInSeconds;
      return agentPresences;
    })
    return from;
  }



  /** */
  async getInventory(roleId?: string): Promise<Inventory> {
    if (!roleId) {
      return this.callPlaysetZome('get_inventory', null);
    }

    let cell: InstalledCell | undefined = undefined;
    for (const cell_data of this.appInfo.cell_data) {
      if (cell_data.role_id == roleId) {
        cell = cell_data;
        break;
      }
    }
    if (cell == undefined) {
      return Promise.reject("Cell not found for role: " + roleId);
    }

    return this.client.callZome(
      cell.cell_id,
      "where_playset",
      'get_inventory',
      null,
      15000
    );

  }

  async isSpaceVisible(spaceEh: EntryHashB64): Promise<boolean> {
    const visibles: Array<HoloHashed<SpaceEntry>> = await this.getVisibleSpaces();
    //console.log({visibles})
    for (const visible of visibles) {
      if (serializeHash(visible.hash) == spaceEh) {
        return true;
      }
    }
    return false;
  }





  /** Space */


  async createSpaceWithSessions(space: SpaceEntry, sessionNames: string[]): Promise<EntryHashB64> {
    console.log("createSpaceWithSessions(): " + sessionNames);
    console.log({space})
    let spaceEh = await this.createSpace(space);
    console.log("createSpaceWithSessions(): " + spaceEh);
    await this.callWhereZome('create_sessions', {sessionNames, spaceEh});
    return spaceEh;
  }


  /** Space·s */


  private async addPlay(spaceEh: EntryHashB64): Promise<void>   {
    /* Check if already added */
    if (this._plays[spaceEh]) {
      console.log("addPlay() aborted. Already have this space")
      return;
    }
    // - Construct Play and add it to store
    const play: Play = await this.constructPlay(spaceEh)
    this._plays[spaceEh] = play
    // - Set starting zoom for new Play
    if (!get(this._zooms)[spaceEh]) {
      this._zooms.update(zooms => {
        zooms[spaceEh] = 1.0
        return zooms
      })
    }
    // - Set currentSession for new Play
    const firstSessionEh = await this.bridge.getSessionAddress(spaceEh, 0);
    // console.log("addPlay() firstSessionEh: " + firstSessionEh)
    if (firstSessionEh) {
      this.setCurrentSession(spaceEh, firstSessionEh)
    } else {
      console.error("No session found for Play " + play.space.name)
    }
  }


  async probePlays() : Promise<Dictionary<Play>> {
    const spaces = await this._bridge.getSpaces();
    //const hiddens = await this.service.getHiddenSpaceList();
    //console.log({hiddens})
    for (const space of spaces.values()) {
      //const visible = !hiddens.includes(space.hash)
      await this.addPlay(space.hash)
    }
    return this._plays
  }

  async getSpaces(): Promise<Array<HoloHashed<SpaceEntry>>> {
    return this.callPlaysetZome('get_spaces', null);
  }

  async getVisibleSpaces(): Promise<Array<HoloHashed<SpaceEntry>>> {
    let alls = await this.getSpaces();
    let hiddens = await this.getHiddenSpaceList();
    let visibles = Array();
    for (const space of alls) {
      if (!hiddens.includes(space.hash)) {
        visibles.push(space)
      }
    }
    return visibles;
  }

  async getHiddenSpaceList(): Promise<Array<EntryHashB64>> {
    return this.callWhereZome('get_hidden_spaces', null);
  }

  async isSpaceVisible(spaceEh: EntryHashB64): Promise<boolean> {
    const visibles: Array<HoloHashed<SpaceEntry>> = await this.getVisibleSpaces();
    //console.log({visibles})
    for (const visible of visibles) {
      if (visible.hash == spaceEh) {
        return true;
      }
    }
    return false;
  }



  /** Location */

  async addLocation(location: Location, spaceEh: EntryHashB64, sessionIndex: number): Promise<ActionHashB64> {
    const entry = this.hereFromLocation(location);
    const input = {spaceEh, sessionIndex, value: entry.value, meta: entry.meta}
    return this.where.addHere(input);
  }

  async updateLocation(hereHh: ActionHashB64, location: Location, spaceEh: EntryHashB64, sessionIndex: number): Promise<ActionHashB64> {
    const entry = this.hereFromLocation(location);
    const input = {oldHereHh: hereHh, newHere: {spaceEh, sessionIndex, value: entry.value, meta: entry.meta}}
    return this.callWhereZome('update_here', input);
  }

  async deleteLocation(hereHh: ActionHashB64): Promise<EntryHashB64> {
    return this.callWhereZome('delete_here', hereHh);
  }

  async getLocations(sessionEh: EntryHashB64): Promise<Array<LocationInfo>> {
    const hereInfos =  await this.callWhereZome('get_heres', sessionEh);
    //console.debug({hereInfos})
    return hereInfos.map((info: HereInfo) => {
      return this.locationFromHere(info)
    });
  }

  /** Misc */

  async notify(signal: Signal, folks: Array<AgentPubKeyB64>): Promise<void> {
    if (signal.message.type != "Ping" && signal.message.type != "Pong") {
     console.debug(`NOTIFY ${signal.message.type}`, signal, folks)
    }
    /* Skip if no recipients or sending to self only */
    if (!folks || folks.length == 1 && folks[0] === this.myAgentPubKey) {
      console.log("notify() aborted: No recipients for notification")
      return;
    }
    return this.callWhereZome('notify', {signal, folks});
  }


  getEntryDefs(zomeName: string) {
    console.debug("getEntryDefs() for " + zomeName + " ...")
    const result = this.client.callZome(this.mainCellId, zomeName, "zome_info", null, 10 * 1000);
    //const result = this.client.callZome(this.mainCellId, zomeName, "entry_defs", null, 10 * 1000);
    console.debug("getEntryDefs() for " + zomeName + "() result:")
    console.debug({result})
  }


  private callWhereZome(fn_name: string, payload: any): Promise<any> {
    //console.debug("callZome: " + fn_name)
    //console.debug({payload})
    const result = this.client.callZome(this.mainCellId, "where", fn_name, payload, 10 * 1000);
    //console.debug("callZome: " + fn_name + "() result")
    //console.debug({result})
    return result;
  }

  private callPlaysetZome(fn_name: string, payload: any): Promise<any> {
    //console.debug("callZome: " + fn_name)
    //console.debug({payload})
    const result = this.client.callZome(this.mainCellId,"where_playset", fn_name, payload, 10 * 1000);
    //console.debug("callZome: " + fn_name + "() result")
    //console.debug({result})
    return result;
  }


  /**
   * Create new empty space
   */
  async newSpace(space: Space): Promise<EntryHashB64> {
    // - Create and commit SpaceEntry
    const entry = this.spaceIntoEntry(space);
    const spaceEh: EntryHashB64 = await this._playsetVm.publishSpace(entry)
    // - Notify others
    // const newSpace: Signal = {maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: 'NewSpace', content: spaceEh}};
    //this.service.notify(newSpace, this.others());
    // - Add play to store
    console.log("newSpace(): " + space.name + " | " + spaceEh)
    // Done
    return spaceEh;
  }


  updateZoom(spaceEh: EntryHashB64, delta: number) : void {
    this._zooms.update(zooms => {
      if (zooms[spaceEh] + delta < 0.1) {
        zooms[spaceEh] = 0.1
      } else {
        zooms[spaceEh] += delta;
      }
      return zooms
    })
  }


  /**
   * Construct Play from all related DNA entries
   */
  async constructPlay(spaceEh: EntryHashB64): Promise<Play> {
    // - Space
    const spaceEntry = await this.bridge.getSpace(spaceEh)
    if (!spaceEntry) {
      console.error("Play not found")
      return Promise.reject("Play not found")
    }
    // - Sessions
    const sessionEhs = await this.bridge.getSpaceSessions(spaceEh);
    console.log("constructPlay() - session count: " + sessionEhs.length);
    if (sessionEhs.length == 0) {
      const session_eh = await this.bridge.createNextSession(spaceEh, "global");
      sessionEhs.push(session_eh)
    }
    let sessions: Dictionary<PlacementSession> = {};
    for (const sessionEh of sessionEhs) {
      const session = await this.bridge.sessionFromEntry(sessionEh);
      // - Heres
      const locations = await this.bridge.getLocations(sessionEh);
      session.locations = locations;
      Object.assign(sessions, {[sessionEh]: session})
    }
    // - Visible
    const visible = await this.bridge.isSpaceVisible(spaceEh);
    // - Done
    return {
      space: this.bridge.spaceFromEntry(spaceEntry),
      visible,
      sessions,
    } as Play;
  }


  // async createSessions(space: SpaceEntry, sessionNames: string[]): Promise<EntryHashB64> {
  //   console.log("createSpaceWithSessions(): " + sessionNames);
  //   let spaceEh = await this._playset.createSpace(space);
  //   console.log("createSpaceWithSessions(): " + spaceEh);
  //   await this._where.CreateSessions({sessionNames, spaceEh});
  //   return spaceEh;
  // }


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
    const entry = this.bridge.spaceIntoEntry(space);
    const spaceEh: EntryHashB64 = await this.bridge.createSpaceWithSessions(entry, sessionNames)
    // - Notify others
    const newSpace: WhereSignal = {maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: 'NewSpace', content: spaceEh}};
    this.bridge.notify(newSpace, await this.others());
    // - Add play to store
    console.log("newPlay(): " + space.name + " | " + spaceEh)
    this.addPlay(spaceEh);
    // Done
    return spaceEh;
  }


  /** */
  async addLocation(spaceEh: EntryHashB64, location: Location) : Promise<void> {
    const session = await this.bridge.getSession(location.sessionEh);
    const linkHh = await this.bridge.addLocation(location, spaceEh, session!.index)
    const locInfo: LocationInfo = { location, linkHh, authorPubKey: this.myAgentPubKey }
    this._plays.update(spaces => {
      spaces[spaceEh].sessions[location.sessionEh].locations.push(locInfo)
      return spaces
    })
    // Notify peers
    const entry = this.bridge.hereFromLocation(location)
    this.sendSignal({
        maybeSpaceHash: spaceEh,
        from: this.myAgentPubKey,
        message: {
          type: "NewHere",
          content: {entry, linkHh, author: this.myAgentPubKey}
        }}
      , await this.others());
  }


  /** -- Conversions -- */

  async sessionFromEntry(sessionEh: EntryHashB64): Promise<PlacementSession> {
    const entry = await this.getSession(sessionEh);
    if (entry) {
      return {
        name: entry.name,
        index: entry.index,
        locations: await this.getLocations(sessionEh)
      }
    }
    console.error("sessionFromEntry(): Session entry not found")
    return Promise.reject();
  }

  spaceFromEntry(entry: SpaceEntry): Space {
    return {
      name: entry.name,
      origin: entry.origin,
      surface: JSON.parse(entry.surface),
      maybeMarkerPiece: entry.maybeMarkerPiece,
      meta: entry.meta ? this.metaFromEntry(entry.meta) : defaultPlayMeta(),
    }
  }

  spaceIntoEntry(space: Space): SpaceEntry {
    return {
      name: space.name,
      origin: space.origin,
      surface: JSON.stringify(space.surface),
      maybeMarkerPiece: space.maybeMarkerPiece,
      meta: this.metaIntoEntry(space.meta)
    }
  }

  metaFromEntry(meta: Dictionary<string>): PlayMeta {
    let spaceMeta: any = {};
    try {
      for (const [key, value] of Object.entries(meta)) {
        Object.assign(spaceMeta, {[key]: JSON.parse(value, this.reviver)})
      }
    } catch (e) {
      console.error("Failed parsing meta filed into PlayMeta")
      console.error(e)
    }
    //console.log({spaceMeta})
    return spaceMeta as PlayMeta;
  }

  metaIntoEntry(playMeta: PlayMeta): Dictionary<string> {
    let dic: Dictionary<string> = {};
    for (const [key, value] of Object.entries(playMeta)) {
      dic[key] = JSON.stringify(value, this.replacer)
    }
    //console.log({dic})
    return dic
  }


  locationFromHere(info: HereInfo) : LocationInfo {
    let locationMeta:any = {};
    try {
      for (const [key, value] of Object.entries(info.entry.meta)) {
        Object.assign(locationMeta, {[key]: JSON.parse(value, this.reviver)})
      }
    } catch (e) {
      console.error("Failed parsing meta filed into LocationMeta")
      console.error(e)
    }
    //
    return {
      location: {
        coord: JSON.parse(info.entry.value),
        sessionEh: info.entry.sessionEh,
        meta: locationMeta,
      },
      linkHh: info.linkHh,
      authorPubKey: info.author,
    }
  }

}
