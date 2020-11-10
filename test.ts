import { devices, webkit } from 'playwright';

const run = async () => {
    const device = devices['iPhone 11'];
    const context = await webkit.launchPersistentContext('./profiles_test/1', {
        headless: false,
        ...device,
    });

    // const context = await browser.newContext({
    //     ...device,
    // });

    const page = await context.newPage();

    await page.goto('https://fingerprintjs.com/demo');
    // await context.close();
};

run();
