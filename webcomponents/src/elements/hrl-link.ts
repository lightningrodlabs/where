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

import { EntryHash, DnaHash, HoloHashMap } from '@holochain/client';
import { AppletInfo, GroupProfile, Hrl, AssetLocationAndInfo } from '@theweave/api';
import { sharedStyles } from '@holochain-open-dev/elements';
import {weClientContext} from "../contexts";
import {WeServicesEx} from "@ddd-qc/we-utils";
import {EntryId} from "@ddd-qc/cell-proxy";


/** */
export async function getAppletsInfosAndGroupsProfiles(
  weServices: WeServicesEx,
  appletsHashes: EntryHash[],
): Promise<{
  appletsInfos: HoloHashMap<EntryHash, AppletInfo>;
  groupsProfiles: HoloHashMap<DnaHash, GroupProfile>;
}> {
  const groupsProfiles = new HoloHashMap<DnaHash, GroupProfile>();
  const appletsInfos = new HoloHashMap<EntryHash, AppletInfo>();

  for (const appletHash of appletsHashes) {
    const appletInfo = await weServices.appletInfo(appletHash);
    if (appletInfo) {
      appletsInfos.set(appletHash, appletInfo);

      for (const groupId of appletInfo.groupsHashes) {
        if (!groupsProfiles.has(groupId)) {
          const groupProfile = await weServices.groupProfile(groupId);

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
 * Renders a link to a Moss asset (WAL = hrl + context)
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

  @state() private _info?: {assetLocInfo: AssetLocationAndInfo, groupsProfiles: HoloHashMap<DnaHash, GroupProfile>, appletsInfos: HoloHashMap<EntryHash, AppletInfo>} | null;


  /** */
  protected async firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    console.log("<we-hrl> firstUpdated()", this.hrl, this.context);
    const assetLocInfo = await this.weServices.assets.assetInfo({
      hrl: this.hrl,
      context: this.context,
    });
    if (!assetLocInfo) {
      this._info = null;
      return;
    }

    const { groupsProfiles, appletsInfos } = await getAppletsInfosAndGroupsProfiles(
      this.weServices,
      [assetLocInfo.appletHash],
    );

    this._info = {assetLocInfo, groupsProfiles, appletsInfos};
  }


  /** */
  render() {
    console.log("<we-hrl>.render(): ", this.hrl, this.context, this._info);
    if(this._info === undefined) {
      return html`<sl-skeleton></sl-skeleton>`;
    }
    if(this._info === null) {
      return html`<div style="color:red">${msg('Asset not found')}</div>`;
    }

    const { assetLocInfo, groupsProfiles, appletsInfos } = this._info;
    const wal = {hrl: this.hrl, context: this.context};
    const appletId = new EntryId(assetLocInfo.appletHash);
    console.log("<we-hrl>", assetLocInfo.assetInfo.name, appletId.b64)

    return html`
    <sl-tooltip style="--max-width: 30rem;">
      <div slot="content">
        <div class="row" style="align-items: center">
          ${this.onlyIcon
            ? html` <span>${assetLocInfo.assetInfo.name},&nbsp;</span> `
            : html``}
          <span style="margin-right:6px;">From ${appletsInfos.get(assetLocInfo.appletHash)?.appletName}</span>
          ${appletsInfos.get(assetLocInfo.appletHash)?.groupsHashes.map(
            (groupId) => html`
              <img
                .src=${groupsProfiles.get(groupId)?.icon_src}
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
        @click=${() => this.weServices.openAsset(wal)}
        @keypress=${(e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            this.weServices.openAsset(wal);
          }
        }}
      >
        <div class="row" style="align-items: center">
          <sl-icon .src=${assetLocInfo.assetInfo.icon_src}></sl-icon>
          ${this.onlyIcon
            ? html``
            : html`
                <span style="margin-left:8px; text-overflow:ellipsis;">${assetLocInfo.assetInfo.name}</span>
              `}
        </div>
      </sl-tag>
    </sl-tooltip>
  `;
  }

  static styles = [sharedStyles];
}
