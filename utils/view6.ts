import { devices, webkit, WebKitBrowser } from 'playwright';
import { ProfileModel } from '../models/Profile.model';
import { delay } from './delay';

function getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

export const view = async (url: string) => {
    let running = true;
    return new Promise(async (resolve, reject) => {
        let browser: undefined | WebKitBrowser;
        setTimeout(async () => {
            if (running) {
                if (browser) await browser.close();
                reject(new Error('Timeout'));
            }
        }, 100 * 1000);
        browser = await webkit.launch({
            // headless: false,
        });

        const totalProfile = await ProfileModel.find({
            is_running: false,
        }).countDocuments();
        const profileData = await ProfileModel.findOne({
            is_running: false,
        }).skip(getRandomArbitrary(0, totalProfile));

        console.log(profileData);

        profileData.is_running = true;
        await profileData.save();

        try {
            const device = devices[profileData.device_name];

            const context = await browser.newContext({
                ...device,
                timezoneId: profileData.timezone_id,
            });

            if (profileData.cookies) {
                await context.addCookies(JSON.parse(profileData.cookies));
            }

            const page = await context.newPage();

            const random = getRandomArbitrary(0, 13);

            let timeout = getRandomArbitrary(40000, 80000);
            if (random < 3) {
                await page.goto(
                    'http://gamevn.com/threads/youtube-clips-thu-gian-v56-di-mot-ngay-dang-luom-mot-dong-xu.1077912/page-1964',
                );
                timeout = 1000;
            } else if (random < 5) {
                await viewDirect(page, url);
            } else if (random < 7) {
                await viewAtYoutube(page, url);
            } else if (random < 9) {
                await viewAtReddit(page, url);
            } else {
                await viewAtYoutubeSuggest(page, url);
            }

            await delay(timeout);
            await ProfileModel.findOneAndUpdate(
                {
                    _id: profileData._id,
                },
                {
                    $set: {
                        cookies: JSON.stringify(await context.cookies()),
                        is_running: false,
                    },
                },
            );
        } catch (error) {
            throw error;
        } finally {
            profileData.is_running = false;
            await profileData.save();
            await browser.close();
            resolve();
        }
    });
};

async function viewAtYoutubeSuggest(page, url: string) {
    await page.goto('https://m.youtube.com');
    await page.waitForSelector('css=.large-media-item-thumbnail-container');
    const data = await page.$$('css=.large-media-item-thumbnail-container');
    await data[3].scrollIntoViewIfNeeded();
    await delay(1000);
    await data[3].hover();
    await data[3].click();
    await playVideo(page);
    try {
        console.log('+++++');
        await page.waitForSelector('css=.compact-media-item-image', {
            timeout: 5000,
        });
        const data = await page.$$('css=.compact-media-item-image');
        await page.$$eval(
            '.compact-media-item-image',
            (elements, url) => {
                elements[3].setAttribute('href', url);
            },
            url,
        );
        await data[3].scrollIntoViewIfNeeded();
        await delay(1000);
        await data[3].hover();
        await data[3].click({
            timeout: 5000,
        });
        await playVideo(page);
    } catch (error) {
        console.log(error);
        try {
            console.log('+++++');
            await page.waitForSelector('css=.large-media-item-thumbnail-container', {
                timeout: 5000,
            });
            const data = await page.$$('css=.large-media-item-thumbnail-container');
            await page.$$eval(
                '.large-media-item-thumbnail-container',
                (elements, url) => {
                    elements[3].setAttribute('href', url);
                },
                url,
            );
            await data[3].scrollIntoViewIfNeeded();
            await delay(1000);
            await data[3].hover();
            await data[3].click({
                timeout: 5000,
            });
            await playVideo(page);
        } catch (error) {
            console.log(error);
        }
    }
}

async function viewDirect(page, url: string) {
    await page.goto(url);
    await playVideo(page);
}

async function viewAtYoutube(page, url: string) {
    await page.goto('https://m.youtube.com');
    await page.waitForSelector('css=.large-media-item-thumbnail-container');
    const data = await page.$$('css=.large-media-item-thumbnail-container');
    await page.$$eval(
        '.large-media-item-thumbnail-container',
        (elements, url) => {
            elements[3].setAttribute('href', url);
        },
        url,
    );
    await data[3].scrollIntoViewIfNeeded();
    await delay(1000);
    await data[3].hover();
    await data[3].click();
    await playVideo(page);
}

async function viewAtReddit(page, url: string) {
    await page.goto('https://www.reddit.com/r/youtube/comments/hvry3l/youtube_deprecating_5_features_in_playlists/');
    try {
        await page.click('text="Continue"', {
            timeout: 5000,
        });
    } catch (error) {}

    await page.$eval(
        '//*[@id="t3_hvry3l"]/div[2]/div/div/div/div/p[2]/a',
        (element, url) => {
            element.setAttribute('href', url);
        },
        url,
    );
    await page.click('//*[@id="t3_hvry3l"]/div[2]/div/div/div/div/p[2]/a');
    await playVideo(page);
}

async function playVideo(page) {
    try {
        await page.waitForSelector('button[aria-label="Play"]', {
            timeout: 5000,
        });
        await page.hover('button[aria-label="Play"]');
        await page.click('button[aria-label="Play"]');
    } catch (error) {}
    try {
        await page.waitForSelector("//div[normalize-space(.)='Tap to unmute']/div[1]", {
            timeout: 5000,
        });
        await page.hover("//div[normalize-space(.)='Tap to unmute']/div[1]");
        await page.click("//div[normalize-space(.)='Tap to unmute']/div[1]");
    } catch (error) {}
}
