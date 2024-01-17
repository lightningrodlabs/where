import { html, css, LitElement } from 'lit';
import { property, query, state, customElement } from 'lit/decorators.js';
import { localized, msg, str } from '@lit/localize';

import "@material/mwc-textfield";
import {TextField} from "@material/mwc-textfield";
import "@material/mwc-button";
import "@material/mwc-icon-button";
import "@material/mwc-fab";

import "@shoelace-style/shoelace/dist/components/avatar/avatar.js"
import "@shoelace-style/shoelace/dist/components/color-picker/color-picker.js"
import "@shoelace-style/shoelace/dist/components/radio/radio.js"
import "@shoelace-style/shoelace/dist/components/radio-group/radio-group.js"
import {Profile as ProfileMat} from "@ddd-qc/profiles-dvm";
import {Dialog} from "@material/mwc-dialog";


/** Crop the image and return a base64 bytes string of its content */
export function resizeAndExport(img: HTMLImageElement) {
  const MAX_WIDTH = 300;
  const MAX_HEIGHT = 300;

  let width = img.width;
  let height = img.height;

  // Change the resizing logic
  if (width > height) {
    if (width > MAX_WIDTH) {
      height = height * (MAX_WIDTH / width);
      width = MAX_WIDTH;
    }
  } else {
    if (height > MAX_HEIGHT) {
      width = width * (MAX_HEIGHT / height);
      height = MAX_HEIGHT;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.drawImage(img, 0, 0, width, height);

  // return the .toDataURL of the temp canvas
  return canvas.toDataURL();
}



/**
 * @element edit-profile
 * @fires save-profile - Fired when the save profile button is clicked
 */
@localized()
@customElement("edit-profile")
export class EditProfile extends LitElement {

  /** -- Properties -- */

  /**
   * The profile to be edited.
   */
  @property({ type: Object })
  profile: ProfileMat | undefined;

  /**
   * Label for the save profile button.
   */
  @property({ type: String, attribute: 'save-profile-label' })
  saveProfileLabel: string | undefined;


  @property()
  avatarMode: string;

  @property({ type: Boolean })
  allowCancel = false;


  /** -- Private properties -- */

  @state() private _avatar: string | undefined;

  private _existingUsernames: { [key: string]: boolean } = {};


  get nicknameFieldElem() : TextField {
    return this.shadowRoot!.getElementById("nickname-field") as TextField;
  }

  @query('#avatar-file-picker')
  private _avatarFilePicker!: HTMLInputElement;


  /** -- Methods -- */

  /** */
  firstUpdated() {
    console.log("<edit-profile>.firstUpdated()", this.nicknameFieldElem);
    this._avatar = this.profile?.fields['avatar'];
    this.nicknameFieldElem.validityTransform = (newValue: string) => {
      this.requestUpdate();
      if (newValue.length < 3) {
        this.nicknameFieldElem.setCustomValidity(msg(`Nickname is too short`));
        return {
          valid: false,
        };
      } else if (this._existingUsernames[newValue]) {
        this.nicknameFieldElem.setCustomValidity(
          msg('This nickname already exists')
        );
        return { valid: false };
      }

      return {
        valid: true,
      };
    };
    /** Update otherwise save button will be disabled */
    this.requestUpdate();
  }


  /** */
  onAvatarUploaded() {
    if (this._avatarFilePicker.files && this._avatarFilePicker.files[0]) {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          this._avatar = resizeAndExport(img);
          this._avatarFilePicker.value = '';
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(this._avatarFilePicker.files[0]);
    }
  }


  /** */
  renderAvatar() {
    return html`
      <div
        style="width: 80px; height: 80px; justify-content: center;"
        class="row"
      >
        ${this._avatar
          ? html`
              <div class="column" style="align-items: center; ">
                <sl-avatar
                  image="${this._avatar}"
                  alt="Avatar"
                  style="margin-bottom: 4px; --size: 3.5rem;"
                  initials=""
                ></sl-avatar>
                <span
                  class="placeholder label"
                  style="cursor: pointer;   text-decoration: underline;"
                  @click=${() => (this._avatar = undefined)}
                  >${msg('Clear')}</span
                >
              </div>
            `
          : html` <div class="column" style="align-items: center;">
              <mwc-fab
                icon="add"
                @click=${() => this._avatarFilePicker.click()}
                style="margin-bottom: 4px;"
              ></mwc-fab>
              <span class="placeholder label">${msg('Avatar')}</span>
            </div>`}
      </div>
    `;
  }


  /** */
  shouldSaveButtonBeEnabled() {
    console.log("<edit-profile>.shouldSaveButtonBeEnabled", this.nicknameFieldElem);
    if (!this.nicknameFieldElem) return false;
    if (!this.nicknameFieldElem.validity.valid) return false;
    if (this.avatarMode === 'avatar-required' && !this._avatar)
      return false;
    if (
      Object.values(this.getAdditionalTextFields()).find(t => !t.validity.valid)
    )
      return false;

    return true;
  }


  /** */
  textfieldToFieldId(field: TextField): string {
    return field.id.split('-')[2];
  }


  /** */
  getAdditionalFieldsValues(): Record<string, string> {
    const textfields = this.getAdditionalTextFields();

    const values: Record<string, string> = {};
    for (const [id, textfield] of Object.entries(textfields)) {
      values[id] = textfield.value;
    }

    return values;
  }


  /** */
  getAdditionalTextFields(): Record<string, TextField> {
    const textfields = Array.from(
      this.shadowRoot!.querySelectorAll('mwc-textfield')
    ).filter(f => f.id !== 'nickname-field') as TextField[];

    const fields: Record<string, TextField> = {};
    for (const field of textfields) {
      const id = this.textfieldToFieldId(field);
      fields[id] = field;
    }
    return fields;
  }


  /** */
  fireSaveProfile() {
    const nickname = this.nicknameFieldElem.value;
    const fields: Record<string, string> = this.getAdditionalFieldsValues();

    /** avatar */
    if (this._avatar) {
      fields['avatar'] = this._avatar;
    }

    /** lang */
    const langRadioGroup = this.shadowRoot!.getElementById("langRadioGroup") as any;
    console.log({langRadioGroup});
    fields['lang'] = langRadioGroup.value? langRadioGroup.value : "";

    /** Color */
    const colorPicker = this.shadowRoot!.getElementById("colorPicker") as any;
    console.log({colorPicker});
    fields['color'] = colorPicker.value? colorPicker.value : "";


    const profile: ProfileMat = {
      fields,
      nickname,
    };

    this.dispatchEvent(
      new CustomEvent('save-profile', {
        detail: {
          profile,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  fireCancel() {
    this.dispatchEvent(
      new CustomEvent('cancel-edit-profile', {
        bubbles: true,
        composed: true,
      })
    );
  }


  /** */
  renderField(fieldName: string) {
    return html`
      <mwc-textfield
        id="profile-field-${fieldName}"
        outlined
        required
        autoValidate
        .validationMessage=${msg('This field is required')}
        .label=${fieldName}
        .value=${this.profile?.fields[fieldName] || ''}
        @input=${() => this.requestUpdate()}
        style="margin-top: 8px;"
      ></mwc-textfield>
    `;
  }


  /** */
  async handleColorChange(e: any) {
    console.log("handleColorChange: " + e.target.lastValueEmitted)
    //this._color = e.target.lastValueEmitted;
    //const profile = this._myProfile!;
    //await this.setMyProfile(profile.nickname, profile.fields['avatar'], color)
  }


  async handleLangChange(_e: any) {
    //console.log({langChangeEvent: e});
    const langRadioGroup = this.shadowRoot!.getElementById("langRadioGroup") as any;
    console.log({langRadioGroup})
    const lang = langRadioGroup.value;
    this.dispatchEvent(new CustomEvent('lang-selected', { detail: lang, bubbles: true, composed: true }));

  }


  /** */
  render() {
    console.log("<edit-profile> render()", this.profile);

    return html`
      <input type="file"
             id="avatar-file-picker"
             style="display: none;"
             @change=${this.onAvatarUploaded}
      />

        <div class="column">

          <div class="row" style="justify-content: center; margin-bottom: 12px; align-self: start;" >

            ${this.renderAvatar()}

            <mwc-textfield
              id="nickname-field"
              outlined
              .label=${msg('Nickname')}
              .value=${this.profile?.nickname || ''}
              .helper=${msg(
                str`Min. 3 characters`
              )}
              @input=${() => this.nicknameFieldElem.reportValidity()}
              style="margin-left: 8px;"
            ></mwc-textfield>

          </div>


          <div class="row" style="justify-content: center; margin-bottom: 18px; align-self: start;" >
              <span style="font-size:18px;padding-right:10px;padding-top:5px;">${msg('Color')}:</span>
              <sl-color-picker id="colorPicker" hoist slot="meta" size="small" noFormatToggle format='rgb'
                               @click="${this.handleColorChange}"
                               .value=${this.profile && this.profile.fields['color']? this.profile.fields['color']: ""}>
              </sl-color-picker>
          </div>

          <div class="row" style="justify-content: center; margin-bottom: 8px; align-self: start;" >
              <span style="font-size:18px;padding-right:10px;">${msg('Language')}:</span>
              <sl-radio-group id="langRadioGroup" @click=${this.handleLangChange} .value=${this.profile?.fields['lang']}>
                  <sl-radio value="en">🇬🇧</sl-radio>
                  <sl-radio value="fr-fr">🇫🇷</sl-radio>
              </sl-radio-group>
          </div>

          <div class="row" style="margin-top: 8px;">

            ${this.allowCancel
              ? html`
              <mwc-button
                style="flex: 1; margin-right: 6px;"
                .label=${msg('Cancel')}
                @click=${() => this.fireCancel()}
              ></mwc-button>
              `
              : html``
            }

            <mwc-button
              style="flex: 1;"
              raised
              .disabled=${!this.shouldSaveButtonBeEnabled()}
              .label=${this.saveProfileLabel ?? msg('Save Profile')}
              @click=${() => this.fireSaveProfile()}
            ></mwc-button>

          </div>

        </div>
      </mwc-card>
    `;
  }


  static styles = [css`

    sl-radio {
      font-size: larger;
    }

    .row {
      display: flex;
      flex-direction: row;
    }
    .column {
      display: flex;
      flex-direction: column;
    }
    .small-margin {
      margin-top: 6px;
    }
    .big-margin {
      margin-top: 23px;
    }

    .fill {
      flex: 1;
      height: 100%;
    }

    .title {
      font-size: 20px;
    }

    .center-content {
      align-items: center;
      justify-content: center;
    }

    .placeholder {
      color: rgba(0, 0, 0, 0.7);
    }

    .label {
      color: var(--mdc-text-field-label-ink-color, rgba(0, 0, 0, 0.6));
      font-family: var(
              --mdc-typography-caption-font-family,
              var(--mdc-typography-font-family, Roboto, sans-serif)
      );
      font-size: var(--mdc-typography-caption-font-size, 0.79rem);
      font-weight: var(--mdc-typography-caption-font-weight, 400);
    }

    .flex-scrollable-parent {
      position: relative;
      display: flex;
      flex: 1;
    }

    .flex-scrollable-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .flex-scrollable-x {
      max-width: 100%;
      overflow-x: auto;
    }
    .flex-scrollable-y {
      max-height: 100%;
      overflow-y: auto;
    }`];
}
