import { html, css, LitElement } from "lit";
import { state, property } from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import { StoreSubscriber } from "lit-svelte-stores";
import { Unsubscriber } from "svelte/store";

import { sharedStyles } from "../sharedStyles";
import { whereContext, Space, Dictionary, Signal } from "../types";
import { WhereStore } from "../where.store";
import { WhereSpace } from "./where-space";
import { WhereSpaceDialog } from "./where-space-dialog";
import { WhereTemplateDialog } from "./where-template-dialog";
import { lightTheme, SlAvatar } from '@scoped-elements/shoelace';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  ListItem,
  Select,
  IconButton,
  Button, TextField,
} from "@scoped-elements/material-web";
import {
  profilesStoreContext,
  ProfilesStore,
  Profile,
} from "@holochain-open-dev/profiles";
import {box_template_html, map2D_template_html, quadrant_template_svg, triangle_template_svg} from "./templates";

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
  @state() _myAvatar = "https://i.imgur.com/oIrcAO8.jpg";

  private initialized = false;
  private initializing = false;


  async createDummyProfile() {
    const nickname = "Cam";
    const avatar = "https://publicdomainvectors.org/tn_img/raphie_green_lanthern_smiley.png";

    try {
      const fields: Dictionary<string> = {};
       if (avatar) {
         fields['avatar'] = avatar;
       }
      await this._profiles.createProfile({
        nickname,
        fields,
      });

    } catch (e) {
      //this._existingUsernames[nickname] = true;
      //this._nicknameField.reportValidity();
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
    unsubscribe = this._profiles.myProfile.subscribe((profile) => {
      if (profile) {
        this._myAvatar = `https://robohash.org/${profile.nickname}`
        this.checkInit().then(() => {});
      }
      // unsubscribe()
    });
  }

  firstUpdated() {
    if (this.canLoadDummy) {
      this.createDummyProfile().then(() => {this.subscribeProfile()});
    } else {
      this.subscribeProfile()
    }
  }

  async checkInit() {
    if (!this.initialized && !this.initializing) {
      this.initializing = true  // because checkInit gets call whenever profiles changes...
      let spaces = await this._store.updateSpaces();
      let templates = await this._store.updateTemplates();
      // load up a space if there are none:
      if (Object.keys(spaces).length == 0 || Object.keys(templates).length == 0) {
        console.log("no spaces found, initializing")
        await this.initializeSpaces();
        spaces = await this._store.updateSpaces();
      }
      if (Object.keys(spaces).length == 0 || Object.keys(templates).length == 0) {
        console.error("No spaces or templates found")
      }
      this._currentSpaceEh = Object.keys(spaces)[0];
      this._currentTemplateEh = Object.keys(templates)[0];
      await this.updateTemplateLabel(spaces[this._currentSpaceEh].name);
      console.log("   current space: ",  spaces[this._currentSpaceEh].name, this._currentSpaceEh);
      console.log("current template: ", templates[this._currentTemplateEh].name, this._currentTemplateEh);
      this.initializing = false
    }
    this.initialized = true;
  }

  private async updateTemplateLabel(spaceEh: string): Promise<void> {
    const spaces = await this._store.updateSpaces();
    if (spaces[spaceEh]) {
      this._currentTemplateEh = spaces[spaceEh].origin;
    }
    let div = this.shadowRoot!.getElementById("template-label") as HTMLElement;
    const templates = await this._store.updateTemplates()
    div.innerText = templates[this._currentTemplateEh].name;
    //let abbr = this.shadowRoot!.getElementById("template-abbr") as HTMLElement;
    //abbr.title = templates[this._currentTemplateEh].surface;
  }

  async initializeSpaces() {
    /** Templates */
    const mapEh = await this._store.addTemplate({
      name: "Map2D",
      surface: JSON.stringify({
         html: map2D_template_html,
        //data: `[{"box":{"left":100,"top":10,"width":100,"height":50},"style":"padding:10px;background-color:#ffffffb8;border-radius: 10px;","content":"Lore"}]`,
        //size: { x: 1000, y: 600 },
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
      surface: {
        html: `<img src=\"https://www.freeworldmaps.net/southamerica/ecuador/ecuador-map.jpg\" style=\"max-width:100%;max-height:100%;width:100%;height:100%;\" />`,
        size: { x: 800, y: 652 },
      },
      meta: {
        ui: `[]`,
        multi: "true", canTag: "true",
        subMap:  "[[\"ImageUrl\",\"https://www.freeworldmaps.net/southamerica/ecuador/ecuador-map.jpg\"]]",
      },
      locations: [],
    });


    await this._store.addSpace({
      name: "earth",
      origin: mapEh,
      surface: {
        html: `<img src=\"https://h5pstudio.ecampusontario.ca/sites/default/files/h5p/content/9451/images/image-5f6645b4ef14e.jpg\" style=\"max-width:100%;max-height:100%;width:100%;height:100%;\" />`,
        size: { x: 1000, y: 400 },
      },
      meta: {
        subMap: "[[\"ImageUrl\",\"https://h5pstudio.ecampusontario.ca/sites/default/files/h5p/content/9451/images/image-5f6645b4ef14e.jpg\"]]",
        ui: `[{"box":{"left":100,"top":10,"width":100,"height":50},"style":"padding:10px;background-color:#ffffffb8;border-radius: 10px;","content":"Land of the Lost"}]`
      },
      locations: [],
    });

    await this._store.addSpace({
      name: "Abstract",
      origin: boxEh,
      surface: {
        size: { x: 1000, y: 700 },
        html: `<div style="pointer-events:none;text-align:center;width:100%;height:100%;background-image:linear-gradient(to bottom right, red, yellow);"></div>`
      },
      meta: {
        subMap: "[[\"style\",\"background-image:linear-gradient(to bottom right, red, yellow);\"]]",
        ui: `[{"box":{"left":200,"top":200,"width":200,"height":200},"style":"background-image: linear-gradient(to bottom right, blue, red);","content":""}, {"box":{"left":450,"top":300,"width":100,"height":100},"style":"background-color:blue;border-radius: 10000px;","content":""}]`,
        multi: "true"
      },
      locations: [],
    });

    await this._store.addSpace({
      name: "Zodiac",
      origin: mapEh,
      surface: {
        html: `<img src=\"https://image.freepik.com/free-vector/zodiac-circle-natal-chart-horoscope-with-zodiac-signs-planets-rulers-black-white-illustration-horoscope-horoscope-wheel-chart_101969-849.jpg\" style=\"max-width:100%;max-height:100%;width:100%;height:100%;\" />`,
        size: { x: 626, y: 626 },
      },
      meta: {
        ui: `[]`,
        multi: "false", canTag: "true",
        subMap: "[[\"ImageUrl\",\"https://image.freepik.com/free-vector/zodiac-circle-natal-chart-horoscope-with-zodiac-signs-planets-rulers-black-white-illustration-horoscope-horoscope-wheel-chart_101969-849.jpg\"]]"
      },
      locations: [],
    });
    await this._store.addSpace({
      name: "Political Compass",
      origin: mapEh,
      surface: {
        html: `<img src=\"https://upload.wikimedia.org/wikipedia/commons/6/64/Political_Compass_standard_model.svg\" style=\"max-width:100%;max-height:100%;width:100%;height:100%;\" />`,
        size: { x: 600, y: 600 },
      },
      meta: {
        ui: `[]`,
        multi: "false",
        subMap: "[[\"ImageUrl\",\"https://upload.wikimedia.org/wikipedia/commons/6/64/Political_Compass_standard_model.svg\"]]"
      },
      locations: [],
    });
  }


  async refresh() {
    await this._store.updateSpaces();
    await this._profiles.fetchAllProfiles()
  }

  async openTemplateDialog(templateEh?: any) {
    this.templateDialogElem.open(templateEh);
  }

  get templateDialogElem() : WhereTemplateDialog {
    return this.shadowRoot!.getElementById("template-dialog") as WhereTemplateDialog;
  }

  get spaceElem(): WhereSpace {
    return this.shadowRoot!.getElementById("where-space") as WhereSpace;
  }

  async openSpaceDialog(space?: any) {
    this.spaceDialogElem.resetAllFields();
    this.spaceDialogElem.open(space);
    if (space) {
      this.spaceDialogElem.loadPreset(space);
    }
  }

  get spaceDialogElem() : WhereSpaceDialog {
    return this.shadowRoot!.getElementById("space-dialog") as WhereSpaceDialog;
  }

  private async handleSpaceSelect(spaceEh: string): Promise<void> {
    this._currentSpaceEh = spaceEh;
    this.spaceElem.currentSpaceEh = spaceEh;
    await this.updateTemplateLabel(spaceEh);
  }

  private handleZoomUpdateAbs(input: number): void {
    const zoom = Math.min(input, 999);
    const cur: number = (this._zooms.value[this._currentSpaceEh] * 100);
    const delta = (zoom - cur) / 100;
    this.spaceElem.updateZoom(delta);
  }

  private handleZoomUpdate(delta: number): void {
    this.spaceElem.updateZoom(delta);
  }


  render() {
    if (!this._currentSpaceEh) {
      return;
    }

    // html`<mwc-button  @click=${() => this.checkInit()}>Start</mwc-button>`;

    /** Build agent list */
    const folks = Object.entries(this._knownProfiles.value).map(([key, profile])=>{
      return html`
        <li class="folk">
            <sl-avatar .image=${profile.fields.avatar}></sl-avatar>
            <div>${profile.nickname}</div>
        </li>`
    })

    return html`
<div id="menu-bar" style="width: 100%;margin-bottom: 5px">
  <mwc-select outlined label="Space" @select=${this.handleSpaceSelect}>
  ${Object.entries(this._spaces.value).map(
    ([key, space]) => html`
      <mwc-list-item
        @request-selected=${() => this.handleSpaceSelect(key)}
        .selected=${key === this._currentSpaceEh}
        value="${key}">
          ${space.name}
      </mwc-list-item>
    `
  )}
  </mwc-select>
<!--  <abbr title="surface description" id="template-abbr"><span id="template-label"></span></abbr>-->
  <mwc-button icon="edit" outlined id="template-label" @click=${() => this.openTemplateDialog(this._currentTemplateEh)}></mwc-button>

  <mwc-textfield label="Zoom" class="rounded" type="number" pattern="[0-9]+" minlength="1" maxlength="3" min="10" max="999" outlined
                 value=${(this._zooms.value[this._currentSpaceEh] * 100).toFixed(0)}
                 @input=${(e:any) => this.handleZoomUpdateAbs(e.target.value)}
  ></mwc-textfield>
    <!-- <div class="zoom">
     Zoom: ${(this._zooms.value[this._currentSpaceEh] * 100).toFixed(0)}% <br/>
     <mwc-icon-button icon="add_circle" @click=${() => this.handleZoomUpdate(0.1)}></mwc-icon-button>
     <mwc-icon-button icon="remove_circle" @click=${() => this.handleZoomUpdate(-0.1)}></mwc-icon-button>
   </div> -->
  <mwc-button icon="build_circle" @click=${() => this.openSpaceDialog(this._currentSpaceEh)}>Fork</mwc-button>
  <mwc-button icon="add_circle" @click=${() => this.openTemplateDialog()}>Template</mwc-button>
  <mwc-button icon="add_circle" @click=${() => this.openSpaceDialog()}>Space</mwc-button>
  <mwc-button icon="refresh" @click=${() => this.refresh()}>Refresh</mwc-button>

  <div class="folks">
  ${folks}
  </div>
</div>

<where-template-dialog id="template-dialog" @template-added=${(e:any) => this._currentTemplateEh = e.detail}> </where-template-dialog>
<where-space-dialog id="space-dialog" @space-added=${(e:any) => this._currentSpaceEh = e.detail}> </where-space-dialog>
<where-space id="where-space" .currentSpaceEh=${this._currentSpaceEh} .avatar=${this.myAvatar}></where-space>
`;
  }

  static get scopedElements() {
    return {
      "mwc-textfield": TextField,
      "mwc-select": Select,
      "mwc-list-item": ListItem,
      "mwc-icon-button": IconButton,
      "mwc-button": Button,
      "where-space-dialog" : WhereSpaceDialog,
      "where-template-dialog" : WhereTemplateDialog,
      "where-space": WhereSpace,
      'sl-avatar': SlAvatar,
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

        .zoom {
          display: inline-block;
        }
        .zoom mwc-icon-button {
          height: 30px;
          margin-top: -8px;
        }

        .folks {
          float:right;
        }
        .folk {
          list-style: none;
          display: inline-block;
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
          width: 90px;
          /*margin-top:10px;*/
        }
        mwc-textfield label {
          padding: 0px;
        }
        #menu-bar mwc-button {
          margin-top: 10px;
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
