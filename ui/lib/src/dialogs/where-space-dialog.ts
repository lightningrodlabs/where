import {css, html, LitElement, PropertyValues} from "lit";
import {property, query, state} from "lit/decorators.js";
import {contextProvided} from "@lit-labs/context";

import {sharedStyles} from "../sharedStyles";

import {ScopedElementsMixin} from "@open-wc/scoped-elements";

import {
  defaultLocationMeta,
  defaultPlayMeta, EmojiGroupVariant,
  LocationMeta, ludothequeContext, MarkerPiece,
  MarkerType,
  PlayMeta, SvgMarkerVariant,
  TemplateEntry,
  UiItem,
  whereContext
} from "../types";
import {EMOJI_WIDTH, renderMarker, renderSvgMarker, renderUiItems} from "../sharedRender";
import {
  Button,
  Checkbox,
  Dialog,
  Formfield,
  IconButton,
  ListItem,
  Radio,
  Select,
  Tab,
  TabBar,
  TextArea,
  TextField
} from "@scoped-elements/material-web";
import {StoreSubscriber} from "lit-svelte-stores";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {unsafeSVG} from "lit/directives/unsafe-svg.js";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {Profile} from "@holochain-open-dev/profiles";
import {SlAvatar, SlTab, SlTabGroup, SlTabPanel} from "@scoped-elements/shoelace";
import {prefix_canvas} from "../templates";
import {WhereEmojiGroupDialog} from "./where-emoji-group-dialog";
import {WhereEmojiDialog} from "./where-emoji-dialog";
import {Picker} from "emoji-picker-element";
import {WhereSvgMarkerDialog} from "./where-svg-marker-dialog";
import {LudothequeStore} from "../ludotheque.store";
import { localized, msg } from '@lit/localize';


/**
 * @element where-space-dialog
 */
@localized()
export class WhereSpaceDialog extends ScopedElementsMixin(LitElement) {
  /** Dependencies */
  @contextProvided({ context: ludothequeContext, subscribe: true })
  _store!: LudothequeStore;

  _templates = new StoreSubscriber(this, () => this._store?.templates);
  _emojiGroups = new StoreSubscriber(this, () => this._store?.emojiGroups);
  _svgMarkers = new StoreSubscriber(this, () => this._store?.svgMarkers);

  /** Private properties */
  @state() _currentTemplate: null | TemplateEntry = null;

  @state() _currentPlaceHolders: Array<string> = [];

  @state() _currentMeta: PlayMeta = defaultPlayMeta();
  @state() _currentMarker?: MarkerPiece;

  _spaceToPreload?: EntryHashB64;
  _useTemplateSize: boolean = true; // have size fields set to default only when changing template
  _canvas: string = "";


  @query('#name-field')
  _nameField!: TextField;
  // - Surface
  @query('#template-field')
  _templateField!: Select;
  @query('#width-field')
  _widthField!: TextField;
  @query('#height-field')
  _heightField!: TextField;
  @query('#ui-field')
  _uiField!: TextArea;
  // - Marker
  @query('#marker-select')
  _markerTypeField!: Select;
  @query('#multi-chk')
  _multiChk!: Checkbox;
  // - Tag
  @query('#tag-chk')
  _tagChk!: Checkbox;
  @query('#tag-visible-chk')
  _tagVisibleChk!: Checkbox;
  @query('#predefined-tags-field')
  _predefinedTagsField!: TextField;


  get tagChkLabel() : Formfield {
    return this.shadowRoot!.getElementById("tag-chk-lbl") as Formfield;
  }

  get emojiDialogElem() : WhereEmojiDialog {
    return this.shadowRoot!.getElementById("emoji-dialog") as WhereEmojiDialog;
  }

  get emojiGroupDialogElem() : WhereEmojiGroupDialog {
    return this.shadowRoot!.getElementById("emoji-group-dialog") as WhereEmojiGroupDialog;
  }

  get svgMarkerDialogElem() : WhereSvgMarkerDialog {
    return this.shadowRoot!.getElementById("svg-marker-dialog") as WhereSvgMarkerDialog;
  }



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
    const originalSpace = this._store.spaceFromEh(spaceEh);
    if (!originalSpace) {
      return;
    }
    console.log("loading preset: " + originalSpace.name)
    this._currentMeta = { ...originalSpace.meta };

    this._currentMarker = originalSpace.maybeMarkerPiece;

    this._nameField.value = 'Fork of ' + originalSpace.name;
    this._templateField.value = originalSpace.origin;
    this._widthField.value = originalSpace.surface.size.x;
    this._heightField.value = originalSpace.surface.size.y;
    this._uiField.value = originalSpace!.meta.ui ? JSON.stringify(originalSpace.meta!.ui) : "[\n]";
    // - Markers
    this._markerTypeField.value = MarkerType[originalSpace.meta.markerType];
    this._multiChk.checked = originalSpace.meta.multi;
    // - Tags
    this._tagChk.checked = originalSpace.meta.canTag;
    this.tagChkLabel.label = "Display tag on surface"
    this._tagVisibleChk.disabled = !originalSpace.meta.canTag;
    this._tagVisibleChk.checked = originalSpace.meta.tagVisible;
    this._predefinedTagsField.disabled = !originalSpace.meta.canTag;
    this._predefinedTagsField.value = originalSpace.meta.predefinedTags.join();
    if (originalSpace.meta.markerType == MarkerType.Tag) {
      this._tagChk.disabled = true;
      this._tagVisibleChk.disabled = true;
      this.tagChkLabel.label = "Display tag on surface (Tag Marker type selected)"
    }
    /** Templated fields */
    for (let [key, value] of originalSpace.meta.subMap!) {
      let field = this.shadowRoot!.getElementById(key + '-gen') as TextField;
      if (!field) {
        console.log('Textfield not found: ' + key + '-gen')
        continue;
      }
      // console.log('field ' + key + ' - ' + value)
      field.value = value
      field.label = key
    }
  }

  private determineMarkerType(): string {
    if (!this._markerTypeField) {
      return MarkerType[MarkerType.Avatar];
    }
    return this._markerTypeField.value;
  }


  updated(changedProperties: any) {
    //console.log("Updated space-dialog: " + changedProperties)
    /** Execute Canvas code */
    if (this._canvas) {
      let canvas_code = prefix_canvas('preview-canvas') + this._canvas;
      try {
        var renderCanvas = new Function(canvas_code);
        renderCanvas.apply(this);
      } catch (e) {console.log("render canvas failed");}
    }
    /** Setup emoji picker */
    let emojiPickerElem = this.shadowRoot!.getElementById("emoji-picker") as Picker;
    if (emojiPickerElem) {
      emojiPickerElem.addEventListener('emoji-click', (event: any) => {
        const unicode = event?.detail?.unicode
        //console.log("emoji-click: " + unicode)
        let emojiPreview = this.shadowRoot!.getElementById("space-unicodes");
        emojiPreview!.innerHTML = unicode
        this._currentMeta.singleEmoji = unicode
        this.requestUpdate()
      });
    }
  }

  /**
   *
   */
  private async handleOk(e: any) {
    /** Check validity */
    let generalTab = this.shadowRoot!.getElementById("general-tab") as SlTab;
    let locationsTab = this.shadowRoot!.getElementById("locations-tab") as SlTab;
    let advancedTab = this.shadowRoot!.getElementById("advanced-tab") as SlTab;
    generalTab.tab.style.color = "grey";
    locationsTab.tab.style.color = "grey";
    advancedTab.tab.style.color = "grey";

    /** Advanced Tab */
    let isAdvancedValid = true;
    // uiField
    let ui: UiItem[] = [];
    try {
      ui = JSON.parse(this._uiField.value)
    }
    catch(e) {
      isAdvancedValid = false;
      advancedTab.tab.style.color = "red";
      this._uiField.setCustomValidity("Invalid UI Object: " + e)
      this._uiField.reportValidity()
    }

    /** General Tab */
    // nameField
    let isGeneralValid = this._nameField.validity.valid
    isGeneralValid &&= this._widthField.validity.valid
    isGeneralValid &&= this._heightField.validity.valid

    if (!this._nameField.validity.valid) {
      this._nameField.reportValidity()
    }
    // width & height fields
    if (!this._widthField.validity.valid) {
      this._widthField.reportValidity()
    }
    if (!this._heightField.validity.valid) {
      this._heightField.reportValidity()
    }

    if (!isGeneralValid) {
      generalTab.tab.style.color = "red";
    }

    /** Locations Tab */
    let isLocationsValid = true;
    // n/a


    /** Finish Validation */
    let isValid = isGeneralValid && isAdvancedValid && isLocationsValid;
    if (!isValid) return

    /** Generate PlayMeta */
    const singleEmojiElem = this.shadowRoot!.getElementById("space-unicodes");
    let {surface, subMap} = this.generateSurface();
    // - Misc.
    this._currentMeta.ui = ui
    this._currentMeta.subMap = subMap
    // - Marker
    this._currentMeta.markerType = MarkerType[this.determineMarkerType() as keyof typeof MarkerType];
    this._currentMeta.singleEmoji = singleEmojiElem? singleEmojiElem.innerText: "";
    // - Tag
    this._currentMeta.multi = this._multiChk.checked;
    this._currentMeta.predefinedTags = this._predefinedTagsField.value.split(",")
    /** Create and share new Play */
    const newSpaceEh = await this._store.newSpace({
        name: this._nameField.value,
        origin: this._templateField.value,
        surface,
        maybeMarkerPiece: this._currentMarker,
        meta: this._currentMeta
      });
    // - Notify parent
    this.dispatchEvent(new CustomEvent('space-added', { detail: newSpaceEh, bubbles: true, composed: true }));
    // - Clear all fields
    // this.resetAllFields();
    // - Close dialog
    const dialog = this.shadowRoot!.getElementById("space-dialog") as Dialog;
    dialog.close()
  }


  /**
   *
   */
  resetAllFields(canResetName?: boolean) {
    let generalTab = this.shadowRoot!.getElementById("general-tab") as SlTab;
    let locationsTab = this.shadowRoot!.getElementById("locations-tab") as SlTab;
    let advancedTab = this.shadowRoot!.getElementById("advanced-tab") as SlTab;
    generalTab.tab.style.color = "grey";
    locationsTab.tab.style.color = "grey";
    advancedTab.tab.style.color = "grey";

    // set first tab
    let tabGroup = this.shadowRoot!.getElementById("space-tab-group") as SlTabGroup;
    tabGroup.setActiveTab(generalTab);

    if (canResetName === undefined || canResetName) this._nameField.value = ''
    this._currentMeta = defaultPlayMeta()
    // - Surface
    for (let placeholder of this._currentPlaceHolders) {
      let field = this.shadowRoot!.getElementById(placeholder + '-gen') as TextField;
      // console.log('field ' + placeholder + ' - ' + field.value)
      field.value = ''
    }
    this._widthField.value = ''
    this._heightField.value = ''
    this._uiField.value = '[]'
    // - Marker
    this._markerTypeField.value = MarkerType[MarkerType.Avatar]
    this._multiChk.checked = false;
    // - Tags
    this._tagChk.checked = false;
    this.tagChkLabel.label = "Display tag on surface";
    this._tagChk.disabled = false;
    this._tagVisibleChk.checked = false;
    this._predefinedTagsField.value = ''
  }

  /**
   *
   */
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
    this.resetAllFields(false);
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
    /** Html/SVG/JS */
    let surface: any = JSON.parse(this._currentTemplate!.surface);
    let code: string = "";
    if (surface.svg) code = surface.svg;
    if (surface.html) code = surface.html;
    if (surface.canvas) code = surface.canvas;

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
    if (surface.svg) surface.svg = code;
    if (surface.html) surface.html = code ;
    if (surface.canvas) surface.canvas = code;

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
    if (!this._currentTemplate || this._currentTemplate.surface === "") {
      return html``
    }

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
    var code;
    if (surface.svg) code = surface.svg;
    if (surface.html) code = surface.html;
    if (surface.canvas) code = surface.canvas;

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
      console.info('No variable found in template');
    }
    this._currentPlaceHolders = Array.from(names)
    // - Generate textField for each placeholder
    return html`${this._currentPlaceHolders.map((name)=> html`
      <mwc-textfield outlined id="${name}-gen" label="${name}" value="" @input="${name==='ImageUrl'?this.handleImageUrlField:null}"></mwc-textfield>`
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


  renderMarkerTypePreview(markerType: MarkerType) {
    let locMeta: LocationMeta = defaultLocationMeta();
    locMeta.markerType = markerType;
    locMeta.img = "42"; // FIXME
    switch (markerType) {
      case MarkerType.EmojiGroup:
        locMeta.emoji = "⚽️";
        break
      case MarkerType.AnyEmoji:
        locMeta.emoji = "😀";
        break
      case MarkerType.SingleEmoji:
      default:
        locMeta.emoji = "♥️";
        break;
    }
    locMeta.color = "blue";
    locMeta.authorName = "(none)";
    return html `<div id="marker-preview" class="location-marker">${renderMarker(locMeta, false)}</div>`
  }


  renderSurfacePreview() {
    if (!this._currentTemplate || this._currentTemplate.surface === "") {
      return html``
    }
    let {surface, _subMap}: any = this.generateSurface();
    const ratio: number = (surface.size && surface.size.x > 0)? surface.size.y / surface.size.x : 1;
    const w: number = 200;
    const h: number = 200 * ratio;
    let uiItems = html ``;
    try {
      const ui = JSON.parse(this._uiField.value);
      uiItems = this._uiField ? renderUiItems(ui, w / surface.size.x, h / surface.size.y) : html``;
    } catch (e) {
      console.warn("Failed to parse uiField. Could be empty");
      //console.error(e)
    }
    var preview;
    if (surface.html) {
      preview =
        html`
          ${uiItems}
          <div style="width: ${w}px; height: ${h}px; margin-bottom:5px;" id="surface-preview-div">
            ${unsafeHTML(surface.html)}
          </div>
        `;
    }
    if (surface.svg) {
      preview = html`
        <svg xmlns="http://www.w3.org/2000/svg"
             width="${w}px"
             height="${h}px"
             viewBox="0 0 ${surface.size.x} ${surface.size.y}"
             preserveAspectRatio="none"
             id="surface-preview-svg">
          ${uiItems}
          ${unsafeSVG(surface.svg)}
        </svg>`
      ;
    }
    if (surface.canvas) {
      this._canvas = surface.canvas;
      preview = html`
      <canvas id="preview-canvas" width="${w}" height="${h}"
              style="border:1px solid #324acb;">`
    }
    return html`${preview}`
  }

  handleCanTagClick(e: any) {
    this._currentMeta.canTag = !this._currentMeta.canTag;
    this._tagVisibleChk.disabled = !this._currentMeta.canTag;
    this.requestUpdate()
  }

  handleCanTagBeVisibleClick(e: any) {
    this._currentMeta.tagVisible = !this._currentMeta.tagVisible;
    this.requestUpdate()
  }

  handleCanModifyPastClick(e: any) {
    this._currentMeta.canModifyPast = !this._currentMeta.canModifyPast;
    this.requestUpdate()
  }

  handleIterationTypeChange(e: any) {
    const oneIterationRadio = this.shadowRoot!.getElementById("no-stop-radio") as Radio;
    const manyIterationRadio = this.shadowRoot!.getElementById("fixed-stop-radio") as Radio;
    if (oneIterationRadio.checked) {
      this._currentMeta.sessionCount = 0
    } else {
      this._currentMeta.sessionCount = manyIterationRadio!.checked ? parseInt(manyIterationRadio.value) : -parseInt(manyIterationRadio.value);
    }
    this.requestUpdate()
  }

  handleMarkerTypeSelect(e: any) {
    //console.log({e})
    this._tagChk.disabled = false;
    this._tagVisibleChk.disabled = !this._currentMeta.canTag;
    this.tagChkLabel.label = "Display tag on surface"

    switch(this._markerTypeField.value) {
      case MarkerType[MarkerType.Tag]:
        this._currentMeta.canTag = true;
        this._currentMeta.tagVisible = true;
        this._tagChk.checked = true;
        this._tagChk.disabled = true;
        this._tagVisibleChk.checked = true;
        this._tagVisibleChk.disabled = true;
        this.tagChkLabel.label = "Display tag on surface (Tag Marker type selected)"
        break;
      case MarkerType[MarkerType.SvgMarker]:
        if (Object.keys(this._svgMarkers.value)[0]) {
          this._currentMarker = {svg: Object.keys(this._svgMarkers.value)[0]};
        }
        break;
      case MarkerType[MarkerType.EmojiGroup]:
        if (Object.keys(this._emojiGroups.value)[0]) {
          this._currentMarker = {svg: Object.keys(this._emojiGroups.value)[0]};
        }
        break;
      default:
        break;
    }
    this.requestUpdate()
  }

  handleEmojiGroupSelect(e?: any) {
    console.log("handleEmojiGroupSelect")
    //console.log({e})
    //const selectedName = e.explicitOriginalTarget.value;
    let emojiGroupField = this.shadowRoot!.getElementById("emoji-group-field") as Select;
    //console.log({emojiGroupField})
    const selectedName = emojiGroupField.value;
    console.log("selectedName: " + selectedName)
    if (!selectedName || selectedName == "") {
      return;
    }
    /** Build emoji list */
    //const maybeEmojiGroupSelector = this.shadowRoot!.getElementById("emoji-group-field") as Select;
    let unicodes = ""
    // FIXME: should retrieve group by eh instead of name
    for (const [eh, group] of Object.entries(this._emojiGroups.value)) {
      if (group.name == selectedName) {
        unicodes = group.unicodes.reduce((prev, cur, idx) => prev += cur);
        this._currentMarker = {emojiGroup: eh};
        break;
      }
    }
    //const emojiGroup: EmojiGroupEntry = this._emojiGroups.value[maybeEmojiGroupSelector.value];
    console.log("unicodes string: " + unicodes)
    let unicodeContainer = this.shadowRoot!.getElementById("space-unicodes");
    unicodeContainer!.innerHTML = unicodes
  }

  handleSvgMarkerSelect(e?: any) {
    console.log("handleSvgMarkerSelect")
    //console.log({e})
    //const selectedName = e.explicitOriginalTarget.value;
    const selectedName = e.currentTarget.value;
    console.log("selectedName: " + selectedName)
    if (!selectedName || selectedName == "") {
      return;
    }

    //let container = this.shadowRoot!.getElementById("svg-marker-container");
    //container!.innerHTML = ""

    /** Find svg marker and set to preview */
    // FIXME: should retrieve svgMarker by eh instead of name
    for (const [eh, svgMarker] of Object.entries(this._svgMarkers.value)) {
      if (svgMarker.name == selectedName) {
        // console.log("svg marker found: " + selectedName)
        this._currentMarker = {svg: eh};
        break;
      }
    }
  }

  async openEmojiDialog(emoji: string | undefined) {
    const dialog = this.emojiDialogElem;
    dialog.clearAllFields();
    dialog.open(emoji);
    if (emoji) {
      dialog.loadPreset(emoji);
    }
  }

  async openEmojiGroupDialog(groupEh: EntryHashB64 | null) {
    let group = undefined;
    if (groupEh) {
      group = this._emojiGroups.value[groupEh]
    }
    const dialog = this.emojiGroupDialogElem;
    dialog.clearAllFields();
    dialog.open(group);
    if (group) {
      dialog.loadPreset(group);
    }
  }

  async openSvgMarkerDialog(eh: EntryHashB64 | null) {
    let svgMarker = undefined;
    if (eh) {
      svgMarker = this._svgMarkers.value[eh]
    }
    const dialog = this.svgMarkerDialogElem;
    dialog.clearAllFields();
    dialog.open(svgMarker);
    if (svgMarker) {
      dialog.loadPreset(svgMarker);
    }
  }


  /** */
  render() {
    /** Determine currentTemplate */
    if (!this._currentTemplate || this._currentTemplate.surface === "") {
      let firstTemplate = Object.keys(this._templates.value)[0];
      //console.log(firstTemplate)
      this._currentTemplate = this._templates.value[firstTemplate]? this._templates.value[firstTemplate] : null
      //console.log("_currentTemplate: " + (this._currentTemplate? this._currentTemplate.name : "none"))
    }
    let selectedTemplateUi = this.renderTemplateFields()
    //console.log({selectedTemplateUi})

    const boxExample = `{ "box": {"left": 100, "top": 10, "width": 100, "height": 50},
      "style": "background-color:white;border-radius:10px;",
      "content": "Land of the Lost"}`

    /** Render emoji picker/selector */
    let color = "blue";
    let maybeMarkerTypeItems = html ``
    const markerType: MarkerType = MarkerType[this.determineMarkerType() as keyof typeof MarkerType];
    let marker_eh: EntryHashB64 | null = null;
    switch (markerType) {
      case MarkerType.SingleEmoji:
        let emoji = this._currentMeta.singleEmoji != "" ? this._currentMeta.singleEmoji : "😀";
        maybeMarkerTypeItems = html`
            <span id="space-unicodes" style="margin-top:20px;font-size:${EMOJI_WIDTH}px;display:inline-flex;">${emoji}</span>
            <mwc-icon-button icon="edit" style="margin-top:10px;" @click=${() => this.openEmojiDialog(this._currentMeta.singleEmoji)}></mwc-icon-button>
          <!-- <details style="margin-top:10px;">
            <summary>Select Emoji</summary>
            <emoji-picker id="emoji-picker" class="light" style="height: 400px;"></emoji-picker>
           </details> -->
        `
        break;
      case MarkerType.EmojiGroup:
        marker_eh = (this._currentMarker as EmojiGroupVariant).emojiGroup;
        /** Build group list */
        console.log("** Building emoji group field:")
        const groups = Object.entries(this._emojiGroups.value).map(
          ([key, emojiGroup]) => {
            console.log({emojiGroup})
            return html`
                     <mwc-list-item class="emoji-group-li" value="${emojiGroup.name}" .selected=${key == marker_eh}>
                       ${emojiGroup.name}
                     </mwc-list-item>
                   `
          }
        )
        /** Get current unicodes */
        let unicodes = ""
        if (this._currentMarker && "emojiGroup" in this._currentMarker) {
          const currentGroup = this._emojiGroups.value[this._currentMarker.emojiGroup];
          unicodes = currentGroup.unicodes.reduce((prev, cur, idx) => prev += cur);
        }
        /** Render */
        maybeMarkerTypeItems = html`
          <mwc-icon-button icon="add_circle" style="margin-top:10px;" @click=${() => this.openEmojiGroupDialog(null)}></mwc-icon-button>
          <mwc-icon-button icon="edit" style="margin-top:10px;" @click=${() => this.openEmojiGroupDialog(marker_eh)}></mwc-icon-button>
          <mwc-select id="emoji-group-field" required style="" label="${msg('Subset')}" @closing=${(e:any)=>{e.stopPropagation(); this.handleEmojiGroupSelect(e)}}>
            ${groups}
          </mwc-select>
          <!-- Display Unicode List / Grid -->
          <!-- <div style="min-height:40px;"> -->
            <div id="space-unicodes" class="unicodes-container" style="font-size:28px;margin-top:10px;padding-top:8px;padding-bottom:2px">${unicodes}</div>
          <!-- </div> -->
        `
        break;

      case MarkerType.SvgMarker:
        marker_eh = (this._currentMarker as SvgMarkerVariant).svg;
        /** Build marker list */
        if ((!this._currentMarker || "emojiGroup" in this._currentMarker) && Object.keys(this._svgMarkers.value).length > 0) {
          this._currentMarker = {svg: Object.keys(this._svgMarkers.value)[0]};
        }
        const markers = Object.entries(this._svgMarkers.value).map(
          ([key, svgMarker]) => {
            // console.log(" - " + svgMarker.name + ": " + key)
            let currentMarker = renderSvgMarker(svgMarker.value, color)
            return html`
                     <mwc-list-item class="svg-marker-li" value="${svgMarker.name}" .selected=${key == marker_eh}>
                       ${svgMarker.name}
                       ${currentMarker}
                     </mwc-list-item>
                   `
          }
        )
        /** Get current unicodes */
        let selectedMarker = html``;
        if (this._currentMarker && "svg" in this._currentMarker) {
          const marker = this._svgMarkers.value[this._currentMarker?.svg]
          //console.log({marker})
          selectedMarker = renderSvgMarker(marker.value, color)
        }
        /** Render */
        maybeMarkerTypeItems = html`
          <mwc-icon-button icon="add_circle" style="margin-top:10px;" @click=${() => this.openSvgMarkerDialog(null)}></mwc-icon-button>
          <mwc-icon-button icon="edit" style="margin-top:10px;" @click=${() => this.openSvgMarkerDialog(marker_eh)}></mwc-icon-button>
          <mwc-select id="svg-marker-field" required style="display:inline-flex;width:230px;" label="${msg('Name')}" @closing=${(e:any)=>{e.stopPropagation(); this.handleSvgMarkerSelect(e)}}>
            ${markers}
          </mwc-select>
          <div id="svg-marker-container">${selectedMarker}</div>
        `
        break;

      default:
        break;
    }

    /** Main Render */
    return html`
<mwc-dialog id="space-dialog" heading="${msg('NEW SPACE')}" @closing=${this.handleDialogClosing} @opened=${this.handleDialogOpened}>
  <sl-tab-group id="space-tab-group">
    <sl-tab id="general-tab" slot="nav" panel="general">${msg('GENERAL')}</sl-tab>
    <sl-tab id="locations-tab" slot="nav" panel="locations">${msg('LOCATIONS')}</sl-tab>
    <sl-tab id="advanced-tab" slot="nav" panel="advanced">${msg('ADVANCED')}</sl-tab>

  <!-- Name & Surface -->
  <sl-tab-panel name="${msg('general')}">
    <div id="thumbnail">
      ${this.renderSurfacePreview()}
      <mwc-button dense unelevated style="display:block;margin-left:45px;margin-bottom:20px;" @click=${this.handlePreview}>${msg('preview')}</mwc-button>
      <mwc-textfield id="width-field"  class="rounded" outlined pattern="[0-9]+" minlength="3" maxlength="4" label="${msg('Width')}" autoValidate=true required></mwc-textfield>
      <mwc-textfield id="height-field" class="rounded" outlined pattern="[0-9]+" minlength="3" maxlength="4" label="${msg('Height')}" autoValidate=true required></mwc-textfield>
    </div>
    <mwc-textfield outlined dialogInitialFocus type="text"
                   @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
                   id="name-field" minlength="3" maxlength="64" label="${msg('Name')}" autoValidate=true required></mwc-textfield>
    <!-- Template/Surface -->
      <!-- <h4 style="margin-bottom: 15px;">Surface</h4> -->
    <mwc-select fixedMenuPosition required id="template-field" label="${msg('Template')}" @select=${this.handleTemplateSelect}  @closing=${(e:any)=>e.stopPropagation()}>
        ${Object.entries(this._templates.value).map(
          ([key, template]) => html`
          <mwc-list-item
            @request-selected=${() => this.handleTemplateSelect(key)}
            .selected=${this._templates.value[key].name === this._currentTemplate!.name}
            value="${key}"
            >${template.name}
          </mwc-list-item>
        `)}
    </mwc-select>
    <div style="max-height: 375px;display:block;overflow-y: auto;padding-right:1px;">
    ${selectedTemplateUi}
    </div>
  </sl-tab-panel>
  <!--  Marker -->
  <sl-tab-panel name="${msg('locations')}">
    <h4 style="margin-top:15px;margin-bottom:10px;">${msg('Marker')}</h4>
    <mwc-select label="${msg('Type')}" id="marker-select" required @closing=${(e:any)=>{e.stopPropagation(); this.handleMarkerTypeSelect(e)}}>
      <mwc-list-item selected value="${MarkerType[MarkerType.Avatar]}">${msg('Avatar')} ${this.renderMarkerTypePreview(MarkerType.Avatar)}</mwc-list-item>
      <mwc-list-item value="${MarkerType[MarkerType.Initials]}">${msg('Initials')} ${this.renderMarkerTypePreview(MarkerType.Initials)}</mwc-list-item>
      <mwc-list-item value="${MarkerType[MarkerType.SvgMarker]}">${msg('Colored SVG')} ${this.renderMarkerTypePreview(MarkerType.SvgMarker)}</mwc-list-item>
      <mwc-list-item value="${MarkerType[MarkerType.SingleEmoji]}">${msg('Predefined Emoji')} ${this.renderMarkerTypePreview(MarkerType.SingleEmoji)}</mwc-list-item>
      <mwc-list-item value="${MarkerType[MarkerType.EmojiGroup]}">${msg('Emoji subset')} ${this.renderMarkerTypePreview(MarkerType.EmojiGroup)}</mwc-list-item>
      <mwc-list-item value="${MarkerType[MarkerType.AnyEmoji]}">${msg('Any Emoji')} ${this.renderMarkerTypePreview(MarkerType.AnyEmoji)}</mwc-list-item>
      <mwc-list-item value="${MarkerType[MarkerType.Tag]}">${msg('Tag')} ${this.renderMarkerTypePreview(MarkerType.Tag)}</mwc-list-item>
    </mwc-select>
    ${maybeMarkerTypeItems}
    <mwc-formfield label="${msg('Allow multiple markers per user')}" style="margin-top:10px">
      <mwc-checkbox id="multi-chk"></mwc-checkbox>
    </mwc-formfield>
    <!-- Tags -->
    <h4 style="margin-top:25px;margin-bottom:10px;">Tagging</h4>
    <mwc-formfield label="${msg('Enable marker tagging')}">
      <mwc-checkbox id="tag-chk" @click=${this.handleCanTagClick}></mwc-checkbox>
    </mwc-formfield>
    <mwc-formfield id="tag-chk-lbl" label="${msg('Display tag on surface')}" style="margin-left:10px">
      <mwc-checkbox id="tag-visible-chk" @click=${this.handleCanTagBeVisibleClick}></mwc-checkbox>
    </mwc-formfield>
    </mwc-formfield>
    <mwc-textfield outlined style="margin-left:25px" type="text" .disabled="${!this._currentMeta.canTag}"
                   id="predefined-tags-field" label="${msg('Predefined tags')}"  helper="${msg('comma separated text')}" autoValidate=true>
    </mwc-textfield>
  </sl-tab-panel>
  <!-- UI BOX -->
  <sl-tab-panel name="advanced">
      <!-- <details style="margin-top:10px;"> -->
      <h4 style="margin-top:15px">${msg('Extra UI elements')}</h4>
      <mwc-textarea type="text" @input=${() => (this.shadowRoot!.getElementById("ui-field") as TextArea).reportValidity()}
                    id="ui-field" value="[]" helper="${msg('Array of \'Box\' objects')}. ${msg('Example')}: ${boxExample}" rows="15" cols="60">
      </mwc-textarea>
    <!-- </details> -->
  </sl-tab-panel>
  </sl-tab-group>

  <!-- Dialog buttons -->
  <mwc-button id="primary-action-button" raised slot="primaryAction" @click=${this.handleOk}>${msg('ok')}</mwc-button>
  <mwc-button slot="secondaryAction"  dialogAction="cancel">${msg('cancel')}</mwc-button>
    <!--<mwc-button slot="secondaryAction" @click=${this.handlePreview}>${msg('preview')}</mwc-button>-->
  <!-- Inner dialogs -->
  <where-emoji-dialog id="emoji-dialog" @emoji-selected=${(e:any) => this.handleEmojiSelected(e.detail)}></where-emoji-dialog>
  <where-emoji-group-dialog id="emoji-group-dialog" .store="${this._store}" @emoji-group-added=${(e:any) => this.handleGroupAdded(e.detail)}></where-emoji-group-dialog>
  <where-svg-marker-dialog id="svg-marker-dialog" .store="${this._store}" @svg-marker-added=${(e:any) => this.handleSvgMarkerAdded(e.detail)}></where-svg-marker-dialog>
</mwc-dialog>
`
  }


  /**
   */
  handleEmojiSelected(emoji: string) {
    console.log("handleEmojiSelected(): " + emoji)
    this._currentMeta.singleEmoji = emoji;
    this.requestUpdate()
  }

  handleGroupAdded(eh: EntryHashB64) {
    this._currentMarker = {emojiGroup: eh};
    const emojiGroup = this._emojiGroups.value[eh];
    const unicodes = emojiGroup.unicodes.reduce((prev, cur, idx) => prev += cur);
    let unicodeContainer = this.shadowRoot!.getElementById("space-unicodes");
    unicodeContainer!.innerHTML = unicodes
    let emojiGroupField = this.shadowRoot!.getElementById("emoji-group-field") as Select;
    console.log({emojiGroupField})
    //console.log("handleGroupAdded")
    emojiGroupField.select(emojiGroupField.children.length - 1);
  }

  handleSvgMarkerAdded(eh: EntryHashB64) {
    this._currentMarker = {svg: eh};
    //const svgMarker = this._svgMarkers.value[eh];
    //let svgMarkerContainer = this.shadowRoot!.getElementById("svg-marker-container");
    //svgMarkerContainer!.innerHTML = svgMarker.value
    let svgMarkerField = this.shadowRoot!.getElementById("svg-marker-field") as Select;
    console.log({svgMarkerField})
    // Select last one
    svgMarkerField.select(svgMarkerField.children.length - 1);
  }


  static get scopedElements() {
    return {
      'sl-avatar': SlAvatar,
      'sl-tab-group': SlTabGroup,
      'sl-tab': SlTab,
      'sl-tab-panel': SlTabPanel,
      "mwc-select": Select,
      "mwc-list-item": ListItem,
      "mwc-button": Button,
      "mwc-icon-button": IconButton,
      "mwc-dialog": Dialog,
      "mwc-textfield": TextField,
      "mwc-textarea": TextArea,
      "mwc-formfield": Formfield,
      "mwc-checkbox": Checkbox,
      "mwc-radio": Radio,
      "mwc-tab": Tab,
      "mwc-tab-bar": TabBar,
      "where-emoji-group-dialog" : WhereEmojiGroupDialog,
      "where-emoji-dialog" : WhereEmojiDialog,
      "where-svg-marker-dialog" : WhereSvgMarkerDialog,
      "emoji-picker": customElements.get('emoji-picker'),
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          /* disables the active color of tab */
          --sl-color-primary-600: red;
        }
        emoji-picker {
          width: auto;
          /*--category-emoji-size: 1.125rem;*/
        }
        sl-tab::part(base) {
          /*color: rgb(110, 20, 239);*/
        }
        sl-tab-panel {
          --padding: 0px;
          min-height: 500px;
        }
        sl-tab-group {
          --indicator-color: rgb(110, 20, 239);
        }
        .svg-marker-li {
          line-height: 0;
        }
        #svg-marker-container {
          display: inline-flex;
          margin-top: 10px;
          /*padding: 4px;*/
          /*background-color: whitesmoke;*/
          /*border: 1px solid gray;*/
          min-width: 40px;
          min-height: 40px;
        }
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
          display: block;
          margin-top: 10px;
        }
        #surface-preview-svg,
        #surface-preview-div {
          border: 1px solid grey;
          background-color: rgb(252, 252, 252);
          max-height: 202px;
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
          width: 6.2em;
        }

        mwc-list-item {
          height: 50px;
          line-height: 40px;
        }

        #marker-select {
          margin-top: 5px;
          display: inline-flex;
          min-width: 230px;
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
