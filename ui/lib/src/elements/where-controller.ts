import { html, css, LitElement } from "lit";
import { state, property } from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import { StoreSubscriber } from "lit-svelte-stores";
import {Unsubscriber} from "svelte/store";

import { sharedStyles } from "../sharedStyles";
import {whereContext, Space, Dictionary, Signal, Coord, MarkerType} from "../types";
import { WhereStore } from "../where.store";
import { WhereSpace } from "./where-space";
import { WhereSpaceDialog } from "./where-space-dialog";
import { WhereTemplateDialog } from "./where-template-dialog";
import { WhereArchiveDialog } from "./where-archive-dialog";
import {lightTheme, SlAvatar, SlBadge, SlColorPicker, SlTooltip} from '@scoped-elements/shoelace';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  ListItem,
  Select,
  IconButton,
  Button, TextField, Dialog, TopAppBar, Drawer, List, Icon, Switch, Formfield, Slider, Menu,
} from "@scoped-elements/material-web";
import {
  profilesStoreContext,
  ProfilesStore,
  Profile,
} from "@holochain-open-dev/profiles";
import {box_template_html, map2D_template_html, quadrant_template_svg, triangle_template_svg} from "./templates";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {MARKER_WIDTH, renderSurface} from "../sharedRender";

/**
 * @element where-controller
 */
export class WhereController extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */
  @property({ type: Boolean, attribute: 'dummy' })
  canLoadDummy = false;

  /** Dependencies */

  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile = new StoreSubscriber(this, () => this._profiles.myProfile);
  _knownProfiles = new StoreSubscriber(this, () => this._profiles.knownProfiles);
  _spaces = new StoreSubscriber(this, () => this._store.spaces);
  _zooms = new StoreSubscriber(this, () => this._store.zooms);

  /** Private properties */

  @state() _currentSpaceEh = "";
  @state() _currentTemplateEh = "";

  private initialized = false;
  private initializing = false;


  get archiveDialogElem() : WhereArchiveDialog {
    return this.shadowRoot!.getElementById("archive-dialog") as WhereArchiveDialog;
  }

  get templateDialogElem() : WhereTemplateDialog {
    return this.shadowRoot!.getElementById("template-dialog") as WhereTemplateDialog;
  }

  get spaceElem(): WhereSpace {
    return this.shadowRoot!.getElementById("where-space") as WhereSpace;
  }

  get spaceDialogElem() : WhereSpaceDialog {
    return this.shadowRoot!.getElementById("space-dialog") as WhereSpaceDialog;
  }


  async createDummyProfile() {
    await this.updateProfile("Cam", "https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Cat-512.png", "#69de85")
  }


  async updateProfile(nickname: string, avatar: string, color: string) {
    try {
      const fields: Dictionary<string> = {};
      fields['color'] = color;
      fields['avatar'] = avatar;
      await this._profiles.createProfile({
        nickname,
        fields,
      });

    } catch (e) {
      console.log("updateProfile() failed");
      console.log(e);
    }
  }


  get myNickName(): string {
    return this._myProfile.value.nickname;
  }
  get myAvatar(): string {
    return this._myProfile.value.fields.avatar;
  }

  private subscribeProfile() {
    let unsubscribe: Unsubscriber;
    unsubscribe = this._profiles.myProfile.subscribe(async (profile) => {
      if (profile) {
        //console.log({profile})
        //this._myAvatar = `https://robohash.org/${profile.nickname}`
        await this.checkInit();
      }
      // unsubscribe()
    });
  }

  firstUpdated() {
    if (this.canLoadDummy) {
      this.createDummyProfile().then(() => {
        this.subscribeProfile()
      });
    } else {
      this.subscribeProfile()
    }
  }


  private _getFirstVisible(spaces: Dictionary<Space>): EntryHashB64 {
    if (Object.keys(spaces).length == 0) {
      return "";
    }
    for (let spaceEh in spaces) {
      const space = spaces[spaceEh]
      if (space.visible) {
        return spaceEh
      }
    }
    return "";
  }


  async checkInit() {
    if (this.initialized || this.initializing) {
      this.initialized = true;
      return;
    }
    this.initializing = true  // because checkInit gets call whenever profiles changes...
    let spaces = await this._store.pullSpaces();
    let templates = await this._store.updateTemplates();
    /** load up a space if there are none */
    if (Object.keys(spaces).length == 0 || Object.keys(templates).length == 0) {
      console.log("no spaces found, initializing")
      await this.addHardcodedSpaces();
      spaces = await this._store.pullSpaces();
    }
    if (Object.keys(spaces).length == 0 || Object.keys(templates).length == 0) {
      console.error("No spaces or templates found")
    }
    this._currentSpaceEh = this._getFirstVisible(spaces);
    this._currentTemplateEh = Object.keys(templates)[0];
    await this.updateTemplateLabel(spaces[this._currentSpaceEh].name);
    console.log("   current space: ",  spaces[this._currentSpaceEh].name, this._currentSpaceEh);
    console.log("current template: ", templates[this._currentTemplateEh].name, this._currentTemplateEh);
    /** Drawer */
    const drawer = this.shadowRoot!.getElementById("my-drawer") as Drawer;
    //const drawer = document.getElementsByTagName('mwc-drawer')[0] as Drawer;
    if (drawer) {
      const container = drawer.parentNode!;
      container.addEventListener('MDCTopAppBar:nav', () => {
        drawer.open = !drawer.open;
      });
    }
    /** Menu */
    const menu = this.shadowRoot!.getElementById("top-menu") as Menu;
    const button = this.shadowRoot!.getElementById("menu-button") as IconButton;
    menu.anchor = button
    // - Done
    this.initializing = false
    this.initialized = true
  }


  private async updateTemplateLabel(spaceEh: string): Promise<void> {
    const spaces = await this._store.pullSpaces();
    if (spaces[spaceEh]) {
      this._currentTemplateEh = spaces[spaceEh].origin;
    }
    const templates = await this._store.updateTemplates()
    let div = this.shadowRoot!.getElementById("template-label") as HTMLElement;
    if (div) {
      div.innerText = templates[this._currentTemplateEh].name;
    }
  }


  async addHardcodedSpaces() {
    /** Templates */
    const mapEh = await this._store.addTemplate({
      name: "Map2D",
      surface: JSON.stringify({
         html: map2D_template_html
      }),
    })
    const quadEh = await this._store.addTemplate({
      name: "Quadrant",
      surface: JSON.stringify({
        svg: quadrant_template_svg,
        size: { x: 600, y: 600 },
      }),
    })
    const boxEh = await this._store.addTemplate({
      name: "Box",
      surface: JSON.stringify({
        html: box_template_html,
        size: { x: 1000, y: 700 },
      }),
    })
    const triangleEh = await this._store.addTemplate({
      name: "Iron Triangle",
      surface: JSON.stringify({
        svg: triangle_template_svg,
        size: { x: 650, y: 460 },
      }),
    })

    /** Spaces */
    await this._store.addSpace({
      name: "Ecuador",
      origin: mapEh,
      visible: true,
      surface: {
        html: `<img src=\"https://www.freeworldmaps.net/southamerica/ecuador/ecuador-map.jpg\" style=\"max-width:100%;max-height:100%;width:100%;height:100%;\" />`,
        size: { x: 800, y: 652 },
      },
      meta: {
        ui: `[]`,
        multi: "true", canTag: "true", markerType: MarkerType[MarkerType.Emoji],
        subMap:  "[[\"ImageUrl\",\"https://www.freeworldmaps.net/southamerica/ecuador/ecuador-map.jpg\"]]",
      },
      locations: [],
    });

    await this._store.addSpace({
      name: "earth",
      origin: mapEh,
      visible: true,
      surface: {
        html: `<img src=\"https://h5pstudio.ecampusontario.ca/sites/default/files/h5p/content/9451/images/image-5f6645b4ef14e.jpg\" style=\"max-width:100%;max-height:100%;width:100%;height:100%;\" />`,
        size: { x: 1000, y: 400 },
      },
      meta: {
        markerType: MarkerType[MarkerType.Avatar],
        subMap: "[[\"ImageUrl\",\"https://h5pstudio.ecampusontario.ca/sites/default/files/h5p/content/9451/images/image-5f6645b4ef14e.jpg\"]]",
        ui: `[{"box":{"left":100,"top":10,"width":100,"height":50},"style":"padding:10px;background-color:#ffffffb8;border-radius: 10px;","content":"Land of the Lost"}]`
      },
      locations: [],
    });

    await this._store.addSpace({
      name: "Abstract",
      origin: boxEh,
      visible: true,
      surface: {
        size: { x: 1000, y: 700 },
        html: `<div style="pointer-events:none;text-align:center;width:100%;height:100%;background-image:linear-gradient(to bottom right, red, yellow);"></div>`
      },
      meta: {
        markerType: MarkerType[MarkerType.Letter],
        subMap: "[[\"style\",\"background-image:linear-gradient(to bottom right, red, yellow);\"]]",
        ui: `[{"box":{"left":200,"top":200,"width":200,"height":200},"style":"background-image: linear-gradient(to bottom right, blue, red);","content":""}, {"box":{"left":450,"top":300,"width":100,"height":100},"style":"background-color:blue;border-radius: 10000px;","content":""}]`,
        multi: "true"
      },
      locations: [],
    });

    await this._store.addSpace({
      name: "Zodiac",
      origin: mapEh,
      visible: true,
      surface: {
        html: `<img src=\"https://image.freepik.com/free-vector/zodiac-circle-natal-chart-horoscope-with-zodiac-signs-planets-rulers-black-white-illustration-horoscope-horoscope-wheel-chart_101969-849.jpg\" style=\"max-width:100%;max-height:100%;width:100%;height:100%;\" />`,
        size: { x: 626, y: 626 },
      },
      meta: {
        ui: `[]`,
        multi: "false", canTag: "true", markerType: MarkerType[MarkerType.Color],
        subMap: "[[\"ImageUrl\",\"https://image.freepik.com/free-vector/zodiac-circle-natal-chart-horoscope-with-zodiac-signs-planets-rulers-black-white-illustration-horoscope-horoscope-wheel-chart_101969-849.jpg\"]]"
      },
      locations: [],
    });

    //// Used for debugging
    // await this._store.addSpace({
    //   name: "Political Compass Img",
    //   origin: mapEh,
    //   visible: true,
    //   surface: {
    //     html: `<img src=\"https://upload.wikimedia.org/wikipedia/commons/6/64/Political_Compass_standard_model.svg\" style=\"max-width:100%;max-height:100%;width:100%;height:100%;\" />`,
    //     size: { x: 600, y: 600 },
    //   },
    //   meta: {
    //     ui: `[]`,
    //     multi: "false", markerType: MarkerType[MarkerType.Avatar],
    //     subMap: "[[\"ImageUrl\",\"https://upload.wikimedia.org/wikipedia/commons/6/64/Political_Compass_standard_model.svg\"]]"
    //   },
    //   locations: [],
    // });
  }


  async archiveSpace() {
    await this._store.hideSpace(this._currentSpaceEh);
    /** Select first space */
    const spaces = await this._store.pullSpaces();
    const firstSpaceEh = this._getFirstVisible(spaces);
    console.log({firstSpaceEh})
    this._currentSpaceEh = firstSpaceEh;
    this.requestUpdate();
  }


  async refresh() {
    console.log("refresh: Pulling data from DHT")
    await this._store.pullSpaces();
    await this._profiles.fetchAllProfiles()
    console.log("refresh: Pinging All")
    await this._store.pingOthers(this._currentSpaceEh, this._profiles.myAgentPubKey)
  }

  async openTemplateDialog(templateEh?: any) {
    this.templateDialogElem.open(templateEh);
  }

  async openArchiveDialog() {
    this.archiveDialogElem.open();
  }

  async openSpaceDialog(space?: any) {
    this.spaceDialogElem.resetAllFields();
    this.spaceDialogElem.open(space);
    if (space) {
      this.spaceDialogElem.loadPreset(space);
    }
  }

  private async handleSpaceSelected(e: any): Promise<void> {
    const index = e.detail.index;
    const spaceList = this.shadowRoot!.getElementById("spaces-list") as List;
    const value = spaceList.items[index].value;
    console.log("space value: " + value);
    this.handleSpaceSelect(value);
  }

  private async handleSpaceSelect(spaceEh: string): Promise<void> {
    this._currentSpaceEh = spaceEh;
    this.spaceElem.currentSpaceEh = spaceEh;
    await this.updateTemplateLabel(spaceEh);
  }

  private async handleArchiveDialogClosing(e: any) {
    const spaces = await this._store.pullSpaces();
    /** Check if current space has been archived */
    if (e.detail.includes(this._currentSpaceEh)) {
      /** Select first visible space */
      const firstSpaceEh = this._getFirstVisible(spaces);
      this._currentSpaceEh = firstSpaceEh;
      this.requestUpdate();
    }
  }

  handleViewArchiveSwitch(e: any) {
    // console.log("handleViewArchiveSwitch: " + e.originalTarget.checked)
    // this.canViewArchive = e.originalTarget.checked;
    // this.requestUpdate()
  }


  openTopMenu() {
    const menu = this.shadowRoot!.getElementById("top-menu") as Menu;
    menu.open = true;
  }

  handleMenuSelect(e: any) {
    console.log("handleMenuSelect: " + e.originalTarget.innerHTML)
    //console.log({e})
    switch (e.originalTarget.innerHTML) {
      case "Fork Template":
        this.openTemplateDialog(this._currentTemplateEh)
        break;
      case "Fork Space":
        this.openSpaceDialog(this._currentSpaceEh)
        break;
      case "Archive Space":
        this.archiveSpace()
        break;
      default:
        break;
    }
  }

  async handleColorChange(e: any) {
    console.log("handleColorChange: " + e.target.lastValueEmitted)
    const color = e.target.lastValueEmitted;
    const profile = this._myProfile.value;
    await this.updateProfile(profile.nickname, profile.fields['avatar'], color)
  }


  determineAgentStatus(key: AgentPubKeyB64) {
    const status = "neutral";
    if (key == this._profiles.myAgentPubKey) {
      return "success";
    }
    const lastPingTime: number = this._store.agentPresences[key];
    const currentTime: number = Math.floor(Date.now()/1000);
    const diff: number = currentTime - lastPingTime;
    if (diff < 10) {
      return "success";
    }
    if (diff < 5 * 60) {
      return "warning";
    }
    return "danger";
  }

  render() {
    if (!this._currentSpaceEh) {
      return;
    }

    /** Build agent list */
    const folks = Object.entries(this._knownProfiles.value).map(([key, profile])=>{
      return html`
        <li class="folk">
          <sl-tooltip content=${profile.nickname}>
            <sl-avatar .image=${profile.fields.avatar}></sl-avatar>
            <sl-badge class="avatar-badge" type="${this.determineAgentStatus(key)}" pill>ㅤ</sl-badge>
          </sl-tooltip>
        </li>`
    })

    /** Build space list */
    const spaces = Object.entries(this._spaces.value).map(
      ([key, space]) => {
        if (!space.visible) {
          return html ``;
        }
        return html`
          <mwc-list-item class="space-li" multipleGraphics twoline value="${key}" graphic="large">
            <span>${space.name}</span>
            <span slot="secondary">${this._store.template(space.origin).name}</span>
            <span slot="graphic" style="width:75px;">${renderSurface(space.surface, 70, 56)}</span>
              <!-- <mwc-icon slot="graphic">folder</mwc-icon>-->
              <!-- <mwc-icon-button slot="meta" icon="info" @click=${() => this.refresh()}></mwc-icon-button> -->
          </mwc-list-item>
          `
      }
    )


    return html`
<!--  DRAWER -->
<mwc-drawer type="dismissible" id="my-drawer">
  <div>
    <mwc-list>
    <mwc-list-item twoline graphic="avatar" hasMeta>
      <span>${this.myNickName}</span>
      <span slot="secondary">${this._profiles.myAgentPubKey}</span>
      <sl-avatar style="margin-left:-22px;border:none;" slot="graphic" .image=${this.myAvatar}></sl-avatar>
      <sl-color-picker hoist slot="meta" size="small" noFormatToggle format='rgb' @click="${this.handleColorChange}" value=${this._myProfile.value.fields['color']}></sl-color-picker>
    </mwc-list-item>
    <li divider role="separator"></li>
    </mwc-list>
    <mwc-button icon="add_circle" @click=${() => this.openSpaceDialog()}>Space</mwc-button>
    <mwc-button icon="add_circle" @click=${() => this.openTemplateDialog()}>Template</mwc-button>
    <mwc-button icon="archive" @click=${() => this.openArchiveDialog()}>View Archives</mwc-button>
    <!-- <mwc-formfield label="View Archived">
      <mwc-switch @click=${this.handleViewArchiveSwitch}></mwc-switch>
    </mwc-formfield>-->

    <!-- SPACE LIST -->
    <mwc-list id="spaces-list" activatable @selected=${this.handleSpaceSelected}>
      ${spaces}
    </mwc-list>

  </div>
  <!-- END DRAWER -->
  <div slot="appContent">
    <!-- TOP APP BAR -->
    <mwc-top-app-bar id="app-bar" dense style="position: relative;">
      <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button>
      <div slot="title">Where - ${this._spaces.value[this._currentSpaceEh].name}</div>
      <mwc-icon-button slot="actionItems" icon="autorenew" @click=${() => this.refresh()} ></mwc-icon-button>
      <mwc-icon-button id="menu-button" slot="actionItems" icon="more_vert" @click=${() => this.openTopMenu()}></mwc-icon-button>
      <mwc-menu id="top-menu" @click=${this.handleMenuSelect}>
        <mwc-list-item graphic="icon" value="fork_template"><span>Fork Template</span><mwc-icon slot="graphic">build</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="fork_space"><span>Fork Space</span><mwc-icon slot="graphic">edit</mwc-icon></mwc-list-item>
        <mwc-list-item graphic="icon" value="archive_space"><span>Archive Space</span><mwc-icon slot="graphic">delete</mwc-icon></mwc-list-item>
      </mwc-menu>
    </mwc-top-app-bar>
    <!-- APP BODY -->
    <div class="appBody">
      <where-space id="where-space" .currentSpaceEh=${this._currentSpaceEh}></where-space>
      <div class="folks">
        ${folks}
      </div>
    </div>
    <!-- DIALOGS -->
    <where-archive-dialog id="archive-dialog" @archive-update="${this.handleArchiveDialogClosing}"></where-archive-dialog>
    <where-template-dialog id="template-dialog" @template-added=${(e:any) => console.log(e.detail)}></where-template-dialog>
    <where-space-dialog id="space-dialog"
                        .myProfile=${this._myProfile.value}
                        @space-added=${(e:any) => this._currentSpaceEh = e.detail}>
    </where-space-dialog>
  </div>
</mwc-drawer>
`;
  }


  static get scopedElements() {
    return {
      "mwc-menu": Menu,
      "mwc-slider": Slider,
      "mwc-switch": Switch,
      "mwc-drawer": Drawer,
      "mwc-top-app-bar": TopAppBar,
      "mwc-textfield": TextField,
      "mwc-select": Select,
      "mwc-list": List,
      "mwc-list-item": ListItem,
      "mwc-icon": Icon,
      "mwc-icon-button": IconButton,
      "mwc-button": Button,
      "where-space-dialog" : WhereSpaceDialog,
      "where-template-dialog" : WhereTemplateDialog,
      "where-archive-dialog" : WhereArchiveDialog,
      "where-space": WhereSpace,
      "mwc-formfield": Formfield,
      'sl-avatar': SlAvatar,
      'sl-tooltip': SlTooltip,
      'sl-color-picker': SlColorPicker,
      'sl-badge': SlBadge,
    };
  }

  static get styles() {
    return [
      lightTheme,
      sharedStyles,
      css`
        :host {
          margin: 10px;
        }

        .mdc-drawer__header {
          display:none;
        }

        .avatar-badge {
          margin-left: 35px;
          margin-top: -15px;
          display: block;

        }

        sl-badge::part(base) {
          border: 1px solid;
          padding-bottom: 0px;
          padding-top: 0px;
        }

        sl-tooltip sl-avatar {
          --size: ${MARKER_WIDTH}px;
        }

        sl-tooltip {
          display: inline;
        }

        mwc-top-app-bar {
          /**--mdc-theme-primary: #00ffbb;*/
          /**--mdc-theme-on-primary: black;*/
        }

        #app-bar {
          /*margin-top: -15px;*/
        }

        #my-drawer {
          margin-top: -15px;
        }

        .zoom {
          display: inline-block;
        }

        .zoom mwc-icon-button {
          height: 30px;
          margin-top: -8px;
        }

        .appBody {
          width: 100%;
          margin-top: 2px;
          display:flex;
        }

        .folk {
          list-style: none;
          margin: 2px;
          text-align: center;
          font-size: 70%;
        }

        .folk > img {
          width: 50px;
          border-radius: 10000px;
        }

        mwc-textfield.rounded {
          --mdc-shape-small: 20px;
          width: 7em;
          margin-top:10px;
        }

        mwc-textfield label {
          padding: 0px;
        }

        @media (min-width: 640px) {
          main {
            max-width: none;
          }
        }
      `,
    ];
  }
}
