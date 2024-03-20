import {html, LitElement, PropertyValues} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/skeleton/skeleton.js';
import '@shoelace-style/shoelace/dist/components/tag/tag.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@holochain-open-dev/elements/dist/elements/display-error.js';

import { HoloHashMap } from '@holochain-open-dev/utils';
import { EntryHash } from '@holochain/client';
import { DnaHash } from '@holochain/client';
import {AppletInfo, GroupProfile, weaveUrlFromWal} from '@lightningrodlabs/we-applet';
import { Hrl } from '@lightningrodlabs/we-applet';
import { WeClient } from '@lightningrodlabs/we-applet';
import { sharedStyles } from '@holochain-open-dev/elements';
import {weClientContext} from "../contexts";
import {WeServicesEx} from "@ddd-qc/we-utils";
//import {AttachableLocationAndInfo} from "@lightningrodlabs/we-applet/dist/types";


/** */
export async function getAppletsInfosAndGroupsProfiles(
  weClient: WeClient,
  appletsHashes: EntryHash[],
): Promise<{
  appletsInfos: ReadonlyMap<EntryHash, AppletInfo>;
  groupsProfiles: ReadonlyMap<DnaHash, GroupProfile>;
}> {
  const groupsProfiles = new HoloHashMap<DnaHash, GroupProfile>();
  const appletsInfos = new HoloHashMap<EntryHash, AppletInfo>();

  for (const appletHash of appletsHashes) {
    const appletInfo = await weClient.appletInfo(appletHash);
    if (appletInfo) {
      appletsInfos.set(appletHash, appletInfo);

      for (const groupId of appletInfo.groupsIds) {
        if (!groupsProfiles.has(groupId)) {
          const groupProfile = await weClient.groupProfile(groupId);

          if (groupProfile) {
            groupsProfiles.set(groupId, groupProfile);
          }
        }
      }
    }
  }

  return {
    groupsProfiles,
    appletsInfos,
  };
}


/**
 *
 */
@localized()
@customElement('we-hrl')
export class HrlLink extends LitElement {

  @property()
  hrl!: Hrl;

  @property()
  context: any;

  @consume({ context: weClientContext, subscribe: true })
  weServices: WeServicesEx;

  @property()
  onlyIcon = false;

  @state() private _info?;//: {attachableInfo: AttachableLocationAndInfo, groupsProfiles: ReadonlyMap<EntryHash, AppletInfo>, appletsInfos: ReadonlyMap<DnaHash, GroupProfile>};


  /** */
  protected async firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    console.log("<we-hrl> firstUpdated()", this.hrl, this.context);
    const attLocInfo = await this.weServices.attachableInfo({
      hrl: this.hrl,
      context: this.context,
    });
    if (!attLocInfo) {
      this._info = null;
      return;
    }

    const { groupsProfiles, appletsInfos } = await getAppletsInfosAndGroupsProfiles(
      this.weServices as any as WeClient,
      [attLocInfo.appletHash],
    );

    this._info = {attLocInfo, groupsProfiles, appletsInfos};
  }


  /** */
  render() {
    console.log("<we-hrl>.render(): ", this.hrl, this.context, this._info);
    if(this._info == undefined) {
      return html`<sl-skeleton></sl-skeleton>`;
    }
    if(this._info == null) {
      return html`<div style="color:red">Attachable not found</div>`;
    }
    // if (this._info.value.value === undefined) {
    //   return html`No entry found`; // TODO: what to put here?
    // }

  const { attLocInfo, groupsProfiles, appletsInfos } = this._info;
  console.log("<we-hrl>", attLocInfo.attachableInfo.name, weaveUrlFromWal({hrl:this.hrl}))

  return html`
    <sl-tooltip style="--max-width: 30rem;">
      <div slot="content">
        <div class="row" style="align-items: center">
          ${this.onlyIcon
            ? html` <span>${attLocInfo.attachableInfo.name},&nbsp;</span> `
            : html``}
          <span style="margin-right:6px;">From ${appletsInfos.get(attLocInfo.appletHash)?.appletName}</span>
          ${appletsInfos.get(attLocInfo.appletHash)?.groupsIds.map(
            (groupId) => html`
              <img
                .src=${groupsProfiles.get(groupId)?.logo_src}
                style="height: 16px; width: 16px; margin-right: 4px; border-radius: 50%"
              />
              <span>${groupsProfiles.get(groupId)?.name}</span>
            `,
          )}
        </div>
      </div>
      <sl-tag
        pill
        style="cursor: pointer"
        tabindex="0"
        @click=${() => this.weServices.openHrl({hrl: this.hrl, context: this.context})}
        @keypress=${(e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            this.weServices.openHrl({hrl:this.hrl, context: this.context});
          }
        }}
      >
        <div class="row" style="align-items: center">
          <sl-icon .src=${attLocInfo.attachableInfo.icon_src}></sl-icon>
          ${this.onlyIcon
            ? html``
            : html`
                <span style="margin-left:8px; text-overflow:ellipsis;">${attLocInfo.attachableInfo.name}</span>
              `}
        </div>
      </sl-tag>
    </sl-tooltip>
  `;
  }

  static styles = [sharedStyles];
}
