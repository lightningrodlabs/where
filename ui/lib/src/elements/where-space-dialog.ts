import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {contextProvided} from "@lit-labs/context";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {WhereStore} from "../where.store";
import {Dictionary, MarkerType, Space, TemplateEntry, whereContext} from "../types";
import {EMOJI_WIDTH, MARKER_WIDTH, renderMarker, renderUiItems} from "../sharedRender";
import {
  Button,
  Checkbox,
  Dialog,
  Formfield,
  ListItem,
  Radio,
  Select,
  TextArea,
  TextField
} from "@scoped-elements/material-web";
import {StoreSubscriber} from "lit-svelte-stores";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {unsafeSVG} from "lit/directives/unsafe-svg.js";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {Profile} from "@holochain-open-dev/profiles";
import {SlAvatar} from "@scoped-elements/shoelace";

/**
 * @element where-space-dialog
 */
export class WhereSpaceDialog extends ScopedElementsMixin(LitElement) {

  @property() myProfile: Profile| undefined = undefined;

  @state() _currentTemplate: TemplateEntry = {name: "__dummy", surface:""};
  @state() _currentPlaceHolders: Array<string> = [];

  _useTemplateSize: boolean = true // have size fields set to default only when changing template

  /** Dependencies */
  @contextProvided({ context: whereContext })
  _store!: WhereStore;

  _templates = new StoreSubscriber(this, () => this._store.templates);

  /** Private properties */
  _spaceToPreload?: EntryHashB64;

  @query('#name-field')
  _nameField!: TextField;
  @query('#template-field')
  _templateField!: Select;
  @query('#width-field')
  _widthField!: TextField;
  @query('#height-field')
  _heightField!: TextField;
  @query('#ui-field')
  _uiField!: TextArea;

  @query('#tag-chk')
  _tagChk!: Checkbox;
  @query('#multi-chk')
  _multiChk!: Checkbox;

  @query('#marker-select')
  _markerField!: Select;


  /**
   *
   */
  open(spaceToPreload?: EntryHashB64) {
    this._spaceToPreload = spaceToPreload;
    if (this._templates.value === undefined) {
      return;
    }
    this.requestUpdate();
    const dialog = this.shadowRoot!.getElementById("space-dialog") as Dialog
    dialog.open = true
  }


  /**
   *
   */
  loadPreset(spaceEh: EntryHashB64) {
    const originalSpace = this._store.space(spaceEh);
    if (!originalSpace) {
      return;
    }
    this._nameField.value = originalSpace.name;
    this._templateField.value = originalSpace.origin;
    this._uiField.value = originalSpace.meta!["ui"] ? originalSpace.meta!["ui"] : "[\n]";
    this._multiChk.checked = originalSpace.meta!["multi"] ? true : false;
    this._tagChk.checked = originalSpace.meta!["canTag"] ? true : false;
    this._markerField.value = originalSpace.meta!["markerType"];
    this._widthField.value = originalSpace.surface.size.x;
    this._heightField.value = originalSpace.surface.size.y;

    /** Templated fields */
    try {
      const subMap = new Map(JSON.parse(originalSpace.meta!["subMap"])) as Map<string, string>;
      for (let [key, value] of subMap) {
        let field = this.shadowRoot!.getElementById(key + '-gen') as TextField;
        if (!field) {
          console.log('Textfield not found: ' + key + '-gen')
          continue;
        }
        console.log('field ' + key + ' - ' + value)
        field.value = value
        field.label = key
      }
    } catch (e) {
      console.error("Failed parsing subMap() for space " + originalSpace)
      console.error(e)
    }
  }

  private determineMarkerType(): string {
     if (!this._markerField) {
       return MarkerType[MarkerType.Avatar];
    }
    return this._markerField.value;
  }

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

    // - Get checkbox values
    const multi = this._multiChk.checked ? "true" : ""
    const canTag = this._tagChk.checked ? "true" : ""
    const markerType = this.determineMarkerType();

    let {surface, subMap} = this.generateSurface();
    const subMapJson = JSON.stringify(Array.from(subMap.entries()));
    console.log({subMapJson});

    // - Create space
    //console.log("this._templateField.value = " + this._templateField.value);
    const space: Space = {
      name: this._nameField.value,
      origin: this._templateField.value,
      visible: true,
      surface,
      meta: {
        subMap: subMapJson,
        multi,
        canTag,
        markerType,
        ui: this._uiField.value
      },
      locations: [],
    };

    // - Add space to commons
    const newSpace = await this._store.addSpace(space);
    this.dispatchEvent(new CustomEvent('space-added', { detail: newSpace, bubbles: true, composed: true }));
    // - Clear all fields
    // this.resetAllFields();
    // - Close dialog
    const dialog = this.shadowRoot!.getElementById("space-dialog") as Dialog;
    dialog.close()
  }


  resetAllFields() {
    this._nameField.value = ''
    for (let placeholder of this._currentPlaceHolders) {
      let field = this.shadowRoot!.getElementById(placeholder + '-gen') as TextField;
      // console.log('field ' + placeholder + ' - ' + field.value)
      field.value = ''
    }
    this._widthField.value = ''
    this._heightField.value = ''
    this._uiField.value = '[]'
  }

  private async handleDialogOpened(e: any) {
    if (this._spaceToPreload) {
      this.loadPreset(this._spaceToPreload);
      this._spaceToPreload = undefined;
    }
    this.requestUpdate()
  }

  private async handleDialogClosing(e: any) {
    this.resetAllFields();
  }

  private handleTemplateSelect(templateName: string): void {
    this.resetAllFields();
    this._useTemplateSize = true;
    this._currentTemplate = this._templates.value[templateName]
  }

  private async handlePreview(e: any) {
    this._useTemplateSize = false;
    this.requestUpdate()
  }

  /**
   *   Generate surface from template and form
   */
  generateSurface() {
    /** Html/SVG */
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
    if (this._widthField) {
      const x = this._widthField.value;
      const y = this._heightField.value;
      //console.log({x})
      surface.size = {x, y}
    }
    /** Done */
    return {surface, subMap};
  }


  renderTemplateFields() {
    // if (!this._currentTemplate || this._currentTemplate.surface === "") {
    //   return html``
    // }

    let surface: any = JSON.parse(this._currentTemplate.surface);

    /** -- Check size -- */
    if (surface.size && this._useTemplateSize) {
      this._widthField.value = surface.size.x;
      this._heightField.value = surface.size.y;
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
    return html`${this._currentPlaceHolders.map((name)=> html`
      <mwc-textfield outlined id="${name}-gen" required label="${name}" value="" @input="${name==='ImageUrl'?this.handleImageUrlField:null}"></mwc-textfield>`
    )}`
  }


  /** Handle special case for ImageUrl field from Map2D template */
  handleImageUrlField(e: any) {
    const imgComp = this.shadowRoot!.getElementById("ImageUrl-gen") as TextField;
    try {
      const _url = new URL(imgComp.value); // check url validity
      let img = new Image();
      img.onload = async () => {
        console.log( img.naturalWidth +' '+ img.naturalHeight );
        this._widthField.value = JSON.stringify(img.naturalWidth);
        this._heightField.value = JSON.stringify(img.naturalHeight);
      };
      img.src = imgComp.value;
    } catch (_) {
      // N/A
    }
  }


  renderMarkerPreview(markerType?: string) {
    let locMeta: Dictionary<string> = {};
    locMeta.markerType = markerType? markerType : this.determineMarkerType();
    locMeta.img = this.myProfile!.fields.avatar;
    locMeta.emoji = "😀";
    locMeta.color = this.myProfile!.fields.color;
    locMeta.name = this.myProfile!.nickname;
    return html `<div id="marker-preview" class="location-marker">${renderMarker(locMeta, false)}</div>`
  }


  renderSurfacePreview() {
    if (!this._currentTemplate || this._currentTemplate.surface === "") {
      return html`<div id="thumbnail"></div>`
    }
    let {surface, _subMap}: any = this.generateSurface();
    const ratio: number = (surface.size && surface.size.x > 0)? surface.size.y / surface.size.x : 1;
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

  handleMarkerSelect(markerType: string) {
    console.log({markerType})
    //this.requestUpdate()
  }


  render() {
    if (!this._currentTemplate || this._currentTemplate.surface === "") {
      this._currentTemplate = this._templates.value[Object.keys(this._templates.value)[0]]
      console.log(this._currentTemplate)
    }
    let selectedTemplateUi = this.renderTemplateFields()
    //console.log({selectedTemplateUi})

    const boxExample = `{ "box": {"left": 100, "top": 10, "width": 100, "height": 50},
      "style": "background-color:white;border-radius:10px;",
      "content": "Land of the Lost"}`

    return html`
<mwc-dialog id="space-dialog" heading="New space" @closing=${this.handleDialogClosing} @opened=${this.handleDialogOpened}>
  ${this.renderSurfacePreview()}
  <mwc-textfield dialogInitialFocus type="text"
                 @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
                 id="name-field" minlength="3" maxlength="64" label="Name" autoValidate=true required></mwc-textfield>
  <!--  Marker Select -->
  <mwc-select label="Marker type" id="marker-select">
    <mwc-list-item selected value="${MarkerType[MarkerType.Avatar]}">Avatar ${this.renderMarkerPreview(MarkerType[MarkerType.Avatar])}</mwc-list-item>
    <mwc-list-item value="${MarkerType[MarkerType.Emoji]}">Emoji ${this.renderMarkerPreview(MarkerType[MarkerType.Emoji])}</mwc-list-item>
    <mwc-list-item value="${MarkerType[MarkerType.Color]}">Colored Pin ${this.renderMarkerPreview(MarkerType[MarkerType.Color])}</mwc-list-item>
    <mwc-list-item value="${MarkerType[MarkerType.Letter]}">Initials ${this.renderMarkerPreview(MarkerType[MarkerType.Letter])}</mwc-list-item>
  </mwc-select>
  <!--  Template Select -->
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

  <mwc-textfield id="width-field" class="rounded" outlined minlength="1" maxlength="4" label="Width" autoValidate=true required></mwc-textfield>
  <mwc-textfield id="height-field" class="rounded" outlined pattern="[0-9]+" minlength="1" maxlength="4" label="Height" autoValidate=true required></mwc-textfield>

  <mwc-formfield label="Multi-locations per user">
    <mwc-checkbox id="multi-chk"></mwc-checkbox>
  </mwc-formfield>
  <mwc-formfield label="Enable tags">
    <mwc-checkbox id="tag-chk"></mwc-checkbox>
  </mwc-formfield>


<details style="margin-top:10px;">
<summary>Extra UI elements</summary>
  <mwc-textarea type="text" @input=${() => (this.shadowRoot!.getElementById("ui-field") as TextArea).reportValidity()}
                id="ui-field" value="[]" helper="Array of 'Box' objects. Example: ${boxExample}" rows="8" cols="60"></mwc-textarea>
                </details>
  <mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
  <mwc-button slot="secondaryAction"  dialogAction="cancel">cancel</mwc-button>
  <mwc-button slot="secondaryAction" @click=${this.handlePreview}>preview</mwc-button>
</mwc-dialog>
`
  }


  static get scopedElements() {
    return {
      'sl-avatar': SlAvatar,
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
        mwc-dialog div, mwc-formfield, mwc-select {
          display: flex;
        }
        #space-dialog {
          --mdc-dialog-min-width: 600px;
        }
        #width-field, #height-field {
          margin-top: 10px;
          display: inline-flex;
        }
        #thumbnail {
          position: relative;
          padding-left: 10px;
          min-width: 200px;
          min-height: 50px;
          margin-left: 10px;
          padding-left: 0px;
          float: right;
          border: 1px solid grey;
          background-color: rgb(252, 252, 252);
        }
        mwc-textfield {
          margin-top: 10px;
          display: flex;
        }
        mwc-formfield {
          height: 32px;
        }
        mwc-textfield.rounded {
          --mdc-shape-small: 28px;
          width: 8em;
        }

        mwc-list-item {
          height: 60px;
        }

        #marker-select {
          margin-top: 5px;
        }

        .location-marker {
          display: inline-flex;
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
