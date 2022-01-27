use hc_utils::get_links_and_load_type;
use holo_hash::EntryHashB64;
pub use hdk::prelude::*;

use crate::error::*;
//use crate::signals::*;

/// SvgMarker Entry
#[hdk_entry(id = "svgmarker")]
#[derive(Clone)]
pub struct SvgMarker {
    pub name: String,
    pub value: String, // Json
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SvgMarkerOutput {
    hash: EntryHashB64,
    content: SvgMarker,
}

fn get_svg_marker_path() -> Path {
    Path::from("svg-marker")
}

#[hdk_extern]
fn create_svg_marker(input: SvgMarker) -> ExternResult<EntryHashB64> {
    let _hh = create_entry(&input)?;
    let eh = hash_entry(input.clone())?;
    let path = get_svg_marker_path();
    path.ensure()?;
    let anchor_hash = path.path_entry_hash()?;
    create_link(anchor_hash, eh.clone(), ())?;
    let eh64: EntryHashB64 = eh.clone().into();
    // let me = agent_info()?.agent_latest_pubkey.into();
    // emit_signal(&SignalPayload::new(None, me, Message::NewSvgMarker((eh64.clone(), input))))?;
    Ok(eh64)
}

#[hdk_extern]
fn get_svg_marker(input: EntryHashB64) -> ExternResult<Option<SvgMarker>> {
    let eh: EntryHash = input.into();
    match get_details(eh, GetOptions::content())? {
            Some(Details::Entry(EntryDetails {entry, .. })) => {
                let tmpl: SvgMarker = entry.try_into()?;
                Ok(Some(tmpl))
            }
        _ => Ok(None),
    }
}

#[hdk_extern]
fn get_svg_markers(_: ()) -> ExternResult<Vec<SvgMarkerOutput>> {
    let path = get_svg_marker_path();
    let templates = get_inner(path.path_entry_hash()?)?;
    Ok(templates)
}

fn get_inner(base: EntryHash) -> WhereResult<Vec<SvgMarkerOutput>> {
    let entries = get_links_and_load_type(base, None, false)?;
    let mut templates = vec![];
    for e in entries {
        templates.push(SvgMarkerOutput {hash: hash_entry(&e)?.into(), content: e});
    }
    Ok(templates)
}
