import {html, svg} from "lit";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {unsafeSVG} from "lit/directives/unsafe-svg.js";
import {Dictionary, LocationMeta, MarkerType, Play, SvgMarkerEntry, TemplateEntry, UiItem} from "./types";
import {SlAvatar} from "@scoped-elements/shoelace";

export const MARKER_WIDTH = 40;
export const EMOJI_WIDTH  = 32;

export const delay = (ms:number) => new Promise(r => setTimeout(r, ms))

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


export function renderMarker(locMeta: LocationMeta, isMe: boolean) {
  let marker;
  const classes = isMe? "me" : "";
  const myStyle = `background-color:${locMeta.color}; border:${locMeta.color} 2px solid`;

  //console.log("locMeta.markerType: " + locMeta.markerType)
  //console.log({locMeta})
  switch (locMeta.markerType) {
    case MarkerType.Avatar:
      // Use an image url if stored in the Location, otherwise use the agent's avatar
      if (locMeta.img === "") {
        marker = html`<sl-avatar class=${classes} style=${myStyle}><div slot="icon"></div></sl-avatar>`
      } else {
        marker = html`<sl-avatar class=${classes} .image=${locMeta.img} style=${myStyle}><div slot="icon"></div></sl-avatar>`
      }
      break;
    case MarkerType.SvgMarker:
      //const pin = render_pin(locMeta.color)
      const svgMarker = renderSvgMarker(locMeta.svgMarker, locMeta.color)
      marker = html`<div class="svg-marker">${svgMarker}</div>`
      break;
    case MarkerType.SingleEmoji:
    case MarkerType.EmojiGroup:
    case MarkerType.AnyEmoji:
      //marker = html `<sl-avatar class="${classes} emoji-marker" initials=${locMeta.emoji}></sl-avatar>`
      marker = html `<div class="emoji-marker">${locMeta.emoji}</div>`
      break;
    case MarkerType.Initials:
      marker = html `<sl-avatar class="${classes} initials-marker" initials=${getInitials(locMeta.authorName)}></sl-avatar>`
      break;
    case MarkerType.Tag:
    default:
      break;
  }
  //console.log({marker})
  return marker;
}


export function renderSurface(play: Play, w: number, h: number) {
  const surface = play.space.surface;
  //html
  if (surface.html) {
    return html`<div style="width: ${w}px; height: ${h}px;" >
        ${unsafeHTML(surface.html)}
      </div>`
  }
  // svg
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
    <canvas id="${play.space.name}-canvas" width="${w}" height="${h}"
            style="border:1px solid #2278da;">`
}

export function renderSvgMarker(svgStr: string, color: string) {
  if (svgStr === "") {
    return html``
  }
  //console.log("renderSvgMarker: " + svgMarker.value);

  try {
    let pattern = "%%color%%";
    var regex = new RegExp(pattern, "g");
    svgStr = svgStr.replace(regex, color);
  } catch (e) {}

  var preview = html`
      <svg xmlns="http://www.w3.org/2000/svg"
           width="${MARKER_WIDTH}px"
           height="${MARKER_WIDTH}px"
           viewBox="0 0 64 64"
           preserveAspectRatio="none"
           >
        ${unsafeSVG(svgStr)}
      </svg>`
  ;

  return preview
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
