const express = require("express");
let cheerio = require("cheerio");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const port = 3000;
let { PythonShell } = require("python-shell");
const request = require("request");
let cPage;
let initialRoll;
let strength;
let url;
let browserObj;
let pages, frame, frame2;
// let trigger=document.querySelector(".launch");
// trigger.addEventListener("click",function()
// {
//   fn();
// })
// We are using our packages here
app.use(bodyParser.json()); // to support JSON-encoded bodies

app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);
app.use(cors());

//You can use this to check if your server is working
app.get("/", (req, res) => {
  res.send("Welcome to your server");
});

//Route that handles login logic
app.post("/disp", (req, res) => {
  console.log(req.body.rollnumberinitial);
  console.log(req.body.strength);
  initialRoll = req.body.rollnumberinitial;
  strength = req.body.strength;
  fn();
});

//Start your server on a specified port
app.listen(port, () => {
  console.log(`Server is runing on port ${port}`);
});

//puppeteer code

//get the required library

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

//creating a browser

let status = false;
let link;
async function fn() {
  // for (let i = 0; i < strength; i++) {
  let browserStartPromise = puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      "--start-maximized",
      "--disable-notifications",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
  });

  browserObj = await browserStartPromise;
  // console.log(browserObj);
  pages = await browserObj.pages();
  //console.log(pages.length);
  cPage = pages[pages.length - 1];
  let aktuSite = cPage.goto(
    "http://erp.aktu.ac.in/webpages/oneview/oneview.aspx"
  );

  // let count=1;
  for (let i = 0; i < strength; i++) {
    console.log(i);
    // if(count==1)
    // {
    //   count=0;
    let waitForElement = await cPage.waitForSelector(`input[name="txtRollNo"]`);

    // let input = await cPage.$(`input[name="txtRollNo"]`);
    // await input.click({ clickCount: 3 })
    // await input.type(initialRoll);

    await new Promise(async function (resolve, reject) {
      await cPage.$eval('input[name="txtRollNo"]', (el) => (el.value = ""));
      await cPage.type(`input[name="txtRollNo"]`, initialRoll);
      resolve();
    });
    // await cPage.$eval('input[name="txtRollNo"]', el => el.value = '');
    // await cPage.type(`input[name="txtRollNo"]`, initialRoll, { delay: 50 });

    //the checkbox is nested inside an iframe, iframe is used to embed other sites into the current site
    //so to access it we need to access iframe first

    //accessing iframe

    await cPage.waitForSelector("iframe[title='reCAPTCHA']");
    const elementHandle = await cPage.$("iframe[title='reCAPTCHA']");

    //getting the frame elements
    frame = await elementHandle.contentFrame();

    //getting the checkbox inside that frame

    await frame.waitForSelector(".rc-anchor-content");
    let button = await frame.$(".rc-anchor-content");

    //clicking the checkbox
    await button.click();
    console.log("Hello");
    await chk();
    await dataExtract();
    await cPage.goBack();

    // }

    // async function cbr(error, response, html) {
    //   if (error) {
    //     console.log(error);
    //   } else if (response.statusCode == 404) {
    //     console.log("not found");
    //   } else {
    //     console.log("request completed");
    //   }
    // }

    // }
  }
}

async function chk() {
  try {
    return new Promise(function (resolve, reject) {
      let clearIntervalValue = null;
      clearIntervalValue = setInterval(async function () {
        await frame.waitForSelector('span[role="checkbox"]');
        let checkbox = await frame.$('span[role="checkbox"]');
        status = await frame.evaluate(
          (anc) => anc.getAttribute("aria-checked"),
          checkbox
        );
        console.log(status);

        if (status == "true") {
          clearInterval(clearIntervalValue);
          console.log("checked !!!!!!!!");
          await cPage.click(`input[name="btnSearch"]`);

          await cPage.waitForSelector(".col-md-6");

          // url = await cPage.url();
          // request(url, cbr);
          //  console.log(url);

          resolve();
        } else {
          try {
            console.log("not checked");
            await cPage.waitForSelector(
              "iframe[title='recaptcha challenge expires in two minutes']"
            );
            //console.log(cPage)
            const elementHandle2 = await cPage.$(
              "iframe[title='recaptcha challenge expires in two minutes']"
            );

            frame2 = await elementHandle2.contentFrame();
            // console.log(frame2);
            // sleep(1000);

            await frame2.waitForSelector(
              'button[title="Get an audio challenge"]'
            );
            let audio = await frame2.$(
              'button[title="Get an audio challenge"]'
            );
            // console.log(audio);
            let errorMsg = await frame2.$(".rc-audiochallenge-error-message");
            if (errorMsg == undefined) {
              await audio.click();
            }
            // do
            let ans = "";

            await frame2.waitForSelector(".rc-audiochallenge-tdownload-link");
            let down = await frame2.$(".rc-audiochallenge-tdownload-link");
            // const handle = await page.$('selector');
            let yourHref = await frame2.evaluate(
              (anchor) => anchor.getAttribute("href"),
              down
            );
            // console.log(yourHref);
            //downloadURI(yourHref,'./tmp');
            link = yourHref;
            const { DownloaderHelper } = require("node-downloader-helper");
            const dl = new DownloaderHelper(link, __dirname);

            dl.on("end", async function () {
              console.log("Download Completed");
              return await new Promise(async function (resolve, reject) {
                PythonShell.run("program.py", null, async function (err, res) {
                  // console.log(res);

                  while (res == null) {
                    console.log("waiting for text output");
                  }

                  (async function () {
                    ans = res[0];
                    console.log(ans);

                    await frame2.waitForSelector("#audio-response");
                    await frame2.type("#audio-response", ans);

                    await frame2.click(`button[id="recaptcha-verify-button"]`);
                    resolve();
                  })();

                  // done = await frame2.$("#audio-response");
                  // console.log(done);
                });
              });
            });
            dl.start();
            // f= await frame.$(".g-recaptcha-response");
            // continue start_position;
            //while(done==undefined);
          } catch (err) {}
        }
        // setTimeout(function () {
        //   chk();
        // }, 3000);
      }, 8000);
    });
  } catch (err) {}
}
async function dataExtract() {
  // await new Promise(async function (resolve, reject) {
  //   await cPage.waitForSelector(".col-md-6 thead tr td");
  //   resolve();
  // });

  //24th element for sgpa
  // console.log(sgpaa[23]);
  let value, value1, value2, value3, value4, value5;

  let resultArr = [];

  let sg1 = await cPage.$("#ctl04_ctl00_lblSGPA");
  if (sg1 != undefined) {
    value = await cPage.evaluate(function (e) {
      return e.textContent;
    }, sg1);
    resultArr.push(value.trim());
  }

  let sg2 = await cPage.$("#ctl04_ctl01_lblSGPA");
  if (sg2 != undefined) {
    value1 = await cPage.evaluate(function (e) {
      return e.textContent;
    }, sg2);
    resultArr.push(value1.trim());
  }

  let sg3 = await cPage.$("#ctl05_ctl00_lblSGPA");
  if (sg3 != undefined) {
    value2 = await cPage.evaluate(function (e) {
      return e.textContent;
    }, sg3);
    resultArr.push(value2.trim());
  }

  let sg4 = await cPage.$("#ctl05_ctl01_lblSGPA");

  if (sg4 != undefined) {
    value3 = await cPage.evaluate(function (e) {
      return e.textContent;
    }, sg4);
    resultArr.push(value3.trim());
  }

  let sg5 = await cPage.$("#ctl06_ctl00_lblSGPA");
  if (sg5 != undefined) {
    value4 = await cPage.evaluate(function (e) {
      return e.textContent;
    }, sg5);
    resultArr.push(value4.trim());
  }

  let sg6 = await cPage.$("#ctl06_ctl01_lblSGPA");
  if (sg6 != undefined) {
    value5 = await cPage.evaluate(function (e) {
      return e.textContent;
    }, sg6);
    resultArr.push(value5.trim());
  }

  console.log(initialRoll);

  for (let ress = 0; ress < resultArr.length; ress++) {
    console.log(resultArr[ress] + " ");
  }

  initialRoll = parseInt(initialRoll);
  ++initialRoll;
  initialRoll = initialRoll.toString();

  console.log("back");

  // count=1;
}

// async function sleep(milliseconds) {
//   const date = Date.now();
//   let currentDate = null;
//   do {
//     currentDate = Date.now();
//   } while (currentDate - date < milliseconds);
// }
