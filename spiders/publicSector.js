import puppeteer from "puppeteer";

/**
 * @description scrapes latest jobs advertised in public sector
 * by the Governement.
 */
export class PublicJobSpider {
  #name = "public jobs";
  #allowedDomains = ["https://www.govpage.co.za/"];
  constructor() {
    this.browser = null;
  }
  async launch() {
    try {
      this.browser = await puppeteer.launch({
        headless: false,
        executablePath:"C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
      });
      await this.crawl();
    } catch (error) {
      console.log(error);
    }
  }
  async crawl() {
    console.log(`"${this.#name}" spider initiated & is crawling.`);
    try {
      if (this.browser) {
        const page = await this.browser.newPage();
        // wait 1 minute by default for page.waitNavigation().
        page.setDefaultNavigationTimeout(100000);
        await page.goto(this.#allowedDomains[0]);
        const subscriptionModal = await page.$(".modalpop_overlay");

        const modalVisible = await subscriptionModal.isIntersectingViewport();
        if (modalVisible) {
          const subscriptionModalCloseButton = await page.$(".close_modal");
          subscriptionModalCloseButton.click();
        }

        const menu = await page.$('*[aria-label="Menu"]');
        menu.click();
        const elements = await page.$$(
          "ul li.wsite-menu-item-wrap a.wsite-menu-item"
        );
        let targetElement = null;
        for (const element of elements) {
          const textContent = await page.evaluate(
            (elem) => elem.textContent.toLowerCase().trim(),
            element
          );
          textContent.includes("updates") && (targetElement = element);
        }
        if (targetElement) {
          console.log(targetElement)
          await targetElement.click();
       
        }
      }
    } catch (error) {
      console.log(error.message);
      if (
        error.message == "Navigation timeout of 100000 ms exceeded" ||
        error.message ==
          "Cannot read properties of null (reading 'isIntersectingViewport')"
      ) {
        this.browser.close();
        await this.launch();
      }
    }
  }
}
