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
      });
      await this.crawl();
    } catch (error) {
      consoole.log(error);
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
          await targetElement.click();
          page.waitForNavigation();
          const newUrl = page.url();
          if (newUrl !== this.#allowedDomains[0]) {
            console.log("URL has changed:", newUrl);
          }

          const { width, height } = await page.evaluate(() => ({
            width: window.innerWidth,
            height: window.innerHeight,
          }));

          const centerX = Math.floor(width / 2);
          const centerY = Math.floor(height / 2);

          await page.mouse.click(centerX, centerY);

          //   // Wait for the URL to change

          //   // Click on the #dismiss-button element if it exists
          //   const adModalCloseButton = await page.$("#dismiss-button");
          //   const adModalVisible =
          //     await adModalCloseButton.isIntersectingViewport();
          //   if (adModalVisible) {
          //     adModalCloseButton.click();
          //   }

          //   if (adModal) {
          //     await adModal.click();
          //   }

          //   // Wait for the URL to change
          //   await page.waitForNavigation();

          //   // Check if the URL has changed
        }
      }
    } catch (error) {
      console.log(error.message);
      //   console.log(error);
    } finally {
      //   this.browser.close();
    }
  }
}
