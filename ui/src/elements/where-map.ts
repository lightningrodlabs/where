import { html,css, LitElement } from 'lit';
import { state, property } from 'lit/decorators.js';

import { requestContext } from '@holochain-open-dev/context';

import { sharedStyles } from '../sharedStyles';
import { WHERE_CONTEXT, Where } from '../types';
import { WhereStore } from '../where.store';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { ListItem } from 'scoped-material-components/mwc-list-item';
import { Select } from 'scoped-material-components/mwc-select';


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

  @state() _current = "somekey";
  @state() _meIdx = 0;
  @state() _me = {
    authorPic: "https://i.imgur.com/oIrcAO8.jpg",
    authorName: "Eggy",
    authorPubkey: "mememememememememememememememeeeeee"
  }

  getMeIdxInSpace(idx:string):number {
    return this._store.spaces[idx].wheres.findIndex((w) => w.authorPubkey == this._me.authorPubkey)
  }

  async firstUpdated() {
//    const result = await this._whereService.getAllCalendarEvents();
//    console.log('result', result);
  }

  private handleSpaceSelect(space: string) {
    this._current = space
    this.requestUpdate()
  }

  private handleClick(event: any) {
    if (event != null) {
      const rect = event.target.getBoundingClientRect();

      const ow = this._store.spaces[this._current].surface.size.x;
      const oh = this._store.spaces[this._current].surface.size.y;

      const img = event.target
      const cw = img!.offsetWidth;
      const ch = img!.offsetHeight;
      const fw = 1//ow/cw;
      const fh = 1//oh/ch;
      const x = (event.clientX - rect.left)*fw; //x position within the element.
      const y = (event.clientY - rect.top)*fh;  //y position within the element.
      this._meIdx = this.getMeIdxInSpace(this._current)
      if (this._meIdx >= 0) {
        this._store.spaces[this._current].wheres[this._meIdx].entry.location.x = x
        this._store.spaces[this._current].wheres[this._meIdx].entry.location.y = y
      } else {
        const w:Where = {entry: {location: {x,y}, meta:""}, authorPic: "", authorName:"", authorPubkey:""}
        Object.assign(w,this._me)

        this._store.spaces[this._current].wheres.push(w)
      }
      this.requestUpdate()
    }
  }

  render() {
    const ow = this._store.spaces[this._current].surface.size.x;
    const oh = this._store.spaces[this._current].surface.size.y;
    const whereItems = this._store.spaces[this._current].wheres.map((where, i) => {
  //    const x = 100*(where.entry.location.x)/ow
    //  const y = 100*(where.entry.location.y)/oh

      const x = where.entry.location.x
      const y = where.entry.location.y

      return html`
      <img class="where-marker" class:me=${i == this._meIdx} style="left:${x}px;top: ${y}px" src="${where.authorPic}">
      <div class="where-details" class:me=${i == this._meIdx} style="left:${x}px;top: ${y}px" src="${where.authorPic}">
      <h3>${where.authorName}</h3>
      <p>${where.entry.meta}</p>
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
<div class="surface">
<img .id="${this._store.spaces[this._current].name}-img" src="${this._store.spaces[this._current].surface.url}" @click=${this.handleClick}>
${whereItems}

</div>
`;
  }

  static get scopedElements() {
    return {
      'mwc-select': Select,
      'mwc-list-item': ListItem,
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
