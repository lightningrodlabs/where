import {css, html, LitElement} from "lit";
import {query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {contextProvided} from "@lit-labs/context";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {WhereStore} from "../where.store";
import {EmojiGroupEntry, SvgMarkerEntry, TemplateEntry, TemplateType, whereContext} from "../types";
import {
  Button,
  Dialog,
  IconButton,
  ListItem,
  Select, TextArea,
  TextField
} from "@scoped-elements/material-web";
import {StoreSubscriber} from "lit-svelte-stores";
import {Picker} from "emoji-picker-element";
import {EMOJI_WIDTH, MARKER_WIDTH, renderSvgMarker} from "../sharedRender";
import {unsafeHTML} from "lit/directives/unsafe-html";
import {unsafeSVG} from "lit/directives/unsafe-svg";

/**
 * @element where-svg-marker-dialog
 */
export class WhereSvgMarkerDialog extends ScopedElementsMixin(LitElement) {

  @state() _currentSvg: string = "";

  /** Dependencies */
  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  _svgMarkers = new StoreSubscriber(this, () => this._store.svgMarkers);

  /** Private properties */

  _markerToPreload?: SvgMarkerEntry;
  _currentMarker: SvgMarkerEntry | null = null;


  @query('#name-field')
  _nameField!: TextField;
  @query('#svg-field')
  _svgField!: TextArea;

  open(marker?: SvgMarkerEntry) {
    this._markerToPreload = marker;
    const dialog = this.shadowRoot!.getElementById("svg-marker-dialog") as Dialog
    dialog.open = true
  }

  protected firstUpdated(_changedProperties: any) {
    // super.firstUpdated(_changedProperties);
  }

  /** preload fields with current emojiGroup values */
  async loadPreset(marker: SvgMarkerEntry) {
    this._nameField.value = 'Fork of ' + marker.name;
    this._svgField.value = marker.value;
    this._currentSvg = marker.value;
    this._currentMarker = marker;
  }

  private isValid() {
    let isValid: boolean = true;
    // Check name
    if (this._nameField) {
      if (!this._nameField.validity.valid) {
        isValid = false;
        this._nameField.reportValidity()
      }
    }
    // FIXME
    // ...
    // Done
    return isValid
  }


  private createSvgMarker(): SvgMarkerEntry {
    let svg: any =  this._svgField.value
    return {
      name: this._nameField.value,
      value: svg,
    }
  }

  clearAllFields(e?: any) {
    this._nameField.value = "";
    this._svgField.value = "";
  }

  private async handleResetMarker(e: any) {
    this._currentSvg = "";
    this.requestUpdate()
  }


  private async handleOk(e: any) {
    if (!this.isValid()) return
    const svgMarker = this.createSvgMarker()
    const newSvgMarkerEh = await this._store.addSvgMarker(svgMarker);
    console.log("newSvgMarkerEh: " + newSvgMarkerEh)
    this.dispatchEvent(new CustomEvent('svg-marker-added', { detail: newSvgMarkerEh, bubbles: true, composed: true }));
    // - Clear all fields
    this.clearAllFields();
    // - Close Dialog
    const dialog = this.shadowRoot!.getElementById("svg-marker-dialog") as Dialog;
    dialog.close()
  }


  private handleDialogOpened(e: any) {
    if (this._markerToPreload) {
      this.loadPreset(this._markerToPreload);
      this._markerToPreload = undefined;
    }
    this.requestUpdate();
  }

  private handleMarkerSelect(name: string): void {
    console.log("handleMarkerSelect: " /*+ emojiGroup.name*/)
    console.log(name)
    //this._currentGroup = emojiGroup;
    //this._currentUnicodes = this._currentGroup?.unicodes!
    this.requestUpdate()
  }


  private previewSvgMarker() {
    if (!this._currentSvg || !this._nameField || !this._svgField) return html``
    const marker = this.createSvgMarker()
    return renderSvgMarker(marker.value, "black")
  }

  render() {
    return html`
<mwc-dialog id="svg-marker-dialog" heading="New SVG Marker 64x64" @opened=${this.handleDialogOpened}>
  <!-- Name field -->
  <mwc-textfield id="name-field" dialogInitialFocus type="text"
                 style="min-width: 250px;margin-bottom:5px;"
                 @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
                 minlength="3" maxlength="64" label="Name" autoValidate=true required></mwc-textfield>
  <!-- Display Preview-->
  <div id="svg-marker-thumbnail">${this.previewSvgMarker()}</div>
  <!-- SVG field -->
  <mwc-textarea type="text" @input=${() => (this.shadowRoot!.getElementById("svg-field") as TextArea).reportValidity()}
                id="svg-field" placeholder="SVG here..." helper="No <svg> tag is required. Use %%color%% for using user's color" rows="10" cols="60" required></mwc-textarea>
  <!-- Dialog buttons -->
  <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
  <mwc-button slot="secondaryAction" dialogAction="cancel">cancel</mwc-button>
    <!-- <mwc-button slot="secondaryAction" @click=${this.handleResetMarker}>reset</mwc-button> -->
  <mwc-button slot="secondaryAction" @click=${this.handlePreview}>preview</mwc-button>
</mwc-dialog>
`
  }

  private async handlePreview(e: any) {
    if (!this.isValid()) return
    this.requestUpdate()
  }


  static get scopedElements() {
    return {
      "mwc-select": Select,
      "mwc-list-item": ListItem,
      "mwc-button": Button,
      "mwc-dialog": Dialog,
      "mwc-textfield": TextField,
      "mwc-icon-button": IconButton,
      "mwc-textarea": TextArea,
    };
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-textfield {
          margin-top: 5px;
        }
        mwc-textfield.rounded {
          --mdc-shape-small: 28px;
          width: 110px;
          margin-top:10px;
        }
        #svg-marker-thumbnail {
          min-width: ${MARKER_WIDTH}px;
          min-height: ${MARKER_WIDTH}px;
          /*border: 1px solid grey;*/
          /*background-color: rgb(252, 252, 252);*/
          display: inline-flex;
        }
      `
    ];
  }
}
