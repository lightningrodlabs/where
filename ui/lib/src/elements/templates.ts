import {html, svg} from "lit";

// Material textfield type:
// export type TextFieldType = 'text'|'search'|'tel'|'url'|'email'|'password'|
//     'date'|'month'|'week'|'time'|'datetime-local'|'number'|'color';

export const box_template_html =
  `<div style=" pointer-events: none; text-align: center; width: 100%;height: 100%;%%style%%"></div>`

export const map2D_template_html = `
    <img src="%%ImageUrl%%" style="max-width:100%;max-height:100%;width:100%;height:100%;" />
    `;

export const triangle_template_svg = `
 <g class="layer">
  <title>Layer 1</title>
  <rect fill="red" height="0" id="svg_5" stroke="#000000" stroke-width="5" width="0" x="298" y="95"/>
  <path d="m111.45499,420.32195l221.14285,-386.99999l221.14285,386.99999l-442.2857,0z" fill="#fbfcc7" id="svg_4" stroke="#b2b2b2" stroke-width="2"/>
  <circle cx="333.5" cy="271" fill="#000000" id="svg_6" r="37.10632" stroke="#000000" stroke-width="2"/>
  <circle cx="332" cy="56.5" fill="#5fbf00" id="svg_7" opacity="0.5" r="45.20832" stroke="#000000" stroke-width="2"/>
  <circle cx="128" cy="404.5" fill="#00ffff" id="svg_8" opacity="0.5" r="45.20832" stroke="#000000" stroke-width="2"/>
  <circle cx="532.5" cy="400.5" fill="#ff7f00" id="svg_9" opacity="0.5" r="45.20832" stroke="#000000" stroke-width="2"/>
  <text fill="#000000" font-family="Serif" font-size="20" id="svg_10" stroke="#000000" stroke-width="0" text-anchor="middle" x="120" xml:space="preserve" y="415">%%param1%%</text>
  <text fill="#000000" font-family="Serif" font-size="20" id="svg_11" stroke="#000000" stroke-width="0" text-anchor="middle" x="330" xml:space="preserve" y="73">%%param2%%</text>
  <text fill="#000000" font-family="Serif" font-size="20" id="svg_12" stroke="#000000" stroke-width="0" text-anchor="middle" x="532" xml:space="preserve" y="415">%%param3%%</text>
 </g>
`;

export const quadrant_template_svg = `
<!--  <svg xmlns="http://www.w3.org/2000/svg">-->
 <g class="layer">
  <rect fill="#C8E4BC" height="253.817" id="rect3451" width="253.817" x="41.279" y="299.291"/>
  <rect fill="#F9BABA" height="253.817" id="rect3449" width="253.817" x="41.279" y="43.474"/>
  <rect fill="#92D9F8" height="253.817" id="rect3447" width="253.817" x="297.097" y="43.474"/>
  <rect fill="#f5f5a7" height="253.817" id="rect3418" width="253.817" x="297.097" y="299.291"/>
  <path d="m295.097,30.229l0,536.156l2,0l0,-536.156l-2,0z" fill="#010101" id="path3210"/>
  <path d="m287.211,51.602l8.839,-24.037l8.839,24.037c-5.219,-3.841 -12.359,-3.818 -17.678,0z" fill="#010101" id="path3440"/>
  <path d="m304.959,545.01l-8.839,24.037l-8.839,-24.037c5.219,3.84 12.359,3.818 17.678,0z" fill="#010101" id="path3442"/>
  <path d="m28.003,297.291l0,2l536.156,0l0,-2l-536.156,0z" fill="#010101" id="path3416"/>
  <path d="m542.789,289.432l24.037,8.839l-24.037,8.839c3.84,-5.219 3.818,-12.359 0,-17.678z" fill="#010101" id="path3427"/>
  <path d="m49.38,307.18l-24.037,-8.839l24.037,-8.839c-3.839,5.219 -3.817,12.358 0,17.678z" fill="#010101" id="path3429"/>
  <text fill="#010101" font-family="Arial-BoldMT" font-size="20.431px" id="text2996" text-anchor="start" x="8.3047" y="284.72247">%%left-axis%%</text>
  <text fill="#010101" font-family="Arial-BoldMT" font-size="20.431px" id="text2998" text-anchor="end" x="588.66278" y="284.79285">%%right-axis%%</text>
  <text fill="#010101" font-family="Arial-BoldMT" font-size="20.431px" id="text3000" text-anchor="middle" x="296.21339" y="585.30182">%%bottom-axis%%</text>
  <text fill="#010101" font-family="Arial-BoldMT" font-size="20.431px" id="text3002" text-anchor="middle" x="295.8755" y="20.083">%%top-axis%%</text>
  <g id="g3487">
   <text fill="#00aad4" font-family="Arial-BoldMT" font-size="20.431px" id="text3005" text-anchor="middle" x="426.56738" y="163.15431">%%top-axis%%</text>
   <text fill="#00aad4" font-family="Arial-BoldMT" font-size="20.431px" id="text3007" text-anchor="middle" x="427.29489" y="184.93553">%%right-axis%%</text>
  </g>
  <g id="g3493">
   <text fill="#f37f81" font-family="Arial-BoldMT" font-size="20.431px" id="text3010" text-anchor="middle" x="177.75" y="163.15431">%%top-axis%%</text>
   <text fill="#f37f81" font-family="Arial-BoldMT" font-size="20.431px" id="text3012" style="cursor: move;" text-anchor="middle" x="177.84958" y="184.93553">%%left-axis%%</text>
  </g>
  <g id="g3503">
   <text fill="#cccb00" font-family="Arial-BoldMT" font-size="20.431px" id="text3015" text-anchor="middle" x="435.90527" y="418.97169">%%bottom-axis%%</text>
   <text fill="#cccb00" font-family="Arial-BoldMT" font-size="20.431px" id="text3017" text-anchor="middle" x="437.29489" y="443.75297">%%right-axis%%</text>
  </g>
  <g id="g3513">
   <text fill="#4ab749" font-family="Arial-BoldMT" font-size="20.431px" id="text3020" text-anchor="middle" x="186.08789" y="418.00192">%%bottom-axis%%</text>
   <text fill="#4ab749" font-family="Arial-BoldMT" font-size="20.431px" id="text3022" text-anchor="middle" x="185.84958" y="442.78223">%%left-axis%%</text>
  </g>
 </g>
<!--</svg>-->
`;
