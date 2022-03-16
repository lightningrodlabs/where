use hdk::prelude::*;

use crate::*;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ImportEntryInput {
  pub entry_type_name: String,
  pub entry: Entry,
}

/// Zome Function Callback
/// Should not be called directly. Only via remote call to self by ludotheque
#[hdk_extern]
fn import_entry(input: ImportEntryInput) -> ExternResult<()> {
  debug!("import_entry() entry_def_id = {:?} | {}", input.entry_type_name, zome_info()?.name);
  // /// Create CreateInput
  // let create_input = CreateInput::new(
  //   input.entry_def_id,
  //   input.entry,
  //   ChainTopOrdering::Relaxed, // Strict //Relaxed
  // );
  // /// Commit Entry
  //create_entry(create_input)?;

  match input.entry_type_name.as_str() {
    "template" => {
      let template = Template::try_from(input.entry)?;
      create_template(template)?;
    },
    "space" => {
      let space = Space::try_from(input.entry)?;
      create_space(space)?;
    },
    "SvgMarker" => {
      let e = SvgMarker::try_from(input.entry)?;
      create_svg_marker(e)?;
    },
    "EmojiGroup" => {
      let e = EmojiGroup::try_from(input.entry)?;
      create_emoji_group(e)?;
    },
    _ => return Err(WasmError::Guest(String::from(format!("Unknown entry type: {}", input.entry_type_name)))),
  };

  /// Done
  Ok(())
}
