import {
  box_template_html, generate_surface,
  map2D_template_html,
  quadrant_template_svg,
  triangle_template_svg,
  tvstatic_template_canvas
} from "./templates";
import {PlaysetZvm} from "./viewModels/playset.zvm";
import {SpaceEntry} from "./viewModels/playset.bindings";
import {MarkerType} from "./viewModels/playset.perspective";
import {createPlayset, Space, spaceIntoEntry} from "./viewModels/where.perspective";
import {HoloHashedB64} from "./utils";
import {LudothequeDvm} from "./viewModels/ludotheque.dvm";


export async function publishExamplePlayset(dvm: LudothequeDvm) {
  const playsetZvm = dvm.playsetZvm;

  /** Templates */
  console.log("Templates...")
  const mapEh = await playsetZvm.publishTemplate({
    name: "Map2D",
    surface: JSON.stringify({
      html: map2D_template_html
    }),
  })
  const canvasEh = await playsetZvm.publishTemplate({
    name: "TV Static",
    surface: JSON.stringify({
      canvas: tvstatic_template_canvas,
      size: {x: 500, y: 500},
    }),
  })
  const quadEh = await playsetZvm.publishTemplate({
    name: "Quadrant",
    surface: JSON.stringify({
      svg: quadrant_template_svg,
      size: {x: 600, y: 600},
    }),
  })
  const boxEh = await playsetZvm.publishTemplate({
    name: "Box",
    surface: JSON.stringify({
      html: box_template_html,
      size: {x: 1000, y: 700},
    }),
  })
  const triangleEh = await playsetZvm.publishTemplate({
    name: "Iron Triangle",
    surface: JSON.stringify({
      svg: triangle_template_svg,
      size: {x: 650, y: 460},
    }),
  })


  /** Emoji Groups */
  console.log("Emojis...")
  const heartsEh = await playsetZvm.publishEmojiGroup({
    name: "hearts",
    description: "",
    unicodes: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤"]
  });
  const zodiacSignsEh = await playsetZvm.publishEmojiGroup({
    name: "zodiac signs",
    description: "",
    unicodes: ["♈️", "♉️", "♊️", "♋️", "♌️", "♍️", "♎️", "♏️", "♐️", "♑️", "♒️", "♓️"]
  });


  /** SVG Markers */
  console.log("SVG Markers...")
  const pinEh = await playsetZvm.publishSvgMarker({
    name: "Pin",
    value: '<path data-name="layer1" d="M32 2a20 20 0 0 0-20 20c0 18 20 40 20 40s20-22 20-40A20 20 0 0 0 32 2zm0 28a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" fill="%%color%%"></path>',
  });

  const otherEh = await playsetZvm.publishSvgMarker({
    name: "Cross",
    value: '<path d="m62.974825,55.511659l-7.426527,7.412329c-1.355295,1.369037 -3.568037,1.369037 -4.937175,0l-18.559378,-18.544683l-18.545536,18.544683c-1.369138,1.369037 -3.595723,1.369037 -4.951018,0l-7.426492,-7.412329c-1.369138,-1.369073 -1.369138,-3.581708 0,-4.950781l18.545536,-18.55849l-18.545536,-18.544647c-1.355331,-1.382915 -1.355331,-3.609357 0,-4.950781l7.426492,-7.426136c1.355295,-1.369073 3.58188,-1.369073 4.951018,0l18.545536,18.558454l18.559378,-18.558454c1.369138,-1.369073 3.595687,-1.369073 4.937175,0l7.426527,7.412329c1.369103,1.369037 1.369103,3.595515 0.013808,4.964588l-18.559378,18.544647l18.545571,18.55849c1.369103,1.369073 1.369103,3.581708 0,4.950781z" fill="%%color%%"/>',
  });


  const publishSpace = async (zvm: PlaysetZvm, space: Space) => {
    const content = spaceIntoEntry(space);
    const hash = await zvm.publishSpace(content);
    spaceList.push({hash, content})
  }

  /** Spaces */

  let spaceList: Array<HoloHashedB64<SpaceEntry>> = new Array();
  let spaceEntry;

  console.log("Spaces...")
  await publishSpace( playsetZvm, {
    name: "Ecuador",
    origin: mapEh,
    surface: {
      html: `<img src=\"https://www.freeworldmaps.net/southamerica/ecuador/ecuador-map.jpg\" style=\"max-width:100%;max-height:100%;width:100%;height:100%;\" />`,
      size: {x: 800, y: 652},
    },
    meta: {
      ui: [],
      sessionCount: 0, canModifyPast: true, sessionLabels: [],
      markerType: MarkerType.AnyEmoji, singleEmoji: "",
      multi: true, canTag: true, tagVisible: false, tagAsMarker:false, predefinedTags: [],
      subMap: new Map([["ImageUrl","https://www.freeworldmaps.net/southamerica/ecuador/ecuador-map.jpg"]]),
    }
  });


  await publishSpace( playsetZvm, {
    name:"earth",
    origin: mapEh,
    surface: {
      html: `<img src=\"https://h5pstudio.ecampusontario.ca/sites/default/files/h5p/content/9451/images/image-5f6645b4ef14e.jpg\" style=\"max-width:100%;max-height:100%;width:100%;height:100%;\" />`,
      size: {x: 1000, y: 400},
    },
    maybeMarkerPiece: {emojiGroup: zodiacSignsEh},
    meta:{
      sessionCount: 0, canModifyPast: true, sessionLabels: [],
      markerType: MarkerType.EmojiGroup, singleEmoji: "",
      multi: false, canTag: false, tagVisible: false,  tagAsMarker:false, predefinedTags: [],
      subMap: new Map([["ImageUrl","https://h5pstudio.ecampusontario.ca/sites/default/files/h5p/content/9451/images/image-5f6645b4ef14e.jpg"]]),
      ui: [{box:{left:450,top:320,width:100,height:20},style:"padding:10px;background-color:#ffffffb8;border-radius: 10px;",content:"Place of Birth"}]
    }
  });

  await publishSpace( playsetZvm, {
    name:"Abstract",
    origin:boxEh,
    surface:{
      size: {x: 1000, y: 700},
      html: `<div style="pointer-events:none;text-align:center;width:100%;height:100%;background-image:linear-gradient(to bottom right, red, yellow);"></div>`
    },
    meta:{
      sessionCount: 0, canModifyPast: true, sessionLabels: [],
      markerType: MarkerType.Initials, singleEmoji: "",
      subMap: new Map([["style","background-image:linear-gradient(to bottom right, red, yellow);"]]),
      ui: [{box:{left:200,top:200,width:200,height:200},style:"background-image: linear-gradient(to bottom right, blue, red);",content:""}, {"box":{"left":450,"top":300,"width":100,"height":100},"style":"background-color:blue;border-radius: 10000px;","content":""}],
      multi: true, canTag: false, tagVisible: false, tagAsMarker:false, predefinedTags: [],
    }
  });

  await publishSpace( playsetZvm, {
    name:"Zodiac",
    origin:mapEh,
    surface:{
      html: `<img src=\"https://image.freepik.com/free-vector/zodiac-circle-natal-chart-horoscope-with-zodiac-signs-planets-rulers-black-white-illustration-horoscope-horoscope-wheel-chart_101969-849.jpg\" style=\"max-width:100%;max-height:100%;width:100%;height:100%;\" />`,
      size: {x: 626, y: 626},
    },
    meta:{
      ui: [],
      sessionCount: 0, canModifyPast: true, sessionLabels: [],
      markerType: MarkerType.Avatar, singleEmoji: "",
      multi: false, canTag: true, tagVisible: false, tagAsMarker:false, predefinedTags: [],
      subMap: new Map([["ImageUrl","https://image.freepik.com/free-vector/zodiac-circle-natal-chart-horoscope-with-zodiac-signs-planets-rulers-black-white-illustration-horoscope-horoscope-wheel-chart_101969-849.jpg"]])
    }});


  let subMap = new Map([["param1","Cost"], ["param2","Quality"], ["param3","Time"]]) as Map<string, string>;
  await publishSpace( playsetZvm, {
    name:"Project Triangle",
    origin:triangleEh,
    surface:{
      svg: generate_surface(triangle_template_svg, subMap),
      size: {x: 650, y: 460},
    },
    meta:{
      ui: [],
      sessionCount: 0, canModifyPast: true, sessionLabels: [],
      markerType: MarkerType.SingleEmoji, singleEmoji: "💥",
      multi: false, canTag: true, tagVisible: true, tagAsMarker:false, predefinedTags: [],
      subMap,
    }});

  subMap = new Map([["ImageUrl","https://i1.wp.com/www.pedrosolorzano.com/wp-content/uploads/2019/08/blobtreepedro.jpg"]]) as Map<string, string>;
  await publishSpace( playsetZvm, {
    name: "Blob Tree",
    origin: mapEh,
    surface: {
      html: generate_surface(map2D_template_html, subMap),
      size: {x: 650, y: 920},
    },
    maybeMarkerPiece: {emojiGroup: heartsEh},
    meta: {
      sessionCount: 0, canModifyPast: true, sessionLabels: [],
      ui: [{box:{left:10,top:45,width:170,height:20},style:"padding:10px;background-color:#fffffffa;border-radius:10px;border:2px solid violet;font-size:large;",content:"How are you feeling?"}],
      markerType: MarkerType.EmojiGroup, singleEmoji: "",
      multi: true, canTag: false, tagVisible: false, tagAsMarker:false, predefinedTags: [],
      subMap,
    }});

  subMap = new Map([["ImageUrl","https://upload.wikimedia.org/wikipedia/commons/2/2c/Johari_Window.PNG"]]) as Map<string, string>;
  await publishSpace( playsetZvm, {
    name: "Johari Window",
    origin: mapEh,
    surface: {
      html: generate_surface(map2D_template_html, subMap),
      size: {x: 548, y: 405},
    },
    meta: {
      ui: [],
      sessionCount: 0, canModifyPast: true, sessionLabels: [],
      markerType: MarkerType.Tag, singleEmoji: "",
      multi: true, canTag: true, tagVisible: true, tagAsMarker: true,
      predefinedTags: ["able", "accepting", "caring", "dignified", "happy", "introverted", "modest", "silly"],
      subMap,
    }});

  subMap = new Map([["pixel-size","6"]]) as Map<string, string>;
  await publishSpace( playsetZvm, {
    name: "Canvas Sample",
    origin: canvasEh,
    surface: {
      canvas: generate_surface(tvstatic_template_canvas, subMap),
      size: {x: 500, y: 500},
    },
    maybeMarkerPiece: {svg: pinEh},
    meta: {
      ui: [],
      sessionCount: 0, canModifyPast: true, sessionLabels: [],
      markerType: MarkerType.SvgMarker, singleEmoji: "",
      multi: true, canTag: true, tagVisible: true, tagAsMarker:false, predefinedTags: [],
      subMap,
    }});

  /** Playset */
  const playsetEntry = await createPlayset("Demo Playset", spaceList);
  const playsetEh = dvm.ludothequeZvm.publishPlayset(playsetEntry);
  console.log("examples - DONE | " + playsetEh)
}
