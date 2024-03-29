import { html, css } from "lit";
import { property, state, customElement } from "lit/decorators.js";
import { localized, msg } from '@lit/localize';

import { sharedStyles } from "../sharedStyles";
import {MARKER_WIDTH} from "../sharedRender";
import {g_stringStore} from "../stringStore";
import {DnaElement} from "@ddd-qc/lit-happ";
import {WhereDnaPerspective, WhereDvm} from "../viewModels/where.dvm";
import {AgentPubKeyB64, decodeHashFromBase64} from "@holochain/client";
import {Dictionary} from "@ddd-qc/cell-proxy";

import "@shoelace-style/shoelace/dist/components/avatar/avatar.js"
import "@shoelace-style/shoelace/dist/components/badge/badge.js"
import "@shoelace-style/shoelace/dist/components/color-picker/color-picker.js"
import "@shoelace-style/shoelace/dist/components/tooltip/tooltip.js";
import "@shoelace-style/shoelace/dist/components/card/card.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";

import {TextField} from "@material/mwc-textfield";

import "@material/mwc-drawer";
import "@material/mwc-top-app-bar";
import "@material/mwc-menu";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-list";
import "@material/mwc-dialog";
import "@material/mwc-slider";
import "@material/mwc-switch";
import "@material/mwc-select";
import "@material/mwc-list/mwc-check-list-item";
import "@material/mwc-icon";
import "@material/mwc-formfield";
import "@material/mwc-circular-progress";
import "@material/mwc-icon-button";
import "@material/mwc-top-app-bar-fixed";
import "@material/mwc-button";
import "@material/mwc-fab";
import "@material/mwc-icon-button-toggle";
import "@material/mwc-textfield";
import {Profile as  ProfileMat, ProfilesPerspective} from "@ddd-qc/profiles-dvm";



/** @element where-peer-list */
@localized()
@customElement("where-peer-list")
export class WherePeerList extends DnaElement<WhereDnaPerspective, WhereDvm> {
  constructor() {
    super(WhereDvm.DEFAULT_BASE_ROLE_NAME);
  }

  /** -- Fields -- */
  @property() soloAgent: AgentPubKeyB64 | null  = null; // filter for a specific agent

  @property() canShowTable: boolean = true;

  @property({type: Object, attribute: false, hasChanged: (_v, _old) => true})
  profilesPerspective!: ProfilesPerspective;

  @state() private _loaded = false;


  /** -- Methods -- */

  /** After first render only */
  firstUpdated() {
    this._dvm.profilesZvm.subscribe(this, "profilesPerspective");
    console.log("<where-peer-list> firstUpdated()", this.profilesPerspective);
    this._loaded = true;
  }


  /** */
  determineAgentStatus(key: AgentPubKeyB64) {
    // const status = "primary"; // "neutral"
    if (key == this._dvm.cell.agentPubKey) {
      return "success";
    }
    const lastPingTime: number = this.perspective.agentPresences[key];
    const currentTime: number = Math.floor(Date.now() / 1000);
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
  handleClickDeleteMyLocations() {
    console.log("handleClickDeleteMyLocations()")
    this.dispatchEvent(new CustomEvent('delete-locations-requested', { detail: null, bubbles: true, composed: true }));
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
  renderList(profiles:  Dictionary<ProfileMat>) {

    if (Object.keys(profiles).length === 0) {
      return html`
        <mwc-list-item
        >(no profiles found)
        </mwc-list-item
        >`;
    }

    const filterField = this.shadowRoot!.getElementById("filter-field") as TextField;
    const filterStr = filterField && filterField.value? filterField.value : "";

    const visibleProfiles = Object.entries(profiles).filter(([key, profile]) => {
      return filterStr.length < 2 || profile.nickname.toLowerCase().includes(filterStr.toLowerCase())
    });

    //console.log({visibleProfiles})

    /** Build avatar agent list */
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
    const peers = visibleProfiles.map(([keyB64, profile]) => {
      let key = decodeHashFromBase64(keyB64)
      let opacity = 1.0;
      if (this.soloAgent && this.soloAgent != keyB64) {
        opacity = 0.4;
      }
      return html`
        <li class="folk" style="opacity: ${opacity};">
          <span @click="${this.handleClickAvatar}">
            <sl-avatar id=${key}  .image=${profile.fields.avatar}
                       style="background-color:${profile.fields.color};border: ${profile.fields.color} 1px solid;">
            </sl-avatar>
            <sl-badge class="avatar-badge" type="${this.determineAgentStatus(keyB64)}" pill></sl-badge>
            <span style="color:${profile.fields['color']};margin-left:4px;font-size:16px;font-weight:bold;-webkit-text-stroke:0.1px black;">
              ${profile.nickname}
            </span>
          </span>
          ${keyB64 == this._dvm.cell.agentPubKey? html`
            <sl-tooltip content=${msg('Remove all my locations')} placement="bottom" hoist>
              <mwc-icon-button icon="wrong_location" style="margin-top: -5px;" @click=${() => this.handleClickDeleteMyLocations()}></mwc-icon-button>
            </sl-tooltip>
          ` : html``}
        </li>`
    })

    /** Build names agent list */
    const peer_list = visibleProfiles.map(([keyB64, profile]) => {
      let key = decodeHashFromBase64(keyB64)
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
      <!-- <mwc-icon-button-toggle mini id="toggle-other-fab" onIcon="location_on"  offIcon="location_off" style=""></mwc-toggle> -->
      <!-- <mwc-icon-button-toggle mini id="toggle-view-fab" onIcon="visibility" offIcon="visibility_off" style="" @click=${() => this.toggleView()}></mwc-toggle> -->
      <!-- <mwc-textfield id="filter-field" outlined icon="search" class="rounded" style="width: 180px" @input=${() =>this.requestUpdate()}></mwc-textfield> -->
      <sl-input id="filter-field" placeholder=${g_stringStore.get("filter")} clearable size="small" pill @input=${() =>this.requestUpdate()} @sl-clear=${() =>this.requestUpdate()}>
        <mwc-icon style="color:gray;" slot="prefix">search</mwc-icon>
      </sl-input>
      <!-- <mwc-switch id="folks-switch" @click=${() => this.toggleView()}></mwc-switch> -->
      <div class="folks">
        ${this.canShowTable? peers : peer_list}
      </div>
    `
  }


  /** */
  render() {
    if (!this._loaded) {
      return html`<div class="fill center-content">
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      </div>`;
    }
    console.log("<where-peer-list> render()", Object.keys(this.profilesPerspective.profiles).length);

    return this.renderList(this.profilesPerspective.profiles);
  }


  // /** */
  // static get scopedElements() {
  //   return {
  //     'mwc-circular-progress': CircularProgress,
  //     "mwc-menu": Menu,
  //     "mwc-slider": Slider,
  //     "mwc-switch": Switch,
  //     "mwc-textfield": TextField,
  //     "mwc-select": Select,
  //     "mwc-list": List,
  //     "mwc-list-item": ListItem,
  //     "mwc-icon": Icon,
  //     "mwc-icon-button": IconButton,
  //     "mwc-icon-button-toggle": IconButtonToggle,
  //     "mwc-button": Button,
  //     'sl-avatar': SlAvatar,
  //     'sl-tooltip': SlTooltip,
  //     'sl-badge': SlBadge,
  //     'sl-input': SlInput,
  //   };
  // }


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
          margin-left:8px;
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
          margin-left: 5px;
          margin-top: 10px;
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
          position: relative;
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
