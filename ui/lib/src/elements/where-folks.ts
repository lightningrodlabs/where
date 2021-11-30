import { html, css, LitElement } from "lit";
import { state, property } from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import { StoreSubscriber } from "lit-svelte-stores";

import randomColor from "randomcolor";
import { sharedStyles } from "../sharedStyles";
import {whereContext, Space, Dictionary, Signal, Coord, MarkerType, EmojiGroupEntry} from "../types";
import { WhereStore } from "../where.store";
import {lightTheme, SlAvatar, SlBadge, SlTooltip} from '@scoped-elements/shoelace';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  ListItem,
  Select,
  IconButton,
  Button, TextField, List, Icon, Switch, Formfield, Slider, Menu,
} from "@scoped-elements/material-web";
import {
  profilesStoreContext,
  ProfilesStore,
  Profile,
} from "@holochain-open-dev/profiles";
import {AgentPubKeyB64, EntryHashB64} from "@holochain-open-dev/core-types";
import {MARKER_WIDTH, renderSurface} from "../sharedRender";


/**
 * @element where-folks
 */
export class WhereFolks extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */
  @property() soloAgent: AgentPubKeyB64 | null  = null; // filter for a specific agent

  /** Dependencies */

  @contextProvided({ context: whereContext })
  _store!: WhereStore;
  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile = new StoreSubscriber(this, () => this._profiles.myProfile);
  _knownProfiles = new StoreSubscriber(this, () => this._profiles.knownProfiles);
  _agentPresences = new StoreSubscriber(this, () => this._store.agentPresences);

  /** Methods */


  determineAgentStatus(key: AgentPubKeyB64) {
    // const status = "primary"; // "neutral"
    if (key == this._profiles.myAgentPubKey) {
      return "success";
    }
    const lastPingTime: number = this._agentPresences.value[key];
    const currentTime: number = Math.floor(Date.now()/1000);
    const diff: number = currentTime - lastPingTime;
    if (diff < 30) {
      return "success";
    }
    if (diff < 5 * 60) {
      return "warning";
    }
    return "danger";
  }


  handleClickAvatar(e: any) {
    //console.log("Avatar clicked: " + e.currentTarget.alt)
    this.dispatchEvent(new CustomEvent('avatar-clicked', { detail: e.currentTarget.alt, bubbles: true, composed: true }));
    //console.log(e.detail)
    const key = e.currentTarget.alt
    this.soloAgent = key == this.soloAgent? null : key;
    //this.requestUpdate();
  }

  /**
   *
   */
  render() {
    /** Build agent list */
    const folks = Object.entries(this._knownProfiles.value).map(([key, profile])=> {
      let opacity = 1.0;
      if (this.soloAgent && this.soloAgent != key) {
        opacity = 0.4;
      }
      return html`
        <li class="folk" style="opacity: ${opacity};">
          <sl-tooltip content=${profile.nickname}>
                <sl-avatar alt=${key} @click="${this.handleClickAvatar}" .image=${profile.fields.avatar} style="background-color:${profile.fields.color};border: ${profile.fields.color} 1px solid;" ></sl-avatar>
                <sl-badge class="avatar-badge" type="${this.determineAgentStatus(key)}" pill></sl-badge>
          </sl-tooltip>
        </li>`
    })

    /** MAIN RENDER */
    return html`
      <div class="folks">
        ${folks}
      </div>
    `
  }

  static get scopedElements() {
    return {
      "mwc-menu": Menu,
      "mwc-slider": Slider,
      "mwc-switch": Switch,
      "mwc-textfield": TextField,
      "mwc-select": Select,
      "mwc-list": List,
      "mwc-list-item": ListItem,
      "mwc-icon": Icon,
      "mwc-icon-button": IconButton,
      "mwc-button": Button,
      "mwc-formfield": Formfield,
      'sl-avatar': SlAvatar,
      'sl-tooltip': SlTooltip,
      'sl-badge': SlBadge,
    };
  }

  static get styles() {
    return [
      lightTheme,
      sharedStyles,
      css`

        .folks {
          /*background-color: red;*/
        }

        .folk {
          list-style: none;
          margin: 2px;
          text-align: center;
          font-size: 70%;
          cursor: pointer;
        }

        .folk > img {
          width: 50px;
          border-radius: 10000px;
        }

        .avatar-badge {
          margin-left: 35px;
          margin-top: -15px;
          display: block;
        }

        sl-badge::part(base) {
          border: 1px solid;
          padding-top: 10px;
        }

        sl-tooltip sl-avatar {
            /*--size: ${MARKER_WIDTH}px;*/
        }

        sl-tooltip {
          display: inline;
        }
      `
    ];
  }
}
