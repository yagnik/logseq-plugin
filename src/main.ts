import "@logseq/libs";
// import { register as AutoLogRegister } from "./plugins/autolog";
import { register as ValidatorRegister } from "./plugins/validator";

const main = async () => {
  // await AutoLogRegister();
  await ValidatorRegister();
};

logseq.ready(main).catch(console.error);
