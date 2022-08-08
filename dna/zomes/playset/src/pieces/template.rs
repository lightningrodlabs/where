use hdk::prelude::*;
use hdk::hash_path::path::TypedPath;
use holo_hash::EntryHashB64;
use zome_utils::get_typed_from_links;
use playset_integrity::*;


#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct TemplateOutput {
    hash: EntryHashB64,
    content: Template,
}


///
pub fn get_templates_path() -> TypedPath {
    Path::from("templates").typed(PlaysetLinkType::Templates).unwrap()
}


///
#[hdk_extern]
pub fn create_template(input: Template) -> ExternResult<EntryHashB64> {
    let _hh = create_entry(PlaysetEntry::Template(input.clone()))?;
    let eh = hash_entry(input.clone())?;
    let path = get_templates_path();
    path.ensure()?;
    let anchor_eh = path.path_entry_hash()?;
    create_link(anchor_eh, eh.clone(), PlaysetLinkType::All, LinkTag::from(()))?;
    let eh64: EntryHashB64 = eh.clone().into();
    // let me = agent_info()?.agent_latest_pubkey.into();
    // emit_signal(&SignalPayload::new(None, me, Message::NewTemplate((eh64.clone(), input))))?;
    Ok(eh64)
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
    let templates = get_templates_inner(path.path_entry_hash()?)?;
    Ok(templates)
}

fn get_templates_inner(base: EntryHash) -> ExternResult<Vec<TemplateOutput>> {
    let entries = get_typed_from_links(base, PlaysetLinkType::All, None)
      .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
    let mut templates = vec![];
    for pair in entries {
        templates.push(TemplateOutput {hash: hash_entry(&pair.0)?.into(), content: pair.0});
    }
    Ok(templates)
}
