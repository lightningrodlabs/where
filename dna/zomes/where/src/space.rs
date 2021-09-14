pub use hdk::prelude::*;
use hc_utils::*;
use std::collections::HashMap;
use holo_hash::EntryHashB64;

use crate::error::*;
use crate::signals::*;

/// Space entry definition
#[hdk_entry(id = "space")]
#[derive(Clone)]
pub struct Space {
    pub name: String,
    //pub dimensionality: CoordinateSystem,
    pub surface: String, // Json
    pub meta: HashMap<String, String>,  // usable by the UI for whatever
}


#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SpaceInput {
    origin: EntryHashB64,
    space: Space,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SpaceOutput {
    hash: EntryHashB64,
    content: Space,
}


fn get_spaces_path() -> Path {
    Path::from("spaces")
}

#[hdk_extern]
fn create_space(input: SpaceInput) -> ExternResult<EntryHashB64> {
    let _header_hash = create_entry(&input.space)?;
    let hash = hash_entry(input.space.clone())?;
    emit_signal(&SignalPayload::new(hash.clone().into(), Message::NewSpace(input.space)))?;
    let path = get_spaces_path();
    path.ensure()?;
    let anchor_hash = path.hash()?;
    create_link(anchor_hash, hash.clone(), ())?;
    create_link(hash.clone(), input.origin.into(), LinkTag::new("origin"))?;
    Ok(hash.into())
}

///
#[hdk_extern]
fn get_spaces(_: ()) -> ExternResult<Vec<SpaceOutput>> {
    let path = get_spaces_path();
    let spaces = get_spaces_inner(path.hash()?)?;
    Ok(spaces)
}

fn get_spaces_inner(base: EntryHash) -> WhereResult<Vec<SpaceOutput>> {
    let entries = get_links_and_load_type(base, None)?;
    let mut spaces = vec![];
    for e in entries {
        spaces.push(SpaceOutput {hash: hash_entry(&e)?.into(), content: e});
    }
    Ok(spaces)
}
