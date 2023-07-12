import { PublicJobSpider } from "./spiders/publicSector.js";
import chalk from "chalk";
(async () => {
  try {
    console.log(chalk.bold.green("Crawler initiated."));
    const publicJobSpider = new PublicJobSpider();
    await publicJobSpider.launch();
  } catch (error) {
    console.log(error);
  }
})();
