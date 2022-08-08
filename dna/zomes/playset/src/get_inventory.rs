use hdk::prelude::*;
use holo_hash::EntryHashB64;

use playset_integrity::*;

use crate::*;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetInventoryOutput {
  pub templates: Vec<EntryHashB64>,
  pub svg_markers: Vec<EntryHashB64>,
  pub emoji_groups: Vec<EntryHashB64>,
  pub spaces: Vec<EntryHashB64>,
}

#[hdk_extern]
pub fn get_inventory(_: ()) -> ExternResult<GetInventoryOutput> {
  /// Get templates
  let base = get_templates_path().path_entry_hash()?;
  let links = get_links(base, PlaysetLinkType::All, None)?;
  let templates = links.iter().map(|link| link.target.clone().into_entry_hash().unwrap().into()).collect();
  /// Get svg_markers
  let base = get_svg_marker_path().path_entry_hash()?;
  let links = get_links(base, PlaysetLinkType::All, None)?;
  let svg_markers = links.iter().map(|link| link.target.clone().into_entry_hash().unwrap().into()).collect();
  /// Get emoji_groups
  let base = get_emoji_group_path().path_entry_hash()?;
  let links = get_links(base, PlaysetLinkType::All, None)?;
  let emoji_groups = links.iter().map(|link| link.target.clone().into_entry_hash().unwrap().into()).collect();
  /// Get spaces
  let base = get_spaces_path().path_entry_hash()?;
  let links = get_links(base, PlaysetLinkType::All, None)?;
  let spaces = links.iter().map(|link| link.target.clone().into_entry_hash().unwrap().into()).collect();
  /// Done
  let inventory = GetInventoryOutput {
    spaces,
    svg_markers,
    emoji_groups,
    templates,
  };
  Ok(inventory)
}
