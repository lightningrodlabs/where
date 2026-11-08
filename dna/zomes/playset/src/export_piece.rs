use hdk::prelude::*;

use zome_utils::*;
use crate::import_piece::ImportPieceInput;


#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportPieceInput {
  pub cell_id: CellId,
  pub piece_eh: EntryHashB64,
  pub piece_type_name: String, // FIXME use UnitEntryTypes and AppEntryTypeName
}

/// Look locally first, then ask the network
pub fn get_entry_local_or_network(eh: EntryHash) -> ExternResult<Entry> {
  if let Ok(entry) = get_entry_from_eh(eh.clone(), GetStrategy::Local) {
    return Ok(entry);
  }
  get_entry_from_eh(eh, GetStrategy::Network)
}

#[hdk_extern]
pub fn export_piece(input: ExportPieceInput) -> ExternResult<()> {
  if input.piece_type_name == "Space" {
    return zome_error!("space piece should be exported with 'export_space()' zome function");
  }
  if input.piece_type_name != "Template"
    && input.piece_type_name != "SvgMarker"
    && input.piece_type_name != "EmojiGroup" {
    return zome_error!("unknown piece type: '{}'", input.piece_type_name);
  }
  let entry = get_entry_local_or_network(input.piece_eh.into())?;
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
    "zPlayset",
    "import_piece".into(),
    None,
    input,
  )?;
  let _: () = decode_response(res)?;
  Ok(())
}
