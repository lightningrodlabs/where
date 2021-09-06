import { html,css, LitElement } from 'lit';
import { state, property } from 'lit/decorators.js';

import { requestContext } from '@holochain-open-dev/context';

import { sharedStyles } from '../sharedStyles';
import { WHERE_CONTEXT, Where, Location } from '../types';
import { WhereStore } from '../where.store';
import { WhereSpace } from './where-space';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { ListItem } from 'scoped-material-components/mwc-list-item';
import { Select } from 'scoped-material-components/mwc-select';
import { IconButton } from 'scoped-material-components/mwc-icon-button';
import { Button } from 'scoped-material-components/mwc-button';
import { PROFILES_STORE_CONTEXT, ProfilesStore, Profile } from "@holochain-open-dev/profiles";

/**
 * @element where-map
 * @fires event-created - Fired after actually creating the event, containing the new CalendarEvent
 * @csspart event-title - Style the event title textfield
 */
export class WhereMap extends ScopedElementsMixin(LitElement) {

  constructor() {
    super()
  }

  /** Public attributes */

  /**
   * This is a description of a property with an attribute with exactly the same name: "color".
   */
  @property({ type: String }) title = 'Hey there';

  /** Dependencies */

  @requestContext(WHERE_CONTEXT)
  _store!: WhereStore;

  @requestContext(PROFILES_STORE_CONTEXT)
  _profiles!: ProfilesStore;

  /** Private properties */

  @state() _current = "";
  @state() _myAvatar = "https://i.imgur.com/oIrcAO8.jpg";

  get myNickName(): string {
    return this._profiles.myProfile ? this._profiles.myProfile.nickname : ""
  }

  async initializeSpaces() {
    const myPubKey = this._profiles.myAgentPubKey
    const myProfile = this._profiles.myProfile as Profile;
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
    this.requestUpdate()
  }

  async newSpace() {
    alert("new")
    this.requestUpdate()
  }

  async checkInit() {
    if (this._profiles) {
      await this._profiles.fetchMyProfile()
      const myProfile = this._profiles.myProfile
      console.log("Profile", myProfile)

      if (myProfile) {
        await this._store.updateSpaces();
        // load up a space if there are none:
        if (Object.keys(this._store.spaces).length == 0) {
          await this.initializeSpaces();
          await this._store.updateSpaces();
        }
        this._current = Object.keys(this._store.spaces)[0]
        console.log("current space", this._current, this._store.spaces[this._current].name)
        this.requestUpdate()
        return
      }
    }
    console.log("trying again")
    setTimeout(this.checkInit,200)
  }

  get spaceElem() : WhereSpace {
    return this.shadowRoot!.getElementById("where-space") as WhereSpace;
  }

  private handleSpaceSelect(space: string) : void {
    this._current = space
    this.spaceElem.current = space
    this.requestUpdate()
  }

  private handleZoom(zoom: number) : void {
    this.spaceElem.zoom(zoom)
    this.requestUpdate()
  }

  render() {
    if (!this._current) return html`
<mwc-button  @click=${() => this.checkInit()}>Start</mwc-button>
`;
    const space = this._store.space(this._current)


    return html`
<mwc-select outlined label="Space" @select=${this.handleSpaceSelect}>
${Object.entries(this._store.spaces).map(([key,space]) => html`
      <mwc-list-item
    @request-selected=${() => this.handleSpaceSelect(key)}
      .selected=${key === this._current} value="${key}">${space.name}
    </mwc-list-item>
      ` )}
</mwc-select>
<div class="zoom">
  Zoom: ${(this._store.zooms[this._current]*100).toFixed(0)}% <br/>
  <mwc-icon-button icon="add_circle" @click=${() => this.handleZoom(.1)}></mwc-icon-button>
  <mwc-icon-button icon="remove_circle" @click=${() => this.handleZoom(-.1)}></mwc-icon-button>
</div>
<mwc-button icon="add_circle" @click=${() => this.newSpace()}>New</mwc-button>
<mwc-button icon="refresh" @click=${() => this.refresh()}>Refresh</mwc-button>
<where-space id="where-space" .current=${this._current} avatar="${this._myAvatar}"></where-space>
`;
  }

  static get scopedElements() {
    return {
      'mwc-select': Select,
      'mwc-list-item': ListItem,
      'mwc-icon-button': IconButton,
      'mwc-button': Button,
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
