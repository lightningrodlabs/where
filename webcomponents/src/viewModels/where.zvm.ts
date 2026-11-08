import {WhereProxy} from '../bindings/where.proxy';
import {Coord, WhereLocation, dematerializeHere, WherePerspective, LocationInfo,
  HereInfo, materializeHere, PlacementSessionMat, PlayManifest
} from "./where.perspective";
import {ZomeViewModel} from "@ddd-qc/lit-happ";
import {SignalPayload} from "../bindings/where.types";
import {ActionHashB64, AgentPubKeyB64, EntryHashB64} from "@holochain/client";
import {WAL} from "@theweave/api";
import {GetStrategy} from "@holochain-open-dev/core-types";
import {catchThrottled, isLocal} from "../utils";


/**
 *
 */
export class WhereZvm extends ZomeViewModel {

  static readonly ZOME_PROXY = WhereProxy;
  get zomeProxy(): WhereProxy {return this._zomeProxy as WhereProxy;}

  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }


  /** */
  override async initializePerspectiveFromLocal(): Promise<void> {
    await this.probeAllInnerAsync(GetStrategy.Local);
  }

  /** */
  override async initializePerspectiveFromNetwork(): Promise<void> {
    await this.probeAllInnerAsync(GetStrategy.Network);
  }

  /** */
  override probeAllInner(strategy: GetStrategy) {
    this.probeAllInnerAsync(strategy);
  }

  /** */
  async probeAllInnerAsync(strategy: GetStrategy) {
    console.log("whereZvm.probeAllInner()", strategy, this.perspective)
    for (const spaceEh of Object.keys(this._manifests)) {
      const maybeManifest = await this.probeManifest(spaceEh, strategy); // TODO optimize
      if (!maybeManifest) continue;
      console.log("whereZvm.probeAllInner()", maybeManifest)
      for (const sessionEh of Object.values(maybeManifest.sessionEhs)) {
        await this.probeSession(sessionEh, strategy); // TODO optimize
      }
    }
    await this.probeVisibilityForAll(strategy);
  }


  /** -- Perspective -- */

  /* */
  get perspective(): WherePerspective {
    return {
      manifests: this._manifests,
      sessions: this._sessions,
    };
  }

  /** SpaceEh -> Play */
  //private _plays: Dictionary<Play> = {};
  /** SpaceEh -> PlayManifest */
  private _manifests: Record<EntryHashB64, PlayManifest> = {};
  /** SpaceEh -> sessionEh */
  //private _currentSessions: Dictionary<EntryHashB64> = {};
  /** SessionEh -> PlacementSession */
  private _sessions: Record<EntryHashB64, PlacementSessionMat> = {};
  /* SessionEh -> [locations] */
  //private _locations: Dictionary<LocationInfo[]> = {};

  //getPlay(eh: EntryHashB64): Play | undefined {return this._plays[eh]}
  getManifest(eh: EntryHashB64): PlayManifest | undefined {return this._manifests[eh]}
  //getCurrentSession(eh: EntryHashB64): EntryHashB64 | undefined {return this._currentSessions[eh]}
  getSession(eh: EntryHashB64): PlacementSessionMat | undefined {return this._sessions[eh]}
  getLocations(eh: EntryHashB64): (LocationInfo | null)[] | undefined {return this._sessions[eh].locations}


  getHiddenSpaces(): EntryHashB64[] {
    let hiddens = [];
    for (const [eh, manifest] of Object.entries(this._manifests)) {
      if (!manifest.visible) {
        hiddens.push(eh);
      }
    }
    return hiddens;
  }


  /** */
  getVisibleSpaces(): EntryHashB64[] {
    let hiddenEhs = this.getHiddenSpaces();
    let visibles = [];
    for (const manifest of Object.values(this._manifests)) {
      if (!hiddenEhs.includes(manifest.spaceEh)) {
        visibles.push(manifest.spaceEh)
      }
    }
    return visibles;
  }



  /** */
  isSpaceVisible(spaceEh: EntryHashB64): boolean {
    const visibles = this.getVisibleSpaces();
    //console.log({visibles})
    for (const visibleSpaceEh of visibles) {
      if (visibleSpaceEh == spaceEh) {
        return true;
      }
    }
    return false;
  }


  /** -- Methods -- */

  /** */
  notifyPeers(signal: SignalPayload, peers: Array<AgentPubKeyB64>): Promise<void> {
    return this.zomeProxy.notifyPeers({signal, peers});
  }

  /** Returns list of hidden spaces */
  async probeVisibilityForAll(strategy: GetStrategy = GetStrategy.Local): Promise<EntryHashB64[]> {
    const [throttled, hiddens] = await catchThrottled(this.zomeProxy.getHiddenSpaces({input: null, local: isLocal(strategy)}));
    if (throttled) {
      return Object.values(this._manifests).filter((m) => !m.visible).map((m) => m.spaceEh);
    }
    for (const hiddenEh of hiddens!) {
      if (this.getManifest(hiddenEh)) {
        this._manifests[hiddenEh].visible = false;
      }
    }
    this.notifySubscribers();
    return hiddens;
  }


  /** */
  async probeManifest(spaceEh: EntryHashB64, strategy: GetStrategy = GetStrategy.Local, probeVisibility = true): Promise<PlayManifest | null> {
      const [throttled, maybeSessionEhs] = await catchThrottled(this.zomeProxy.getSpaceSessions({input: spaceEh, local: isLocal(strategy)}));
      if (throttled) {
        /** Same probe is already in flight or just ran: answer from the perspective */
        return this.getManifest(spaceEh) ?? null;
      }
      const sessionEhs = maybeSessionEhs!;
      if (sessionEhs.length == 0) {
        return null;
      }
      if (probeVisibility) {
        await this.probeVisibilityForAll(strategy);
      }
      let manifest = this.getManifest(spaceEh);
      if (!manifest) {
        manifest = {
          spaceEh: spaceEh,
          visible: true,
          sessionEhs: sessionEhs,
        };
        //console.error("Session found but no manifest:", spaceEh, this.perspective)
        //return Promise.reject("Inconsistant state: Manifest not found although sessions where found.")
      } else {
        manifest.sessionEhs = sessionEhs;
      }
      this._manifests[spaceEh] = manifest;
      this.notifySubscribers();
      return manifest;
  }


  /** */
  async probeSession(sessionEh: EntryHashB64, strategy: GetStrategy = GetStrategy.Local): Promise<PlacementSessionMat> {
    const entry = await this.zomeProxy.getSessionFromEh({input: sessionEh, local: isLocal(strategy)});
    if (!entry) {
      console.error("fetchSession(): Session entry not found")
      return Promise.reject("fetchSession(): Session entry not found");
    }
    const session: PlacementSessionMat = {
      name: entry.name,
      index: entry.index,
      locations: await this.probeLocations(sessionEh, strategy)
    };
    this._sessions[sessionEh] = session;
    this.notifySubscribers();
    return session;
  }


  /** */
  private async probeLocations(sessionEh: EntryHashB64, strategy: GetStrategy = GetStrategy.Local): Promise<Array<LocationInfo>> {
    const hereInfos = await this.zomeProxy.getHeres({input: sessionEh, local: isLocal(strategy)});
    //console.debug({hereInfos})
    const locs = hereInfos.map((info: HereInfo) => {
      return materializeHere(info)
    });
    //this._locations[sessionEh] = locs;
    //this.notifySubscribers();
    return locs;
  }


  /** -- Sessions -- */

  addSession(spaceEh: EntryHashB64, sessionEh: EntryHashB64, session: PlacementSessionMat): void {
    if (!this._manifests[spaceEh]) {
      this._manifests[spaceEh] = {spaceEh, visible: true, sessionEhs: [sessionEh]} as PlayManifest;
    }
    this._manifests[spaceEh].sessionEhs.push(sessionEh);
    this._sessions[sessionEh] = session;
    this.notifySubscribers();

  }

  /** Add Session to Perspective */
  private addEmptySession(spaceEh: EntryHashB64, sessionEh: EntryHashB64, name: string, index: number): PlacementSessionMat {
    const session: PlacementSessionMat = {name, index, locations: []};
    this.addSession(spaceEh, sessionEh, session);
    return session;
  }


  /** */
  async createNextSession(spaceEh: EntryHashB64, name: string): Promise<[EntryHashB64, PlacementSessionMat]> {
    const [eh, index] = await this.zomeProxy.createNextSession({spaceEh, name});
    const session = this.addEmptySession(spaceEh, eh, name, index);
    return [eh, session];
  }


  /** */
  async createSessions(spaceEh: EntryHashB64, sessionNames: string[]): Promise<Record<string, PlacementSessionMat>> {
    const index = this._manifests[spaceEh]? this._manifests[spaceEh].sessionEhs.length : 0;
    const ehs = await this.zomeProxy.createSessions({spaceEh, sessionNames});
    let sessions: any = {};
    for (let i = 0; i < sessionNames.length; i++) {
      const session = this.addEmptySession(spaceEh, ehs[i], sessionNames[i], index + i)
      sessions[ehs[i]] = session;

    }
    this.notifySubscribers();
    return sessions;
  }


  /** -- Visibility -- */

  /** */
  async hidePlay(spaceEh: EntryHashB64) : Promise<void> {
    const _ = await this.zomeProxy.hideSpace(spaceEh);
    this._manifests[spaceEh].visible = false
    this.notifySubscribers();
  }

  /** */
  async unhidePlay(spaceEh: EntryHashB64): Promise<void> {
    const _ = await this.zomeProxy.unhideSpace(spaceEh);
    this._manifests[spaceEh].visible = true
    this.notifySubscribers();
  }


  /** -- Locations -- */

  /** */
  async publishLocation(location: WhereLocation, spaceEh: EntryHashB64) : Promise<ActionHashB64> {
    const session = await this.zomeProxy.getSessionFromEh({input: location.sessionEh, local: true});
    if (!session) console.error("Current session not found", spaceEh, location.sessionEh);
    const linkAh = await this.publishLocationWithSessionIndex(location, spaceEh, session!.index)
    const locInfo: LocationInfo = { location, linkAh, authorPubKey: this.cell.address.agentId.b64 }
    this._sessions[location.sessionEh].locations.push(locInfo)
    this.notifySubscribers();
    return linkAh;
  }


  /** */
  private async publishLocationWithSessionIndex(location: WhereLocation, spaceEh: EntryHashB64, sessionIndex: number): Promise<ActionHashB64> {
    const entry = dematerializeHere(location);
    //console.log("publishLocationWithSessionIndex()", entry, location, spaceEh, sessionIndex)
    const ah = this.zomeProxy.addHere({spaceEh, sessionIndex, value: entry.value, meta: entry.meta});
    return ah;
  }


  /** */
  async updateLocation(sessionEh: EntryHashB64, spaceEh: EntryHashB64, locIdx: number, c?: Coord, tag?: string, emoji?: string, attachables?: WAL[]): Promise<LocationInfo> {
    const locInfo = this.getSession(sessionEh)!.locations[locIdx]!;
    if (c != undefined && c != null) {
      locInfo.location.coord = c
    }
    if (tag != undefined && tag != null) {
      locInfo.location.meta.tag = tag
    }
    if (emoji != undefined && emoji != null) {
      locInfo.location.meta.emoji = emoji
    }
    if (attachables != undefined) {
      locInfo.location.meta.attachables = attachables;
    }
    const session = await this.zomeProxy.getSessionFromEh({input: sessionEh, local: true});
    const newLinkAh: ActionHashB64 = await this.publishLocationWithSessionIndex(locInfo.location, spaceEh, session!.index)
    await this.zomeProxy.deleteHere(locInfo.linkAh)
    locInfo.linkAh = newLinkAh;
    this._sessions[sessionEh].locations[locIdx] = locInfo;
    this.notifySubscribers();
    return locInfo;
  }


  /** */
  async deleteLocation(sessionEh: EntryHashB64, idx: number): Promise<LocationInfo> {
    const locInfo = this.getSession(sessionEh)!.locations[idx]!
    await this.zomeProxy.deleteHere(locInfo.linkAh)
    this._sessions[sessionEh].locations[idx] = null;
    this.notifySubscribers();
    return locInfo;
  }


  /** */
  addLocation(locInfo: LocationInfo): void {
    const session = this.getSession(locInfo.location.sessionEh);
    if (!session) {
      throw Error("Session not found when adding location " + locInfo.linkAh)
    }
    for (const [i, curLoc] of Object.entries(session.locations)) {
      if (curLoc && curLoc.linkAh == locInfo.linkAh) {
        console.warn("Location already added", locInfo.linkAh);
        // replace?
        //const idx: number = i;
        //this._sessions[locInfo.location.sessionEh].locations[idx] = locInfo;
        return;
      }
    }
    this._sessions[locInfo.location.sessionEh].locations.push(locInfo);
    this.notifySubscribers();
  }

  /** */
  removeLocation(spaceEh: EntryHashB64, sessionEh: EntryHashB64, linkAh: ActionHashB64): void {
    const session = this.getSession(sessionEh);
    if (!session) {
      throw Error("Session not found when removing location " + linkAh)
    }
    const idx = session.locations.findIndex((locationInfo) => locationInfo && locationInfo.linkAh == linkAh)
    if (idx > -1) {
      //session.locations.splice(idx, 1);
      session.locations[idx] = null;
      this.notifySubscribers();
    } else {
      console.warn("removeLocation() failed. linkAh not found in session", linkAh, sessionEh, session.locations, idx);
    }
  }
}
