import { PublicJobSpider } from "./spiders/publicSector.js";

(async () => {
  try {
    console.log("Crawler initiated.");
    const publicJobSpider = new PublicJobSpider();
    await publicJobSpider.launch();
  } catch (error) {
    console.log(error);
  }
})();
