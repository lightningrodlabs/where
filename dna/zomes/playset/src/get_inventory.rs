use hdk::prelude::*;
use zome_fn_input::*;

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

fn get_anchor_targets(path: TypedPath, strategy: GetStrategy) -> ExternResult<Vec<EntryHashB64>> {
  let base = path.path_entry_hash()?;
  let links = get_links(LinkQuery::try_new(base, PlaysetLinkType::All)?, strategy)?;
  Ok(links.into_iter()
    .filter_map(|link| link.target.into_entry_hash())
    .map(|eh| eh.into())
    .collect())
}

#[hdk_extern]
pub fn get_inventory(input: ZomeFnInput<()>) -> ExternResult<GetInventoryOutput> {
  let strategy = input.get_strategy();
  let inventory = GetInventoryOutput {
    templates: get_anchor_targets(get_templates_path()?, strategy)?,
    svg_markers: get_anchor_targets(get_svg_marker_path()?, strategy)?,
    emoji_groups: get_anchor_targets(get_emoji_group_path()?, strategy)?,
    spaces: get_anchor_targets(get_spaces_path()?, strategy)?,
  };
  Ok(inventory)
}
