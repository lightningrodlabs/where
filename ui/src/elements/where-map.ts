import { html,css, LitElement } from 'lit';
import { state, property } from 'lit/decorators.js';

import { requestContext } from '@holochain-open-dev/context';

import { sharedStyles } from '../sharedStyles';
import { WHERE_CONTEXT, Where } from '../types';
import { WhereStore } from '../where.store';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { ListItem } from 'scoped-material-components/mwc-list-item';
import { Select } from 'scoped-material-components/mwc-select';
import { IconButton } from 'scoped-material-components/mwc-icon-button';


const MARKER_WIDTH = 40

/**
 * @element where-map
 * @fires event-created - Fired after actually creating the event, containing the new CalendarEvent
 * @csspart event-title - Style the event title textfield
 */
export class WhereMap extends ScopedElementsMixin(LitElement) {
  /** Public attributes */

  /**
   * This is a description of a property with an attribute with exactly the same name: "color".
   */
  @property({ type: String }) title = 'Hey there';

  /** Dependencies */

  @requestContext(WHERE_CONTEXT)
  _store!: WhereStore;

  /** Private properties */

  @state() _current = "";
  @state() _meIdx = 0;
  @state() _me = {
    meta: {
      img: "https://i.imgur.com/oIrcAO8.jpg",
      name: "Eggy",
    },
    authorPubkey: "mememememememememememememememeeeeee"
  }
  @state() _zoom = 1.0;

  getMeIdxInSpace(idx:string):number {
    return this._store.spaces[idx].wheres.findIndex((w) => w.authorPubkey == this._me.authorPubkey)
  }

  async initializeSpaces() {
    const me = this._store.myAgentPubKey
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
                      img: this._me.meta.img,
                      name: this._me.meta.name,
                      tag: "My house"
                    }},
            authorPubkey: me},
          { entry: {location: {x: 1890, y: 500},
                    meta: {
                      name: "Monk",
                      tag: "My apartment",
                      img: "https://i.imgur.com/4BKqQY1.png"
                    }},
            authorPubkey: "sntahoeuabcorchaotbkantgcdoesucd"}
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
        wheres: [
          { entry: {location: {x: 0, y: 0},
                    meta: {
                      name: "Monk",
                      tag: "My apartment",
                      img: "https://i.imgur.com/4BKqQY1.png"
                    }},
            authorPubkey: "sntahoeuabcorchaotbkantgcdoesucd"}
        ]
      }
    )
  }

  async firstUpdated() {
    this._me.authorPubkey = this._store.myAgentPubKey
    const result = await this._store.updateSpaces();
    // load up a space if there are none:
    if (Object.keys(this._store.spaces).length == 0) {
      await this.initializeSpaces();
      await this._store.updateSpaces();
      console.log(Object.keys(this._store.spaces).length)
    }
    this._current = Object.keys(this._store.spaces)[0]
    console.log(this._current)
  }

  private handleSpaceSelect(space: string) {
    this._current = space
    this.requestUpdate()
  }

  private handleZoom(zoom: number) {
    if (this._zoom + zoom < 0) {
      this._zoom = 0
    } else {
      this._zoom += zoom;
    }
    this.requestUpdate()
  }

  private handleClick(event: any) {
    if (event != null) {
      const rect = event.target.getBoundingClientRect();

      const ow = this._store.spaces[this._current].surface.size.x;
      const oh = this._store.spaces[this._current].surface.size.y;

      const img = event.target
      const x = (event.clientX - rect.left)/this._zoom; //x position within the element.
      const y = (event.clientY - rect.top)/this._zoom;  //y position within the element.
      this._meIdx = this.getMeIdxInSpace(this._current)
      if (this._meIdx >= 0) {
        this._store.spaces[this._current].wheres[this._meIdx].entry.location.x = x
        this._store.spaces[this._current].wheres[this._meIdx].entry.location.y = y
      } else {
        const w:Where = {entry: {location: {x,y}, meta:{tag:"", img: "", name:""}}, authorPubkey:""}
        Object.assign(w,this._me)

        this._store.spaces[this._current].wheres.push(w)
      }
      this.requestUpdate()
    }
  }

  render() {
    if (!this._current) return;
    const ow = this._store.spaces[this._current].surface.size.x;
    const oh = this._store.spaces[this._current].surface.size.y;
    const whereItems = this._store.spaces[this._current].wheres.map((where, i) => {
  //    const x = 100*(where.entry.location.x)/ow
    //  const y = 100*(where.entry.location.y)/oh

      const x = where.entry.location.x*this._zoom
      const y = where.entry.location.y*this._zoom
      console.log(x)
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
<img .style="width:${ow*this._zoom}px" .id="${this._current}-img" src="${this._store.spaces[this._current].surface.url}" @click=${this.handleClick}>
${whereItems}

</div>
`;
  }

  static get scopedElements() {
    return {
      'mwc-select': Select,
      'mwc-list-item': ListItem,
      'mwc-icon-button': IconButton,
    };
  }

  static get styles() {
    return [
      sharedStyles,
      css`
.surface{
position: relative;
overflow:auto;
max-width:1000px;
max-height:500px;
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
