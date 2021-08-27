import { html, LitElement } from 'lit';
import { state, property } from 'lit/decorators.js';

import { requestContext } from '@holochain-open-dev/context';

import { sharedStyles } from '../sharedStyles';
import { TODO_REPLACE_NAME_CONTEXT } from '../types';
import { CalendarEventsService } from '../calendar-events.service';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';

// TODO: create your own elements

/**
 * @element calendar-event
 * @fires event-created - Fired after actually creating the event, containing the new CalendarEvent
 * @csspart event-title - Style the event title textfield
 */
export class CalendarEventEl extends ScopedElementsMixin(LitElement) {
  /** Public attributes */

  /**
   * This is a description of a property with an attribute with exactly the same name: "color".
   */
  @property({ type: String }) title = 'Hey there';

  /** Dependencies */

  @requestContext("where")
  _whereThing!: string;

  /** Private properties */

  @state() _counter = 5;

  async firstUpdated() {
//    const result = await this._calendarEventsService.getAllCalendarEvents();
//    console.log('result', result);
  }

  render() {
    return html`
      <h2>${this._whereThing}</h2>
    `;
  }

  static get styles() {
    return sharedStyles;
  }
}
