use hdk::prelude::*;
use hdk::prelude::CellId;
use holo_hash::EntryHashB64;

use zome_utils::*;
use crate::import_piece::ImportPieceInput;


#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportPieceInput {
  pub cell_id: CellId,
  pub piece_eh: EntryHashB64,
  pub piece_type_name: String,
}

#[hdk_extern]
pub fn export_piece(input: ExportPieceInput) -> ExternResult<()> {
  if input.piece_type_name == "space" {
    return error("space piece should be exported with 'export_space()' zome function");
  }
  if input.piece_type_name != "template"
    && input.piece_type_name != "SvgMarker"
    && input.piece_type_name != "EmojiGroup" {
    return error(&format!("unknown piece type: '{}'", input.piece_type_name));
  }
  let entry = get_entry_from_eh(input.piece_eh.into())?;
  export_entry(&input.piece_type_name, entry, input.cell_id.clone())?;
  Ok(())
}


///
pub fn export_entry(entry_type_name: &str, entry: Entry, cell_id: CellId) -> ExternResult<()> {
  debug!("export_entry(): {} - {:?}", entry_type_name, cell_id);
  let input = ImportPieceInput {
    piece_type_name: entry_type_name.to_string(),
    piece_entry: entry,
  };
  let res = call(
    CallTargetCell::OtherCell(cell_id),
    "where_playset",
    "import_piece".into(),
    None,
    input,
  )?;
  let _: () = decode_response(res)?;
  Ok(())
}
