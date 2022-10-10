import { avoidRender } from "../../lib/inifinityAvoidance";
import { FLAG, RECOMPUTE_DURATION } from "./config";
import { z as d, ZodObject } from "zod";
import { fromZodError } from "zod-validation-error";
import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user";

function getSchema(raw: string) {
  try {
    // @ts-ignore
    // just a hack so that z can be used inside eval
    const z = d;
    return eval(raw);
  } catch (error) {
    console.log(error);
  }
}

function validate(
  raw: string,
  data: { name: string; properties: any; parse?: any }[]
) {
  let r: ZodObject<any> = getSchema(raw);

  return data.map((row) => {
    row["parse"] = r.safeParse(row.properties);
    return row;
  });
}

function logErrors(result: { name: string; parse?: any }[]) {
  let str = [];
  str.push("|name|errors|");
  str.push("|--|--|");
  result.map((row) => {
    if (!row.parse.success) {
      str.push(`|${row.name}|${fromZodError(row.parse.error)}|`);
    }
  });
  return str.join("\n");
}

async function main(currentBlock: string, page: string) {
  let block = await logseq.Editor.getBlock(currentBlock, {
    includeChildren: true,
  });
  if (block ? ["children"].length < 1 : true) return;

  // @ts-ignore
  let raw = block!.children![0].content.match(/^\`\`\`([^\`]*?)\`\`\`$/)[1];
  console.log("RAW", raw);

  let pages = await logseq.Editor.getPagesTreeFromNamespace(page);
  let data = pages!.map(async (page) => {
    return {
      name: page.name,
      properties: await logseq.Editor.getBlockProperties(
        (await logseq.Editor.getPage(page.id))!.uuid
      ),
    };
  });
  let validatedData = validate(raw, await Promise.all(data));
  let markdownErrors = logErrors(validatedData);
  // @ts-ignore
  let markdownBlock: BlockEntity = block!.children![1];

  if (block) {
    await logseq.Editor.updateBlock(markdownBlock.uuid, markdownErrors);
  } else {
    await logseq.Editor.insertBlock(currentBlock, markdownErrors, {
      sibling: false,
    });
  }
}

// {{renderer :validate, people}}
export function register() {
  logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
    if (payload.arguments[0] !== FLAG) return;
    if (await avoidRender(slot, payload.uuid, RECOMPUTE_DURATION)) return;
    await main(payload.uuid, payload.arguments[1]);
  });
}
