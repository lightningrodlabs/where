import {html, svg} from "lit";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {unsafeSVG} from "lit/directives/unsafe-svg.js";
import {Dictionary, MarkerType, TemplateEntry, UiItem} from "./types";
import {SlAvatar} from "@scoped-elements/shoelace";

export const MARKER_WIDTH = 40;
export const EMOJI_WIDTH  = 32;

function getInitials(nickname: string): string {
  const names = nickname.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  } else {
    initials += names[0].substring(1, 2);
  }
  return initials;
}

export function renderUiItems(ui: UiItem[], zx: number, zy: number) {
  let uiItems = html``
  try {
    for (const item of ui) {
      return html`
            <div
              class="ui-item"
              style="width: ${item.box.width * zx}px;
          height: ${item.box.height * zy}px;
          left: ${item.box.left * zx}px;
          top: ${item.box.top * zy}px;
        ${item.style}"
            >
              ${item.content}
            </div>
          `;
    };
  } catch (e) {
    console.error("Invalid meta.ui: " + e)
  }
  return uiItems
}


export function renderSurface(space: any, w: number, h: number) {
  const surface = space.surface;
  if (surface.html) {
    return html`<div style="width: ${w}px; height: ${h}px;" >
        ${unsafeHTML(surface.html)}
      </div>`
  }
  if (surface.svg) {
    return html`<svg xmlns="http://www.w3.org/2000/svg"
                  width="${w}px"
                  height="${h}px"
                  viewBox="0 0 ${surface.size.x} ${surface.size.y}"
                  preserveAspectRatio="none">
          ${unsafeSVG(surface.svg)}
        </svg>`
    ;
  }
  // canvas
  return html`
    <canvas id="${space.name}-canvas" width="${w}" height="${h}"
            style="border:1px solid #2278da;">`
}

export function renderMarker(locMeta: Dictionary<string>, isMe: boolean) {
  let marker;
  const classes = isMe? "me" : "";
  const myStyle = `background-color:${locMeta.color}; border:${locMeta.color} 2px solid`;

  //console.log("locMeta.markerType: " + locMeta.markerType)
  //console.log({locMeta})
  switch (locMeta.markerType) {
    case MarkerType[MarkerType.Avatar]:
      // Use an image url if stored in the Location, otherwise use the agent's avatar
      if (locMeta.img === "") {
        marker = html`<sl-avatar class=${classes} style=${myStyle}><div slot="icon"></div></sl-avatar>`
      } else {
        marker = html`<sl-avatar class=${classes} .image=${locMeta.img} style=${myStyle}><div slot="icon"></div></sl-avatar>`
      }
      break;
    case MarkerType[MarkerType.Color]:
      const pin = render_pin(locMeta.color)
      marker = html`<div class="pin-marker">${pin}</div>`
      break;
    case MarkerType[MarkerType.SingleEmoji]:
    case MarkerType[MarkerType.EmojiGroup]:
    case MarkerType[MarkerType.AnyEmoji]:
      //marker = html `<sl-avatar class="${classes} emoji-marker" initials=${locMeta.emoji}></sl-avatar>`
      marker = html `<div class="emoji-marker">${locMeta.emoji}</div>`
      break;
    case MarkerType[MarkerType.Letter]:
      marker = html `<sl-avatar class="${classes} initials-marker" initials=${getInitials(locMeta.name)}></sl-avatar>`
      break;
    default:
      break;
  }
  //console.log({marker})
  return marker;
}

function render_pin(color: string) {
  return svg`
<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_WIDTH}px"
                  height="${MARKER_WIDTH}px" viewBox="0 0 64 64"
aria-describedby="desc" role="img" xmlns:xlink="http://www.w3.org/1999/xlink">
<path data-name="layer1"
d="M32 2a20 20 0 0 0-20 20c0 18 20 40 20 40s20-22 20-40A20 20 0 0 0 32 2zm0 28a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"
fill="${color}"></path>
  </svg>
`;
}
