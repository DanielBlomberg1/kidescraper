const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

require("dotenv").config({
  path: "./.env",
});

const escapeXpathString = (str) => {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
};

const clickByText = async (page, text) => {
  const escapedText = escapeXpathString(text);
  const linkHandlers = await page.$x(
    `//o-menu-item[contains(text(), ${escapedText})]`
  );

  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error(`Link not found: ${text}`);
  }
};

const Delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const LogErr = (explanation = "Standard error") => {
  console.log("Encountered error " + explanation);
};

const ScreenShot = async (page, picname) => {
  const filepath = "./src/pictures/" + picname + ".png";
  await page.screenshot({ path: filepath });
};

const SignIn = async (page) => {
  await page.click(".o-action-chip--primary-dark");

  await Delay(500);

  await clickByText(page, `Kirjaudu sisään`);
  console.log("pressed sign in");

  await Delay(500);

  await Delay(100);

  await page.click("#username");

  await page.keyboard.type(process.env.EMAIL);

  await Delay(500);

  await page.click("#password");

  await page.keyboard.type(process.env.PASSWORD);

  await Delay(500);

  await page.keyboard.press("Enter");

  await Delay(4000);
};

async function Main() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  puppeteer.use(StealthPlugin());

  page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36"
  );

  try {
    await page.goto(process.env.URL_TO_SCRAPE, {
      waitUntil: ["networkidle0", "domcontentloaded"],
    });
  } catch (error) {
    LogErr("event page doesnt exit");
  }

  await Delay(500);

  // sign in
  await SignIn(page);

  await Delay(500);

  let isOnSale = false;
  let timesReloaded = 0;
  while (!isOnSale) {
    if (
      (await page.$(
        "body > main > ui-view > o-page > o-section:nth-child(2) > o-content > o-grid > div > o-grid > div:nth-child(2) > o-material > ng-include > o-list > o-item > o-accent"
      )) !== null
    ) {
      console.log("is on sale");
      isOnSale = true;
    } else {
      let today = new Date();
      console.log(
        timesReloaded,
        ": reloading page ",
        "the time is: " +
          today.getHours() +
          ":" +
          today.getMinutes() +
          ":" +
          today.getSeconds()
      );
      await Delay(50);
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
      timesReloaded++;
    }
  }
  await Delay(300);
  await page.click(
    "body > main > ui-view > o-page > o-section:nth-child(2) > o-content > o-grid > div > o-grid > div:nth-child(2) > o-material > ng-include > o-list > o-item > o-accent"
  );
  await Delay(500);
  console.log("tickets are on sale");

  await page.click("select");
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("ArrowDown");
  }

  await page.keyboard.press("Enter");

  await Delay(500);

  console.log("selected 4 tickets");
  console.log("trying to reserve...");

  await page.click(
    "body > o-dialog__container > o-dialog > form > o-dialog__footer > o-dialog__footer__content > button:nth-child(1)"
  );

  await Delay(1000);
  await ScreenShot(page, "final");
  console.log("successfully reserved 4 tickets for the event");
}

Main();
