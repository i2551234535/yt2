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
        }, 120 * 1000);
        browser = await webkit.launch({
            // headless: false,
        });

        const totalProfile = await ProfileModel.find({
            is_running: false,
        }).countDocuments();
        const profileData = await ProfileModel.findOne({
            is_running: false,
        }).skip(getRandomArbitrary(0, totalProfile));

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

            const random = getRandomArbitrary(0, 15);
            let timeout = getRandomArbitrary(40000, 80000);
            console.log('random:', random);
            if (random === 0) {
                await page.goto('https://m.youtube.com');
                timeout = 1000;
            } else if (random === 1) {
                await viewDirect(page, url);
            } else if (random === 2) {
                await viewAtYoutube(page, url);
            } else if (random === 3) {
                await viewAtReddit(page, url);
            } else if (random === 4) {
                await viewAtYoutubeSuggest(page, url);
            } else if (random === 5) {
                await viewAtFacebook(page, url);
            } else if (random === 6) {
                await viewAtTwitter(page, url);
            } else if (random === 7) {
                await viewAtIMDB(page, url);
            } else if (random === 8) {
                await viewAtYahoo(page, url);
            } else if (random === 9) {
                await viewAtESPN(page, url);
            } else if (random === 10) {
                await viewAtGsmArena(page, url);
            } else if (random === 11) {
                await viewAtCnet(page, url);
            } else if (random === 12) {
                await page.goto(
                    'http://gamevn.com/threads/youtube-clips-thu-gian-v56-di-mot-ngay-dang-luom-mot-dong-xu.1077912/page-1964',
                );
                timeout = 1000;
            } else {
                await viewRandomAtYoutube(page, url);
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

async function viewAtFacebook(page, url: string) {
    await page.goto('https://facebook.com');
    await page.waitForSelector('css=#forgot-password-link');
    await page.$eval(
        '#forgot-password-link',
        (element, url) => {
            element.setAttribute('href', url);
        },
        url,
    );
    await page.click('css=#forgot-password-link');
    await playVideo(page);
}
async function createLink(page: any, url: string) {
    await page.$eval(
        'body',
        (element, url) => {
            var node = document.createElement('a'); // Create a <li> node
            node.setAttribute('id', 'ahihi');
            node.setAttribute('href', url);
            element.appendChild(node);
        },
        url,
    );
    await page.$eval('#ahihi', (element) => {
        console.log(element);
        element.click();
    });
}

async function viewAtTwitter(page, url: string) {
    await page.goto('https://twitter.com');
    await delay(3000);
    await createLink(page, url);
    await playVideo(page);
}

async function viewAtIMDB(page, url: string) {
    await page.goto('https://www.imdb.com/');
    await delay(3000);
    await createLink(page, url);
    await playVideo(page);
}
async function viewAtYahoo(page, url: string) {
    await page.goto('https://yahoo.com');
    await delay(3000);
    await createLink(page, url);
    await playVideo(page);
}

async function viewAtESPN(page, url: string) {
    await page.goto('https://www.espn.com/');
    await delay(3000);
    await createLink(page, url);
    await playVideo(page);
}

async function viewAtGsmArena(page, url: string) {
    await page.goto('https://www.gsmarena.com/');
    await delay(3000);
    await createLink(page, url);
    await playVideo(page);
}
async function viewAtCnet(page, url: string) {
    await page.goto('https://www.cnet.com/');
    await delay(3000);
    await createLink(page, url);
    await playVideo(page);
}

async function viewRandomAtYoutube(page, url: string) {
    await page.goto('https://m.youtube.com');
    await page.waitForSelector('css=.large-media-item-thumbnail-container');
    const data = await page.$$('css=.large-media-item-thumbnail-container');
    await data[3].scrollIntoViewIfNeeded();
    await delay(1000);
    await data[3].hover();
    await data[3].click();
    await playVideo(page);
}
