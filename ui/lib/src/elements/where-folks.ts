import { html, css, LitElement } from "lit";
import { property } from "lit/decorators.js";

import { contextProvided } from '@lit-labs/context';
import {StoreSubscriber, TaskSubscriber} from "lit-svelte-stores";

import { sharedStyles } from "../sharedStyles";
import {whereContext} from "../types";
import { WhereStore } from "../where.store";
import {SlAvatar, SlBadge, SlInput, SlTooltip} from '@scoped-elements/shoelace';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  ListItem,
  Select,
  IconButton,
  Button, TextField, List, Icon, Switch, Slider, Menu, IconButtonToggle,
} from "@scoped-elements/material-web";
import {
  profilesStoreContext,
  ProfilesStore, Profile,
} from "@holochain-open-dev/profiles";
import {AgentPubKeyB64} from "@holochain-open-dev/core-types";
import {MARKER_WIDTH} from "../sharedRender";
import {g_stringStore} from "../stringStore";
import {HoloHashMap, serializeHash} from "@holochain-open-dev/utils";
import { localized, msg } from '@lit/localize';

/** @element where-folks */
@localized()
export class WhereFolks extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */
  @property() soloAgent: AgentPubKeyB64 | null  = null; // filter for a specific agent

  @property({type: Boolean}) canShowTable: boolean = true;


  /** Dependencies */

  @contextProvided({ context: whereContext, subscribe: true })
  _store!: WhereStore;
  @contextProvided({ context: profilesStoreContext, subscribe: true })
  _profiles!: ProfilesStore;

  //_knownProfiles = new StoreSubscriber(this, () => this._profiles?.knownProfiles);
  _agentPresences = new StoreSubscriber(this, () => this._store?.agentPresences);


  private _allProfilesTask = new TaskSubscriber(
    this,
    () => this._profiles.fetchAllProfiles(),
    () => [this._profiles]
  );


  /** Methods */

  /** */
  determineAgentStatus(key: AgentPubKeyB64) {
    // const status = "primary"; // "neutral"
    if (key == serializeHash(this._profiles.myAgentPubKey)) {
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


  /** */
  handleClickAvatar(e: any) {
    const key = e.currentTarget.id
    console.log("Avatar clicked: " + key)
    this.dispatchEvent(new CustomEvent('avatar-clicked', { detail: key, bubbles: true, composed: true }));
    //console.log(e.detail)
    this.soloAgent = key == this.soloAgent? null : key;
    //this.requestUpdate();
  }


  /** */
  renderList(profiles: HoloHashMap<Profile>) {

    if (profiles.keys().length === 0)
      return html`
        <mwc-list-item
        >There are no created profiles yet
        </mwc-list-item
        >`;

    const filterField = this.shadowRoot!.getElementById("filter-field") as TextField;
    const filterStr = filterField && filterField.value? filterField.value : "";

    const visibleProfiles = profiles.entries().filter(([key, profile]) => {
      return filterStr.length < 2 || profile.nickname.toLowerCase().includes(filterStr.toLowerCase())
    });

    //console.log({visibleProfiles})

    // /** Build avatar agent list */
    // const folks = visibleProfiles.map(([key, profile])=> {
    //   let opacity = 1.0;
    //   if (this.soloAgent && this.soloAgent != key) {
    //     opacity = 0.4;
    //   }
    //   return html`
    //     <li class="folk" style="opacity: ${opacity};">
    //       <sl-tooltip content=${profile.nickname} placement="right">
    //             <sl-avatar id=${key} @click="${this.handleClickAvatar}" .image=${profile.fields.avatar} style="background-color:${profile.fields.color};border: ${profile.fields.color} 1px solid;" ></sl-avatar>
    //             <sl-badge class="avatar-badge" type="${this.determineAgentStatus(key)}" pill></sl-badge>
    //       </sl-tooltip>
    //     </li>`
    // })

    /** Build avatar agent list */
    const folks = visibleProfiles.map(([key, profile]) => {
      let keyB64 = serializeHash(key)
      let opacity = 1.0;
      if (this.soloAgent && this.soloAgent != keyB64) {
        opacity = 0.4;
      }
      return html`
        <li class="folk" style="opacity: ${opacity};">
          <sl-avatar id=${key} @click="${this.handleClickAvatar}" .image=${profile.fields.avatar}
                     style="background-color:${profile.fields.color};border: ${profile.fields.color} 1px solid;">
          </sl-avatar>
          <sl-badge class="avatar-badge" type="${this.determineAgentStatus(keyB64)}" pill></sl-badge>
          <span
            style="color:${profile.fields['color']};margin-left:4px;font-size:16px;font-weight:bold;-webkit-text-stroke:0.1px black;">${profile.nickname}</span>
        </li>`
    })

    /** Build names agent list */
    const list_folks = visibleProfiles.map(([key, profile]) => {
      let keyB64 = serializeHash(key)
      let opacity = 1.0;
      if (this.soloAgent && this.soloAgent != keyB64) {
        opacity = 0.4;
      }
      const status = this.determineAgentStatus(keyB64);
      const statusColor = this.status2color(status)

      // y.js style ; need code to generate darken value
      // <div style="background-color:${profile.fields['color']};width:4px;height:17px;display:inline-flex;"></div>
      // <div style="color:${statusColor};margin-left:8px;margin-top:-21px;">${profile.nickname}</div>

      return html`
        <li class="folk-row" style="opacity: ${opacity};" @click="${this.handleClickAvatar}" id=${key}>
          <div
            style="background-color:${profile.fields['color']};width:9px;height:9px;display:inline-flex;border-radius:12px;border:1px solid gray;"></div>
          <span style="color:${statusColor};margin-left:2px">${profile.nickname}</span>
        </li>`
    })

    /** MAIN RENDER */
    //       <mwc-fab mini id="reset-fab" icon="delete" style="left:160px;top:0px;" @click=${() => this.resetMyLocations()}></mwc-fab>
    return html`
      <!-- <mwc-toggle mini id="toggle-other-fab" onIcon="location_on"  offIcon="location_off" style=""></mwc-toggle> -->
      <!-- <mwc-toggle mini id="toggle-view-fab" onIcon="visibility" offIcon="visibility_off" style="" @click=${() => this.toggleView()}></mwc-toggle> -->
      <!-- <mwc-textfield id="filter-field" outlined icon="search" class="rounded" style="width: 180px" @input=${() =>this.requestUpdate()}></mwc-textfield> -->
      <sl-input id="filter-field" placeholder=${g_stringStore.get("filter")} clearable size="small" pill @input=${() =>this.requestUpdate()} @sl-clear=${() =>this.requestUpdate()}>
        <mwc-icon style="color:gray;" slot="prefix">search</mwc-icon>
      </sl-input>
      <mwc-switch id="folks-switch" @click=${() => this.toggleView()}></mwc-switch>
      <div class="folks">
        ${this.canShowTable? folks : list_folks}
      </div>
    `
  }

  render() {
    return this._allProfilesTask.render({
      pending: () => html`<div class="fill center-content">
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      </div>`,
      complete: profiles => this.renderList(profiles),
    });
  }



  /** */
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


  /** */
  toggleView() {
    this.canShowTable = !this.canShowTable;
  }


  /** */
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


  /** */
  static get styles() {
    return [
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
          margin: 10px 0px 10px 6px;
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
          list-style: none;
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
          margin-left: -15px;
          vertical-align: bottom;
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
