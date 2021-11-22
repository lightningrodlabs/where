import {
  box_template_html, generate_surface,
  map2D_template_html,
  quadrant_template_svg,
  triangle_template_svg,
  tvstatic_template_canvas
} from "./templates";
import {MarkerType} from "../types";
import {WhereStore} from "../where.store";

export async function addHardcodedSpaces(store: WhereStore) {
  /** Templates */
  const mapEh = await store.addTemplate({
    name: "Map2D",
    surface: JSON.stringify({
      html: map2D_template_html
    }),
  })
  const canvasEh = await store.addTemplate({
    name: "TV Static",
    surface: JSON.stringify({
      canvas: tvstatic_template_canvas,
      size: {x: 500, y: 500},
    }),
  })
  const quadEh = await store.addTemplate({
    name: "Quadrant",
    surface: JSON.stringify({
      svg: quadrant_template_svg,
      size: {x: 600, y: 600},
    }),
  })
  const boxEh = await store.addTemplate({
    name: "Box",
    surface: JSON.stringify({
      html: box_template_html,
      size: {x: 1000, y: 700},
    }),
  })
  const triangleEh = await store.addTemplate({
    name: "Iron Triangle",
    surface: JSON.stringify({
      svg: triangle_template_svg,
      size: {x: 650, y: 460},
    }),
  })


  /** Spaces */

  await store.addSpace({
    name: "Ecuador",
    origin: mapEh,
    visible: true,
    surface: {
      html: `<img src=\"https://www.freeworldmaps.net/southamerica/ecuador/ecuador-map.jpg\" style=\"max-width:100%;max-height:100%;width:100%;height:100%;\" />`,
      size: {x: 800, y: 652},
    },
    meta: {
      ui: [],
      markerType: MarkerType.Emoji,
      multi: true, canTag: true, tagVisible: false,
      subMap: new Map([["ImageUrl","https://www.freeworldmaps.net/southamerica/ecuador/ecuador-map.jpg"]]),
    },
    locations: [],
  });

  const subMap = new Map([["pixel-size","6"]]) as Map<string, string>;

  await store.addSpace({
    name: "Canvas Sample",
    origin: canvasEh,
    visible: true,
    surface: {
      canvas: generate_surface(tvstatic_template_canvas, subMap),
      size: {x: 500, y: 500},
    },
    meta: {
      ui: [],
      markerType: MarkerType.Emoji,
      multi: true, canTag: true, tagVisible: false,
      subMap,
    },
    locations: [],
  });

  await store.addSpace({
    name: "earth",
    origin: mapEh,
    visible: true,
    surface: {
      html: `<img src=\"https://h5pstudio.ecampusontario.ca/sites/default/files/h5p/content/9451/images/image-5f6645b4ef14e.jpg\" style=\"max-width:100%;max-height:100%;width:100%;height:100%;\" />`,
      size: {x: 1000, y: 400},
    },
    meta: {
      markerType: MarkerType.Avatar,
      multi: false, canTag: false, tagVisible: false,
      subMap: new Map([["ImageUrl","https://h5pstudio.ecampusontario.ca/sites/default/files/h5p/content/9451/images/image-5f6645b4ef14e.jpg"]]),
      ui: [{box:{left:100,top:10,width:100,height:50},style:"padding:10px;background-color:#ffffffb8;border-radius: 10px;",content:"Land of the Lost"}]
    },
    locations: [],
  });

  await store.addSpace({
    name: "Abstract",
    origin: boxEh,
    visible: true,
    surface: {
      size: {x: 1000, y: 700},
      html: `<div style="pointer-events:none;text-align:center;width:100%;height:100%;background-image:linear-gradient(to bottom right, red, yellow);"></div>`
    },
    meta: {
      markerType: MarkerType.Letter,
      subMap: new Map([["style","background-image:linear-gradient(to bottom right, red, yellow);"]]),
      ui: [{box:{left:200,top:200,width:200,height:200},style:"background-image: linear-gradient(to bottom right, blue, red);",content:""}, {"box":{"left":450,"top":300,"width":100,"height":100},"style":"background-color:blue;border-radius: 10000px;","content":""}],
      multi: true, tagVisible: false, canTag: false,
    },
    locations: [],
  });

  await store.addSpace({
    name: "Zodiac",
    origin: mapEh,
    visible: true,
    surface: {
      html: `<img src=\"https://image.freepik.com/free-vector/zodiac-circle-natal-chart-horoscope-with-zodiac-signs-planets-rulers-black-white-illustration-horoscope-horoscope-wheel-chart_101969-849.jpg\" style=\"max-width:100%;max-height:100%;width:100%;height:100%;\" />`,
      size: {x: 626, y: 626},
    },
    meta: {
      ui: [],
      markerType: MarkerType.Color,
      multi: false, canTag: true, tagVisible: false,
      subMap: new Map([["ImageUrl","https://image.freepik.com/free-vector/zodiac-circle-natal-chart-horoscope-with-zodiac-signs-planets-rulers-black-white-illustration-horoscope-horoscope-wheel-chart_101969-849.jpg"]])
    },
    locations: [],
  });
}
