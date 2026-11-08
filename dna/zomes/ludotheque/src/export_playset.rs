use hdk::prelude::*;

use zome_utils::*;
use ludotheque_integrity::*;


#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportPlaysetInput {
  pub destination_cell_id: CellId,
  pub playset_eh: EntryHashB64,
}

#[hdk_extern]
fn export_playset(ExportPlaysetInput{playset_eh, destination_cell_id}: ExportPlaysetInput) -> ExternResult<Vec<EntryHashB64>> {
  /* Get Playset */
  let playset_eh: EntryHash = playset_eh.into();
  let playset: Playset = match get_typed_from_eh(playset_eh.clone(), GetStrategy::Local) {
    Ok(p) => p,
    Err(_) => get_typed_from_eh(playset_eh, GetStrategy::Network)?,
  };
  /* Export each template */
  for eh in playset.templates {
    let entry = get_entry_local_or_network(eh.into())?;
    export_piece_inner("Template", entry, destination_cell_id.clone())?;
  }
  /* Export each svg marker */
  for eh in playset.svg_markers {
    let entry = get_entry_local_or_network(eh.into())?;
    export_piece_inner("SvgMarker", entry, destination_cell_id.clone())?;
  }
  /* Export each svg marker */
  for eh in playset.emoji_groups {
    let entry = get_entry_local_or_network(eh.into())?;
    export_piece_inner("EmojiGroup", entry, destination_cell_id.clone())?;
  }
  /* Export each space */
  for spaceEh in playset.spaces.clone() {
    let space_entry = get_entry_local_or_network(spaceEh.into())?;
    export_piece_inner("Space", space_entry, destination_cell_id.clone())?;
  }
  /* Done */
  Ok(playset.spaces)
}


/// Look locally first, then ask the network
fn get_entry_local_or_network(eh: EntryHash) -> ExternResult<Entry> {
  if let Ok(entry) = get_entry_from_eh(eh.clone(), GetStrategy::Local) {
    return Ok(entry);
  }
  get_entry_from_eh(eh, GetStrategy::Network)
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
