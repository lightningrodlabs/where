use hdk::prelude::*;
use holo_hash::EntryHashB64;

use zome_utils::*;
use crate::*;
use crate::export_piece::*;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportSpaceInput {
  pub space_eh: EntryHashB64,
  pub cell_id: CellId,
}


#[hdk_extern]
fn export_space(input: ExportSpaceInput) -> ExternResult<()> {
  let space_eh: EntryHash = input.space_eh.into();
  let space_entry = get_entry_from_eh(space_eh)?;
  let space = Space::try_from(space_entry.clone())?;
  /// Export template
  let piece_info = ExportPieceInput {
    piece_eh: space.origin,
    cell_id: input.cell_id.clone(),
    piece_type_name: "template".to_string(),
  };
  export_piece(piece_info)?;
  /// Export marker
  if let Some(marker_piece) = space.maybe_marker_piece {
    let piece_info = ExportPieceInput {
      cell_id: input.cell_id.clone(),
      piece_eh: marker_piece.eh().to_owned().into(),
      piece_type_name: marker_piece.type_name().to_string(),
    };
    export_piece(piece_info)?;
  }
  /// Export space
  export_entry("space", space_entry, input.cell_id.clone())?;
  /// Done
  Ok(())
}
