use hdk::prelude::*;
use zome_utils::*;
use playset_integrity::*;
use crate::*;


#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ImportPieceInput {
  pub piece_type_name: String, // FIXME use UnitEntryTypes and AppEntryTypeName
  pub piece_entry: Entry,
}

/// Zome Function Callback
/// Should not be called directly. Only via remote call to self by ludotheque
#[hdk_extern]
fn import_piece(ImportPieceInput{piece_entry, piece_type_name}: ImportPieceInput) -> ExternResult<()> {
  debug!("import_piece() entry_def_id = {:?} | {}", piece_type_name, zome_info()?.name);
  /// Bail if we already have it
  let eh = hash_entry(piece_entry.clone())?;
  let maybe_entry = get_entry_from_eh(eh);
  if maybe_entry.is_ok() {
    return Ok(());
  }
  /// Import depending on type
  match piece_type_name.as_str() {
    "Template" => {
      let template = Template::try_from(piece_entry)?;
      create_template(template)?;
    },
    "Space" => {
      let space = Space::try_from(piece_entry)?;
      create_space(space)?;
    },
    "SvgMarker" => {
      let e = SvgMarker::try_from(piece_entry)?;
      create_svg_marker(e)?;
    },
    "EmojiGroup" => {
      let e = EmojiGroup::try_from(piece_entry)?;
      create_emoji_group(e)?;
    },
    _ => return error(&format!("Unknown entry type: {}", piece_type_name)),
  };
  /// Done
  Ok(())
}
