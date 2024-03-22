import {
  LocationInfo,
  Play,
  dematerializeHere,
  Coord,
  materializeHere,
  WhereLocation,
  dematerializeSession, HereInfo,
} from "./where.perspective";
import {DnaViewModel, ZomeViewModel} from "@ddd-qc/lit-happ";
import {PlaysetZvm} from "./playset.zvm";
import {WhereZvm} from "./where.zvm";
import {dematerializeSpace, SpaceMat} from "./playset.perspective";
import {Space} from "../bindings/playset.types";
import {
  Here,
  HereOutput,
  Message,
  MessageType,
  PlacementSession,
  SignalPayload,
  WHERE_DEFAULT_ROLE_NAME
} from "../bindings/where.types";
import {AgentPubKeyB64, EntryHashB64, AppSignal, AppSignalCb, ActionHashB64} from "@holochain/client";
import {ProfilesAltZvm, ProfilesZvm} from "@ddd-qc/profiles-dvm";
import {WAL} from "@lightningrodlabs/we-applet";


/** */
export interface WhereDnaPerspective {
  plays: Record<string, Play>,
  currentSessions: Record<string, EntryHashB64>,
  zooms: Record<string, number>,
  agentPresences: Record<string, number>,
}


/**
 * ViewModel fo the Where DNA
 * Holds 3 zomes:
 *  - Playset
 *  - Where
 *  - Profiles
 */
export class WhereDvm extends DnaViewModel {

  /** -- DnaViewModel Interface -- */

  static readonly DEFAULT_BASE_ROLE_NAME = WHERE_DEFAULT_ROLE_NAME;
  static readonly ZVM_DEFS = [PlaysetZvm, WhereZvm, ProfilesAltZvm]
  readonly signalHandler?: AppSignalCb = this.handleSignal;

  /** QoL Helpers */
  get playsetZvm(): PlaysetZvm { return this.getZomeViewModel(PlaysetZvm.DEFAULT_ZOME_NAME) as PlaysetZvm}
  get whereZvm(): WhereZvm { return this.getZomeViewModel(WhereZvm.DEFAULT_ZOME_NAME) as WhereZvm}
  get profilesZvm(): ProfilesAltZvm { return this.getZomeViewModel(ProfilesZvm.DEFAULT_ZOME_NAME) as ProfilesAltZvm}


  /** -- Perspective -- */

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
  private _plays: Record<string, Play> = {};
  /** SpaceEh -> sessionEh */
  private _currentSessions: Record<string, EntryHashB64> = {};
  /** SpaceEh -> zoomPct */
  private _zooms: Record<string, number> = {};
  /** agentPubKey -> timestamp */
  private _agentPresences: Record<string, number> = {};

  /** -- Getters -- */
  getZoom(spaceEh: EntryHashB64): number | undefined {return this._zooms[spaceEh]}
  getPlay(spaceEh: EntryHashB64): Play | undefined {return this._plays[spaceEh]}
  getCurrentSession(spaceEh: EntryHashB64): EntryHashB64 | undefined { return this._currentSessions[spaceEh]}
  getVisibility(spaceEh: EntryHashB64): boolean | undefined { return this.whereZvm.getManifest(spaceEh)?.visible}


  /** -- Signaling -- */

  /** */
  handleSignal(signal: AppSignal) {
    console.log("Received Signal", signal);
    if (signal.zome_name === ProfilesZvm.DEFAULT_ZOME_NAME) {
      return;
    }
    const signalPayload = signal.payload as SignalPayload;
    const sType = Object.keys(signalPayload.message.type)[0];
    /* Update agent's presence stat */
    this.updatePresence(signalPayload.from);
    /* Send pong response */
    if (sType != MessageType.Pong) {
      console.log("PONGING ", signalPayload.from)
      const pong: SignalPayload = {
        maybeSpaceHash: signalPayload.maybeSpaceHash,
        from: this._cellProxy.cell.agentPubKey,
        message: {type: {Pong: null}, content: this._cellProxy.cell.agentPubKey}
      };
      this.notifyPeers(pong, [signalPayload.from])
    }
    /* Handle signal */
    switch(sType) {
      case MessageType.Ping:
      case MessageType.Pong:
        break;
      case MessageType.NewSvgMarker:
        const svgEh = signalPayload.message.content as EntryHashB64;
        this.playsetZvm.fetchSvgMarker(svgEh);
        break;
      case MessageType.NewEmojiGroup:
        const groupEh = signalPayload.message.content as EntryHashB64;
        this.playsetZvm.fetchEmojiGroup(groupEh);
        break;
      case MessageType.NewTemplate:
        const templateEh = signalPayload.message.content as EntryHashB64;
        this.playsetZvm.fetchTemplate(templateEh);
        break;
      case MessageType.NewSpace:
        const spaceEh = signalPayload.message.content as EntryHashB64;
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
      case MessageType.NewSession:
        const sessEh = signalPayload.message.content[0];
        const session: PlacementSession = signalPayload.message.content[1];
        if (signalPayload.maybeSpaceHash && this._plays[signalPayload.maybeSpaceHash]) {
          this.whereZvm.addSession(signalPayload.maybeSpaceHash, sessEh, {name: session.name, index: session.index, locations: []});
          this._plays[signalPayload.maybeSpaceHash].sessions[session.name] = sessEh;
        }
        break;
      case MessageType.NewHere:
        const hereInfo = signalPayload.message.content as HereOutput;
        const newLocInfo: LocationInfo = materializeHere(hereInfo);
        if (signalPayload.maybeSpaceHash && this._plays[signalPayload.maybeSpaceHash]) {
          //console.log("locations before add", this._plays[signal.maybeSpaceHash].sessions[hereInfo.entry.sessionEh].locations.length)
          this.whereZvm.addLocation(newLocInfo);
          //console.log("locations after add", this._plays[signal.maybeSpaceHash].sessions[hereInfo.entry.sessionEh].locations.length)
        }
        break;
      case MessageType.DeleteHere:
        const sessionEh = signalPayload.message.content[0] as EntryHashB64;
        const hereLinkAh = signalPayload.message.content[1] as ActionHashB64;
        if (signalPayload.maybeSpaceHash && this._plays[signalPayload.maybeSpaceHash]) {
          //console.log("locations before remove", this._plays[signal.maybeSpaceHash].sessions[hereInfo.entry.sessionEh].locations.length)
          this.whereZvm.removeLocation(signalPayload.maybeSpaceHash, sessionEh, hereLinkAh);
          //console.log("locations before remove", this._plays[signal.maybeSpaceHash].sessions[hereInfo.entry.sessionEh].locations.length)

        }
        break;
      case MessageType.UpdateHere:
        const idx = signalPayload.message.content[0] as number;
        const newHereInfo: HereInfo = {
          entry: signalPayload.message.content[2] as Here,
          linkAh: signalPayload.message.content[1] as ActionHashB64,
          author: signalPayload.from,
          };
        const newInfo = materializeHere(newHereInfo);
        if (signalPayload.maybeSpaceHash && this._plays[signalPayload.maybeSpaceHash]) {
          this.whereZvm.updateLocation(newInfo.location.sessionEh, signalPayload.maybeSpaceHash, idx,
              newInfo.location.coord, newInfo.location.meta.tag, newInfo.location.meta.emoji, newInfo.location.meta.attachables);
        }
        break;
    }
  }


  /** */
  async notifyPeers(signal: SignalPayload, peers: Array<AgentPubKeyB64>): Promise<void> {
    // if (signal.message.type != "Ping" && signal.message.type != "Pong") {
    //   console.log(`NOTIFYING ${signal.message.type}`, signal, peers)
    // };
    console.log(`NOTIFYING "${signal.message.type}" to`, peers)
    /* Skip if no recipients or sending to self only */
    if (!peers || peers.length == 1 && peers[0] === this._cellProxy.cell.agentPubKey) {
      console.log("notifyPeers() aborted: No recipients for notification")
      return;
    }
    return this.whereZvm.notifyPeers(signal, peers);
  }


  /** */
  async pingPeers(maybeSpaceHash: EntryHashB64 | null, peers: Array<AgentPubKeyB64>) {
    const ping: SignalPayload = {
      maybeSpaceHash: maybeSpaceHash? maybeSpaceHash : undefined,
      from: this._cellProxy.cell.agentPubKey,
      message: {type: {Ping: null}, content: this._cellProxy.cell.agentPubKey}};
    // console.log({signal})
    this.notifyPeers(ping, peers);
  }


  /** */
  allCurrentOthers(): AgentPubKeyB64[] {
    const agents = this.profilesZvm.getAgents();
    //console.log({agents})
    //console.log({presences: this._agentPresences})
    const currentTime: number = Math.floor(Date.now() / 1000);
    const keysB64 = agents
      .filter((key)=> key != this.cell.agentPubKey)
      .filter((key)=> {
        const lastPingTime = this._agentPresences[key];
        if (!lastPingTime) return false;
        return (currentTime - lastPingTime) < 5 * 60; // 5 minutes
      });
    console.log({keysB64});
    return keysB64;
  }


  /** -- Probing -- */

  zvmChanged(zvm: ZomeViewModel): void {
    console.log("whereDvm.zvmChanged()", zvm.zomeName);
    if (zvm.zomeName !== this.playsetZvm.zomeName) {
      return;
    }
    this.probeAllPlays();
  }

  /** */
  probeAllInner() {
    console.log(`${this.baseRoleName}.probeAllInner()...`);
    super.probeAllInner();
    console.log(`${this.baseRoleName}.probeAllInner() Done.`);
    //console.log(`Found ${Object.keys(this.whereZvm.perspective.manifests).length} / ${Object.keys(this.perspective.plays).length}`)
  }


  /** For each known space, look for an up-to-date Play, otherwise construct it? */
  async probeAllPlays() : Promise<Record<string, Play>> {
    console.log("whereDvm.probeAllPlays()");
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
    let sessions: Record<string, EntryHashB64> = {};
    for (const sessionEh of manifest.sessionEhs) {
      // const session = this.whereZvm.getSession(sessionEh);
      const session = await this.whereZvm.probeSession(sessionEh);
      if (!session) {
        console.warn("Session not found in whereZvm", sessionEh, spaceEh);
        continue;
      }
      //sessions[session!.name] = session!;
      sessions[session!.name] = sessionEh;
      //sessions[sessionEh] = session!;
    }
    if (Object.keys(sessions).length == 0) {
      console.error("No sessions found space", spaceEh, space);
      return undefined;
    }

    /* - Construct Play */
    const play: Play = {
      space,
      sessions,
    };
    /* - Done */
    return play;
  }


  /** */
  private updatePresence(from: AgentPubKeyB64) {
    const currentTimeInSeconds: number = Math.floor(Date.now() / 1000);
    console.log("Updating presence of", from, currentTimeInSeconds);
    this._agentPresences[from] = currentTimeInSeconds;
    this.notifySubscribers();
  }


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



  /** */
  setCurrentSession(spaceEh: EntryHashB64, sessionEh: EntryHashB64) {
    this._currentSessions[spaceEh] = sessionEh;
    //console.log("setCurrentSession()", this._providedHosts);
    this.notifySubscribers();
  }


  /** */
  async createNextSession(spaceEh: EntryHashB64, name: string): Promise<EntryHashB64> {
    const [sessionEh, session] = await this.whereZvm.createNextSession(spaceEh, name);
    this.setCurrentSession(spaceEh, sessionEh);
    /** Notify peers */
    await this.notifyPeers({
        maybeSpaceHash: spaceEh,
        from: this._cellProxy.cell.agentPubKey,
        message: {type: {NewSession: null}, content: [sessionEh, dematerializeSession(session, spaceEh)],
        }},
      this.allCurrentOthers());
    /** Done */
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
      if (locInfo && locInfo.authorPubKey === this._cellProxy.cell.agentPubKey) {
        await this.deleteLocation(spaceEh, idx);
      }
      idx += 1;
    }
  }


  /** Get locIdx of first location from agent with given name */
  getPeerFirstLocation(spaceEh: EntryHashB64, peerName: string): LocationInfo | null {
    const sessionEh: EntryHashB64 = this.getCurrentSession(spaceEh)!;
    const session = this.whereZvm.getSession(sessionEh)!;
    const index = session.locations.findIndex((locInfo) => locInfo && locInfo.location.meta.authorName == peerName)
    if (index == -1) {
      return null;
    }
    return session.locations[index];
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
      ([name, sessionEh]) => {
        if (name == today /* "dummy-test-name" */) {
          todaySessionEh = sessionEh;
        }
      })
    return todaySessionEh == currentSessionEh;
  }


  /** */
  async publishSpaceWithSessions(space: Space, sessionNames: string[]): Promise<[EntryHashB64, Record<string, EntryHashB64>]> {
    console.log("createSpaceWithSessions(): " + sessionNames);
    console.log({space})
    let spaceEh = await this.playsetZvm.publishSpaceEntry(space);
    console.log("createSpaceWithSessions(): " + spaceEh);
    const sessions = await this.whereZvm.createSessions(spaceEh, sessionNames);
    let playSessions: Record<string, EntryHashB64> = {};
    for (const [eh, session] of Object.entries(sessions)) {
      playSessions[session.name] = eh;
    }
    return [spaceEh, playSessions];
    // FIXME Notify New Play
  }



  /** Add Play to Perspective. Caller should call this.notifySubcribers() */
  private addPlay(spaceEh: EntryHashB64, play: Play): void   {
    const hasAlready = this.getPlay(spaceEh);
    /** plays */
    console.log("addPlay()", spaceEh, play);
    this._plays[spaceEh] = play;
    // FIXME Notify New Play
    /* Check if already added */
    if (hasAlready) {
      console.log("addPlay() just updating. Already had a Play for this space in this perspective", spaceEh);
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
  }


  /**
   * Create new empty play with starting space
   * Creates a default "global" session if none provided
   */
  async constructNewPlay(space: SpaceMat, sessionNamesArray?: string[]): Promise<EntryHashB64> {
    let sessionNames = ["global"];
    if (sessionNamesArray && sessionNamesArray.length > 0 && sessionNamesArray[0] != "") {
      sessionNames = sessionNamesArray
    }
    /* - Create and commit SpaceEntry */
    const entry = dematerializeSpace(space);
    const [spaceEh, sessions] = await this.publishSpaceWithSessions(entry, sessionNames)
    /* - Add play to perspective */
    console.log("newPlay(): " + space.name + " | " + spaceEh)
    /* Form Play */
    const play: Play = {
      space,
      sessions,
    };
    this.addPlay(spaceEh, play);
    this.notifySubscribers();
    /* Done */
    return spaceEh;
  }


  /** -- Misc. -- */

  /** */
  async updateLocation(spaceEh: EntryHashB64, locIdx: number, c?: Coord, tag?: string, emoji?: string, attachables?: WAL[]) {
    console.log("whereDvm.updateLocation()", attachables);
    const manifest = this.whereZvm.getManifest(spaceEh);
    const sessionEh = this.getCurrentSession(spaceEh);
    if (!manifest || !sessionEh) {
      console.warn("updateLocation() failed: Play or Session not found", spaceEh);
      return;
    }
    //const oldLocInfo = this.whereZvm.getLocations(sessionEh)![locIdx]!
    const newLocInfo = await this.whereZvm.updateLocation(sessionEh, spaceEh, locIdx, c, tag, emoji, attachables);
    const entry = dematerializeHere(newLocInfo.location);
    let message: Message = {type: {UpdateHere: null}, content: [locIdx, newLocInfo.linkAh, entry]};
    let signal: SignalPayload = {maybeSpaceHash: spaceEh, from: this._cellProxy.cell.agentPubKey, message};
    await this.notifyPeers(signal, this.allCurrentOthers());
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
        from: this._cellProxy.cell.agentPubKey,
        message: {type: {DeleteHere: null}, content: [locInfo.location.sessionEh, locInfo.linkAh],
        }},
      this.allCurrentOthers());
  }


  /** */
  async publishLocation(location: WhereLocation, spaceEh: EntryHashB64): Promise<void> {
    console.log("whereDvm.publishLocation()", location);
    const linkAh = await this.whereZvm.publishLocation(location, spaceEh);
    /* Notify peers */
    const entry = dematerializeHere(location)
    this.notifyPeers({
        maybeSpaceHash: spaceEh,
        from: this._cellProxy.cell.agentPubKey,
        message: {
          type: {NewHere: null},
          content: {entry, linkAh, author: this._cellProxy.cell.agentPubKey}
        }
      }
      , this.allCurrentOthers());
  }

}

