use hdk::prelude::*;
use holo_hash::EntryHashB64;
use hc_utils::get_links_and_load_type;

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
    let _hh = create_entry(&input)?;
    let eh = hash_entry(input.clone())?;
    let path = get_templates_path();
    path.ensure()?;
    let anchor_eh = path.path_entry_hash()?;
    create_link(anchor_eh, eh.clone(), ())?;
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
    let entries = get_links_and_load_type(base, None, false)
      .map_err(|err| WasmError::Guest(err.to_string()))?;
    let mut templates = vec![];
    for e in entries {
        templates.push(TemplateOutput {hash: hash_entry(&e)?.into(), content: e});
    }
    Ok(templates)
}
