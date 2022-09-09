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

  await Delay(1000);

  ScreenShot(page, "4");

  await clickByText(page, `Kirjaudu sisään`);
  console.log("pressed sign in");

  await Delay(1000);

  ScreenShot(page, "5");

  await Delay(2000);

  await page.click("#username");

  await page.keyboard.type(process.env.EMAIL);

  await Delay(500);

  await page.click("#password");

  await page.keyboard.type(process.env.PASSWORD);

  await Delay(1000);

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
    await page.goto(process.env.URL_TO_SCRAPE);
  } catch (error) {
    LogErr("event page doesnt exit");
  }

  await Delay(4000);

  ScreenShot(page, "2");

  // close annoying banner

  await page.click("button.o-card__footer__right.o-button.o-button--accent");

  await Delay(3000);
  ScreenShot(page, "3");

  // sign in
  await SignIn(page);

  await Delay(10000);

  let isOnSale = false;
  while (!isOnSale) {
    if (
      (await page.$(
        "body > main > ui-view > o-page > o-section:nth-child(2) > o-content > o-grid > div > o-grid > div:nth-child(2) > o-material > ng-include > o-list > o-item > o-accent"
      )) !== null
    ) {
      console.log("is on sale");
      isOnSale = true;
    } else {
      console.log("reloading page");
      Delay(200);
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    }
  }
  await page.click(
    "body > main > ui-view > o-page > o-section:nth-child(2) > o-content > o-grid > div > o-grid > div:nth-child(2) > o-material > ng-include > o-list > o-item > o-accent"
  );
  Delay(100);
  console.log("we are half way there");
  await page.select("select", process.env.AMOUNT_OF_TICKETS);
  Delay(100);

  console.log("well make it i swear");

  await page.click(
    "body > o-dialog__container > o-dialog > form > o-dialog__footer > o-dialog__footer__content > button:nth-child(1)"
  );

  console.log("living on a prayer");
  Delay(1000);
  ScreenShot(page, "final");
  console.log("finished");
}

Main();
