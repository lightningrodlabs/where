import {ActionHashB64, AgentPubKeyB64, Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";
import {
  WhereLocation,
  LocationInfo, PlacementSession,
  Play,
  Space, convertSpaceToEntry,
  convertLocationToHere, convertEntryToSpace, Coord,
} from "./where.perspective";
import {AppSignal} from "@holochain/client/lib/api/app/types";
import {areCellsEqual, HoloHashedB64} from "../utils";
import {DnaClient, DnaViewModel} from "@ddd-qc/dna-client";
import {SpaceEntry} from "./playset.bindings";
import {ReactiveElement} from "lit";
import {PlaysetZvm} from "./playset.zvm";
import {WhereZvm} from "./where.zvm";
import {WhereSignal} from "./where.signals";
import {createContext} from "@lit-labs/context";


// /** */
// export interface WhereDnaPerspective {
//   plays: Dictionary<Play>,
//   currentSessions: Dictionary<EntryHashB64>,
//   zooms: Dictionary<number>,
//   agentPresences: Dictionary<number>,
// }
//


/**
 * ViewModel fo the Where DNA
 * Holds 2 zomes:
 *  - Playset
 *  - Where
 */
export class WhereDvm extends DnaViewModel {

  /** async factory */
  static async new(host: ReactiveElement, port: number, installedAppId: string): Promise<WhereDvm> {
    let dnaClient = await DnaClient.new(port, installedAppId);
    return new WhereDvm(host, dnaClient);
  }


  /** */
  private constructor(host: ReactiveElement, dnaClient: DnaClient) {
    super(host, dnaClient);
    this.addZomeViewModel(PlaysetZvm);
    this.addZomeViewModel(WhereZvm);
    dnaClient.addSignalHandler(this.handleSignal)
    // this.profiles = profilesStore;
  }

  /** */
  static context = createContext<WhereDvm>('dvm/where');
  getContext(): any {return WhereDvm.context}

  /** Private */
  //private profiles: ProfilesStore

  /** */
  get playsetZvm(): PlaysetZvm { return this.getZomeViewModel("where_playset") as PlaysetZvm}
  get whereZvm(): WhereZvm { return this.getZomeViewModel("where") as WhereZvm}


  /** -- Feilds -- */

  /** SpaceEh -> zoomPct */
  private _zooms: Dictionary<number> = {};
  /** agentPubKey -> timestamp */
  private _agentPresences: Dictionary<number> = {};

  /** SpaceEh -> Play */
  //private _plays: Dictionary<Play> = {};
  /** SpaceEh -> sessionEh */
  private _currentSessions: Dictionary<EntryHashB64> = {};


  getZoom(spaceEh: EntryHashB64): number | undefined { return this._zooms[spaceEh]}
  //getPlay(spaceEh: EntryHashB64): Play | undefined { return this._plays[spaceEh]}
  getCurrentSession(spaceEh: EntryHashB64): EntryHashB64 | undefined { return this._currentSessions[spaceEh]}


  /** */
  setCurrentSession(spaceEh: EntryHashB64, sessionEh: EntryHashB64) {
    this._currentSessions[spaceEh] = sessionEh;
    this.notify();
  }



  /** */
  async createNextSession(spaceEh: EntryHashB64, name: string): Promise<EntryHashB64> {
    const sessionEh = await this._bridge.createNextSession(spaceEh, name);
    this.setCurrentSession(spaceEh, sessionEh);
    return sessionEh;
  }


  /** */
  async deleteAllMyLocations(spaceEh: EntryHashB64) {
    if (!this.isCurrentSessionToday(spaceEh)) {
      return;
    }
    const play = this.whereZvm.getPlay(spaceEh);
    const sessionEh = this.getCurrentSession(spaceEh);
    let idx = 0;
    for (const locInfo of play!.sessions[sessionEh!].locations) {
      if (locInfo && locInfo.authorPubKey === this._dnaClient.myAgentPubKey) {
        await this.deleteLocation(spaceEh, idx);
      }
      idx += 1;
    }
  }


  /** Get locIdx of first location from agent with given name */
  getAgentLocIdx(spaceEh: EntryHashB64, agent: string): number {
    const sessionEh = this.getCurrentSession(spaceEh);
    const play = this.whereZvm.getPlay(spaceEh);
    return play!.sessions[sessionEh!].locations.findIndex((locInfo) => locInfo && locInfo.location.meta.authorName == agent)
  }


  /** */
  isCurrentSessionToday(spaceEh: EntryHashB64): boolean {
    const play = this.whereZvm.getPlay(spaceEh);
    const currentSessionEh = this.getCurrentSession(spaceEh);
    if (!play || !currentSessionEh) {
      return false;
    }
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



  /** -- Methods -- */

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
    /* Update agent's presence stat */
    this.updatePresence(signal.from)
    /* Send pong response */
    if (signal.message.type != "Pong") {
      //console.log("PONGING ", payload.from)
      const pong: WhereSignal = {
        maybeSpaceHash: signal.maybeSpaceHash,
        from: this._dnaClient.myAgentPubKey,
        message: {type: 'Pong', content: this._dnaClient.myAgentPubKey}
      };
      this.sendSignal(pong, [signal.from])
    }
    /* Handle signal */
    switch(signal.message.type) {
      case "Ping":
      case "Pong":
        break;
      case "NewSvgMarker":
        const svgEh = signal.message.content
        this.playsetZvm.getSvgMarker(svgEh).then(maybeSvg => {
          if (maybeSvg) {
            this.playsetZvm.addSvgMarker(svgEh, maybeSvg)
          }
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
        const newHereLinkAh = signal.message.content.linkAh;
        if (signal.maybeSpaceHash && get(this.plays)[signal.maybeSpaceHash]) {
          this._plays.update(plays => {
            let locations = plays[signal.maybeSpaceHash].sessions[hereInfo.entry.sessionEh].locations
            const idx = locations.findIndex((locationInfo) => locationInfo!.linkAh == newHereLinkAh)
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
        const hereLinkAh = signal.message.content[1];
        if (signal.maybeSpaceHash && get(this.plays)[signal.maybeSpaceHash]) {
          this._plays.update(plays => {
            let locations = plays[signal.maybeSpaceHash].sessions[sessionEh].locations
            const idx = locations.findIndex((locationInfo) => locationInfo && locationInfo.linkAh == hereLinkAh)
            if (idx > -1) {
              locations.splice(idx, 1);
            }
            return plays
          })
        }
        break;
    }
  }


  /** */
  async sendSignal(signal: WhereSignal, folks: Array<AgentPubKeyB64>): Promise<void> {
    if (signal.message.type != "Ping" && signal.message.type != "Pong") {
      console.debug(`NOTIFY ${signal.message.type}`, signal, folks)
    }
    /* Skip if no recipients or sending to self only */
    if (!folks || folks.length == 1 && folks[0] === this.myAgentPubKey) {
      console.log("notify() aborted: No recipients for notification")
      return;
    }
    return this.whereZvm.sendSignal(signal, folks);
  }


  /** */
  async pingOthers(spaceHash: EntryHashB64, myKey: AgentPubKeyB64) {
    const ping: WhereSignal = {maybeSpaceHash: spaceHash, from: this._dnaClient.myAgentPubKey, message: {type: 'Ping', content: myKey}};
    // console.log({signal})
    this.sendSignal(ping, await this.others());
  }


  /** */
  async others(): Promise<Array<AgentPubKeyB64>> {
    let keysB64 = new Array();
    // const profiles = get(await this.profiles.fetchAllProfiles());
    // console.log({profiles})
    // keysB64 = profiles.keys()
    //   .map(key => serializeHash(key))
    //   .filter((key)=> key != this.myAgentPubKey)
    // console.log({keysB64})
    return keysB64
  }


  /** */
  private updatePresence(from: AgentPubKeyB64) {
    // const currentTimeInSeconds: number = Math.floor(Date.now() / 1000);
    // this._agentPresences.update(agentPresences => {
    //   agentPresences[from] = currentTimeInSeconds;
    //   return agentPresences;
    // })
    // return from;
  }



  /** */
  // async getInventory(roleId?: string): Promise<Inventory> {
  //   if (!roleId) {
  //     return this.callPlaysetZome('get_inventory', null);
  //   }
  //
  //   let cell: InstalledCell | undefined = undefined;
  //   for (const cell_data of this.appInfo.cell_data) {
  //     if (cell_data.role_id == roleId) {
  //       cell = cell_data;
  //       break;
  //     }
  //   }
  //   if (cell == undefined) {
  //     return Promise.reject("Cell not found for role: " + roleId);
  //   }
  //
  //   return this.client.callZome(
  //     cell.cell_id,
  //     "where_playset",
  //     'get_inventory',
  //     null,
  //     15000
  //   );
  //
  // }


  /** Space */



  /** Space·s */


  private async addPlay(spaceEh: EntryHashB64): Promise<void>   {
    /* Check if already added */
    if (this.getPlay(spaceEh)) {
      console.log("addPlay() aborted. Already have this space")
      return;
    }
    /* Construct Play and add it to store */
    const play: Play = await this.constructPlay(spaceEh);
    this._plays[spaceEh] = play
    /* Set starting zoom for new Play */
    if (!this._zooms[spaceEh]) {
        this._zooms[spaceEh] = 1.0
    }
    /* Set currentSession for new Play */
    const firstSessionEh = await this.whereZvm.getSessions(spaceEh)![0];
    // console.log("addPlay() firstSessionEh: " + firstSessionEh)
    if (firstSessionEh) {
      this._currentSessions[spaceEh] = firstSessionEh;
    } else {
      console.error("No session found for Play " + play.space.name)
    }
    this.notify();
  }


  /** */
  async probePlays() : Promise<Dictionary<Play>> {
    const spaces = this.playsetZvm.perspective.spaces;
    //const hiddens = await this.service.getHiddenSpaceList();
    //console.log({hiddens})
    for (const space of Object.values(spaces)) {
      //const visible = !hiddens.includes(space.hash)
      await this.addPlay(space.hash)
    }
    return this._plays
  }


  /** */
  async getVisibleSpaces(): Promise<Array<HoloHashedB64<SpaceEntry>>> {
    let alls = this.playsetZvm.perspective.spaces;
    let hiddens = await this.getHiddenSpaceList();
    let visibles = Array();
    for (const space of Object.values(alls)) {
      if (!hiddens.includes(space.hash)) {
        visibles.push(space)
      }
    }
    return visibles;
  }


  /** */
  async isSpaceVisible(spaceEh: EntryHashB64): Promise<boolean> {
    const visibles: Array<HoloHashedB64<SpaceEntry>> = await this.getVisibleSpaces();
    //console.log({visibles})
    for (const visible of visibles) {
      if (visible.hash == spaceEh) {
        return true;
      }
    }
    return false;
  }




  /** Misc */


  // getEntryDefs(zomeName: string) {
  //   console.debug("getEntryDefs() for " + zomeName + " ...")
  //   const result = this.client.callZome(this.mainCellId, zomeName, "zome_info", null, 10 * 1000);
  //   //const result = this.client.callZome(this.mainCellId, zomeName, "entry_defs", null, 10 * 1000);
  //   console.debug("getEntryDefs() for " + zomeName + "() result:")
  //   console.debug({result})
  // }


  /** */
  updateZoom(spaceEh: EntryHashB64, delta: number): void {
      if (this._zooms[spaceEh] + delta < 0.1) {
        this._zooms[spaceEh] = 0.1
      } else {
        this._zooms[spaceEh] += delta;
      }
      this.notify();
  }


  /**
   * Construct Play from all related DNA entries
   */
  async constructPlay(spaceEh: EntryHashB64): Promise<Play> {
    /* - Space */
    const spaceEntry = await this.playsetZvm.getSpace(spaceEh)
    if (!spaceEntry) {
      console.error("Space not found")
      return Promise.reject("Space not found")
    }
    /* - Sessions */
    const sessionEhs = await this.whereZvm.getSessions(spaceEh)!;
    console.log("constructPlay() - session count: " + sessionEhs.length);
    if (sessionEhs.length == 0) {
      const session_eh = await this.whereZvm.createNextSession(spaceEh, "global");
      sessionEhs.push(session_eh)
    }
    let sessions: Dictionary<PlacementSession> = {};
    for (const sessionEh of sessionEhs) {
      const session = await this.whereZvm.fetchSession(sessionEh);
      /* - Heres */
      const locations = await this.whereZvm.fetchLocations(sessionEh);
      session.locations = locations;
      Object.assign(sessions, {[sessionEh]: session})
    }
    /* - Visible */
    const visible = await this.isSpaceVisible(spaceEh);
    /* - Done */
    return {
      space: convertEntryToSpace(spaceEntry),
      visible,
      sessions,
    };
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
    /* - Create and commit SpaceEntry */
    const entry = convertSpaceToEntry(space);
    const spaceEh: EntryHashB64 = await this.createSpaceWithSessions(entry, sessionNames)
    /* - Add play to store */
    console.log("newPlay(): " + space.name + " | " + spaceEh)
    this.addPlay(spaceEh);
    /* Done */
    return spaceEh;
  }


  /** */
  async createSpaceWithSessions(space: SpaceEntry, sessionNames: string[]): Promise<EntryHashB64> {
    console.log("createSpaceWithSessions(): " + sessionNames);
    console.log({space})
    let spaceEh = await this.playsetZvm.publishSpaceEntry(space);
    console.log("createSpaceWithSessions(): " + spaceEh);
    await this.whereZvm.createSessions(spaceEh, sessionNames);
    return spaceEh;
  }


  async updateLocation(spaceEh: EntryHashB64, locIdx: number, c: Coord, others: Array<AgentPubKeyB64>, tag?: string, emoji?: string) {
    const play = this.whereZvm.getPlay(spaceEh);
    const sessionEh = this.getCurrentSession(spaceEh);
    if (!play || !sessionEh) {
      console.warn("updateLocation() failed: Play or Session not found", spaceEh);
      return;
    }
    const oldLocInfo = play.sessions[sessionEh].locations[locIdx]!
   const newLocInfo = await this.whereZvm.updateLocation(play, sessionEh, locIdx, c, tag, emoji);
    const entry = convertLocationToHere(newLocInfo.location)
    await this.sendSignal({maybeSpaceHash: spaceEh, from: this._dnaClient.myAgentPubKey, message: {type: "DeleteHere", content: [oldLocInfo.location.sessionEh, oldLocInfo.linkAh]}},
      others);
    await this.sendSignal({maybeSpaceHash: spaceEh, from: this._dnaClient.myAgentPubKey, message: {type: "NewHere", content: {entry, linkAh: newLocInfo.linkAh, author: this._dnaClient.myAgentPubKey}}},
      others);
  }

    /** */
  async deleteLocation(spaceEh: EntryHashB64, idx: number) {
    const play = this.whereZvm.getPlay(spaceEh);
    const sessionEh = this.getCurrentSession(spaceEh);
    if (!play || !sessionEh) {
      console.warn("deleteLocation() failed: Space or session not found", spaceEh);
      return Promise.reject("Space or session not found");
    }
    const locInfo = await this.whereZvm.deleteLocation(play, sessionEh, idx);
    await this.sendSignal({
        maybeSpaceHash: spaceEh,
        from: this._dnaClient.myAgentPubKey,
        message: {type: "DeleteHere", content: [locInfo.location.sessionEh, locInfo.linkAh]
        }},
      await this.others());
  }


  /** */
  async publishLocation(spaceEh: EntryHashB64, location: WhereLocation): Promise<void> {
    const linkAh = await this.whereZvm.publishLocation(spaceEh, location);
    /* Notify peers */
    const entry = convertLocationToHere(location)
    this.sendSignal({
        maybeSpaceHash: spaceEh,
        from: this._dnaClient.myAgentPubKey,
        message: {
          type: "NewHere",
          content: {entry, linkAh, author: this._dnaClient.myAgentPubKey}
        }
      }
      , await this.others());
  }
}

