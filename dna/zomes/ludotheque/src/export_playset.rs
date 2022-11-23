use hdk::prelude::*;
use holo_hash::EntryHashB64;

use zome_utils::*;
use ludotheque_integrity::*;


#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportPlaysetInput {
  pub destination_cell_id: CellId,
  pub playset_eh: EntryHashB64,
}

#[hdk_extern]
fn export_playset(ExportPlaysetInput{playset_eh, destination_cell_id}: ExportPlaysetInput) -> ExternResult<()> {
  /* Get Playset */
  let playset: Playset = get_typed_from_eh(playset_eh.into())?;
  /* Export each template */
  for eh in playset.templates {
    let entry = get_entry_from_eh(eh.into())?;
    export_piece_inner("template", entry, destination_cell_id.clone())?;
  }
  /* Export each svg marker */
  for eh in playset.svg_markers {
    let entry = get_entry_from_eh(eh.into())?;
    export_piece_inner("SvgMarker", entry, destination_cell_id.clone())?;
  }
  /* Export each svg marker */
  for eh in playset.emoji_groups {
    let entry = get_entry_from_eh(eh.into())?;
    export_piece_inner("EmojiGroup", entry, destination_cell_id.clone())?;
  }
  /* Export each space */
  for spaceEh in playset.spaces {
    let space_entry = get_entry_from_eh(spaceEh.into())?;
    export_piece_inner("space", space_entry, destination_cell_id.clone())?;
  }
  /* Done */
  Ok(())
}


/// warning: duplicate struct in ludotheque zome
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ImportPieceInput {
  pub piece_type_name: String,
  pub piece_entry: Entry,
}

///
fn export_piece_inner(entry_type_name: &str, piece_entry: Entry, cell_id: CellId) -> ExternResult<()> {
  debug!("export_piece_inner() called: {}", entry_type_name);
  let input = ImportPieceInput {
    piece_type_name: entry_type_name.to_string(),
    piece_entry
  };
  let res = call(
    CallTargetCell::OtherCell(cell_id),
    "zPlayset",
    "import_piece".into(),
    None,
    input,
  )?;
  let _: () = decode_response(res)?;
  Ok(())
}
