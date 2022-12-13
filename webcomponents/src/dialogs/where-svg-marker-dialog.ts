import {css, html, LitElement} from "lit";
import {query, state, property} from "lit/decorators.js";
import { localized, msg } from '@lit/localize';
import {sharedStyles} from "../sharedStyles";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {Button, Dialog, IconButton, ListItem, Select, TextArea, TextField} from "@scoped-elements/material-web";
import {MARKER_WIDTH, renderSvgMarker} from "../sharedRender";
import {SvgMarker} from "../viewModels/playset.bindings";


/**
 * @element where-svg-marker-dialog
 */
@localized()
export class WhereSvgMarkerDialog extends ScopedElementsMixin(LitElement) {

  @state() private _currentSvg: string = "";

  /** Private properties */

  private _markerToPreload?: SvgMarker;
  private _currentMarker: SvgMarker | null = null;


  @query('#name-field')
  private _nameField!: TextField;
  @query('#svg-field')
  private _svgField!: TextArea;


  /** -- Methods -- */

  /** Public API */

  open(marker?: SvgMarker) {
    this._markerToPreload = marker;
    const dialog = this.shadowRoot!.getElementById("svg-marker-dialog") as Dialog
    dialog.open = true
  }


  /** preload fields with current emojiGroup values */
  async loadPreset() {
    const marker = this._markerToPreload!;
    this._nameField.value = msg('Fork of') + ' ' + marker.name;
    this._svgField.value = marker.value;
    this._currentSvg = marker.value;
    this._currentMarker = marker;
  }

  /** */
  clearAllFields(e?: any) {
    this._nameField.value = "";
    this._svgField.value = "";
  }


  /** Private API */

  /** */
  private isValid() {
    let isValid: boolean = true;
    /* Check name */
    if (this._nameField) {
      if (!this._nameField.validity.valid) {
        isValid = false;
        this._nameField.reportValidity()
      }
    }
    // TODO: Add more validation
    // ...
    // Done
    return isValid
  }


  /** */
  private createSvgMarker(): SvgMarker {
    let svg: any =  this._svgField.value
    return {
      name: this._nameField.value,
      value: svg,
    }
  }


  /** */
  private async handleResetMarker(e: any) {
    this._currentSvg = "";
    //this.requestUpdate()
  }


  /** */
  private handleOk(e: any) {
    if (!this.isValid()) return
    const svgMarker = this.createSvgMarker()
    //const newSvgMarkerEh = await this.store.addSvgMarker(svgMarker);
    //console.log("newSvgMarkerEh: " + newSvgMarkerEh)
    this.dispatchEvent(new CustomEvent('svg-marker-created', { detail: svgMarker, bubbles: true, composed: true }));
    /* - Clear all fields */
    this.clearAllFields();
    /* - Close Dialog */
    const dialog = this.shadowRoot!.getElementById("svg-marker-dialog") as Dialog;
    dialog.close()
  }


  /** */
  private handleDialogOpened(e: any) {
    if (this._markerToPreload) {
      this.loadPreset();
      this._markerToPreload = undefined;
    }
    this.requestUpdate();
  }

  // private handleMarkerSelect(name: string): void {
  //   console.log("handleMarkerSelect: " /*+ emojiGroup.name*/)
  //   console.log(name)
  //   //this._currentGroup = emojiGroup;
  //   //this._currentUnicodes = this._currentGroup?.unicodes!
  //   this.requestUpdate()
  // }


  /** */
  private previewSvgMarker() {
    if (!this._currentSvg || !this._nameField || !this._svgField) return html``
    const marker = this.createSvgMarker()
    return renderSvgMarker(marker.value, "black")
  }


  /** */
  render() {
    return html`
<mwc-dialog id="svg-marker-dialog" heading="${msg('New SVG Marker')} 64x64" @opened=${this.handleDialogOpened}>
  <!-- Name field -->
  <mwc-textfield id="name-field" dialogInitialFocus type="text"
                 style="min-width: 250px;margin-bottom:5px;"
                 @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
                 minlength="3" maxlength="64" label="${msg('Name')}" autoValidate=true required></mwc-textfield>
  <!-- Display Preview-->
  <div id="svg-marker-thumbnail">${this.previewSvgMarker()}</div>
  <!-- SVG field -->
  <mwc-textarea type="text" @input=${() => (this.shadowRoot!.getElementById("svg-field") as TextArea).reportValidity()}
                id="svg-field" placeholder="${msg('SVG here')}..." helper="${msg('No svg top level tag is required')}. ${msg('Use %%color%% to use profile color')}" rows="10" cols="60" required></mwc-textarea>
  <!-- Dialog buttons -->
  <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>${msg('ok')}</mwc-button>
  <mwc-button slot="secondaryAction" dialogAction="cancel">${msg('cancel')}</mwc-button>
    <!-- <mwc-button slot="secondaryAction" @click=${this.handleResetMarker}>${msg('reset')}</mwc-button> -->
  <mwc-button slot="secondaryAction" @click=${this.handlePreview}>${msg('preview')}</mwc-button>
</mwc-dialog>
`
  }


  /** */
  private async handlePreview(e: any) {
    if (!this.isValid()) return
    this.requestUpdate()
  }


  /** */
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


  /** */
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
