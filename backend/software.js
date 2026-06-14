const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const fs = require('fs');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest(testId, email, password, expectedResult) {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get('http://localhost:3000');

        await sleep(2000);

        // ✅ STEP 1: Click "LOG IN" button first
        let loginOpenBtn = await driver.findElement(By.xpath("//button[contains(text(),'Log In')]"));
        await loginOpenBtn.click();

        await sleep(2000);

        // ✅ STEP 2: Wait for form fields
        let emailField = await driver.wait(
            until.elementLocated(By.id('login-email')), 10000
        );
        await driver.wait(until.elementIsVisible(emailField), 10000);

        // ✅ STEP 3: Enter data slowly
        if (email !== "") {
            await emailField.sendKeys(email);
            await sleep(1000);
        }

        let passwordField = await driver.findElement(By.id('login-password'));

        if (password !== "") {
            await passwordField.sendKeys(password);
            await sleep(1000);
        }

        // ✅ STEP 4: Click submit button
        let submitBtn = await driver.findElement(By.css('.primary-btn'));
        await submitBtn.click();

        await sleep(3000);

        let actualResult;

        // ✅ STEP 5: Validate result
        let currentUrl = await driver.getCurrentUrl();

        if (currentUrl.includes('dashboard')) {
            actualResult = "Login Success";
        } else {
            actualResult = "Login Failed";
        }

        // 📸 Screenshot
        let image = await driver.takeScreenshot();
        fs.writeFileSync(`${testId}.png`, image, 'base64');

        if (actualResult === expectedResult) {
            console.log(`✅ ${testId}: PASS`);
        } else {
            console.log(`❌ ${testId}: FAIL`);
        }

        await sleep(2000);

    } catch (err) {
        console.log(`❌ ${testId}: ERROR - ${err.message}`);
    } finally {
        await driver.quit();
    }
}

// Run test cases
(async function () {

    await runTest("TC_01", "yss@gmail.com", "123456", "Login Success");
    await runTest("TC_02", "test@gmail.com", "wrong", "Login Failed");
    await runTest("TC_03", "wrong@gmail.com", "123456", "Login Failed");
    await runTest("TC_04", "", "", "Login Failed");
    await runTest("TC_05", "test@gmail.com", "", "Login Failed");

})();