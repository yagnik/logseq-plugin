// Add an updated at field to ensure the renderer doesn't do infinite loop
// https://github.com/logseq/logseq/issues/6937

const SLOT_KEY = "_slot"
const UPDATED_KEY = "_updatedAt"

export async function avoidRender(
  slot: string,
  uuid: string,
  duration: number
) {
  let currentSlot: String = await logseq.Editor.getBlockProperty(uuid, SLOT_KEY);
  let lastUpdatedAt: number = await logseq.Editor.getBlockProperty(uuid, UPDATED_KEY);
  let currentTime = Date.now();
  let result = currentTime - lastUpdatedAt < duration && slot !== currentSlot;
  if (!result) {
    await logseq.Editor.upsertBlockProperty(uuid, UPDATED_KEY, currentTime);
    await logseq.Editor.upsertBlockProperty(uuid, SLOT_KEY, slot);
  }
  return result;
}
