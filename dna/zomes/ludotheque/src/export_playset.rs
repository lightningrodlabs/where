use hdk::prelude::*;
use holo_hash::EntryHashB64;

use zome_utils::*;
use crate::*;


#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportPlaysetInput {
  pub cell_id: CellId,
  pub playset_eh: EntryHashB64,
}

#[hdk_extern]
fn export_playset(input: ExportPlaysetInput) -> ExternResult<()> {
  /// Get Playset
  let playset: Playset = get_typed_from_eh(input.playset_eh.into())?;
  /// Export each template
  for eh in playset.templates {
    let entry = get_entry_from_eh(eh.into())?;
    export_piece("template", entry, input.cell_id.clone())?;
  }
  /// Export each svg marker
  for eh in playset.svg_markers {
    let entry = get_entry_from_eh(eh.into())?;
    export_piece("SvgMarker", entry, input.cell_id.clone())?;
  }
  /// Export each svg marker
  for eh in playset.emoji_groups {
    let entry = get_entry_from_eh(eh.into())?;
    export_piece("EmojiGroup", entry, input.cell_id.clone())?;
  }
  /// Export each space
  for spaceEh in playset.spaces {
    let space_entry = get_entry_from_eh(spaceEh.into())?;
    export_piece("space", space_entry, input.cell_id.clone())?;
  }
  /// Done
  Ok(())
}


///
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ImportPieceInput {
  pub piece_type_name: String,
  pub piece_entry: Entry,
}

///
pub fn export_piece(entry_type_name: &str, piece_entry: Entry, cell_id: CellId) -> ExternResult<()> {
  debug!("export_piece() called: {}", entry_type_name);
  let input = ImportPieceInput {
    piece_type_name: entry_type_name.to_string(),
    piece_entry
  };
  let res = call(
    CallTargetCell::Other(cell_id),
    "where_playset".into(),
    "import_piece".into(),
    None,
    input,
  )?;
  let _: () = decode_response(res)?;
  Ok(())
}
