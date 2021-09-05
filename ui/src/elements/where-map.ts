import { html,css, LitElement } from 'lit';
import { state, property } from 'lit/decorators.js';

import { requestContext } from '@holochain-open-dev/context';

import { sharedStyles } from '../sharedStyles';
import { WHERE_CONTEXT, Where, Location } from '../types';
import { WhereStore } from '../where.store';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { ListItem } from 'scoped-material-components/mwc-list-item';
import { Select } from 'scoped-material-components/mwc-select';
import { IconButton } from 'scoped-material-components/mwc-icon-button';
import { Button } from 'scoped-material-components/mwc-button';
import { PROFILES_STORE_CONTEXT, ProfilesStore } from "@holochain-open-dev/profiles";


const MARKER_WIDTH = 40

/**
 * @element where-map
 * @fires event-created - Fired after actually creating the event, containing the new CalendarEvent
 * @csspart event-title - Style the event title textfield
 */
export class WhereMap extends ScopedElementsMixin(LitElement) {

  private _handleWheel = (e:WheelEvent) => {
    if (e.target ) {
      if ((e.target as Element).tagName == "WHERE-MAP") {
        this.handleZoom(e.deltaY > 0 ? .05 : -.05)
      }
    }
  }

  constructor() {
    super()
    window.addEventListener('wheel', this._handleWheel);
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
  @state() _meIdx = 0;
  @state() _myAvatar = "https://i.imgur.com/oIrcAO8.jpg";
  @state() _myNickName = "_unknown_";
  @state() _zoom = 1.0;

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
                      name: this._myNickName,
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

  async checkInit() {
    if (this._profiles) {
      await this._profiles.fetchMyProfile()
      const myProfile = this._profiles.myProfile
      console.log("Profile", myProfile)

      if (myProfile) {
        this._myNickName = myProfile.nickname
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

  private handleSpaceSelect(space: string) : void {
    this._current = space
    this.requestUpdate()
  }

  private handleZoom(zoom: number) : void {
    if (this._zoom + zoom < 0) {
      this._zoom = 0
    } else {
      this._zoom += zoom;
    }
    this.requestUpdate()
  }

  private handleClick(event: any) : void {
    if (event != null) {
      const rect = event.target.getBoundingClientRect();

      const x = (event.clientX - rect.left)/this._zoom; //x position within the element.
      const y = (event.clientY - rect.top)/this._zoom;  //y position within the element.
      this._meIdx = this._store.getAgentIdx(this._current, this._profiles.myAgentPubKey)
      if (this._meIdx >= 0) {
        this._store.updateWhere(this._current,this._meIdx, x, y)
      } else {
        const where : Location = {
          location: {x,y},
          meta: {
            tag: "",
            img: this._myAvatar,
            name: this._myNickName
          }
        }
        this._store.addWhere(this._current, where )
      }
      this.requestUpdate()
    }
  }

  render() {
    if (!this._current) return html`
<mwc-button  @click=${() => this.checkInit()}>Start</mwc-button>
`;
    const space = this._store.space(this._current)
    const whereItems = space.wheres.map((where, i) => {

      const x = where.entry.location.x*this._zoom
      const y = where.entry.location.y*this._zoom

      return html`
      <img class="where-marker" class:me=${i == this._meIdx} style="left:${x}px;top: ${y}px" src="${where.entry.meta.img}">
      <div class="where-details" class:me=${i == this._meIdx} style="left:${x}px;top: ${y}px" src="${where.entry.meta.img}">
      <h3>${where.entry.meta.name}</h3>
      <p>${where.entry.meta.tag}</p>
  `})

    return html`
<mwc-select outlined label="Space" @select=${this.handleSpaceSelect}>
${Object.entries(this._store.spaces).map(([key,space]) => html`
      <mwc-list-item
    @request-selected=${() => this.handleSpaceSelect(key)}
      .selected=${key === this._current} value="${key}">${space.name}
    </mwc-list-item>
      ` )}
</mwc-select>
Zoom: ${(this._zoom*100).toFixed(0)}%
<mwc-icon-button icon="add_circle" @click=${() => this.handleZoom(.1)}></mwc-icon-button>
<mwc-icon-button icon="remove_circle" @click=${() => this.handleZoom(-.1)}></mwc-icon-button>
<div class="surface">
<img .style="width:${space.surface.size.x*this._zoom}px" .id="${this._current}-img" src="${space.surface.url}" @click=${this.handleClick}>
${whereItems}

</div>
`;
  }

  static get scopedElements() {
    return {
      'mwc-select': Select,
      'mwc-list-item': ListItem,
      'mwc-icon-button': IconButton,
      'mwc-button': Button,
    };
  }

  static get styles() {
    return [
      sharedStyles,
      css`
:host {
margin: 10px;
}

.surface{
position: relative;
overflow:auto;
max-width:1500px;
max-height:900px;
}

.surface > img {
}

img.where-marker {
max-width:100%;
max-height:100%;
border-radius: 10000px;
border: black 1px solid;
position: absolute;
height: ${MARKER_WIDTH}px;
width: ${MARKER_WIDTH}px;
margin-top: -${MARKER_WIDTH/2}px;
margin-left: -${MARKER_WIDTH/2}px;
}

img.where-marker.me {
border: orange 2px solid;
}

.where-details {
display: none;
position: absolute;

background: white;
border-radius: 10px;
border: black 1px solid;
padding: 15px;
text-align: left;
}

.where-details.me {
border: orange 2px solid;
}

.where-details h3 {
margin: 0;
}

.where-details p:last-of-type {
margin-bottom: 0;
}

.where-marker:hover + .where-details, .where-details:hover {
display: block;
}

@media (min-width: 640px) {
main {
max-width: none;
}
}
`]
  }
}
