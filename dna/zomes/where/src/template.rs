use hc_utils::*;
use holo_hash::EntryHashB64;
pub use hdk::prelude::*;

use crate::error::*;
use crate::signals::*;

/// Template Entry
#[hdk_entry(id = "template")]
#[derive(Clone)]
pub struct Template {
    pub name: String,
    pub surface: String, // Json
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct TemplateOutput {
    hash: EntryHashB64,
    content: Template,
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
fn get_template(input: EntryHashB64) -> ExternResult<Option<Template>> {
    let eh: EntryHash = input.into();
    match get_details(eh, GetOptions::content())? {
            Some(Details::Entry(EntryDetails {entry, .. })) => {
                let tmpl: Template = entry.try_into()?;
                Ok(Some(tmpl))
            }
        _ => Ok(None),
    }
}

#[hdk_extern]
fn get_templates(_: ()) -> ExternResult<Vec<TemplateOutput>> {
    let path = get_templates_path();
    let templates = get_templates_inner(path.hash()?)?;
    Ok(templates)
}

fn get_templates_inner(base: EntryHash) -> WhereResult<Vec<TemplateOutput>> {
    let entries = get_links_and_load_type(base, None)?;
    let mut templates = vec![];
    for e in entries {
        templates.push(TemplateOutput {hash: hash_entry(&e)?.into(), content: e});
    }
    Ok(templates)
}
