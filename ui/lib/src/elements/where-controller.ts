import { html, css, LitElement } from "lit";
import { state } from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import { StoreSubscriber } from "lit-svelte-stores";
import { Unsubscriber } from "svelte/store";

import { sharedStyles } from "../sharedStyles";
import { whereContext, Space, Dictionary, Signal } from "../types";
import { WhereStore } from "../where.store";
import { WhereSpace } from "./where-space";
import { WhereSpaceDialog } from "./where-space-dialog";
<<<<<<< HEAD
import { WhereTemplateDialog } from "./where-template-dialog";
=======
import { lightTheme, SlAvatar } from '@scoped-elements/shoelace';
>>>>>>> remotes/origin/HEAD
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  ListItem,
  Select,
  IconButton,
  Button,
} from "@scoped-elements/material-web";
import {
  profilesStoreContext,
  ProfilesStore,
  Profile,
} from "@holochain-open-dev/profiles";

/**
 * @element where-controller
 */
export class WhereController extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */

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

  @state() _current = "";
  @state() _currentTemplate = "";
  @state() _myAvatar = "https://i.imgur.com/oIrcAO8.jpg";

  private initialized = false;
  private initializing = false;
  get myNickName(): string {
    return this._myProfile.value.nickname;
  }
  get myAvatar(): string {
    return this._myProfile.value.fields.avatar;
  }
  firstUpdated() {
    console.log("firstUpdated...")
    let unsubscribe: Unsubscriber;
    unsubscribe = this._profiles.myProfile.subscribe((profile) => {
      if (profile) {
        this._myAvatar = `https://robohash.org/${profile.nickname}`
        this.checkInit().then(() => {});
      }
      // unsubscribe()
    });
  }

  async checkInit() {
    console.log("checkInit...")
    if (!this.initialized && !this.initializing) {
      this.initializing = true  // because checkInit gets call whenever profiles changes...
      let spaces = await this._store.updateSpaces();
      let templates = await this._store.updateTemplates();
      // load up a space if there are none:
      if (Object.keys(spaces).length == 0) {
        console.log("no spaces found, initializing")
        await this.initializeSpaces();
        spaces = await this._store.updateSpaces();
      }
      this._current = Object.keys(spaces)[0];
      this._currentTemplate = Object.keys(templates)[0];
      console.log("current space", this._current, spaces[this._current].name);
      console.log("current template", this._currentTemplate, templates[this._currentTemplate].name);
      this.initializing = false
    }
    this.initialized = true;
  }

  async initializeSpaces() {
    console.log('initializeSpaces...')
    //const myPubKey = this._profiles.myAgentPubKey;
    const mapEh = await this._store.addTemplate({
      name: "Map2D",
      surface: "{\
        'url': '%ImageURL%',\
        'box': \"{'box':{'left':100,'top':10,'width':100,'height':50}\"\
    'title': '%String%'\
  }",
      //surface: "bob"
    })
    console.log('mapEh: ' + mapEh)
    await this._store.addSpace({
      name: "earth",
      origin: mapEh,
      surface: {
        url: "https://h5pstudio.ecampusontario.ca/sites/default/files/h5p/content/9451/images/image-5f6645b4ef14e.jpg",
        size: { x: 3840, y: 1799 },
        data: `[{"box":{"left":100,"top":10,"width":100,"height":50},"style":"padding:10px;background-color:white;border-radius: 10px;","content":"Land of the Lost"}]`,
      },
      meta: {},
      wheres: [],
    });
    await this._store.addSpace({
      name: "Ecuador",
      origin: mapEh,
      surface: {
        url: "https://www.freeworldmaps.net/southamerica/ecuador/ecuador-map.jpg",
        size: { x: 800, y: 652 },
        data: "[]",
      },
      meta: { multi: "true" },
      wheres: [],
    });
    await this._store.addSpace({
      name: "Abstract",
      origin: mapEh,
      surface: {
        url: "",
        size: { x: 1000, y: 700 },
        data: `[{"box":{"left":0,"top":0,"width":1000,"height":700},"style":"background-image: linear-gradient(to bottom right, red, yellow);","content":""},{"box":{"left":450,"top":300,"width":100,"height":100},"style":"background-color:blue;border-radius: 10000px;","content":""}]`,
      },
      meta: { multi: "true" },
      wheres: [],
    });
    await this._store.addSpace({
      name: "Zodiac",
      origin: mapEh,
      surface: {
        url: "https://image.freepik.com/free-vector/zodiac-circle-natal-chart-horoscope-with-zodiac-signs-planets-rulers-black-white-illustration-horoscope-horoscope-wheel-chart_101969-849.jpg",
        size: { x: 626, y: 626 },
        data: "[]",
      },
      meta: { multi: "false" },
      wheres: [],
    });
    await this._store.addSpace({
      name: "Political Compass",
      origin: mapEh,
      surface: {
        url: "https://upload.wikimedia.org/wikipedia/commons/6/64/Political_Compass_standard_model.svg",
        size: { x: 600, y: 600 },
        data: "[]",
      },
      meta: { multi: "false" },
      wheres: [],
    });
  }

  async refresh() {
    console.log('refresh...')
    await this._store.updateSpaces();
    await this._profiles.fetchAllProfiles()
  }

  async openTemplateDialog() {
    this.templateDialogElem.open();
  }

  get templateDialogElem() : WhereTemplateDialog {
    return this.shadowRoot!.getElementById("template-dialog") as WhereTemplateDialog;
  }

  get spaceElem(): WhereSpace {
    return this.shadowRoot!.getElementById("where-space") as WhereSpace;
  }

  async openSpaceDialog() {
    this.spaceDialogElem.open();
  }

  get spaceDialogElem() : WhereSpaceDialog {
    return this.shadowRoot!.getElementById("space-dialog") as WhereSpaceDialog;
  }

  private handleSpaceSelect(space: string): void {
    this._current = space;
    this.spaceElem.current = space;
  }

  private handleZoom(zoom: number): void {
    this.spaceElem.zoom(zoom);
  }

  render() {
    console.log('render...')
    if (!this._current) return; // html`<mwc-button  @click=${() => this.checkInit()}>Start</mwc-button>`;
    const folks = Object.entries(this._knownProfiles.value).map(([key, profile])=>{
      return html`<li class="folk">
<sl-avatar .image=${profile.fields.avatar}></sl-avatar>
 <div>${profile.nickname}</div></li>`
    })
    return html`
<mwc-select outlined label="Space" @select=${this.handleSpaceSelect}>
${Object.entries(this._spaces.value).map(
  ([key, space]) => html`
    <mwc-list-item
      @request-selected=${() => this.handleSpaceSelect(key)}
      .selected=${key === this._current}
      value="${key}"
      >${space.name}
    </mwc-list-item>
  `
)}
</mwc-select>
<div class="zoom">
  Zoom: ${(this._zooms.value[this._current] * 100).toFixed(0)}% <br/>
  <mwc-icon-button icon="add_circle" @click=${() => this.handleZoom(0.1)}></mwc-icon-button>
  <mwc-icon-button icon="remove_circle" @click=${() => this.handleZoom(-0.1)}></mwc-icon-button>
</div>
<mwc-button icon="add_circle" @click=${() => this.openTemplateDialog()}>Template</mwc-button>
<mwc-button icon="add_circle" @click=${() => this.openSpaceDialog()}>Space</mwc-button>
<mwc-button icon="refresh" @click=${() => this.refresh()}>Refresh</mwc-button>

<div class="folks">
${folks}
</div>

<<<<<<< HEAD
<where-template-dialog id="template-dialog" @template-added=${(e:any) => this._currentTemplate = e.detail}> </where-template-dialog>
<where-space-dialog id="space-dialog" @space-added=${(e:any) => this._current = e.detail}> </where-space-dialog>


<where-space id="where-space" .current=${this._current} .avatar=${this._myAvatar}></where-space>
=======
<where-space-dialog id="space-dialog" @space-added=${(e:any) => this._current = e.detail}> ></where-space-dialog>
<where-space id="where-space" .current=${this._current} .avatar=${this.myAvatar}></where-space>
>>>>>>> remotes/origin/HEAD
`;
  }

  static get scopedElements() {
    return {
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

        @media (min-width: 640px) {
          main {
            max-width: none;
          }
        }
      `,
    ];
  }
}
