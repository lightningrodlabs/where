import { html, css, LitElement } from "lit";
import { state, query } from "lit/decorators.js";

import { sharedStyles } from "../sharedStyles";
import { contextProvided } from "@lit-labs/context";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { WhereStore } from "../where.store";
import {whereContext, Space, Coord, TemplateEntry, SpaceEntry} from "../types";
import {
  Dialog,
  TextField,
  Button,
  Checkbox,
  Formfield,
  Select,
  ListItem,
  TextArea
} from "@scoped-elements/material-web";
import {StoreSubscriber} from "lit-svelte-stores";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {unsafeSVG} from "lit/directives/unsafe-svg.js";
import {renderUiItems} from "./where-space";

/**
 * @element where-space
 */
export class WhereSpaceDialog extends ScopedElementsMixin(LitElement) {

  @state() size : Coord = {x:0,y:0};
  @state() _currentTemplate: TemplateEntry = {name: "__dummy", surface:""};
  @state() _currentPlaceHolders: Array<string> = [];

  _useTemplateSize: boolean = true // have size fields set to default only when changing template

  /** Dependencies */
  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  _templates = new StoreSubscriber(this, () => this._store.templates);

  open(spaceEh?: any) {
    if (this._templates.value === undefined) {
      return;
    }

    /** preload fields with  current space values */
    if(spaceEh) {
      this._originalSpace = this._store.space(spaceEh);
      this._nameField.value = this._originalSpace.name;
      this._templateField.value = this._originalSpace.origin;
      this._uiField.value = this._originalSpace.meta!["ui"]? this._originalSpace.meta!["ui"] : "[\n]";
      let chk = this.shadowRoot!.getElementById("multi-chk") as Checkbox;
      chk.checked = this._originalSpace.meta!["multi"]? true : false;
      const tagChk = this.shadowRoot!.getElementById("tag-chk") as Checkbox;
      tagChk.checked = this._originalSpace.meta!["canTag"]? true : false;
      let widthField = this.shadowRoot!.getElementById("width-field") as TextField;
      widthField.value = this._originalSpace.surface.size.x;
      let heightField = this.shadowRoot!.getElementById("height-field") as TextField;
      heightField.value = this._originalSpace.surface.size.y;

      /** Templated fields */
      try {
        const subMap = new Map(JSON.parse(this._originalSpace.meta!["subMap"])) as Map<string, string>;
        for (let [key, value] of subMap) {
          let field = this.shadowRoot!.getElementById(key + '-gen') as TextField;
          console.log('field ' + key + ' - ' + value)
          field.value = value
          field.label = key
        }
      } catch (e) {
        console.error("Failed parsing subMap() for space " + spaceEh)
        console.error(e)
      }

      /** generate preview */
      this.requestUpdate();
    }

    const dialog = this.shadowRoot!.getElementById("space-dialog") as Dialog
    dialog.open = true
  }

  /** Private properties */
  _originalSpace?: Space;

  @query('#name-field')
  _nameField!: TextField;
  @query('#template-field')
  _templateField!: Select;
  @query('#ui-field')
  _uiField!: TextArea;

  /**
   *
   */
  private async handleOk(e: any) {
    /** Check validity */
    // nameField
    let isValid = this._nameField.validity.valid
    //&& this._urlField.validity.valid
    if (!this._nameField.validity.valid) {
      this._nameField.reportValidity()
    }
    // uiField
    try {
      const _ = JSON.parse(this._uiField.value)
    }
    catch (e) {
      isValid = false;
      this._uiField.setCustomValidity("Invalid UI Object: " + e)
      this._uiField.reportValidity()
    }
    if (!isValid) return

    // - Get checkbox value
    const chk = this.shadowRoot!.getElementById("multi-chk") as Checkbox;
    const multi = chk.checked ? "true" : ""

    const tagChk = this.shadowRoot!.getElementById("tag-chk") as Checkbox;
    const canTag = tagChk.checked ? "true" : ""

    let {surface, subMap} = this.generateSurface();
    const subMapJson = JSON.stringify(Array.from(subMap.entries()));
    console.log({subMapJson});

    // - Create space
    console.log("this._templateField.value = " + this._templateField.value);
    const space: Space = {
      name: this._nameField.value,
      origin: this._templateField.value,
      surface,
      meta: {
        subMap: subMapJson,
        multi,
        canTag,
        ui: this._uiField.value
      },
      locations: [],
    };

    // - Add space to commons
    const newSpace = await this._store.addSpace(space);
    this.dispatchEvent(new CustomEvent('space-added', { detail: newSpace, bubbles: true, composed: true }));
    // - Clear all fields
    let field = this.shadowRoot!.getElementById('name-field') as TextField;
    field.value = ''
    for (let placeholder of this._currentPlaceHolders) {
      let field = this.shadowRoot!.getElementById(placeholder + '-gen') as TextField;
      console.log('field ' + name + ' - ' + field.value)
      field.value = ''
    }
    this._uiField.value = '[{\n\n}]'
    // - Close dialog
    const dialog = this.shadowRoot!.getElementById("space-dialog") as Dialog;
    dialog.close()
  }

  private async handleCloseSpaceDialog(e: any) {
    console.log("handleCloseSpaceDialog CALLED")
    this._nameField.value = "";
  }

  private handleTemplateSelect(templateName: string): void {
    this._useTemplateSize = true;
    this._currentTemplate = this._templates.value[templateName]
  }

  private async handlePreview(e: any) {
    this._useTemplateSize = false;
    this.requestUpdate()
  }


  // handleUrlUpdated(e:Event) {
  //   this._urlField.setCustomValidity("can't load url")
  //   this._surfaceImg.onload = async () => {
  //     this._urlField.setCustomValidity("")
  //     this.size ={y:this._surfaceImg.naturalHeight, x: this._surfaceImg.naturalWidth}
  //   }
  //   this._surfaceImg.src = this._urlField.value;
  //   this.size = {x:0,y:0}
  // }


  /**
   *   Generate surface from template and form
   */
  generateSurface() {
    /** Html/SVG */
    //let surface: any = {html: `<img src="%%ImageUrl%%" style="width:100%" />`, size: { x: 626, y: 626 }, data: "[]"}
    //let surface: any = {svg: quadrant_template_svg, size: { x: 626, y: 626 }, data: "[]"}
    let surface: any = JSON.parse(this._currentTemplate.surface);
    let code: string = surface.svg? surface.svg : surface.html;
    /** Create substitution map */
    let subMap: Map<string, string> = new Map();
    for (let placeholder of this._currentPlaceHolders) {
      const txtfield = this.shadowRoot!.getElementById(placeholder + "-gen") as TextField;
      subMap.set(placeholder, txtfield? txtfield.value : placeholder)
    }
    //console.log({subMap})
    /** Replace each placeholder */
    subMap.forEach((value, key, map) => {
      let pattern = "%%" + key + "%%"
      var regex = new RegExp(pattern, "g");
      code = code.replace(regex, value)
    })
    //console.log({code})
    /** Replace field */
    if (surface.svg) {
      surface.svg = code
    } else {
      surface.html = code
    }

    /** Size */
    const widthField = this.shadowRoot!.getElementById("width-field") as TextField;
    if (widthField) {
      const x = widthField.value;
      const heightField = this.shadowRoot!.getElementById("height-field") as TextField;
      const y = heightField.value;
      //console.log({x})
      surface.size = {x, y}
    }
    /** Done */
    return {surface, subMap};
  }


  renderTemplate() {
    // if (!this._currentTemplate || this._currentTemplate.surface === "") {
    //   return html``
    // }

    let surface: any = JSON.parse(this._currentTemplate.surface);

    /** -- Check size -- */
    if (surface.size && this._useTemplateSize) {
      const widthField = this.shadowRoot!.getElementById("width-field") as TextField;
      widthField.value = surface.size.x;
      const heightField = this.shadowRoot!.getElementById("height-field") as TextField;
      heightField.value = surface.size.y;
    }

    /** -- Extract Fields  -- */
    //console.log({surface})
    // - Parse template
    const regex = /%%([a-zA-Z_0-9\-]+)%%/gm;
    let code = surface.svg? surface.svg : surface.html;
    let names: Set<string> = new Set()
    try {
      //let match = regex.exec(code);
      const match = [...code.matchAll(regex)];
      //console.log({match})
      // - Remove duplicates
      for (const pair of match) {
        names.add(pair[1])
      }
      //console.log({names})
    } catch(err) {
      console.error('No placeholder found in template');
    }
    this._currentPlaceHolders = Array.from(names)
    // - Generate textField for each placeholder
    return html`${this._currentPlaceHolders.map((name)=> html`<mwc-textfield outlined id="${name}-gen" required label="${name}" value="" ></mwc-textfield>`)}`
  }


  renderSurfacePreview() {
    if (!this._currentTemplate || this._currentTemplate.surface === "") {
      return html`<div id="thumbnail"></div>`
    }
    let {surface, subMap}: any = this.generateSurface();
    const ratio: number = surface.size? surface.size.y / surface.size.x : 1;
    const w: number = 200;
    const h: number = 200 * ratio;
    let uiItems = this._uiField? renderUiItems(this._uiField.value, w / surface.size.x, h / surface.size.y) : html ``;
    const preview = surface.html?
      html`
        ${uiItems}
        <div style="width: ${w}px; height: ${h}px;" id="surface-preview-div">
            ${unsafeHTML(surface.html)}
        </div>
        `
      : html`<svg xmlns="http://www.w3.org/2000/svg"
                  width="${w}px"
                  height="${h}px"
                  viewBox="0 0 ${surface.size.x} ${surface.size.y}"
                  preserveAspectRatio="none"
                  id="surface-preview-svg">
          ${uiItems}
          ${unsafeSVG(surface.svg)}
        </svg>`
      ;
    return html`
      <div id="thumbnail">${preview}</div>
    `
  }

//

  render() {
    if (!this._currentTemplate || this._currentTemplate.surface === "") {
      this._currentTemplate = this._templates.value[Object.keys(this._templates.value)[0]]
      console.log(this._currentTemplate)
    }
    let selectedTemplateUi = this.renderTemplate()
    //console.log({selectedTemplateUi})

    return html`
<mwc-dialog id="space-dialog" heading="New space" @closing=${this.handleCloseSpaceDialog}>
  ${this.renderSurfacePreview()}
  <mwc-textfield dialogInitialFocus type="text" @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
                 id="name-field" minlength="3" maxlength="64" label="Name" autoValidate=true required></mwc-textfield>
  <mwc-select fixedMenuPosition required id="template-field" label="Template" @select=${this.handleTemplateSelect}>
      ${Object.entries(this._templates.value).map(
        ([key, template]) => html`
        <mwc-list-item
          @request-selected=${() => this.handleTemplateSelect(key)}
          .selected=${this._templates.value[key].name === this._currentTemplate.name}
          value="${key}"
          >${template.name}
        </mwc-list-item>
      `)}
  </mwc-select>
  ${selectedTemplateUi}
  <mwc-textfield class="rounded" outlined @input=${() => (this.shadowRoot!.getElementById("width-field") as TextField).reportValidity()}
                 id="width-field" minlength="1" maxlength="4" label="Width" autoValidate=true required></mwc-textfield>
  <mwc-textfield class="rounded" pattern="[0-9]+" outlined @input=${() => (this.shadowRoot!.getElementById("height-field") as TextField).reportValidity()}
                   id="height-field" pattern="[0-9]+" minlength="1" maxlength="4" label="Height" autoValidate=true required></mwc-textfield>
  <mwc-formfield label="Multi-locations per user">
    <mwc-checkbox id="multi-chk"></mwc-checkbox>
  </mwc-formfield>
  <mwc-formfield label="Enable tags">
    <mwc-checkbox id="tag-chk"></mwc-checkbox>
  </mwc-formfield>
  <mwc-textarea type="text" label="UI elements" @input=${() => (this.shadowRoot!.getElementById("ui-field") as TextArea).reportValidity()}
                id="ui-field" value="[{\n\n}]" helper="Array of 'Box' objects" rows="8" cols="60"></mwc-textarea>
  <mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
  <mwc-button slot="secondaryAction"  dialogAction="cancel">cancel</mwc-button>
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
      "mwc-checkbox": Checkbox,
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-textfield {
          margin-top: 10px;
          display: flex;
        }
        mwc-dialog div, mwc-formfield, mwc-select {
          display: flex;
        }
        #space-dialog {
          --mdc-dialog-min-width: 500px;
        }
        #width-field, #height-field {
          margin-top: 10px;
          display: inline-flex;
        }
        #thumbnail {
          position: relative;
          padding-left: 10px;
          min-width: 200px;
          min-height: 10px;
          margin-left: 10px;
          padding-left: 0px;
          float: right;
          border: 1px solid grey;
          background-color: rgb(252, 252, 252);
        }
        mwc-textfield.rounded {
          --mdc-shape-small: 28px;
          width: 100px;
        }
        .ui-item {
          position: absolute;
          pointer-events: none;
          text-align: center;
          flex-shrink: 0;
        }
`,
    ];
  }
}
