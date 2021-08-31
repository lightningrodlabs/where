import { html,css, LitElement } from 'lit';
import { state, property } from 'lit/decorators.js';

import { requestContext } from '@holochain-open-dev/context';

import { sharedStyles } from '../sharedStyles';
import { WHERE_CONTEXT, Where } from '../types';
import { WhereStore } from '../where.store';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { ListItem } from 'scoped-material-components/mwc-list-item';
import { Select } from 'scoped-material-components/mwc-select';

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

  @state() _current = "otherkey";
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
      const x = event.clientX - rect.left; //x position within the element.
      const y = event.clientY - rect.top;  //y position within the element.

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
    return html`
<div class="map">
<mwc-select outlined label="Space" @select=${this.handleSpaceSelect}>
  ${Object.entries(this._store.spaces).map(([key,space]) => html`

  <mwc-list-item
    @request-selected=${() => this.handleSpaceSelect(key)}
    ${key === this._current ? 'selected' : ""} value="${key}">${space.name}
  </mwc-list-item>
      ` )}
</mwc-select>
  <img src="${this._store.spaces[this._current].surface.url}" @click=${this.handleClick}>
  ${this._store.spaces[this._current].wheres.map((where, i) => html`
      <img class="where-marker" class:me=${i == this._meIdx} style="left:${where.entry.location.x - (40/2)}px;top: ${where.entry.location.y - (40/2)}px" src="${where.authorPic}">
      <div class="where-details" class:me=${i == this._meIdx} style="left:${where.entry.location.x - (40/2)}px;top: ${where.entry.location.y + (40/2)}px" src="${where.authorPic}">
      <h3>${where.authorName}</h3>
      <p>${where.entry.meta}</p>
  `)}
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
.map{
position: relative;
}

img.where-marker {
max-width:100%;
max-height:100%;
border-radius: 10000px;
border: black 1px solid;
position: absolute;
height: 40px; /* hardcoded for now */
width: 40px;
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
