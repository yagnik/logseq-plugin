import { fromJournalToIso } from "../../lib/date";
import { avoidRender } from "../../lib/inifinityAvoidance";
import { FLAG, RECOMPUTE_DURATION } from "./config";

async function clearChildren(children: { uuid: string }[]) {
  for (let child of children) {
    await logseq.Editor.removeBlock(child.uuid);
  }
}

async function getContentLinks(page: string) {
  let links = (await logseq.Editor.getPageLinkedReferences(page)) || [];

  return links
    .filter(([page, blocks]) => {
      return page && !!page["journalDay"] && blocks.length > 0;
    })
    .sort(([page1], [page2]) => {
      return (!!page1["journalDay"] && page1["journalDay"]) <
        (!!page2["journalDay"] && page2["journalDay"])
        ? 1
        : -1;
    })
    .map(([page, blocks]) => {
      return {
        content: `${fromJournalToIso(page["journalDay"] as number)} {{embed ((${
          blocks[0].uuid
        }))}}`,
      };
    });
}

async function main(currentBlock: string, page: string) {
  let block = await logseq.Editor.getBlock(currentBlock, {
    includeChildren: true,
  });
  block && clearChildren(block.children as { uuid: string }[]);
  await logseq.Editor.insertBatchBlock(
    currentBlock,
    await getContentLinks(page),
    { sibling: false }
  );
}

// {{renderer :autolog, create/incontext}}
export function register() {
  logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
    if (payload.arguments[0] !== FLAG) return;
    if (await avoidRender(slot, payload.uuid, RECOMPUTE_DURATION)) return;
    await main(payload.uuid, payload.arguments[1]);
  });
}
