import {css, html, LitElement} from "lit";
import {query, state, property, customElement} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import parser from "fast-xml-parser";
import {prefix_canvas} from "../templates";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {unsafeSVG} from "lit/directives/unsafe-svg.js";
import { localized, msg } from '@lit/localize';
import {TemplateType} from "../viewModels/playset.perspective";
import {Template} from "../bindings/playset.types";


import "@material/mwc-circular-progress";
import "@material/mwc-icon/mwc-icon";
import "@material/mwc-list";
import "@material/mwc-icon-button";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-menu";
import "@material/mwc-drawer";
import "@material/mwc-textfield";
import "@material/mwc-textarea";
import "@material/mwc-dialog";
import "@material/mwc-select";
import "@material/mwc-button";
import "@material/mwc-formfield";

import {TextField} from "@material/mwc-textfield";
import {TextArea} from "@material/mwc-textarea";
import {Select} from "@material/mwc-select";
import {Dialog} from "@material/mwc-dialog";


/** */
function isValidXml(input: string) {
  console.log("isValidXml()", input)
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
 * @element
 */
@localized()
@customElement("where-template-dialog")
export class WhereTemplateDialog extends LitElement {

  /** -- Fields -- */

  private _currentType: TemplateType = TemplateType.Html;
  private _canvas: string = "";

  private _templateToPreload?: Template;

  @query('#name-field')
  _nameField!: TextField;
  @query('#surface-field')
  _surfaceField!: TextArea;
  @query('#type-field')
  _typeField!: Select;


  /** -- Methods -- */

  /** */
  open(template?: Template) {
    this._templateToPreload = template;
    const dialog = this.shadowRoot!.getElementById("template-dialog") as Dialog
    dialog.open = true
  }


  /** */
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

  /** preload fields with current template values */
  private loadPreset() {
    const surface = JSON.parse(this._templateToPreload!.surface)

    this._nameField.value = msg('Fork of') + ' ' + this._templateToPreload!.name;

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

  /** */
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


  private createTemplate(): Template {
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


  /** */
  private previewTemplate() {
    if (!this._currentType || !this._nameField || !this._surfaceField) return html``
    const template = this.createTemplate()
    return this.renderTemplate(template)
  }

  private renderTemplate(template: Template) {
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


  /** */
  private async handleOk(e: any) {
    if (!this.isValid()) return
    const template = this.createTemplate()
    console.log("newTemplate: ", + template)
    this.dispatchEvent(new CustomEvent('template-created', { detail: template, bubbles: true, composed: true }));
    /* Clear all fields */
    this.clearAllFields();
    /* Close Dialog */
    const dialog = this.shadowRoot!.getElementById("template-dialog") as Dialog;
    dialog.close()
  }

  private handleDialogOpened(e: any) {
    if (this._templateToPreload) {
      this.loadPreset();
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
<mwc-dialog id="template-dialog" heading="${msg('New template')}" @opened=${this.handleDialogOpened}>
  <mwc-textfield dialogInitialFocus type="text"
                 @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
                 id="name-field" minlength="3" maxlength="64" label="${msg('Name')}" autoValidate=true required></mwc-textfield>
  <mwc-select required id="type-field" label="${msg('Type')}" @select=${this.handleTypeSelect}>
    <mwc-list-item @request-selected=${() => this.handleTypeSelect(TemplateType.Html)} selected value="html">HTML</mwc-list-item>
    <mwc-list-item @request-selected=${() => this.handleTypeSelect(TemplateType.Svg)} value="svg">SVG</mwc-list-item>
    <mwc-list-item @request-selected=${() => this.handleTypeSelect(TemplateType.Canvas)} value="canvas">Canvas</mwc-list-item>
  </mwc-select>

  <mwc-textarea type="text" @input=${() => (this.shadowRoot!.getElementById("surface-field") as TextArea).reportValidity()}
                id="surface-field" placeholder="HTML/SVG/JS ${msg('here')}..." helper="${msg('No svg / html top level tag is required')}" rows="10" cols="60" required></mwc-textarea>
  </mwc-formfield>
  <mwc-textfield class="rounded" pattern="[0-9]+" defaultValue="500" outlined @input=${() => (this.shadowRoot!.getElementById("width-field") as TextField).reportValidity()}
                 id="width-field" minlength="1" maxlength="4" label="${msg('Width')}" autoValidate=true></mwc-textfield>
  <mwc-textfield class="rounded" pattern="[0-9]+" defaultValue="500" outlined @input=${() => (this.shadowRoot!.getElementById("height-field") as TextField).reportValidity()}
                 id="height-field" minlength="1" maxlength="4" label="${msg('Height')}" autoValidate=true></mwc-textfield>
  <div id="thumbnail">${this.previewTemplate()}</div>
  <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>${msg('ok')}</mwc-button>
  <mwc-button slot="secondaryAction" dialogAction="cancel">${msg('cancel')}</mwc-button>
  <mwc-button slot="secondaryAction" @click=${this.handlePreview}>${msg('preview')}</mwc-button>
</mwc-dialog>
`
  }


  // static get scopedElements() {
  //   return {
  //     "mwc-select": Select,
  //     "mwc-list-item": ListItem,
  //     "mwc-button": Button,
  //     "mwc-dialog": Dialog,
  //     "mwc-textfield": TextField,
  //     "mwc-textarea": TextArea,
  //     "mwc-formfield": Formfield,
  //   };
  // }


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
