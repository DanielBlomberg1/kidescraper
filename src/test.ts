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

  ScreenShot(page, "4");

  await clickByText(page, `Kirjaudu sisään`);
  console.log("pressed sign in");

  await Delay(500);

  ScreenShot(page, "5");

  await Delay(100);

  await page.click("#username");

  await page.keyboard.type(process.env.EMAIL);

  await Delay(500);

  await page.click("#password");

  await page.keyboard.type(process.env.PASSWORD);

  await Delay(500);

  await page.keyboard.press("Enter");

  await Delay(4000);

  ScreenShot(page, "6");
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

  await ScreenShot(page, "2");

  await Delay(500);
  await ScreenShot(page, "3");

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
      await Delay(200);
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
      timesReloaded++;
    }
  }
  await Delay(300);
  await page.click(
    "body > main > ui-view > o-page > o-section:nth-child(2) > o-content > o-grid > div > o-grid > div:nth-child(2) > o-material > ng-include > o-list > o-item > o-accent"
  );
  await Delay(500);
  console.log("we are half way there");

  await page.click("select");
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("ArrowDown");
  }

  await page.keyboard.press("Enter");

  await Delay(500);

  console.log("well make it i swear");

  await page.click(
    "body > o-dialog__container > o-dialog > form > o-dialog__footer > o-dialog__footer__content > button:nth-child(1)"
  );

  console.log("living on a prayer");
  await Delay(1000);
  await ScreenShot(page, "final");
  console.log("finished");
}

async function Test() {
  const url = "https://lichess.org/editor";
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  puppeteer.use(StealthPlugin());
  await page.goto(url);
  await Delay(1000);
  await page.click("#variants");

  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("ArrowDown");
  }

  await page.keyboard.press("Enter");
}

Main();

//Test();
