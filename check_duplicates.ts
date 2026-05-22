
import catalog from './src/data/amplitube5_gear_catalog.json';

const guids = new Map();
const duplicates = [];

catalog.forEach(item => {
  if (guids.has(item.guid)) {
    duplicates.push({ guid: item.guid, names: [guids.get(item.guid), item.display_name] });
  } else {
    guids.set(item.guid, item.display_name);
  }
});

if (duplicates.length > 0) {
  console.log('Found duplicate GUIDs in catalog:');
  console.log(JSON.stringify(duplicates, null, 2));
} else {
  console.log('No duplicate GUIDs found in catalog.');
}
