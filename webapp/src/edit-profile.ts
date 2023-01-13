import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import {
  Button,
  Fab,
  IconButton,
  TextField,
} from '@scoped-elements/material-web';
import { SlAvatar } from '@scoped-elements/shoelace';
import { html, css, LitElement } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { localized, msg, str } from '@lit/localize';
import {WhereProfile} from "@where/elements/dist/viewModels/profiles.proxy";


// Crop the image and return a base64 bytes string of its content
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
export class EditProfile extends ScopedElementsMixin(LitElement) {
  /**
   * The profile to be edited.
   */
  @property({ type: Object })
  profile: WhereProfile | undefined;

  /**
   * Label for the save profile button.
   */
  @property({ type: String, attribute: 'save-profile-label' })
  saveProfileLabel: string | undefined;

  /** Dependencies */

  @property()
  avatarMode: string;

  @property({ type: Boolean })
  allowCancel = false;

  /** Private properties */

  @query('#nickname-field')
  private _nicknameField!: TextField;

  private _existingUsernames: { [key: string]: boolean } = {};

  @query('#avatar-file-picker')
  private _avatarFilePicker!: HTMLInputElement;

  @state()
  private _avatar: string | undefined;

  firstUpdated() {
    this._avatar = this.profile?.fields['avatar'];

    this._nicknameField.validityTransform = (newValue: string) => {
      this.requestUpdate();
      if (newValue.length < 3) {
        this._nicknameField.setCustomValidity(msg(`Nickname is too short`));
        return {
          valid: false,
        };
      } else if (this._existingUsernames[newValue]) {
        this._nicknameField.setCustomValidity(
          msg('This nickname already exists')
        );
        return { valid: false };
      }

      return {
        valid: true,
      };
    };
  }

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

  hasAvatarMode() {
    return (
      this.avatarMode === 'avatar-required' ||
      this.avatarMode === 'avatar-optional'
    );
  }

  renderAvatar() {
    if (!this.hasAvatarMode()) {
      return html``;
    }
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
              <span class="placeholder label">Avatar</span>
            </div>`}
      </div>
    `;
  }

  shouldSaveButtonBeEnabled() {
    if (!this._nicknameField) return false;
    if (!this._nicknameField.validity.valid) return false;
    if (this.avatarMode === 'avatar-required' && !this._avatar)
      return false;
    if (
      Object.values(this.getAdditionalTextFields()).find(t => !t.validity.valid)
    )
      return false;

    return true;
  }

  textfieldToFieldId(field: TextField): string {
    return field.id.split('-')[2];
  }

  getAdditionalFieldsValues(): Record<string, string> {
    const textfields = this.getAdditionalTextFields();

    const values: Record<string, string> = {};
    for (const [id, textfield] of Object.entries(textfields)) {
      values[id] = textfield.value;
    }

    return values;
  }

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

  fireSaveProfile() {
    const nickname = this._nicknameField.value;

    const fields: Record<string, string> = this.getAdditionalFieldsValues();
    if (this._avatar) {
      fields['avatar'] = this._avatar;
    }

    const profile: WhereProfile = {
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

  render() {
    return html`
      ${
        this.hasAvatarMode()
          ? html`<input
              type="file"
              id="avatar-file-picker"
              style="display: none;"
              @change=${this.onAvatarUploaded}
            />`
          : html``
      }
        <div class="column">

          <div class="row" style="justify-content: center; margin-bottom: 8px; align-self: start;" >
            ${this.renderAvatar()}

            <mwc-textfield
              id="nickname-field"
              outlined
              .label=${msg('Nickname')}
              .value=${this.profile?.nickname || ''}
              .helper=${msg(
                str`Min. 3 characters`
              )}
              @input=${() => this._nicknameField.reportValidity()}
              style="margin-left: 8px;"
            ></mwc-textfield>
          </div>
            
            
          <div class="row" style="margin-top: 8px;">

            ${this.allowCancel
              ? html`
              <mwc-button
                style="flex: 1; margin-right: 6px;"
                .label=${'Cancel'}
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

  /**
   * @ignore
   */
  static get scopedElements() {
    return {
      'mwc-textfield': TextField,
      'mwc-button': Button,
      'mwc-fab': Fab,
      'mwc-icon-button': IconButton,
      'sl-avatar': SlAvatar,
    };
  }

  static styles = [css`
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
