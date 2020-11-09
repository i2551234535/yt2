import { BrowserContext, devices, Route, webkit } from 'playwright';
import { ProfileModel } from '../models/Profile.model';
import { delay } from './delay';
import Axios from 'axios';
import { ProfileViewModel } from '../models/ProfileView.model';
import { allDevices } from '../devices';
const SocksProxyAgent = require('socks-proxy-agent');

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}
const http = require('http');

function getRandomArbitrary(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

const { PROXY_SOCK5, PROXY_HOST, PROXY_PORT, PROXY_USER, PROXY_PASSWORD } = process.env;

console.log();

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
        let viewUrl = false;
        let isViewed = false;
        let context: BrowserContext | undefined;
        setTimeout(async () => {
            if (running) {
                try {
                    if (context) await context.close();
                } catch (error) {}
                reject(new Error('Timeout'));
            }
        }, 5 * 60 * 1000);

        // const totalProfile = await ProfileModel.find({}).countDocuments();
        // const profileData = await ProfileModel.findOne({}).skip(getRandomArbitrary(0, totalProfile));
        const profileData = await ProfileModel.findOne({
            $or: [
                {
                    cookies: JSON.stringify([]),
                },
                {
                    cookies: {
                        $exists: false,
                    },
                },
            ],
        });

        profileData.is_running = true;
        await profileData.save();

        const profileView = await ProfileViewModel.findOne({
            profile_id: profileData._id,
            link: url,
        });
        if (profileView) {
            isViewed = true;
        }

        try {
            const device = devices[profileData.device_name];

            const timezoneId = 'Asia/Saigon';

            console.log('load profile:', profileData._id.toHexString());

            const context = await webkit.launchPersistentContext('./profiles/' + profileData._id.toHexString(), {
                headless: process.env.HEADLESS === '0' ? false : true,
                ...device,
                timezoneId,
            });
            try {
                if (profileData.cookies?.length > 0) {
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

                return route.continue();
            });

            const random = getRandomArbitrary(0, 60);
            let timeout = getRandomArbitrary(1.5 * 60 * 1000, 2 * 60 * 1000);
            console.log('random:', random);
            if (isViewed) {
                await viewRandomAtYoutube(page);
            } else if (random === 0) {
                await page.goto('https://m.youtube.com');
                timeout = 10000;
            } else if (random === 1) {
                viewUrl = true;
                await viewAtYoutubeSuggest(page, url);
            } else if (random === 2) {
                viewUrl = true;
                await viewDirect(page, url);
            } else if (random === 3) {
                viewUrl = true;
                await viewAtReddit(page, url);
            } else if (random === 4) {
                viewUrl = true;
                await viewAtFacebook(page, url);
            } else if (random === 5) {
                viewUrl = true;
                await viewAtTwitter(page, url);
            } else if (random === 6) {
                viewUrl = true;
                await viewAtYoutube(page, url);
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
                        last_time_date_string: new Date().toISOString(),
                    },
                },
            );
            if (viewUrl) {
                const newProfileView = new ProfileViewModel({
                    profile_id: profileData._id,
                    link: url,
                    timestamp: now,
                    time: new Date().toISOString(),
                });
                await newProfileView.save();
            }
        } catch (error) {
            reject(error);
        } finally {
            try {
                profileData.last_time = now;
                profileData.last_time_date_string = new Date().toISOString();
                await profileData.save();
                await context.close();
            } catch (error) {}

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
