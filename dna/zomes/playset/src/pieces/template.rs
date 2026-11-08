use hdk::prelude::*;
use zome_utils::*;
use zome_fn_input::*;
use playset_integrity::*;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct TemplateOutput {
    hash: EntryHashB64,
    content: Template,
}


///
pub fn get_templates_path() -> ExternResult<TypedPath> {
    Ok(Path::from("templates").typed(PlaysetLinkType::Templates)?.with_strategy(GetStrategy::Local))
}


///
#[hdk_extern]
pub fn create_template(input: Template) -> ExternResult<EntryHashB64> {
    let _hh = create_entry(PlaysetEntry::Template(input.clone()))?;
    let eh = hash_entry(input.clone())?;
    let path = get_templates_path()?;
    path.ensure()?;
    let anchor_eh = path.path_entry_hash()?;
    create_link(anchor_eh, eh.clone(), PlaysetLinkType::All, LinkTag::from(()))?;
    let eh64: EntryHashB64 = eh.clone().into();
    Ok(eh64)
}


///
#[hdk_extern]
pub fn get_template(input: ZomeFnInput<EntryHashB64>) -> ExternResult<Option<Template>> {
    let options = input.get_options();
    let eh: EntryHash = input.input.into();
    let maybe_record = get(eh, options)?;
    let Some(record) = maybe_record
        else {return Ok(None)};
    let typed = get_typed_from_record::<Template>(record)?;
    Ok(Some(typed))
}


///
#[hdk_extern]
pub fn get_templates(input: ZomeFnInput<()>) -> ExternResult<Vec<TemplateOutput>> {
    let path = get_templates_path()?;
    let items = get_templates_inner(path.path_entry_hash()?, input.get_strategy())?;
    Ok(items)
}

fn get_templates_inner(base: EntryHash, strategy: GetStrategy) -> ExternResult<Vec<TemplateOutput>> {
    let entries = get_typed_from_links::<Template>(LinkQuery::try_new(base, PlaysetLinkType::All)?, strategy)
      .map_err(|err| wasm_error!(WasmErrorInner::Guest(err.to_string())))?;
    let mut items = vec![];
    for pair in entries {
        items.push(TemplateOutput {hash: hash_entry(&pair.0)?.into(), content: pair.0});
    }
    Ok(items)
}
