import {ActionHashB64, AgentPubKeyB64, Dictionary, EntryHashB64} from "@holochain-open-dev/core-types";
import {
  HereInfo,
  WhereLocation,
  LocationInfo, PlacementSession,
  Play,
  Space, spaceIntoEntry,
  convertLocationToHere,
} from "./where.perspective";
import {AppSignal} from "@holochain/client/lib/api/app/types";
import {areCellsEqual, HoloHashedB64} from "../utils";
import {ProfilesStore} from "@holochain-open-dev/profiles";
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


  getZoom(spaceEh: EntryHashB64): number | undefined { return this._zooms[spaceEh]}


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
    if (this.whereZvm.getPlay(spaceEh)) {
      console.log("addPlay() aborted. Already have this space")
      return;
    }
    /* Construct Play and add it to store */
    const play: Play = await this.constructPlay(spaceEh);
    this._plays[spaceEh] = play
    /* Set starting zoom for new Play */
    if (!get(this._zooms)[spaceEh]) {
      this._zooms.update(zooms => {
        zooms[spaceEh] = 1.0
        return zooms
      })
    }
    /* Set currentSession for new Play */
    const firstSessionEh = await this.bridge.getSessionAddress(spaceEh, 0);
    // console.log("addPlay() firstSessionEh: " + firstSessionEh)
    if (firstSessionEh) {
      this.setCurrentSession(spaceEh, firstSessionEh)
    } else {
      console.error("No session found for Play " + play.space.name)
    }
  }


  /** */
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

  /** */
  async getSpaces(): Promise<Array<HoloHashedB64<SpaceEntry>>> {
    return this.callPlaysetZome('get_spaces', null);
  }

  /** */
  async getVisibleSpaces(): Promise<Array<HoloHashedB64<SpaceEntry>>> {
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
    const visibles: Array<HoloHashedB64<SpaceEntry>> = await this.getVisibleSpaces();
    //console.log({visibles})
    for (const visible of visibles) {
      if (visible.hash == spaceEh) {
        return true;
      }
    }
    return false;
  }



  /** Location */


  async getLocations(sessionEh: EntryHashB64): Promise<Array<LocationInfo>> {
    const hereInfos =  await this.callWhereZome('get_heres', sessionEh);
    //console.debug({hereInfos})
    return hereInfos.map((info: HereInfo) => {
      return this.locationFromHere(info)
    });
  }

  /** */
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


  /** Misc */


  // getEntryDefs(zomeName: string) {
  //   console.debug("getEntryDefs() for " + zomeName + " ...")
  //   const result = this.client.callZome(this.mainCellId, zomeName, "zome_info", null, 10 * 1000);
  //   //const result = this.client.callZome(this.mainCellId, zomeName, "entry_defs", null, 10 * 1000);
  //   console.debug("getEntryDefs() for " + zomeName + "() result:")
  //   console.debug({result})
  // }


  /**
   * Create new empty space
   */
  async newSpace(space: Space): Promise<EntryHashB64> {
    // - Create and commit SpaceEntry
    const entry = spaceIntoEntry(space);
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
    const entry = spaceIntoEntry(space);
    const spaceEh: EntryHashB64 = await this.createSpaceWithSessions(entry, sessionNames)
    // - Notify others
    const newSpace: WhereSignal = {maybeSpaceHash: spaceEh, from: this.myAgentPubKey, message: {type: 'NewSpace', content: spaceEh}};
    this.sendSignal(newSpace, await this.others());
    // - Add play to store
    console.log("newPlay(): " + space.name + " | " + spaceEh)
    this.addPlay(spaceEh);
    // Done
    return spaceEh;
  }



  /** */
  async createSpaceWithSessions(space: SpaceEntry, sessionNames: string[]): Promise<EntryHashB64> {
    console.log("createSpaceWithSessions(): " + sessionNames);
    console.log({space})
    let spaceEh = await this.playsetZvm.publishSpace(space);
    console.log("createSpaceWithSessions(): " + spaceEh);
    await this.whereZvm.createSessions(spaceEh, sessionNames);
    return spaceEh;
  }


  /** */
  async deleteLocation(spaceEh: EntryHashB64, idx: number) {
    const locInfo = await this.whereZvm.deleteLocation(spaceEh, idx);
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

