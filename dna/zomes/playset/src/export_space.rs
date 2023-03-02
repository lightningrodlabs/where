use hdk::prelude::*;
use holo_hash::EntryHashB64;

use zome_utils::*;
use playset_integrity::*;

use crate::export_piece::*;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportSpaceInput {
  pub cell_id: CellId,
  pub space_eh: EntryHashB64,
}


#[hdk_extern]
fn export_space(ExportSpaceInput{cell_id, space_eh}: ExportSpaceInput) -> ExternResult<Vec<EntryHashB64>> {
  let space_eh: EntryHash = space_eh.into();
  let space_entry = get_entry_from_eh(space_eh)?;
  let space = Space::try_from(space_entry.clone())?;
  /// Export template
  let piece_info = ExportPieceInput {
    piece_eh: space.origin.clone(),
    cell_id: cell_id.clone(),
    piece_type_name: "Template".to_string(),
  };
  let mut output = vec![space.origin];
  export_piece(piece_info)?;
  /// Export marker
  if let Some(marker_piece) = space.maybe_marker_piece {
    let piece_info = ExportPieceInput {
      cell_id: cell_id.clone(),
      piece_eh: marker_piece.eh().to_owned().into(),
      piece_type_name: marker_piece.type_name().to_string(),
    };
    output.push(piece_info.piece_eh.clone());
    export_piece(piece_info)?;
  }
  /// Export space
  export_entry("Space", space_entry, cell_id.clone())?;
  /// Done
  Ok(output)
}
