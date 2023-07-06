import puppeteer from "puppeteer";

/**
 * @description scrapes latest jobs advertised in public sector
 * by the Governement.
 */
export class PublicJobSpider {
  #name = "public jobs";
  #allowedDomains = [
    "https://www.govpage.co.za/",
    "https://www.govpage.co.za/latest-govpage-updates",
  ];
  constructor() {
    this.browser = null;
  }
  async launch() {
    try {
      this.browser = await puppeteer.launch({
        headless: false,
        executablePath:
          "C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
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
        menu?.click();
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
          await this.#latestUpdates(page);
        }
      }
    } catch (error) {
      console.log(error.message);
      if (
        error.message == "Navigation timeout of 100000 ms exceeded" ||
        error.message ==
          "Cannot read properties of null (reading 'isIntersectingViewport')"
      ) {
        console.log(`${this.#name} restarting`);
        this.browser.close();
        await this.launch();
      }
    }
  }
  /***
   * @param {Object} page
   * @description Get's currenly advertised government jobs for the current day.
   */
  async #latestUpdates(page) {
    try {
      const updates = async () => {
        if (page.url().includes(this.#allowedDomains[1])) {
          clearInterval(intervalId);

          const currentDate = this.#date("date")
            .toUpperCase()
            .replaceAll("-", " ");
          page.waitForNavigation();
          const elementHandles = await page.$$(".blog-title-link");

          const targetHandle = await elementHandles.reduce(
            async (targetHandle, elementHandle) => {
              const textContent = await page.evaluate(
                (elem) => elem.textContent,
                elementHandle
              );
              if (textContent.includes(currentDate)) {
                targetHandle = elementHandle;
                return targetHandle;
              }
              return targetHandle;
            },
            null
          );

          if (targetHandle) {
            await targetHandle?.click();

            this.#advertLinks(page);
          } 
        }
      };

      const intervalId = setInterval(() => {
        updates();
      }, 5000);
    } catch (error) {
      console.log(error.message);
    }
  }
  #advertLinks(page) {
    try {
      const advertList = async () => {
        const date = this.#date("date").toLowerCase();

        if (page.url().includes(date)) {
          clearInterval(intervalId);
          const elementHandles = await page.$x(
            '//*[@id="blog-post-175300862913840118"]/div[3]/div[6]/strong/font[1]/a'
          );
          console.log(elementHandles);
          for (const elementHandle of elementHandles) {
            const textContent = await page.evaluate(
              (elem) => elem.textContent,
              elementHandle
            );
            console.log(textContent);
          }
        }
      };
      const intervalId = setInterval(() => {
        advertList();
      }, 5000);
    } catch (error) {
      console.log(error.message);
    }
  }
  /***
   * @description Get's  the current date and time.
   * @returns date string
   *
   */
  #date(type = "") {
    try {
      const pad = (num) => num.toString().padStart(2, "0"),
        date = new Date(),
        year = date.getFullYear(),
        month = date.toLocaleString("default", { month: "long" }),
        day = date.getDate(),
        hour = date.getHours(),
        minute = date.getMinutes(),
        second = date.getSeconds();

      const currentDate = `${day}-${pad(month)}-${pad(year)}`;
      const currentTime = ` ${pad(hour)}:${pad(minute)}:${pad(second)}`;
      switch (type.trim().toLowerCase()) {
        case "date":
          return currentDate;
        case "time":
          return currentTime;
        default:
          return {
            date: currentDate,
            time: currentTime,
          };
      }
    } catch (error) {
      console.log(error.message);
    }
  }
}
