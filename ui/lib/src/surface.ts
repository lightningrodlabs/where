import {html} from "lit";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {unsafeSVG} from "lit/directives/unsafe-svg.js";
import {TemplateEntry} from "./types";


export function renderTemplate(template: TemplateEntry, w: number, h: number) {
  if (template.surface === "") {
    return html``
  }
  let surface: any = JSON.parse(template.surface);
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
