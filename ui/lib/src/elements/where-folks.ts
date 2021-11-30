import { html, css, LitElement } from "lit";
import { state, property } from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import { StoreSubscriber } from "lit-svelte-stores";

import randomColor from "randomcolor";
import { sharedStyles } from "../sharedStyles";
import {whereContext, Space, Dictionary, Signal, Coord, MarkerType, EmojiGroupEntry} from "../types";
import { WhereStore } from "../where.store";
import {lightTheme, SlAvatar, SlBadge, SlIcon, SlInput, SlTooltip} from '@scoped-elements/shoelace';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  ListItem,
  Select,
  IconButton,
  Button, TextField, List, Icon, Switch, Formfield, Slider, Menu, Fab, IconButtonToggle,
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

  @property() canShowTable: boolean = true;


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
    const key = e.currentTarget.id
    console.log("Avatar clicked: " + key)
    this.dispatchEvent(new CustomEvent('avatar-clicked', { detail: key, bubbles: true, composed: true }));
    //console.log(e.detail)
    this.soloAgent = key == this.soloAgent? null : key;
    //this.requestUpdate();
  }

  /**
   *
   */
  render() {
    const filterField = this.shadowRoot!.getElementById("filter-field") as TextField;
    const filterStr = filterField? filterField.value : "";
    console.log("filterStr: " + filterStr);

    const visibleProfiles = Object.entries(this._knownProfiles.value).filter(([key, profile]) =>
      filterStr.length < 2 || profile.nickname.toLowerCase().includes(filterStr.toLowerCase()));

    //console.log({visibleProfiles})

    /** Build agent list */
    const folks = visibleProfiles.map(([key, profile])=> {
      let opacity = 1.0;
      if (this.soloAgent && this.soloAgent != key) {
        opacity = 0.4;
      }
      return html`
        <li class="folk" style="opacity: ${opacity};">
          <sl-tooltip content=${profile.nickname} placement="right">
                <sl-avatar id=${key} @click="${this.handleClickAvatar}" .image=${profile.fields.avatar} style="background-color:${profile.fields.color};border: ${profile.fields.color} 1px solid;" ></sl-avatar>
                <sl-badge class="avatar-badge" type="${this.determineAgentStatus(key)}" pill></sl-badge>
          </sl-tooltip>
        </li>`
    })

    /** Build agent list */
    const list_folks = visibleProfiles.map(([key, profile])=> {
      let opacity = 1.0;
      if (this.soloAgent && this.soloAgent != key) {
        opacity = 0.4;
      }
      const status = this.determineAgentStatus(key);
      const statusColor = this.status2color(status)
      return html`
        <li class="folk-row" style="opacity: ${opacity};" @click="${this.handleClickAvatar}" id=${key}>
          <div style="background-color:${profile.fields['color']};border:1px solid black;width:9px;height:9px;display:inline-flex;"></div>
          <span style="color:${statusColor};margin-left:2px">${profile.nickname}</span>
        </li>`
    })


    /** MAIN RENDER */
    //       <mwc-fab mini id="reset-fab" icon="delete" style="left:160px;top:0px;" @click=${() => this.resetMyLocations()}></mwc-fab>
    return html`
      <!-- <mwc-toggle mini id="toggle-other-fab" onIcon="location_on"  offIcon="location_off" style=""></mwc-toggle> -->
      <!-- <mwc-toggle mini id="toggle-view-fab" onIcon="visibility" offIcon="visibility_off" style="" @click=${() => this.toggleView()}></mwc-toggle> -->
      <!-- <mwc-textfield id="filter-field" outlined icon="search" class="rounded" style="width: 180px" @input=${() =>this.requestUpdate()}></mwc-textfield> -->
      <sl-input id="filter-field" placeholder="filter" clearable size="small" pill @input=${() =>this.requestUpdate()} @sl-clear=${() =>this.requestUpdate()}>
        <mwc-icon style="color:gray;" slot="prefix">search</mwc-icon>
      </sl-input>
      <mwc-switch id="folks-switch" @click=${() => this.toggleView()}></mwc-switch>
      <div class="folks">
        ${this.canShowTable? list_folks : folks}
      </div>
    `
  }

  status2color(status: string): string {
    switch(status) {
      case "primary": return "rgb(14, 165, 233)"; break;
      case "neutral": return "rgb(113, 113, 122)"; break;
      case "success": return "rgb(34, 197, 94)"; break;
      case "warning": return "rgb(245, 158, 11)"; break;
      case "danger": return "rgb(239, 68, 68)"; break;
      default: return "rgb(0, 0, 0)"; break;
    }
  }

  toggleView() {
    this.canShowTable = !this.canShowTable;
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
      "mwc-toggle": IconButtonToggle,
      "mwc-button": Button,
      'sl-avatar': SlAvatar,
      'sl-tooltip': SlTooltip,
      'sl-badge': SlBadge,
      'sl-input': SlInput,
    };
  }

  static get styles() {
    return [
      lightTheme,
      sharedStyles,
      css`
        mwc-textfield.rounded {
          --mdc-shape-small: 28px;
        }

        #filter-field {
          width:150px;
          margin-left:3px;
          /*display:inline-block;*/
        }

        #folks-switch {
          margin: 10px 0px 10px 3px;
          /*--mdc-switch-selected-handle-color: teal;*/
          /*--mdc-switch-selected-track-color: lightseagreen;*/
          --mdc-switch-unselected-handle-color: teal;
          /*--mdc-switch-unselected-track-color: palegoldenrod;*/
          /*--mdc-switch-unselected-icon-color: teal;*/
        }

        .folks {
          /*background-color: red;*/
          overflow-y: auto;
          margin-left:5px;
        }

        .folk-row {
          cursor: pointer;
        }
        .folk {
          list-style: none;
          margin: 2px;
          /*text-align: center;*/
          font-size: 70%;
          cursor: pointer;
        }

        .folk > img {
          width: 50px;
          border-radius: 10000px;
        }

        .avatar-badge {
          margin-left: 30px;
          margin-top: -15px;
          display: block;
        }

        .avatar-badge::part(base) {
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
