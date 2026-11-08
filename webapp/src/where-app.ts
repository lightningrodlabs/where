import {css, html} from "lit";
import {customElement, state} from "lit/decorators.js";
import {localized, msg} from '@lit/localize';
import {
  AdminWebsocket, AgentPubKeyB64,
  Signal,
  AppWebsocket,
  encodeHashToBase64,
  EntryHash,
  EntryHashB64,
  InstalledAppId,
  RoleName, ZomeName
} from "@holochain/client";
import {
  AppProxy,
  BaseRoleName,
  CellsForRole, CloneId,
  delay,
  MyDictionary as Dictionary, DnaViewModel, DvmDef,
  HappElement,
  HCL,
  HcConnectionOptions,
  HvmDef, pascal, EntryId,
} from "@ddd-qc/lit-happ";
import {
  DEFAULT_WHERE_DEF,
  LudothequeDvm, PlaysetEntryType,
  WHERE_DEFAULT_COORDINATOR_ZOME_NAME,
  WHERE_DEFAULT_ROLE_NAME,
  WhereDvm, Inventory, weClientContext,
} from "@where/elements";
import {setLocale} from "./localization";

import {HC_ADMIN_PORT, HC_APP_PORT} from "./globals"
import {GetStrategy} from "@holochain-open-dev/core-types";

import "@shoelace-style/shoelace/dist/components/card/card.js";

import "@material/mwc-circular-progress";
import "@material/mwc-button";
import "@material/mwc-dialog";
import {Dialog} from "@material/mwc-dialog";
import {AppletId, AppletView, WeaveServices, AppletInfo} from "@theweave/api";
import {ContextProvider} from "@lit/context";
import {AssetViewInfo, WeServicesEx} from "@ddd-qc/we-utils";
import {Profile as ProfileMat, ProfilesDvm} from "@ddd-qc/profiles-dvm";

/** */
export interface ProfileInfo {
  profilesAppId: InstalledAppId,
  profilesBaseRoleName: BaseRoleName,
  profilesCloneId: CloneId | undefined,
  profilesZomeName: ZomeName,
  profilesProxy: AppProxy,
}


/**
 *
 */
@localized()
@customElement("where-app")
export class WhereApp extends HappElement {

  @state() private _loaded = false;
  @state() private _hasHolochainFailed = true;


  @state() private _canLudotheque = false;
  @state() private _hasStartingProfile = false;
  @state() private _lang?: string

  @state() private _currentSpaceEh: null | EntryHashB64 = null;

  static readonly HVM_DEF: HvmDef = DEFAULT_WHERE_DEF;

  private _currentPlaysetEh: null | EntryHashB64 = null;

  @state() private _ludoRoleCells!: CellsForRole;
  @state() private _curLudoCloneId?: RoleName; // = LudothequeDvm.DEFAULT_BASE_ROLE_NAME;


  private _whereInventory: Inventory | null = null;


  @state() private _canShowBuildView = false;

  /** -- We-applet specifics -- */

  protected _weProvider?: unknown; // FIXME type: ContextProvider<this.getContext()> ?
  //protected _threadsProvider?: unknown; // FIXME type: ContextProvider<this.getContext()> ?
  //protected _filesProvider?: unknown; // FIXME type: ContextProvider<this.getContext()> ?
  //protected _filesAppletHash?: EntryHash;

  //protected _threadsAppletHash?: EntryHash;

  private _appInfoMap: Dictionary<AppletInfo> = {};

  private _weProfilesDvm?: ProfilesDvm;

  @state() private _hasWeProfile = false;

  private _weServices?: WeServicesEx;


  /** */
  constructor(
      appWs?: AppWebsocket,
      private _adminWs?: AdminWebsocket,
      private _canAuthorizeZfns?: boolean,
      appId?: InstalledAppId,
      weServices?: WeaveServices,
      thisAppletId?: AppletId,
      public appletView?: AppletView,
      profileInfo?: ProfileInfo,
  ) {
    /** Standalone: connect through the app port and let the admin websocket authorize zome calls.
     *  In Moss: the app websocket is provided and Moss handles authorization. */
    const adminUrl = _adminWs
      ? undefined
      : HC_ADMIN_PORT
        ? new URL(`ws://localhost:${HC_ADMIN_PORT}`)
        : undefined;
    const options: HcConnectionOptions = appWs
      ? {socket: appWs, timeout: 20 * 1000}
      : {port: HC_APP_PORT, timeout: 20 * 1000, adminUrl};
    super(options, undefined, appId);
    if (_canAuthorizeZfns == undefined) {
      this._canAuthorizeZfns = true;
    }
    if (weServices) {
      this._weServices = new WeServicesEx(weServices, thisAppletId? [new EntryId(thisAppletId)] : []);
      console.log(`\t\tProviding context "${weClientContext}" | in host `, this._weServices, this);
      this._weProvider = new ContextProvider(this, weClientContext, this._weServices);
    }
    if(profileInfo) {
      this.createWeProfilesDvm(profileInfo);
    }
  }


  /** Create a Profiles DVM out of a different happ */
  async createWeProfilesDvm(profileInfo?: ProfileInfo): Promise<void> {
    const profilesAppInfo = await profileInfo.profilesProxy.appInfo();
    const profilesDef: DvmDef = {ctor: ProfilesDvm, baseRoleName: profileInfo.profilesBaseRoleName, isClonable: false};
    const cell_infos = Object.values(profilesAppInfo.cell_info);
    console.log("createProfilesDvm() cell_infos:", cell_infos);
    /** Create Profiles DVM */
        //const profilesZvmDef: ZvmDef = [ProfilesZvm, profilesZomeName];
    const dvm: DnaViewModel = new profilesDef.ctor(this, profileInfo.profilesProxy, new HCL(profileInfo.profilesAppId, profileInfo.profilesBaseRoleName, profileInfo.profilesCloneId), false);
    console.log("createProfilesDvm() dvm", dvm);
    await this.setupWeProfilesDvm(dvm as ProfilesDvm, encodeHashToBase64(profilesAppInfo.agent_pub_key));
  }


  /** */
  async setupWeProfilesDvm(dvm: ProfilesDvm, agent: AgentPubKeyB64): Promise<void> {
    this._weProfilesDvm = dvm as ProfilesDvm;
    /** Load My profile */
    const maybeMyProfile = await this._weProfilesDvm.profilesZvm.probeProfile(agent);
    if (maybeMyProfile) {
      const maybeLang = maybeMyProfile.fields['lang'];
      if (maybeLang) {
        console.log("Setting locale from We Profile", maybeLang);
        setLocale(maybeLang);
      }
      this._hasWeProfile = true;
    }
  }


  /** -- Getters -- */

  get whereDvm(): WhereDvm { return this.hvm.getDvm(WhereDvm.DEFAULT_BASE_ROLE_NAME)! as WhereDvm }
  get ludothequeDvm(): LudothequeDvm {
    const hcl = new HCL(this.hvm.appId, LudothequeDvm.DEFAULT_BASE_ROLE_NAME, this._curLudoCloneId);
    const maybeDvm = this.hvm.getDvm(hcl);
    if (!maybeDvm) console.error("DVM not found for ludotheque " + hcl.toString(), this.hvm);
    return maybeDvm! as LudothequeDvm;
  }

  get importingDialogElem() : Dialog {
    return this.shadowRoot!.getElementById("importing-dialog") as Dialog;
  }

  /** -- Methods -- */

  /** */
  handleSignal(sig: Signal) {
    //console.log("<where-app> handleSignal()", sig);
    this.appProxy.onSignal(sig);
  }


  /** */
  async fetchAppInfo(appletHashs: EntryHash[]) {
    if (!this._weServices) {
      console.warn("fetchAppInfo() Aborted. WeaveServices not available.")
      return;
    }
    for (const appletHash of appletHashs) {
      this._appInfoMap[encodeHashToBase64(appletHash)] = await this._weServices.appletInfo(appletHash);
    }
    this.requestUpdate();
  }


  /** */
  override async hvmConstructed() {
    console.log("hvmConstructed()", this._adminWs, this._canAuthorizeZfns)
    /** Authorize all zome calls (HappElement already did it with its own admin websocket if one was derived from HC_ADMIN_PORT) */
    if (this._adminWs && this._canAuthorizeZfns) {
      await this.hvm.authorizeAllZomeCalls(this._adminWs);
      console.log("*** Zome call authorization complete");
    }
    this._hasHolochainFailed = false;

    // /** Probe we-applets */
    // if (this._weServices) {
    //   console.log("weServices|Probing appletInfo() by attachmentTypes")
    //   for (const appletHash of this._weServices.attachmentTypes.keys()) {
    //     const appletInfo = await this._weServices.appletInfo(appletHash); // FIXME: use Promise.all();
    //     console.log("weServices|appletInfo", encodeHashToBase64(appletHash), appletInfo);
    //     this._appInfoMap[encodeHashToBase64(appletHash)] = appletInfo;
    //     // if (appletInfo.appletName == "files-we_applet") {
    //     //   this._filesAppletHash = appletHash;
    //     //   this._filesProvider = new ContextProvider(this, filesAppletContext, this._filesAppletHash);
    //     // }
    //     if (appletInfo.appletName == "hThreadsWeApplet") {
    //       console.log("weServices|Threads we-applet found", encodeHashToBase64(appletHash), appletInfo.appletName);
    //       this._threadsAppletHash = appletHash;
    //       this._threadsProvider = new ContextProvider(this, threadsAppletContext, this._threadsAppletHash);
    //       break;
    //     }
    //   }
    // }

    /** Grab ludo cells */
    this._ludoRoleCells = await this.appProxy.fetchCells(DEFAULT_WHERE_DEF.id, LudothequeDvm.DEFAULT_BASE_ROLE_NAME);

  }


  /** Check for my profile and set locale */
  private loadMyProfile(): void {
    const maybeMyProfile = this.whereDvm.profilesZvm.getMyProfile();
    console.log("<where-app>.loadMyProfile() maybeMyProfile", maybeMyProfile);
    if (maybeMyProfile) {
      const maybeLang = maybeMyProfile.fields['lang'];
      if (maybeLang) {
        setLocale(maybeLang);
      }
      this._hasStartingProfile = true;
    }
  }


  /** Entry defs are queried during local init: use them to check the conductor serves the Where DNA */
  private checkEntryDefs(): void {
    const allAppEntryTypes = this.whereDvm.allEntryDefs;
    console.log("<where-app> allAppEntryTypes", allAppEntryTypes);
    const whereDefs = allAppEntryTypes[WHERE_DEFAULT_COORDINATOR_ZOME_NAME];
    if (!whereDefs || Object.keys(whereDefs).length == 0) {
      console.warn(`No entries found for ${WHERE_DEFAULT_COORDINATOR_ZOME_NAME}`);
      this._hasHolochainFailed = true;
    }
  }


  /** Local data is available: render right away */
  override async perspectiveInitializedFromLocal(): Promise<void> {
    console.log("<where-app>.perspectiveInitializedFromLocal()");
    this.checkEntryDefs();
    this.loadMyProfile();
    try {
      await this.whereDvm.probeAllPlays(GetStrategy.Local);
      this._whereInventory = await this.whereDvm.playsetZvm.probeInventory(GetStrategy.Local);
    } catch (e) {
      console.warn("<where-app> local probe failed, rendering what the perspective has", e);
    }
    /** Done */
    this._loaded = true;
  }


  /** Then refresh everything from the network */
  override async perspectiveInitializedFromNetwork(): Promise<void> {
    console.log("<where-app>.perspectiveInitializedFromNetwork()");
    try {
      await this.hvm.initializePerspectiveFromNetwork();
      await this.whereDvm.probeAllPlays(GetStrategy.Network);
      this._whereInventory = await this.whereDvm.playsetZvm.probeInventory(GetStrategy.Network);
    } catch (e) {
      console.warn("<where-app> network probe failed", e);
    }
    if (!this._hasStartingProfile) {
      this.loadMyProfile();
    }
    this.requestUpdate();
  }


  /** */
  async createMyProfile(profile: ProfileMat) {
    //console.log("onNewProfile()", profile)
    const profilesZvm = this.whereDvm.profilesZvm;
    try {
      await profilesZvm.createMyProfile(profile);
    } catch (e: any) {
      console.warn("Failed creating my Profile", e);
      return;
    }
    /** ProfilesAltZvm only stores the profile when the zome's post-commit signal arrives,
     *  so wait for the perspective to catch up (as vines does) before showing the app. */
    for (let i = 0; i < 250 && !profilesZvm.getMyProfile(); i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    if (!profilesZvm.getMyProfile()) {
      console.warn("<where-app> my profile signal did not arrive, probing local cell");
      await profilesZvm.probeAllProfiles(GetStrategy.Local);
    }
    this.loadMyProfile();
    this.requestUpdate();
  }


  /** */
  async onShowLudo(cloneId: RoleName | null) {
    if (cloneId) {
      this._curLudoCloneId = cloneId;
    } else {
      this._curLudoCloneId = undefined;
    }
    this._whereInventory = await this.whereDvm.playsetZvm.probeInventory(GetStrategy.Local);
    this._canLudotheque = true;
  }


  /** */
  async onAddLudoClone(uuid: string, cloneName?: string) {
    console.log("onAddLudoClone()", uuid, cloneName);
    const cellDef = { modifiers: {network_seed: uuid}, cloneName: cloneName}
    const [_cloneIndex, dvm] = await this.hvm.cloneDvm(LudothequeDvm.DEFAULT_BASE_ROLE_NAME, cellDef);
    this._ludoRoleCells = await this.appProxy.fetchCells(this.hvm.appId, LudothequeDvm.DEFAULT_BASE_ROLE_NAME);
    this._curLudoCloneId = dvm.cell.cloneId;
    console.log("Ludotheque clone created:", dvm.hcl.toString(), dvm.cell.name, this._curLudoCloneId);
  }


  /** */
  renderWhere() {
    let view;
    if (this._currentSpaceEh) {
      view = html`
                <where-page
                    .currentSpaceEh=${this._currentSpaceEh}
                    .canShowBuildView=${this._canShowBuildView}
                    .ludoRoleCells=${this._ludoRoleCells}
                    @canShowBuildView-set="${(e: any) => {e.stopPropagation();this._canShowBuildView = e.detail}}"
                    @show-ludotheque="${(e: any) => {e.stopPropagation();this.onShowLudo(e.detail)}}"
                    @add-ludotheque="${(e: any) => {e.stopPropagation();this.onAddLudoClone(e.detail.uuid, e.detail.cloneName)}}"
                    @play-selected="${(e: any) => {e.stopPropagation();this._currentSpaceEh = e.detail}}"
                    @lang-selected=${(e: CustomEvent) => {console.log("<where-app> set lang", e.detail);setLocale(e.detail)}}
                ></where-page>
              `;
    } else {
      view = html`
                <where-dashboard
                    .canShowBuildView=${this._canShowBuildView}
                    .ludoRoleCells=${this._ludoRoleCells}
                    @canShowBuildView-set="${(e: any) => {e.stopPropagation();this._canShowBuildView = e.detail}}" 
                    @show-ludotheque="${(e: any) => {e.stopPropagation();this.onShowLudo(e.detail)}}"
                    @add-ludotheque="${(e: any) => {e.stopPropagation();this.onAddLudoClone(e.detail.uuid, e.detail.cloneName)}}"
                    @play-selected="${(e: any) => {e.stopPropagation();this._currentSpaceEh = e.detail}}"
                    @lang-selected=${(e: CustomEvent) => {console.log("<where-app> set lang", e.detail);setLocale(e.detail)}}
                ></where-dashboard>
              `;
    }

    if (this.appletView) {
      console.log("appletView", this.appletView);
      switch (this.appletView.type) {
        case "main":
          break;
        case "asset":
          const assetViewInfo = this.appletView as AssetViewInfo;
          if (!assetViewInfo.recordInfo) {
            throw new Error("Where Moss Tool: asset view without recordInfo is not supported.");
          }
          if (assetViewInfo.recordInfo.roleName != WHERE_DEFAULT_ROLE_NAME) {
            throw new Error(`Where Moss Tool: Unknown role name '${assetViewInfo.recordInfo.roleName}'.`);
          }
          const entryType = pascal(assetViewInfo.recordInfo.entryType);
          console.log("pascal entryType", entryType);
          switch (entryType) {
            case PlaysetEntryType.Space:
              const spaceEh = encodeHashToBase64(assetViewInfo.wal.hrl[1]);
              console.log("Space entry:", spaceEh);
              view = html`<where-space .currentSpaceEh=${spaceEh}></where-space>`;
              break;
            default:
              throw new Error(`Unhandled entry type ${assetViewInfo.recordInfo.entryType}.`);
          }
          break;
        case "creatable":
          throw new Error("Where Moss Tool: creatable view is not implemented.");
        default:
          console.error("Unknown Moss applet-view type", this.appletView);
          throw new Error(`Unknown Moss applet-view type`);
      }
    }

    /** Done */
    return html`
        <cell-context .cell="${this.whereDvm.cell}">
          ${view}
        </cell-context>
      `;
  }


  renderLudotheque() {
    return html`
        <cell-context .cell="${this.ludothequeDvm.cell}">
                  <ludotheque-page examples
                                   .whereInventory="${this._whereInventory}"
                                   .whereCellId=${this.whereDvm.cell.address.intoId()}
                                   @space-exported="${this.handleSpaceExported}"
                                   @import-playset-requested="${this.handleImportRequest}"
                                   @exit="${() => this._canLudotheque = false}"
                  ></ludotheque-page>
        </cell-context>
    `;
  }


  /** */
  render() {
    console.log("*** <where-app> render()", this._canLudotheque, this._hasStartingProfile, this._hasWeProfile, this._curLudoCloneId)
    if (!this._loaded) {
      return html`        
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh">
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      </div>
      `;
    }
    if(this._hasHolochainFailed) {
      return html`<div style="width: auto; height: auto; font-size: 4rem;">Failed to connect to Holochain Conductor</div>`;
    }

    const page = this._canLudotheque? this.renderLudotheque() : this.renderWhere();

    // const guardedPage = this.hasStartingProfile
    //   ? page
    //   : html`<profile-prompt style="margin-left:-7px; margin-top:0px;display:block;" @profile-created=${(e:any) => this.onNewProfile(e.detail.profile)}>
    //             ${page}
    //         </profile-prompt>`;


    let attachments = [html``];
    // FIXME
    // if (this._weServices) {
    //   /** attachments */
    //   for (const [appletHash, dict] of this._weServices.attachmentTypes.entries()) {
    //     const appletId = encodeHashToBase64(appletHash)
    //     console.log("weServices.appletId", appletId);
    //     console.log("weServices.dict", dict);
    //     const maybeAppInfo = this._appInfoMap[appletId];
    //     if (maybeAppInfo) {
    //       console.log("appletName", maybeAppInfo.appletName);
    //       for (const v of Object.values(dict)) {
    //         const templ = html`
    //           <li>${maybeAppInfo.appletName}: ${v.label}</li>`;
    //         attachments.push(templ);
    //       }
    //     }
    //   };
    //   if (attachments.length == 1) {
    //     attachments[0] = html`<span>None</span>`
    //   }
    // }


    const createProfile = html `
        <div class="column mainDiv">
          <h1 style="font-family: arial;color: #5804A8;"><img src="logo.svg" width="32" height="32" style="padding-left: 5px;padding-top: 5px;"/> Where</h1>            
          <div class="column" style="align-items: center;">
            <sl-card style="box-shadow: rgba(0, 0, 0, 0.19) 0px 10px 20px, rgba(0, 0, 0, 0.23) 0px 6px 6px;">
                <div class="title" style="margin-bottom: 24px; align-self: flex-start">
                  ${this._hasWeProfile? msg('Import Profile') : msg('Create Profile')}
                </div>
                <edit-profile
                          .saveProfileLabel=${this._hasWeProfile? msg('Import Profile') : msg('Create Profile')}
                          .profile=${this._hasWeProfile? this._weProfilesDvm.profilesZvm.getMyProfile() : undefined}
                          @save-profile=${(e: CustomEvent) => this.createMyProfile(e.detail.profile)}
                          @lang-selected=${(e: CustomEvent) => {console.log("<where-app> set lang", e.detail); setLocale(e.detail)}}
                ></edit-profile>
            </sl-card>
            </div>
        </div>`;

    /** Render off the perspective itself (like vines): the profile is only "there" once
     *  ProfilesAltZvm has stored it, and the pages below dereference it unguarded. */
    const guardedPage = this.whereDvm.profilesZvm.getMyProfile()? page : createProfile;


    /** Render all */
    return html`
        ${guardedPage}
        <!-- DIALOGS -->
        <mwc-dialog id="importing-dialog"  heading="${msg('Importing Playset')}" scrimClickAction="" escapeKeyAction="">
            <div>Playset ${this._currentPlaysetEh}...</div>
            <!--<mwc-button
                    slot="secondaryAction"
                    dialogAction="discard">
                Discard
            </mwc-button>-->
            <mwc-button
                    slot="primaryAction"
                    dialogAction="cancel">
                Cancel
            </mwc-button>
        </mwc-dialog>
    `;
  }


  /** Create sessions for each space */
  private async importSpaces(spaceEhs: EntryHashB64[]) {
    for (const spaceEh of spaceEhs) {
      const space = await this.whereDvm.playsetZvm.getSpace(spaceEh);
      //console.log("importSpaces().loop", spaceEh, space)
      if (!space) {
        console.warn("importSpaces() did not find spaceEh", spaceEh);
        continue;
      }
      if (space.meta.sessionCount == 0) {
        await this.whereDvm.constructNewPlay(space);
      } else {
        await this.whereDvm.constructNewPlay(space, space!.meta.sessionLabels);
      }
    }
  }


  /** */
  private async handleSpaceExported(event: CustomEvent<EntryHashB64>) {
    console.log("handleSpaceExported() : " + event.detail);
    await this.whereDvm.playsetZvm.ProbePlaysets(GetStrategy.Local);
    await this.importSpaces([event.detail]);
  }


  /** */
  private async handleImportRequest(event: CustomEvent<EntryHashB64>) {
    console.log("handleImportRequest() : " + JSON.stringify(event.detail))
    this._currentPlaysetEh = event.detail;
    if(!this._currentPlaysetEh) {
      console.warn("handleImportRequest aborted. Missing entryHash value in event detail.");
      return;
    }

    const startTime = Date.now();
    this.importingDialogElem.open = true;
    const spaceEhs = await this.ludothequeDvm.ludothequeZvm.exportPlayset(this._currentPlaysetEh, this.whereDvm.cell.address.intoId())
    console.log("handleImportRequest()", spaceEhs.length)
    await this.whereDvm.playsetZvm.ProbePlaysets(GetStrategy.Local);

    await this.importSpaces(spaceEhs);

    this._whereInventory = await this.whereDvm.playsetZvm.probeInventory(GetStrategy.Local);

    /** Wait a minimum amount of time before closing dialog */
    while(Date.now() - startTime < 500) {
      //console.log(Date.now() - startTime)
      await delay(20);
    }
    this.importingDialogElem.open = false;
    this.requestUpdate();
  }


  // /** */
  // static get scopedElements() {
  //   return {
  //     "where-page": WherePage,
  //     "mwc-circular-progress": CircularProgress,
  //     "mwc-dialog": Dialog,
  //     "mwc-button": Button,
  //     "where-dashboard": WhereDashboard,
  //     "ludotheque-page": LudothequePage,
  //     "cell-context": CellContext,
  //     "edit-profile": EditProfile,
  //     'sl-card': SlCard,
  //   };
  // }


  /** */
  static get styles() {
    return [
      css`
        :host {
          background: #f7f6f8;
          display: block;
          height: 100vh;
          width: inherit;
        }

        .mainDiv {
          align-items: center; justify-content: center; flex: 1; padding-bottom: 10px;
        }
        
        .column {
          display: flex;
          flex-direction: column;
        }

        .title {
          font-size: 20px;
        }

      `,

    ];
  }
}



