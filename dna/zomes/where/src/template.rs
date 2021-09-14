use hc_utils::*;
use std::collections::HashMap;
use holo_hash::{EntryHashB64, AgentPubKeyB64, HeaderHashB64};
pub use hdk::prelude::*;

/// Template Entry
#[hdk_entry(id = "template")]
#[derive(Clone)]
pub struct Template {
    pub name: String,
    pub surface: String, // Json
}



fn get_templates_path() -> Path {
    Path::from("templates")
}

#[hdk_extern]
fn create_template(input: Template) -> ExternResult<EntryHashB64> {
    let _header_hash = create_entry(&input)?;
    let hash = hash_entry(input.clone())?;
    emit_signal(&SignalPayload::new(hash.clone().into(), Message::NewTemplate(input)))?;
    let path = get_templates_path();
    path.ensure()?;
    let anchor_hash = path.hash()?;
    create_link(anchor_hash, hash.clone(), ())?;
    Ok(hash.into())
}

#[hdk_extern]
fn get_templates(_: ()) -> ExternResult<Vec<SpaceOutput>> {
    let path = get_spaces_path();
    let spaces = get_spaces_inner(path.hash()?)?;
    Ok(spaces)
}

fn get_templates_inner(base: EntryHash) -> WhereResult<Vec<SpaceOutput>> {
    let entries = get_links_and_load_type(base, None)?;
    let mut spaces = vec![];
    for e in entries {
        spaces.push(SpaceOutput {hash: hash_entry(&e)?.into(), content: e});
    }
    Ok(spaces)
}
