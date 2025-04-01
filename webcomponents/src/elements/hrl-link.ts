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

import { EntryHash } from '@holochain/client';
import {AppletInfo, GroupProfile, weaveUrlFromWal, Hrl, WeaveClient, AssetLocationAndInfo} from '@theweave/api';
import { sharedStyles } from '@holochain-open-dev/elements';
import {weClientContext} from "../contexts";
import {WeServicesEx} from "@ddd-qc/we-utils";
import {DnaId, DnaIdMap, EntryId, EntryIdMap} from "@ddd-qc/cell-proxy";


/** */
export async function getAppletsInfosAndGroupsProfiles(
  weClient: WeaveClient,
  appletsHashes: EntryHash[],
): Promise<{
  appletsInfos: EntryIdMap<AppletInfo>;
  groupsProfiles: DnaIdMap<GroupProfile>;
}> {
  const groupsProfiles = new DnaIdMap<GroupProfile>();
  const appletsInfos = new EntryIdMap<AppletInfo>();

  for (const appletHash of appletsHashes) {
    const appletInfo = await weClient.appletInfo(appletHash);
    if (appletInfo) {
      appletsInfos.set(new EntryId(appletHash), appletInfo);

      for (const groupHash of appletInfo.groupsHashes) {
        const groupId = new DnaId(groupHash);
        if (!groupsProfiles.get(groupId)) {
          const groupProfile = await weClient.groupProfile(groupHash);
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

  @state() private _info?: {attachableInfo: AssetLocationAndInfo,   appletsInfos: EntryIdMap<AppletInfo>; groupsProfiles: DnaIdMap<GroupProfile>};


  /** */
  protected async firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    console.log("<we-hrl> firstUpdated()", this.hrl, this.context);
    const attachableInfo = await this.weServices.assets.assetInfo({
      hrl: this.hrl,
      context: this.context,
    });
    if (!attachableInfo) {
      this._info = null;
      return;
    }

    const { groupsProfiles, appletsInfos } = await getAppletsInfosAndGroupsProfiles(
      this.weServices as any as WeaveClient,
      [attachableInfo.appletHash],
    );

    this._info = {attachableInfo, groupsProfiles, appletsInfos};
  }


  /** */
  render() {
    console.log("<we-hrl>.render()", this.hrl, this.context, this._info);
    if(this._info == undefined) {
      return html`<sl-skeleton></sl-skeleton>`;
    }
    if(this._info == null) {
      return html`<div style="color:red">Asset not found</div>`;
    }
    // if (this._info.value.value === undefined) {
    //   return html`No entry found`; // TODO: what to put here?
    // }

  const { attachableInfo, groupsProfiles, appletsInfos } = this._info;
  console.log("<we-hrl> assetInfo", attachableInfo.assetInfo.name, weaveUrlFromWal({hrl:this.hrl}))

  const appletId = new EntryId(attachableInfo.appletHash);

  /** */
  return html`
    <sl-tooltip style="--max-width: 30rem;">
      <div slot="content">
        <div class="row" style="align-items: center">
          ${this.onlyIcon
            ? html` <span>${attachableInfo.assetInfo.name},&nbsp;</span> `
            : html``}
          <span style="margin-right:6px;">From ${appletsInfos.get(appletId)?.appletName}</span>
          ${appletsInfos.get(appletId)?.groupsHashes.map(
            (groupHash) => html`
              <img
                .src=${groupsProfiles.get(new DnaId(groupHash))?.icon_src}
                style="height: 16px; width: 16px; margin-right: 4px; border-radius: 50%"
              />
              <span>${groupsProfiles.get(new DnaId(groupHash))?.name}</span>
            `,
          )}
        </div>
      </div>
      <sl-tag
        pill
        style="cursor: pointer"
        tabindex="0"
        @click=${() => this.weServices.openAsset({hrl: this.hrl, context: this.context})}
        @keypress=${(e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            this.weServices.openAsset({hrl:this.hrl, context: this.context});
          }
        }}
      >
        <div class="row" style="align-items: center">
          <sl-icon .src=${attachableInfo.assetInfo.icon_src}></sl-icon>
          ${this.onlyIcon
            ? html``
            : html`
                <span style="margin-left:8px; text-overflow:ellipsis;">${attachableInfo.assetInfo.name}</span>
              `}
        </div>
      </sl-tag>
    </sl-tooltip>
  `;
  }

  static styles = [sharedStyles];
}
