import { devices, Route, webkit, WebKitBrowser } from 'playwright';
import { ProfileModel } from '../models/Profile.model';
import { delay } from './delay';
import Axios from 'axios';

const http = require('http');

function getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

const proxy = (route: Route, url, method, headers, data) => {
    return Axios.request({
        method: method as any,
        url,
        headers,
        data,
        proxy: {
            host: process.env.PROXY_HOST,
            port: Number(process.env.PROXY_PORT),
            auth: {
                username: process.env.PROXY_USER,
                password: process.env.PROXY_PASSWORD,
            },
            protocol: 'http',
        },
        responseType: 'arraybuffer',
        validateStatus: function (status) {
            return true;
        },
    })
        .then((data) => {
            // console.log(method, url);
            // console.log(data.status);
            return route.fulfill({
                status: data.status,
                body: data.data,
                headers: data.headers,
                // contentType: data.headers['content-type'],
                // path: data.headers['path'],
            });
        })
        .catch((e) => console.error(e));
};

export const view = async (url: string) => {
    let running = true;
    return new Promise(async (resolve, reject) => {
        const now = new Date().getTime();
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

        const totalProfile = await ProfileModel.find({}).countDocuments();
        const profileData = await ProfileModel.findOne({}).skip(getRandomArbitrary(0, totalProfile));

        profileData.is_running = true;
        await profileData.save();

        try {
            const device = devices[profileData.device_name];

            const context = await browser.newContext({
                ...device,
                timezoneId: profileData.timezone_id,
            });

            try {
                if (profileData.cookies) {
                    await context.addCookies(JSON.parse(profileData.cookies));
                }
            } catch (error) {}

            const page = await context.newPage();

            await page.route('**/*', (route) => {
                const url = route.request().url();
                const method = route.request().method();
                const headers = route.request().headers();
                const data = route.request().postData();

                // if (url.indexOf('googlevideo.com') > -1) {
                //     return route.continue();
                // }

                if (url.indexOf('/log_event') > -1) {
                    return route.continue();
                }
                if (url.indexOf('/atr') > -1) {
                    return proxy(route, url, method, headers, data);
                }
                if (url.indexOf('/pagead/id') > -1) {
                    return proxy(route, url, method, headers, data);
                }
                if (url.indexOf('/stats/watchtime') > -1) {
                    return proxy(route, url, method, headers, data);
                }
                if (url.indexOf('/stats/qoe') > -1) {
                    return proxy(route, url, method, headers, data);
                }
                if (url.indexOf('m.youtube.com/watch') > -1) {
                    return proxy(route, url, method, headers, data);
                }
                return route.continue();
            });

            const random = getRandomArbitrary(0, 2);
            let timeout = getRandomArbitrary(40000, 80000);
            console.log('random:', random);
            if (random === 0) {
                await page.goto('https://m.youtube.com');
                timeout = 1000;
            } else {
                await viewRandomAtYoutube(page);
            }

            await delay(timeout);
            await ProfileModel.findOneAndUpdate(
                {
                    _id: profileData._id,
                },
                {
                    $set: {
                        cookies: JSON.stringify(await context.cookies()),
                        last_time: now,
                    },
                },
            );
        } catch (error) {
            throw error;
        } finally {
            profileData.last_time = now;
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
        await page.waitForSelector('css=button.ytp-large-play-button', {
            timeout: 5000,
        });
        await page.hover('css=button.ytp-large-play-button');
        await page.click('css=button.ytp-large-play-button');
    } catch (error) {}
    try {
        await page.waitForSelector('css=button.ytp-unmute', {
            timeout: 5000,
        });
        await page.hover('css=button.ytp-unmute');
        await page.click('css=button.ytp-unmute');
    } catch (error) {}
    // try {
    //     await page.waitForSelector("//div[normalize-space(.)='Tap to unmute']/div[1]", {
    //         timeout: 5000,
    //     });
    //     await page.hover("//div[normalize-space(.)='Tap to unmute']/div[1]");
    //     await page.click("//div[normalize-space(.)='Tap to unmute']/div[1]");
    // } catch (error) {}
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
    return viewAtWeb(page, url, 'https://twitter.com');
}

async function viewAtIMDB(page, url: string) {
    return viewAtWeb(page, url, 'https://www.imdb.com/');
}
async function viewAtYahoo(page, url: string) {
    return viewAtWeb(page, url, 'https://yahoo.com');
}

async function viewAtESPN(page, url: string) {
    return viewAtWeb(page, url, 'https://www.espn.com/');
}

async function viewAtGsmArena(page, url: string) {
    return viewAtWeb(page, url, 'https://www.gsmarena.com/');
}
async function viewAtCnet(page, url: string) {
    return viewAtWeb(page, url, 'https://www.cnet.com/');
}

async function viewAtWeb(page, url: string, webUrl: string) {
    await page.goto(webUrl);
    await delay(3000);
    await createLink(page, url);
    await playVideo(page);
}

async function viewRandomAtYoutube(page) {
    await page.goto('https://m.youtube.com');
    await page.waitForSelector('css=.large-media-item-thumbnail-container');
    const data = await page.$$('css=.large-media-item-thumbnail-container');
    const itemIndex = getRandomArbitrary(1, data.length - 1);
    await data[itemIndex].scrollIntoViewIfNeeded();
    await delay(1000);
    await data[itemIndex].hover();
    await data[itemIndex].click();
    await playVideo(page);
}
