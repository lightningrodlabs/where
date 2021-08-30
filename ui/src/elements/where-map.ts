import { html,css, LitElement } from 'lit';
import { state, property } from 'lit/decorators.js';

import { requestContext } from '@holochain-open-dev/context';

import { sharedStyles } from '../sharedStyles';
import { WHERE_CONTEXT, Where } from '../types';
import { WhereStore } from '../where.store';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';

// TODO: create your own elements


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

  private handleClick(event: any) {
    if (event != null) {
      var rect = event.target.getBoundingClientRect();
      var x = event.clientX - rect.left; //x position within the element.
      var y = event.clientY - rect.top;  //y position within the element.

      this._meIdx = this.getMeIdxInSpace(this._current)
      if (this._meIdx >= 0) {
        console.log("setting",this._store.spaces[this._current].wheres[this._meIdx].entry.location.x," to ", x)
        this._store.spaces[this._current].wheres[this._meIdx].entry.location.x = x
        this._store.spaces[this._current].wheres[this._meIdx].entry.location.y = y
      } else {
        let w:Where = {entry: {location: {x,y}, meta:""}, authorPic: "", authorName:"", authorPubkey:""}
        Object.assign(w,this._me)

        this._store.spaces[this._current].wheres.push(w)
      }
      this.requestUpdate()
    }
  }
  render() {
    return html`
<div class="map">
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
