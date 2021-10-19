import {html} from "lit";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {unsafeSVG} from "lit/directives/unsafe-svg.js";
import {Dictionary, MarkerType, TemplateEntry} from "./types";

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

export function renderUiItems(ui: string, zx: number, zy: number) {
  let uiItems = html``
  try {
    uiItems = JSON.parse(ui).map((item: any) => {
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
    });
  } catch (e) {
    console.error("Invalid meta.ui: " + e)
  }
  return uiItems
}


export function renderSurface(surface: any, w: number, h: number) {
  return surface.html?
    html`<div style="width: ${w}px; height: ${h}px;" >
        ${unsafeHTML(surface.html)}
      </div>`
    : html`<svg xmlns="http://www.w3.org/2000/svg"
                  width="${w}px"
                  height="${h}px"
                  viewBox="0 0 ${surface.size.x} ${surface.size.y}"
                  preserveAspectRatio="none">
          ${unsafeSVG(surface.svg)}
        </svg>`
    ;
}


export function renderTemplate(template: TemplateEntry) {
  if (template.surface === "") {
    return html``
  }
  let surface: any = JSON.parse(template.surface);
  const ratio: number = surface.size? surface.size.y / surface.size.x : 1;
  const w: number = 200;
  const h: number = 200 * ratio;
  const preview = surface.html?
    html`
        <div style="width: ${w}px; height: ${h}px;" id="surface-preview-div">
            ${unsafeHTML(surface.html)}
        </div>`
    : html`<svg xmlns="http://www.w3.org/2000/svg"
                  width="${w}px"
                  height="${h}px"
                  viewBox="0 0 ${surface.size.x} ${surface.size.y}"
                  preserveAspectRatio="none"
                  id="surface-preview-svg">
          ${unsafeSVG(surface.svg)}
        </svg>`
  ;
  return html`${preview}`
}


export function renderMarker(locMeta: Dictionary<string>) {
  let marker;
  //console.log("locMeta.markerType: " + locMeta.markerType)
  switch (locMeta.markerType) {
    case MarkerType[MarkerType.Avatar]:
      // Use an image url if stored in the Location, otherwise use the agent's avatar
      let img = locMeta.img
      if (img === "") {
        img = 'https://miro.medium.com/max/720/1*W35QUSvGpcLuxPo3SRTH4w.png'
      }
      marker = html`<img src="${img}" style="width:inherit;">`
      break;
    case MarkerType[MarkerType.Color]:
      marker = html`<span class="marker-bg" style="background-color: ${locMeta.color}"></span>`
      break;
    case MarkerType[MarkerType.Emoji]:
      marker = html`<div class='emoji-marker'>${locMeta.emoji}</div>`
      break;
    case MarkerType[MarkerType.Letter]:
      marker = html`<span class="letter-marker">${getInitials(locMeta.name)}</span>`
      break;
    default:
      break;
  }
  //console.log({marker})
  return marker;
}
