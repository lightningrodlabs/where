use hdk::prelude::*;
use zome_utils::*;
use zome_fn_input::*;
use playset_integrity::*;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SvgMarkerOutput {
    hash: EntryHashB64,
    content: SvgMarker,
}


///
pub fn get_svg_marker_path() -> ExternResult<TypedPath> {
    Ok(Path::from("svg-marker").typed(PlaysetLinkType::SvgMarkers)?.with_strategy(GetStrategy::Local))
}


///
#[hdk_extern]
pub fn create_svg_marker(input: SvgMarker) -> ExternResult<EntryHashB64> {
    let _hh = create_entry(PlaysetEntry::SvgMarker(input.clone()))?;
    let eh = hash_entry(input.clone())?;
    let path = get_svg_marker_path()?;
    path.ensure()?;
    let anchor_eh = path.path_entry_hash()?;
    create_link(anchor_eh, eh.clone(), PlaysetLinkType::All, LinkTag::from(()))?;
    let eh64: EntryHashB64 = eh.clone().into();
    Ok(eh64)
}


///
#[hdk_extern]
pub fn get_svg_marker(input: ZomeFnInput<EntryHashB64>) -> ExternResult<Option<SvgMarker>> {
    let options = input.get_options();
    let eh: EntryHash = input.input.into();
    let maybe_record = get(eh, options)?;
    let Some(record) = maybe_record
        else {return Ok(None)};
    let typed = get_typed_from_record::<SvgMarker>(record)?;
    Ok(Some(typed))
}


///
#[hdk_extern]
pub fn get_svg_markers(input: ZomeFnInput<()>) -> ExternResult<Vec<SvgMarkerOutput>> {
    let path = get_svg_marker_path()?;
    let items = get_inner(path.path_entry_hash()?, input.get_strategy())?;
    Ok(items)
}

fn get_inner(base: EntryHash, strategy: GetStrategy) -> ExternResult<Vec<SvgMarkerOutput>> {
    let entries = get_typed_from_links::<SvgMarker>(LinkQuery::try_new(base, PlaysetLinkType::All)?, strategy)
      .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
    let mut items = vec![];
    for pair in entries {
        items.push(SvgMarkerOutput {hash: hash_entry(&pair.0)?.into(), content: pair.0});
    }
    Ok(items)
}
