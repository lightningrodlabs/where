import {css, html, LitElement} from "lit";
import {query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {contextProvided} from "@lit-labs/context";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {WhereStore} from "../where.store";
import {Coord, TemplateEntry, TemplateType, whereContext} from "../types";
import {Button, Dialog, Formfield, ListItem, Select, TextArea, TextField} from "@scoped-elements/material-web";
import parser from "fast-xml-parser";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {prefix_canvas} from "../templates";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {unsafeSVG} from "lit/directives/unsafe-svg.js";

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

  _currentType: TemplateType = TemplateType.Html;
  _canvas: string = "";

  _templateToPreload?: EntryHashB64;

  @query('#name-field')
  _nameField!: TextField;
  @query('#surface-field')
  _surfaceField!: TextArea;
  @query('#type-field')
  _typeField!: Select;

  updated(changedProperties: any) {
    if (this._canvas) {
      let canvas_code = prefix_canvas('template-canvas') + this._canvas;
      try {
        var renderCanvas = new Function (canvas_code);
        renderCanvas.apply(this);
      } catch(err) {
        console.log("render template failed");
      }
    }
  }

  /** preload fields with  current space values */
  loadPreset(templateEh: EntryHashB64) {
    const templateToPreload = this._store.template(templateEh);
    const surface = JSON.parse(templateToPreload.surface)

    this._nameField.value = 'Fork of ' + templateToPreload.name;

    if (surface.html) {
      this._typeField.value = TemplateType.Html;
      this._currentType = TemplateType.Html;
      this._surfaceField.value = surface.html;
    }
    if (surface.svg) {
      this._typeField.value = TemplateType.Svg;
      this._currentType = TemplateType.Svg;
      this._surfaceField.value = surface.svg;
    }
    if (surface.canvas) {
      this._typeField.value = TemplateType.Canvas;
      this._currentType = TemplateType.Canvas;
      this._surfaceField.value = surface.canvas;
      this._canvas = surface.canvas;
    }

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
    if (this._surfaceField && this._currentType != TemplateType.Canvas) {
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
    if (this._currentType === TemplateType.Svg) {
      surface.svg = this._surfaceField.value
    }
    if (this._currentType === TemplateType.Html) {
      surface.html = this._surfaceField.value
    }
    if (this._currentType === TemplateType.Canvas) {
      //const final = canvas_prefix + this._surfaceField.value;
      surface.canvas = this._surfaceField.value
    }

    /** Create TemplateEntry */
    return {
      name: this._nameField.value,
      surface: JSON.stringify(surface),
    }
  }

  private previewTemplate() {
    if (!this._currentType || !this._nameField || !this._surfaceField) return html``
    const template = this.createTemplate()
    return this.renderTemplate(template)
  }

  private renderTemplate(template: TemplateEntry) {
    if (template.surface === "") {
      return html``
    }
    // console.log("renderTemplate:" + template.surface);
    let surface: any = JSON.parse(template.surface);
    if (surface.svg) {
      console.log(surface.svg)
    }
    const ratio: number = surface.size? surface.size.y / surface.size.x : 1;
    const w: number = 200;
    const h: number = 200 * ratio;

    var preview;
    if (surface.html) {
      preview = html`
        <div style="width: ${w}px; height: ${h}px;" id="surface-preview-div">
            ${unsafeHTML(surface.html)}
        </div>`;
    }
    if (surface.svg) {
      preview = html`
      <svg xmlns="http://www.w3.org/2000/svg"
           width="${w}px"
           height="${h}px"
           viewBox="0 0 ${surface.size.x} ${surface.size.y}"
           preserveAspectRatio="none"
           id="surface-preview-svg">
        ${unsafeSVG(surface.svg)}
      </svg>`
      ;
      // console.log(preview)
    }
    // canvas
    if (surface.canvas) {
      this._canvas = surface.canvas;
      preview = html`<canvas id="template-canvas" width="${w}" height="${h}">`
    }
    //
    return html`${preview}`
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

  private handleTypeSelect(t: TemplateType): void {
    this._currentType = t;
  }

  render() {
    return html`
<mwc-dialog id="template-dialog" heading="New template" @opened=${this.handleDialogOpened}>
  <mwc-textfield dialogInitialFocus type="text"
                 @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
                 id="name-field" minlength="3" maxlength="64" label="Name" autoValidate=true required></mwc-textfield>
  <mwc-select required id="type-field" label="Type" @select=${this.handleTypeSelect}>
    <mwc-list-item @request-selected=${() => this.handleTypeSelect(TemplateType.Html)} selected value="html">HTML</mwc-list-item>
    <mwc-list-item @request-selected=${() => this.handleTypeSelect(TemplateType.Svg)} value="svg">SVG</mwc-list-item>
    <mwc-list-item @request-selected=${() => this.handleTypeSelect(TemplateType.Canvas)} value="canvas">Canvas</mwc-list-item>
  </mwc-select>

  <mwc-textarea type="text" @input=${() => (this.shadowRoot!.getElementById("surface-field") as TextArea).reportValidity()}
                id="surface-field" placeholder="HTML/SVG/JS here..." helper="No <svg> / <html> tag is required" rows="10" cols="60" required></mwc-textarea>
  </mwc-formfield>
  <mwc-textfield class="rounded" pattern="[0-9]+" defaultValue="500" outlined @input=${() => (this.shadowRoot!.getElementById("width-field") as TextField).reportValidity()}
                 id="width-field" minlength="1" maxlength="4" label="Width" autoValidate=true></mwc-textfield>
  <mwc-textfield class="rounded" pattern="[0-9]+" defaultValue="500" outlined @input=${() => (this.shadowRoot!.getElementById("height-field") as TextField).reportValidity()}
                 id="height-field" minlength="1" maxlength="4" label="Height" autoValidate=true></mwc-textfield>
  <div id="thumbnail">${this.previewTemplate()}</div>
  <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
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
