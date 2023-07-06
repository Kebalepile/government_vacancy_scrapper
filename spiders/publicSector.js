import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
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
  /**
   * @param {String} file
   * @returns String: file path
   */
  #databasePath(file = "none") {
    const currentFilePath = fileURLToPath(import.meta.url);
    const directoryPath = path.dirname(currentFilePath);
    return path.join(directoryPath, "..", "database", `${file}.json`);
  }
  async launch() {
    try {
      this.browser = await puppeteer.launch({
        headless: "new",
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
      const errors = [
        "Node is either not clickable or not an HTMLElement",
        "Navigation timeout of 100000 ms exceeded",
        "Cannot read properties of null (reading 'isIntersectingViewport')",
      ];
      if (errors.includes(error.message)) {
        console.log(`${this.#name} restarting`);
        console.clear();
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

            await this.#advertLinks(page);
          } else {
            fs.writeFile(
              this.#databasePath(this.#date("date")),
              JSON.stringify(
                {
                  text: "No job posts for today",
                  date: this.#date("date"),
                },
                null,
                4
              ),
              (error) =>
                error
                  ? console.log(error.message)
                  : console.log(`${this.#date("date")}.json save to database`)
            );
            this.browser.close();
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
  async #advertLinks(page) {
    try {
      const advertList = async () => {
        const date = this.#date("date").toLowerCase();

        if (page.url().includes(date)) {
          const posts = {
            list: [],
            total: 0,
          };

          const elementHandles = await page.$$("[id^='blog-post-'] a");
          console.log(elementHandles);
          if (elementHandles.length) {
            clearInterval(intervalId);
            for (let i = 0; i < elementHandles.length; i++) {
              const elementHandle = elementHandles[i];

              const elemObject = await page.evaluate(
                (elem) => ({
                  text: elem.textContent.trim(),
                  sourceLink: elem.href,
                }),
                elementHandle
              );

              i == 0
                ? (posts["date"] = elemObject.text)
                : (() => {
                    if (elemObject.text.length) {
                      posts["list"].push(elemObject);
                      posts.total++;
                    }
                  })();
            }

            console.log(posts);

            if (posts.total) {
              fs.writeFile(
                this.#databasePath(posts.date),
                JSON.stringify(posts, null, 4),
                (error) =>
                  error
                    ? console.log(error.message)
                    : (() => {
                        console.log(
                          `Data written to ${posts.date}.json file successfully. `
                        );
                        console.log(`${this.#name} is disconnected.`);
                        this.browser.close();
                      })()
              );
            }
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
