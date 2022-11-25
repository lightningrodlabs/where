import {AgentPubKeyB64, Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";
import {
  LocationInfo, PlacementSession, Play,
  convertLocationToHere, Coord, convertHereToLocation,
} from "./where.perspective";
import {AppSignal} from "@holochain/client/lib/api/app/types";
import {areCellsEqual} from "../utils";
import {DnaViewModel, HappViewModel} from "@ddd-qc/dna-client";
import {SpaceEntry} from "./playset.bindings";
import {PlaysetZvm} from "./playset.zvm";
import {WhereZvm} from "./where.zvm";
import {WhereSignal} from "./where.signals";
import {convertSpaceToEntry, Space} from "./playset.perspective";
import {ProfilesZvm} from "./profiles.zvm";


/** */
export interface WhereDnaPerspective {
  plays: Dictionary<Play>,
  currentSessions: Dictionary<EntryHashB64>,
  zooms: Dictionary<number>,
  agentPresences: Dictionary<number>,
}


/**
 * ViewModel fo the Where DNA
 * Holds 3 zomes:
 *  - Playset
 *  - Where
 *  - Profiles
 */
export class WhereDvm extends DnaViewModel {

  /** */
  constructor(happ: HappViewModel, roleId: string) {
    super(happ, roleId, [PlaysetZvm, WhereZvm, ProfilesZvm]);
    happ.conductorAppProxy.addSignalHandler(this.handleSignal)
  }

  /** -- ViewModel Interface -- */

  protected hasChanged(): boolean {return true}

  get perspective(): WhereDnaPerspective {
    return {
      plays: this._plays,
      currentSessions: this._currentSessions,
      zooms: this._zooms,
      agentPresences: this._agentPresences,
    }
  }

  /** SpaceEh -> Play */
  private _plays: Dictionary<Play> = {};
  /** SpaceEh -> sessionEh */
  private _currentSessions: Dictionary<EntryHashB64> = {};
  /** SpaceEh -> zoomPct */
  private _zooms: Dictionary<number> = {};
  /** agentPubKey -> timestamp */
  private _agentPresences: Dictionary<number> = {};



  /** -- Getters --  */

  /** */
  get playsetZvm(): PlaysetZvm { return this.getZomeViewModel(PlaysetZvm.zomeName) as PlaysetZvm}
  get whereZvm(): WhereZvm { return this.getZomeViewModel(WhereZvm.zomeName) as WhereZvm}
  get profilesZvm(): ProfilesZvm { return this.getZomeViewModel(ProfilesZvm.zomeName) as ProfilesZvm}

  getZoom(spaceEh: EntryHashB64): number | undefined { return this._zooms[spaceEh]}
  getPlay(spaceEh: EntryHashB64): Play | undefined { return this._plays[spaceEh]}
  getCurrentSession(spaceEh: EntryHashB64): EntryHashB64 | undefined { return this._currentSessions[spaceEh]}


  /** -- Methods -- */

  async probeAll(): Promise<void> {
    console.log(`${this.roleId}.probeAll()...`)
    await super.probeAll();
    await this.probeAllPlays();
    console.log(`${this.roleId}.probeAll() Done.`);
    console.log(`Found ${Object.keys(this.whereZvm.perspective.manifests).length} / ${Object.keys(this.perspective.plays).length}`)
  }

  /** */
  setCurrentSession(spaceEh: EntryHashB64, sessionEh: EntryHashB64) {
    this._currentSessions[spaceEh] = sessionEh;
    console.log("setCurrentSession()", this._providedHosts);
    this.notifySubscribers();
  }


  /** */
  async createNextSession(spaceEh: EntryHashB64, name: string): Promise<EntryHashB64> {
    const sessionEh = await this.whereZvm.createNextSession(spaceEh, name);
    this.setCurrentSession(spaceEh, sessionEh);
    return sessionEh;
  }


  /** */
  async deleteAllMyLocations(spaceEh: EntryHashB64) {
    if (!this.isCurrentSessionToday(spaceEh)) {
      return;
    }
    //const play = this.whereZvm.getManifest(spaceEh);
    const sessionEh = this.getCurrentSession(spaceEh)!;
    const session = this.whereZvm.getSession(sessionEh)!;
    let idx = 0;
    for (const locInfo of session.locations) {
      if (locInfo && locInfo.authorPubKey === this._cellProxy.agentPubKey) {
        await this.deleteLocation(spaceEh, idx);
      }
      idx += 1;
    }
  }


  /** Get locIdx of first location from agent with given name */
  getAgentLocIdx(spaceEh: EntryHashB64, agent: string): number {
    const sessionEh: EntryHashB64 = this.getCurrentSession(spaceEh)!;
    const session = this.whereZvm.getSession(sessionEh)!;
    return session.locations.findIndex((locInfo) => locInfo && locInfo.location.meta.authorName == agent)
  }


  /** */
  isCurrentSessionToday(spaceEh: EntryHashB64): boolean {
    const play = this.getPlay(spaceEh);
    if (!play) {return false}
    const currentSessionEh = this.getCurrentSession(spaceEh);
    if (!currentSessionEh) {return false}
    const session = this.whereZvm.getSession(currentSessionEh);
    if (!session) {return false}
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
    if (!areCellsEqual(this._cellProxy.cellId, appSignal.data.cellId)) {
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
        from: this._cellProxy.agentPubKey,
        message: {type: 'Pong', content: this._cellProxy.agentPubKey}
      };
      this.notifyPeers(pong, [signal.from])
    }
    /* Handle signal */
    switch(signal.message.type) {
      case "Ping":
      case "Pong":
        break;
      case "NewSvgMarker":
        const svgEh = signal.message.content;
        this.playsetZvm.fetchSvgMarker(svgEh);
        break;
      case "NewEmojiGroup":
        const groupEh = signal.message.content
        this.playsetZvm.fetchEmojiGroup(groupEh);
        break;
      case "NewTemplate":
        const templateEh = signal.message.content
        this.playsetZvm.fetchTemplate(templateEh);
        break;
      case "NewSpace":
        const spaceEh = signal.message.content;
        /*await*/ this.playsetZvm.fetchSpace(spaceEh).then((space) => {
          if (space.meta.sessionCount == 0) {
            //this.whereZvm.createNextSession()
          }
      })
        // if (!this._plays[spaceEh]) {
        //   console.log("addPlay() from signal: " + spaceEh)
        //   /*await*/ this.addPlay(spaceEh)
        // }
        break;
      case "NewSession":
          // FIXME
        break;
      case "NewHere":
        const hereInfo = signal.message.content;
        const newLocInfo: LocationInfo = convertHereToLocation(hereInfo);
        if (signal.maybeSpaceHash && this._plays[signal.maybeSpaceHash]) {
          let locations = this._plays[signal.maybeSpaceHash].sessions[hereInfo.entry.sessionEh].locations
          const idx = locations.findIndex((locationInfo) => locationInfo!.linkAh == hereInfo.linkAh)
          if (idx > -1) {
            locations[idx] = newLocInfo
          } else {
            locations.push(newLocInfo)
          }
          this.notifySubscribers();
        }
        break;
      case "DeleteHere":
        const sessionEh = signal.message.content[0];
        const hereLinkAh = signal.message.content[1];
        if (signal.maybeSpaceHash && this._plays[signal.maybeSpaceHash]) {
          let locations = this._plays[signal.maybeSpaceHash].sessions[sessionEh].locations
          const idx = locations.findIndex((locationInfo) => locationInfo && locationInfo.linkAh == hereLinkAh)
          if (idx > -1) {
            locations.splice(idx, 1);
          }
          this.notifySubscribers();
        }
        break;
    }
  }


  /** */
  async notifyPeers(signal: WhereSignal, folks: Array<AgentPubKeyB64>): Promise<void> {
    if (signal.message.type != "Ping" && signal.message.type != "Pong") {
      console.debug(`NOTIFY ${signal.message.type}`, signal, folks)
    }
    /* Skip if no recipients or sending to self only */
    if (!folks || folks.length == 1 && folks[0] === this._cellProxy.agentPubKey) {
      console.log("notify() aborted: No recipients for notification")
      return;
    }
    return this.whereZvm.notifyPeers(signal, folks);
  }


  /** */
  async pingPeers(spaceHash: EntryHashB64, myKey: AgentPubKeyB64, folks: Array<AgentPubKeyB64>) {
    const ping: WhereSignal = {maybeSpaceHash: spaceHash, from: this._cellProxy.agentPubKey, message: {type: 'Ping', content: myKey}};
    // console.log({signal})
    this.notifyPeers(ping, folks);
  }


  /** */
  private updatePresence(from: AgentPubKeyB64) {
    const currentTimeInSeconds: number = Math.floor(Date.now() / 1000);
    this._agentPresences[from] = currentTimeInSeconds;
    this.notifySubscribers();
  }


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
    this.notifySubscribers();
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


  /** Plays */


  /** */
  async publishSpaceWithSessions(space: SpaceEntry, sessionNames: string[]): Promise<[EntryHashB64, Dictionary<PlacementSession>]> {
    console.log("createSpaceWithSessions(): " + sessionNames);
    console.log({space})
    let spaceEh = await this.playsetZvm.publishSpaceEntry(space);
    console.log("createSpaceWithSessions(): " + spaceEh);
    const sessions = await this.whereZvm.createSessions(spaceEh, sessionNames);
    return [spaceEh, sessions];
  }


  /** For each known space, look for an upto date Play otherwise construct it? */
  async probeAllPlays() : Promise<Dictionary<Play>> {
    const spaces = this.playsetZvm.perspective.spaces;
    for (const spaceEh of Object.keys(spaces)) {
      const play = await this.probePlay(spaceEh);
      /** Add or update play to perspective */
      if (play) {
        this.addPlay(spaceEh, play);
      }
    }
    this.notifySubscribers();
    return this._plays;
  }


  /** Add Play to Perspective */
  private addPlay(spaceEh: EntryHashB64, play: Play): void   {
    const hasAlready = this.getPlay(spaceEh);
    /** plays */
    console.log("addPlay()", spaceEh, play);
    this._plays[spaceEh] = play
    /* Check if already added */
    if (hasAlready) {
      console.log("addPlay() just updating. Already had a Play for this space in this perspective", spaceEh)
      return;
    }
    /* zooms */
    if (!this._zooms[spaceEh]) {
        this._zooms[spaceEh] = 1.0
    }
    /* currentSessions */
    if (!this._currentSessions[spaceEh]) {
      const maybeManifest = this.whereZvm.getManifest(spaceEh);
      if (!maybeManifest) {
        console.error("addPlay() No manifest found for space", spaceEh);
        return;
      }
      if (maybeManifest.sessionEhs.length <= 0) {
        console.error("No session found for Play", play.space.name);
        return;
      }
      const firstSessionEh = maybeManifest!.sessionEhs[0];
      console.log("addPlay() firstSessionEh:", firstSessionEh, maybeManifest)
      this._currentSessions[spaceEh] = firstSessionEh;
    }
    //this.notifySubscribers();
  }


  /**
   * Create new empty play with starting space
   * Creates a default "global" session if none provided
   */
  async constructNewPlay(space: Space, sessionNamesArray?: string[]): Promise<EntryHashB64> {
    let sessionNames = ["global"];
    if (sessionNamesArray && sessionNamesArray.length > 0 && sessionNamesArray[0] != "") {
      sessionNames = sessionNamesArray
    }
    /* - Create and commit SpaceEntry */
    const entry = convertSpaceToEntry(space);
    const [spaceEh, sessions] = await this.publishSpaceWithSessions(entry, sessionNames)
    /* - Add play to perspective */
    console.log("newPlay(): " + space.name + " | " + spaceEh)
    /* Form Play */
    const play: Play = {
      space,
      visible: true,
      sessions,
    };
    this.addPlay(spaceEh, play);
    this.notifySubscribers();
    /* Done */
    return spaceEh;
  }


  /** Construct Play from all related DNA entries */
  async probePlay(spaceEh: EntryHashB64): Promise<Play | undefined> {
    const manifest = await this.whereZvm.probeManifest(spaceEh);
    if (!manifest) {
      //return Promise.reject("No manifest found for requested Play");
      return undefined;
    }
    /* - Space */
    const space = await this.playsetZvm.getSpace(spaceEh);
    if (!space) {
      console.error("Space not found")
      return Promise.reject("Space not found")
    }
    /* - Sessions */
    let sessions: Dictionary<PlacementSession> = {};
    for (const sessionEh of manifest.sessionEhs) {
      // const session = this.whereZvm.getSession(sessionEh);
      const session = await this.whereZvm.probeSession(sessionEh);
      if (!session) {
        console.warn("Session not found in whereZvm", sessionEh, spaceEh);
        continue;
      }
      //sessions[session!.name] = session!;
      sessions[sessionEh] = session!;
    }
    if (Object.keys(sessions).length == 0) {
      console.error("No sessions found space", spaceEh, space);
      return undefined;
    }

    /* - Construct Play */
    const play: Play = {
      space,
      visible: manifest.visible,
      sessions,
    };
    /* - Done */
    return play;
  }


  /** -- Misc. -- */

  /** */
  async updateLocation(spaceEh: EntryHashB64, locIdx: number, c: Coord, others: Array<AgentPubKeyB64>, tag?: string, emoji?: string) {
    const manifest = this.whereZvm.getManifest(spaceEh);
    const sessionEh = this.getCurrentSession(spaceEh);
    if (!manifest || !sessionEh) {
      console.warn("updateLocation() failed: Play or Session not found", spaceEh);
      return;
    }
    const oldLocInfo = this.whereZvm.getLocations(sessionEh)![locIdx]!
   const newLocInfo = await this.whereZvm.updateLocation(sessionEh, spaceEh, locIdx, c, tag, emoji);
    const entry = convertLocationToHere(newLocInfo.location)
    await this.notifyPeers({maybeSpaceHash: spaceEh, from: this._cellProxy.agentPubKey, message: {type: "DeleteHere", content: [oldLocInfo.location.sessionEh, oldLocInfo.linkAh]}},
      others);
    await this.notifyPeers({maybeSpaceHash: spaceEh, from: this._cellProxy.agentPubKey, message: {type: "NewHere", content: {entry, linkAh: newLocInfo.linkAh, author: this._cellProxy.agentPubKey}}},
      others);
  }


  /** */
  async deleteLocation(spaceEh: EntryHashB64, idx: number) {
    const manifest = this.whereZvm.getManifest(spaceEh);
    const sessionEh = this.getCurrentSession(spaceEh);
    if (!manifest || !sessionEh) {
      console.warn("deleteLocation() failed: Space or session not found", spaceEh);
      return Promise.reject("Space or session not found");
    }
    const locInfo = await this.whereZvm.deleteLocation(sessionEh, idx);
    await this.notifyPeers({
        maybeSpaceHash: spaceEh,
        from: this._cellProxy.agentPubKey,
        message: {type: "DeleteHere", content: [locInfo.location.sessionEh, locInfo.linkAh]
        }},
      this.allOthers());
  }


  // /** */
  // async publishLocation(location: WhereLocation, spaceEh: EntryHashB64): Promise<void> {
  //   const linkAh = await this.whereZvm.publishLocation(location, spaceEh);
  //   /* Notify peers */
  //   const entry = convertLocationToHere(location)
  //   this.notifyPeers({
  //       maybeSpaceHash: spaceEh,
  //       from: this._cellProxy.agentPubKey,
  //       message: {
  //         type: "NewHere",
  //         content: {entry, linkAh, author: this._cellProxy.agentPubKey}
  //       }
  //     }
  //     , await this.others());
  // }


  /** */
  allOthers(): AgentPubKeyB64[] {
    const agents = this.profilesZvm.getAgents();
     console.log({agents})
     const keysB64 = agents.filter((key)=> key != this.agentPubKey)
     console.log({keysB64})
    return keysB64
  }
}

