import { html,css, LitElement } from 'lit';
import { state, property } from 'lit/decorators.js';

import { contextProvided } from '@lit-labs/context';
import { contextStore } from 'lit-svelte-stores';
import { Unsubscriber } from 'svelte/store';

import { sharedStyles } from '../sharedStyles';
import { whereContext, Where, Location, Space, Dictionary } from '../types';
import { WhereStore } from '../where.store';
import { WhereSpace } from './where-space';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { ListItem } from 'scoped-material-components/mwc-list-item';
import { Select } from 'scoped-material-components/mwc-select';
import { IconButton } from 'scoped-material-components/mwc-icon-button';
import { Button } from 'scoped-material-components/mwc-button';
import { Dialog } from 'scoped-material-components/mwc-dialog';
import { profilesStoreContext, ProfilesStore, Profile } from "@holochain-open-dev/profiles";
import { TextField } from 'scoped-material-components/mwc-textfield';

/**
 * @element where-controller
 * @fires event-created - Fired after actually creating the event, containing the new CalendarEvent
 * @csspart event-title - Style the event title textfield
 */
export class WhereController extends ScopedElementsMixin(LitElement) {

  constructor() {
    super()
  }

  /** Public attributes */

  /** Dependencies */

  @contextProvided({context: whereContext})
  _store!: WhereStore;

  @contextProvided({context: profilesStoreContext})
  _profiles!: ProfilesStore;

  @contextStore({
    context: profilesStoreContext,
    selectStore: s => s.myProfile,
  })
  _myProfile!: Profile;


  @contextStore({
    context: whereContext,
    selectStore: s => s.spaces,
  })
  _spaces!: Dictionary<Space>;

  @contextStore({
    context: whereContext,
    selectStore: s => s.zooms,
  })
  _zooms!: Dictionary<number>;

  /** Private properties */

  @state() _current = "";
  @state() _myAvatar = "https://i.imgur.com/oIrcAO8.jpg";

  private initialized = false

  get myNickName(): string {
    return this._myProfile.nickname
  }

  firstUpdated() {
    const unsubscribe : Unsubscriber;
    unsubscribe = this._profiles.myProfile.subscribe(()=>  {
      this.checkInit()
      unsubscribe()
    })
  }

  async checkInit() {
    if (!this.initialized) {
      let spaces = await this._store.updateSpaces();
      // load up a space if there are none:
      if (Object.keys(spaces).length == 0) {
        await this.initializeSpaces();
        spaces = await this._store.updateSpaces();
      }
      this._current = Object.keys(spaces)[0]
      console.log("current space", this._current, spaces[this._current].name)
    }
    this.initialized = true
  }

  async initializeSpaces() {
    const myPubKey = this._profiles.myAgentPubKey
    await this._store.addSpace(
      { name: "earth",
        surface: {
          url: "https://h5pstudio.ecampusontario.ca/sites/default/files/h5p/content/9451/images/image-5f6645b4ef14e.jpg",
          size: {x:3840, y:1799},
        },
        meta: {},
        wheres: [
          { entry: {location: {x: 1150, y: 450},
                    meta: {
                      img: this._myAvatar,
                      name: this.myNickName,
                      tag: "My house"
                    }},
            hash: "",
            authorPubKey: myPubKey},
          { entry: {location: {x: 1890, y: 500},
                    meta: {
                      name: "Monk",
                      tag: "My apartment",
                      img: "https://i.imgur.com/4BKqQY1.png"
                    }},
            hash: "",
            authorPubKey: "sntahoeuabcorchaotbkantgcdoesucd"}
        ],
      }
    )
    await this._store.addSpace(
      {
        name: "Ecuador",
        surface: {
          url: "https://www.freeworldmaps.net/southamerica/ecuador/ecuador-map.jpg",
          size: {x: 500, y: 300}
        },
        meta: {},
        wheres: [/*
          { entry: {location: {x: 0, y: 0},
                    meta: {
                      name: "Monk",
                      tag: "My apartment",
                      img: "https://i.imgur.com/4BKqQY1.png"
                    }},
            hash: "",
            authorPubKey: "sntahoeuabcorchaotbkantgcdoesucd"}*/
        ]
      }
    )
  }

  async refresh() {
    await this._store.updateSpaces();
  }

  get spaceElem() : WhereSpace {
    return this.shadowRoot!.getElementById("where-space") as WhereSpace;
  }

  async newSpace() {
    const dialog = this.newSpaceElem
    dialog.open = true
  }

  get newSpaceElem() : Dialog {
    return this.shadowRoot!.getElementById("new-space") as Dialog;
  }

  private handleSpaceSelect(space: string) : void {
    this._current = space
    this.spaceElem.current = space
  }

  private handleZoom(zoom: number) : void {
    this.spaceElem.zoom(zoom)
  }

  private async handleNewSpace(e: any) {
    const name = this.shadowRoot!.getElementById("new-space-name") as TextField
    const url = this.shadowRoot!.getElementById("new-space-url") as TextField
    if (e.detail.action == "ok") {
      const dialog = e.target as Dialog
      const img = this.shadowRoot!.getElementById("sfc") as HTMLImageElement
      img.onload = async () => {
        const space : Space = {
          name: name.value,
          surface: {
            url: url.value,
            size: {x: img.naturalHeight, y: img.naturalWidth}
          },
          meta: {},
          wheres: []
        }
        this._current = await this._store.addSpace(space)
        name.value = ""
        url.value = ""
      }
      img.src = url.value
    }
    else {
      name.value = ""
      url.value = ""
    }
  }

  render() {
    if (!this._current) return // html`<mwc-button  @click=${() => this.checkInit()}>Start</mwc-button>`;

    const space = this._store.space(this._current)

    return html`
<mwc-select outlined label="Space" @select=${this.handleSpaceSelect}>
${Object.entries(this._spaces).map(([key,space]) => html`
      <mwc-list-item
    @request-selected=${() => this.handleSpaceSelect(key)}
      .selected=${key === this._current} value="${key}">${space.name}
    </mwc-list-item>
      ` )}
</mwc-select>
<div class="zoom">
  Zoom: ${(this._zooms[this._current]*100).toFixed(0)}% <br/>
  <mwc-icon-button icon="add_circle" @click=${() => this.handleZoom(.1)}></mwc-icon-button>
  <mwc-icon-button icon="remove_circle" @click=${() => this.handleZoom(-.1)}></mwc-icon-button>
</div>
<mwc-button icon="add_circle" @click=${() => this.newSpace()}>New</mwc-button>
<mwc-button icon="refresh" @click=${() => this.refresh()}>Refresh</mwc-button>

<mwc-dialog id="new-space" heading="New Space" @closing=${this.handleNewSpace}>
<mwc-textfield
id="new-space-name"
minlength="3"
maxlength="64"
placeholder="Name"
required>
</mwc-textfield>
<mwc-textfield
id="new-space-url"
placeholder="Image URL"
required>
<img id="sfc" src=""></img>
</mwc-textfield>
<mwc-button slot="primaryAction" dialogAction="ok">ok</mwc-button>
<mwc-button slot="secondaryAction"  dialogAction="cancel">cancel</mwc-button>
</mwc-dialog>

<where-space id="where-space" .current=${this._current} avatar="${this._myAvatar}"></where-space>
`;
  }

  static get scopedElements() {
    return {
      'mwc-select': Select,
      'mwc-list-item': ListItem,
      'mwc-icon-button': IconButton,
      'mwc-button': Button,
      'mwc-dialog': Dialog,
      'mwc-textfield': TextField,
      'where-space': WhereSpace,
    };
  }

  static get styles() {
    return [
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

@media (min-width: 640px) {
main {
max-width: none;
}
}
`]
  }
}
