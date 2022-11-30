use hdk::prelude::*;
use hdk::hash_path::path::TypedPath;
use zome_utils::*;
use holo_hash::EntryHashB64;
use playset_integrity::*;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SvgMarkerOutput {
    hash: EntryHashB64,
    content: SvgMarker,
}

pub fn get_svg_marker_path() -> TypedPath {
    Path::from("svg-marker").typed(PlaysetLinkType::SvgMarkers).unwrap()
}

#[hdk_extern]
pub fn create_svg_marker(input: SvgMarker) -> ExternResult<EntryHashB64> {
    let _hh = create_entry(PlaysetEntry::SvgMarker(input.clone()))?;
    let eh = hash_entry(input.clone())?;
    let path = get_svg_marker_path();
    path.ensure()?;
    let anchor_eh = path.path_entry_hash()?;
    create_link(anchor_eh, eh.clone(), PlaysetLinkType::All, LinkTag::from(()))?;
    let eh64: EntryHashB64 = eh.clone().into();
    // let me = agent_info()?.agent_latest_pubkey.into();
    // emit_signal(&SignalPayload::new(None, me, Message::NewSvgMarker((eh64.clone(), input))))?;
    Ok(eh64)
}

#[hdk_extern]
fn get_svg_marker(input: EntryHashB64) -> ExternResult<Option<SvgMarker>> {
    let maybe_record = get(input, GetOptions::content())?;
    let Some(record) = maybe_record 
        else {return Ok(None)};
    let typed = get_typed_from_record::<SvgMarker>(record)?;
    Ok(Some(typed))
}

#[hdk_extern]
fn get_svg_markers(_: ()) -> ExternResult<Vec<SvgMarkerOutput>> {
    let path = get_svg_marker_path();
    let templates = get_inner(path.path_entry_hash()?)?;
    Ok(templates)
}

fn get_inner(base: EntryHash) -> ExternResult<Vec<SvgMarkerOutput>> {
    let entries = get_typed_from_links(base, PlaysetLinkType::All, None)
      .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
    let mut templates = vec![];
    for pair in entries {
        templates.push(SvgMarkerOutput {hash: hash_entry(&pair.0)?.into(), content: pair.0});
    }
    Ok(templates)
}
