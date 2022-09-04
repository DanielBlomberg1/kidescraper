const puppeteer = require("puppeteer");
require("dotenv").config({
  path: "./.env",
});

const escapeXpathString = (str) => {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
};

const clickByText = async (page, type, text) => {
  const escapedText = escapeXpathString(text);
  const linkHandlers = await page.$x(
    `//${type}[contains(text(), ${escapedText})]`
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


const ScreenShot = async(page, picname) => {
  const filepath = "./src/pictures/" + picname + ".png";
  await page.screenshot({ path:  filepath});
};



async function Main() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36"
  );

  await page.setDefaultNavigationTimeout(0); 

  // make sure kide app is online

  try {
    await page.goto("https://kide.app");
  } catch (error) {
    LogErr("page offline");
  }

  await Delay(4000);

  ScreenShot(page, "1");

  // go to right event page

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

  await page.click("o-action-chip.o-action-chip--primary-dark");

  await Delay(3000);

  ScreenShot(page, "4");

  await clickByText(page, "o-menu-item", `Kirjaudu sisään`);

  await Delay(3000);

  ScreenShot(page, "5");

  await page.$eval(
    "#username",
    (el, email) => (el.value = email),
    process.env.EMAIL
  );

  await page.$eval(
    "#password",
    (el, psw) => (el.value = psw),
    process.env.PASSWORD
  );

  await Delay(3000);

  //await page.click(".o-button--flat");

  await Delay(6000);

  ScreenShot(page, "6");

  let content = await page.content();
  // console.log(content);
  await browser.close();
}

Main();
