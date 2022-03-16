use hdk::prelude::*;
use holo_hash::EntryHashB64;

use zome_utils::*;
use crate::*;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportPlaysetInput {
  pub playset_eh: EntryHashB64,
  pub cell_id: CellId,
}

#[hdk_extern]
fn export_playset(input: ExportPlaysetInput) -> ExternResult<()> {
  /// Get Playset
  let playset: Playset = get_typed_from_eh(input.playset_eh.into())?;
  /// Export each template
  for eh in playset.templates {
    let entry = get_entry_from_eh(eh.into())?;
    call_import("template", entry, input.cell_id.clone())?;
  }
  /// Export each svg marker
  for eh in playset.svg_markers {
    let entry = get_entry_from_eh(eh.into())?;
    call_import("SvgMarker", entry, input.cell_id.clone())?;
  }
  /// Export each svg marker
  for eh in playset.emoji_groups {
    let entry = get_entry_from_eh(eh.into())?;
    call_import("EmojiGroup", entry, input.cell_id.clone())?;
  }
  /// Export each space
  for spaceEh in playset.spaces {
    let space_entry = get_entry_from_eh(spaceEh.into())?;
    call_import("space", space_entry, input.cell_id.clone())?;
  }
  /// Done
  Ok(())
}


///
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ImportEntryInput {
  pub entry_type_name: String,
  pub entry: Entry,
}

///
pub fn call_import(entry_type_name: &str, entry: Entry, cell_id: CellId) -> ExternResult<()> {
  let input = ImportEntryInput {
    entry_type_name: entry_type_name.to_string(),
    entry
  };
  let res = call(
    CallTargetCell::Other(cell_id),
    "where_playset".into(),
    "import_entry".into(),
    None,
    input,
  )?;
  let _: () = decode_response(res)?;
  Ok(())
}


////
pub fn get_entry_from_eh(eh: EntryHash) -> ExternResult<Entry> {
  match get(eh, GetOptions::content())? {
    None => error("get_entry_from_eh(): Entry not found"),
    Some(element) => match element.entry() {
      element::ElementEntry::Present(entry) =>  {
        Ok(entry.clone())
      }
      _ => error("No Entry at element"),
    }
  }
}
