export async function avoidRender(
  slot: string,
  uuid: string,
  duration: number
) {
  let currentSlot = await logseq.Editor.getBlockProperty(uuid, "slot");
  let lastUpdatedAt = await logseq.Editor.getBlockProperty(uuid, "updatedAt");
  let currentTime = Date.now();
  let result = currentTime - lastUpdatedAt < duration && slot !== currentSlot;
  if (!result) {
    await logseq.Editor.upsertBlockProperty(uuid, "updatedAt", currentTime);
    await logseq.Editor.upsertBlockProperty(uuid, "slot", slot);
  }
  return result;
}
