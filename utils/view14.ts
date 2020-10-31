import { devices, Route, webkit, WebKitBrowser } from 'playwright';
import { ProfileModel } from '../models/Profile.model';
import { delay } from './delay';
import Axios from 'axios';
const SocksProxyAgent = require('socks-proxy-agent');

const http = require('http');

function getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

const { PROXY_SOCK5, PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASSWORD } = process.env;

const proxyHTTPS = (route: Route, url, method, headers, data) => {
    const httpsAgent = new SocksProxyAgent(PROXY_SOCK5);
    return Axios.request({
        method: method as any,
        url,
        headers,
        data,
        httpsAgent,
        responseType: 'arraybuffer',
        validateStatus: function (status) {
            return true;
        },
    })
        .then((data) => {
            console.log(method, url);
            console.log(data.status);
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

const proxyHTTP = (route: Route, url, method, headers, data) => {
    return Axios.request({
        method: method as any,
        url,
        headers,
        data,
        proxy: {
            host: PROXY_HOST,
            port: Number(PROXY_PORT),
            auth: {
                username: PROXY_USER,
                password: PROXY_PASSWORD,
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
        }, 5 * 60 * 1000);
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
                timezoneId: profileData.cookies ? 'Asia/Saigon' : profileData.timezone_id,
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

                if (url.indexOf('googlevideo.com') > -1) {
                    return route.continue();
                }

                if (url.indexOf('youtube.com') > -1) {
                    if (url.indexOf('/youtubei/') > -1) {
                        return proxyHTTPS(route, url, method, headers, data);
                    }
                    if (url.indexOf('/pagead/') > -1) {
                        return proxyHTTP(route, url, method, headers, data);
                    }
                    if (url === 'https://m.youtube.com/') {
                        return proxyHTTP(route, url, method, headers, data);
                    }
                    if (url === 'https://m.youtube.com') {
                        return proxyHTTP(route, url, method, headers, data);
                    }
                    if (url.indexOf('/atr') > -1) {
                        return proxyHTTP(route, url, method, headers, data);
                    }
                    if (url.indexOf('/pagead/') > -1) {
                        return proxyHTTP(route, url, method, headers, data);
                    }
                    if (url.indexOf('/api/stats/') > -1) {
                        return proxyHTTP(route, url, method, headers, data);
                    }
                    if (url.indexOf('/ptracking') > -1) {
                        return proxyHTTP(route, url, method, headers, data);
                    }
                    if (url.indexOf('/get_video_info') > -1) {
                        return proxyHTTP(route, url, method, headers, data);
                    }
                    if (url.indexOf('/csi_204') > -1) {
                        return proxyHTTP(route, url, method, headers, data);
                    }
                    if (url.indexOf('/pcs/') > -1) {
                        return proxyHTTP(route, url, method, headers, data);
                    }
                    if (url.indexOf('m.youtube.com/watch') > -1) {
                        return proxyHTTP(route, url, method, headers, data);
                    }
                    if (url.indexOf('/generate_204') > -1) {
                        return proxyHTTP(route, url, method, headers, data);
                    }
                    if (url.indexOf('/get_midroll_info') > -1) {
                        return proxyHTTP(route, url, method, headers, data);
                    }
                    return route.continue({
                        headers: {
                            'User-Agent':
                                'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
                            Accept: '*/*',
                            'Accept-Language': 'en-US,en;q=0.5',
                        },
                    });
                }

                return route.continue({
                    headers: {},
                });
            });

            const random = getRandomArbitrary(0, 60);
            let timeout = getRandomArbitrary(3 * 60 * 1000, 4 * 60 * 1000);
            console.log('random:', random);
            if (random === 0) {
                await page.goto('https://m.youtube.com');
                timeout = 10000;
            }
            // else if (random === 1) {
            //     await viewAtYoutubeSuggest(page, url);
            // } else if (random === 2) {
            //     await viewDirect(page, url);
            // } else if (random === 3) {
            //     await viewAtReddit(page, url);
            // } else if (random === 4) {
            //     await viewAtFacebook(page, url);
            // } else if (random === 5) {
            //     await viewAtTwitter(page, url);
            // } else if (random === 6) {
            //     await viewAtYoutube(page, url);
            // }
            else {
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
            reject(error);
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
    return viewAtWeb(page, url, 'https://www.reddit.com');
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
}

async function viewAtFacebook(page, url: string) {
    await page.goto('https://facebook.com');
    return viewAtWeb(page, url, 'https://facebook.com');
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
