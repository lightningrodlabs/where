import { html, css, LitElement } from "lit";
import { state, query } from "lit/decorators.js";

import { sharedStyles } from "../sharedStyles";
import { contextProvided } from "@lit-labs/context";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { WhereStore } from "../where.store";
import {whereContext, Coord, Space, TemplateEntry} from "../types";
import {
  Dialog,
  TextField,
  Button,
  Formfield,
  TextArea,
  Select,
  ListItem, Checkbox
} from "@scoped-elements/material-web";
import {renderTemplate} from "../sharedRender";
import parser from "fast-xml-parser";
import {EntryHashB64} from "@holochain-open-dev/core-types";

function isValidXml(input: string) {
  if (input === undefined || input === null) {
    return false;
  }
  input = input.toString().trim();
  if (input.length === 0) {
    return false;
  }
  let jsonObject;
  try {
    jsonObject = parser.parse(input);
  } catch (parseError) {
    console.log({parseError})
    return false;
  }
  if (!jsonObject) {
    return false;
  }
  return true;
}


/**
 * @element where-template
 */
export class WhereTemplateDialog extends ScopedElementsMixin(LitElement) {

  @state() size : Coord = {x:0,y:0};


  /** Dependencies */
  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  open(templateEh?: EntryHashB64) {
    this._templateToPreload = templateEh;
    const dialog = this.shadowRoot!.getElementById("template-dialog") as Dialog
    dialog.open = true
  }

  /** Private properties */

  _currentType = "html";

  _templateToPreload?: EntryHashB64;

  @query('#name-field')
  _nameField!: TextField;
  @query('#surface-field')
  _surfaceField!: TextArea;
  @query('#type-field')
  _typeField!: Select;

  /** preload fields with  current space values */
  loadPreset(templateEh: EntryHashB64) {
    const templateToPreload = this._store.template(templateEh);
    const surface = JSON.parse(templateToPreload.surface)

    this._nameField.value = templateToPreload.name;

    this._typeField.value = surface.html? 'html' : 'svg';

    this._surfaceField.value = surface.html? surface.html : surface.svg;

    if (surface.size) {
      let widthField = this.shadowRoot!.getElementById("width-field") as TextField;
      widthField.value = surface.size.x;
      let heightField = this.shadowRoot!.getElementById("height-field") as TextField;
      heightField.value = surface.size.y;
    }
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
    // check surface description validity
    if (this._surfaceField) {
      if (!isValidXml(this._surfaceField.value)) {
        isValid = false;
        this._surfaceField.setCustomValidity("Invalid XML")
        this._surfaceField.reportValidity()
      }
    }
    // Done
    return isValid
  }


  private createTemplate() {
    /** Create Surface */
    let surface: any = {}
    /** Size */
    const widthField = this.shadowRoot!.getElementById("width-field") as TextField;
    if (widthField) {
      const x = widthField.value;
      const heightField = this.shadowRoot!.getElementById("height-field") as TextField;
      const y = heightField.value;
      //console.log({x})
      surface.size = {x, y}
    }
    /** code */
    if (this._currentType === 'svg') {
      surface.svg = this._surfaceField.value
    } else {
      surface.html = this._surfaceField.value
    }
    /** Create TemplateEntry */
    return {
      name: this._nameField.value,
      surface: JSON.stringify(surface),
    }
  }

  private  previewTemplate() {
    if (!this._currentType || !this._nameField || !this._surfaceField) return html``
    const template = this.createTemplate()
    return renderTemplate(template)
  }

  private async handlePreview(e: any) {
    if (!this.isValid()) return
    this.requestUpdate()
  }

  private async handleOk(e: any) {
    if (!this.isValid()) return
    const template = this.createTemplate()
    const newTemplateEh = await this._store.addTemplate(template);
    console.log("newTemplateEh: " + newTemplateEh)
    this.dispatchEvent(new CustomEvent('template-added', { detail: newTemplateEh, bubbles: true, composed: true }));
    // - Clear all fields
    this.clearAllFields();
    // - Close Dialog
    const dialog = this.shadowRoot!.getElementById("template-dialog") as Dialog;
    dialog.close()
  }

  private handleDialogOpened(e: any) {
    if (this._templateToPreload) {
      this.loadPreset(this._templateToPreload);
      this._templateToPreload = undefined;
    }
    this.requestUpdate();
  }

  clearAllFields(e?: any) {
    this._nameField.value = "";
    this._surfaceField.value = "";
    let field = this.shadowRoot!.getElementById('width-field') as TextField;
    field.value = ''
    field = this.shadowRoot!.getElementById('height-field') as TextField;
    field.value = ''
  }

  private handleTypeSelect(t: string): void {
    this._currentType = t;
  }

  render() {
    return html`
<mwc-dialog id="template-dialog" heading="New template" @opened=${this.handleDialogOpened}>
  <mwc-textfield dialogInitialFocus type="text"
                 @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
                 id="name-field" minlength="3" maxlength="64" label="Name" autoValidate=true required></mwc-textfield>
  <mwc-select required id="type-field" label="Type" @select=${this.handleTypeSelect}>
    <mwc-list-item @request-selected=${() => this.handleTypeSelect("html")} selected value="html">HTML</mwc-list-item>
    <mwc-list-item @request-selected=${() => this.handleTypeSelect("svg")} value="svg">SVG</mwc-list-item>
  </mwc-select>

  <mwc-textarea type="text" @input=${() => (this.shadowRoot!.getElementById("surface-field") as TextArea).reportValidity()}
                id="surface-field" placeholder="HTML/SVG here..." helper="No <svg> / <html> tag is required" rows="10" cols="60" required></mwc-textarea>
  </mwc-formfield>
  <mwc-textfield class="rounded" pattern="[0-9]+" defaultValue="500" outlined @input=${() => (this.shadowRoot!.getElementById("width-field") as TextField).reportValidity()}
                 id="width-field" minlength="1" maxlength="4" label="Width" autoValidate=true required></mwc-textfield>
  <mwc-textfield class="rounded" pattern="[0-9]+" defaultValue="500" outlined @input=${() => (this.shadowRoot!.getElementById("height-field") as TextField).reportValidity()}
                 id="height-field" minlength="1" maxlength="4" label="Height" autoValidate=true required></mwc-textfield>
  <div id="thumbnail">${this.previewTemplate()}</div>
<mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
<mwc-button slot="secondaryAction" dialogAction="cancel">cancel</mwc-button>
  <mwc-button slot="secondaryAction" @click=${this.handlePreview}>preview</mwc-button>
</mwc-dialog>
`
  }


  static get scopedElements() {
    return {
      "mwc-select": Select,
      "mwc-list-item": ListItem,
      "mwc-button": Button,
      "mwc-dialog": Dialog,
      "mwc-textfield": TextField,
      "mwc-textarea": TextArea,
      "mwc-formfield": Formfield,
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-textfield.rounded {
          --mdc-shape-small: 28px;
          width: 110px;
          margin-top:10px;
        }
        #thumbnail {
          min-width: 200px;
          min-height: 10px;
          float: right;
          border: 1px solid grey;
          background-color: rgb(252, 252, 252);
        }
        #surface-field {
          width: 100%;
          margin-top:10px;
          display:block;
        }
`,
    ];
  }
}
