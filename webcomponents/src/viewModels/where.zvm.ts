import {EntryHashB64, ActionHashB64, AgentPubKeyB64, Dictionary} from '@holochain-open-dev/core-types';
import { WhereBridge } from './where.bridge';
import {
  Coord,
  Play,
  WhereLocation,
  convertLocationToHere,
  WherePerspective,
  LocationInfo,
  HereInfo, convertHereToLocation, PlacementSession
} from "./where.perspective";
import {DnaClient, ZomeViewModel} from "@ddd-qc/dna-client";
import {createContext} from "@lit-labs/context";
import {WhereSignal} from "./where.signals";
import {Space} from "./playset.perspective";


/**
 *
 */
export class WhereZvm extends ZomeViewModel<WherePerspective, WhereBridge> {

  /** Ctor */
  constructor(protected _dnaClient: DnaClient) {
    super(new WhereBridge(_dnaClient));
  }

  static context = createContext<WhereZvm>('zome_view_model/where');
  getContext(): any {return WhereZvm.context}

  /* */
  protected hasChanged(): boolean {
    // TODO
    return true;
  }


  /** */
  async probeDht() {
     // n/a
  }

  /** -- Perspective -- */

  /* */
  get perspective(): WherePerspective {
    return {
      plays: this._plays,
      //currentSessions: this._currentSessions,
      //sessions: this._sessions,
      //locations: this._locations,
    };
  }


  /** SpaceEh -> Play */
  private _plays: Dictionary<Play> = {};
  /** SpaceEh -> sessionEh */
  //private _currentSessions: Dictionary<EntryHashB64> = {};
  /** SpaceEh -> [sessionEh] */
  //private _sessions: Dictionary<PlacementSession[]> = {};
  /* SessionEh -> [locations] */
  //private _locations: Dictionary<Location[]> = {};

  getPlay(eh: EntryHashB64): Play | undefined {return this._plays[eh]}
  //getCurrentSession(eh: EntryHashB64): EntryHashB64 | undefined {return this._currentSessions[eh]}
  //getSessions(eh: EntryHashB64): PlacementSession[] | undefined {return this._sessions[eh]}
  //getLocations(eh: EntryHashB64): Location[] | undefined {return this._locations[eh]}


  /** -- Methods -- */

  /** */
  sendSignal(signal: WhereSignal, folks: Array<AgentPubKeyB64>) {
    this._bridge.notify(signal, folks)
  }


  /** */
  async createSessions(spaceEh: EntryHashB64, sessionNames: string[]): Promise<void> {
    await this._bridge.createSessions(spaceEh, sessionNames);
    this.notify();
  }



  /** */
  async hidePlay(spaceEh: EntryHashB64) : Promise<void> {
    const _ = await this._bridge.hideSpace(spaceEh);
    this._plays[spaceEh].visible = false
    this.notify();
  }

  /** */
  async unhidePlay(spaceEh: EntryHashB64): Promise<void> {
    const _ = await this._bridge.unhideSpace(spaceEh);
    this._plays[spaceEh].visible = true
    this.notify();
  }



  /** */
  async deleteLocation(play: Play, sessionEh: EntryHashB64, idx: number): Promise<LocationInfo> {
    const locInfo = play.sessions[sessionEh].locations[idx]!
    await this._bridge.deleteHere(locInfo.linkAh)
    play.sessions[sessionEh].locations[idx] = null
    this.notify();
    return locInfo;
  }


  /** */
  async publishLocation(spaceEh: EntryHashB64, location: WhereLocation) : Promise<ActionHashB64> {
    const session = await this._bridge.getSessionFromEh(location.sessionEh);
    const linkAh = await this.publishLocationWithSessionIndex(location, spaceEh, session!.index)
    const locInfo: LocationInfo = { location, linkAh, authorPubKey: this._dnaClient.myAgentPubKey }
    this._plays[spaceEh].sessions[location.sessionEh].locations.push(locInfo)
    this.notify();
    return linkAh;
  }


  /** */
  private async publishLocationWithSessionIndex(location: WhereLocation, spaceEh: EntryHashB64, sessionIndex: number): Promise<ActionHashB64> {
    const entry = convertLocationToHere(location);
    return this._bridge.addHere(spaceEh, sessionIndex, entry.value, entry.meta);
  }


  /** */
  async updateLocation(play: Play, sessionEh: EntryHashB64, locIdx: number, c: Coord, tag?: string, emoji?: string): LocationInfo {
    const locInfo = play.sessions[sessionEh].locations[locIdx]!
    locInfo.location.coord = c
    if (tag != null) {
      locInfo.location.meta.tag = tag
    }
    if (emoji != null) {
      locInfo.location.meta.emoji = emoji
    }
    const session = await this._bridge.getSessionFromEh(sessionEh);
    const newLinkAh: ActionHashB64 = await this.publishLocationWithSessionIndex(locInfo.location, spaceEh, session!.index)
    await this._bridge.deleteHere(locInfo.linkAh)
    locInfo.linkAh = newLinkAh;
    play.sessions[sessionEh].locations[locIdx] = locInfo;
    this.notify();
    return locInfo;
  }




  /** */
  async fetchLocations(sessionEh: EntryHashB64): Promise<Array<LocationInfo>> {
    const hereInfos =  await this._bridge.getHeres(sessionEh);
    //console.debug({hereInfos})
    return hereInfos.map((info: HereInfo) => {
      return convertHereToLocation(info)
    });
  }


  /** */
  async fetchSession(sessionEh: EntryHashB64): Promise<PlacementSession> {
    const entry = await this._bridge.getSessionFromEh(sessionEh);
    if (entry) {
      return {
        name: entry.name,
        index: entry.index,
        locations: await this.fetchLocations(sessionEh)
      }
    }
    console.error("sessionFromEntry(): Session entry not found")
    return Promise.reject("sessionFromEntry(): Session entry not found");
  }


}
