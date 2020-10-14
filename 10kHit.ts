import { parallelLimit } from 'async';
import * as mongoose from 'mongoose';
const http = require('http');

const options = {
    method: 'GET',
    hostname: 'exc.10khits.com',
    port: null,
    path: '/surf?id=588794&token=92c2b76e0285738d788934a825fadc60',
    headers: {
        connection: 'keep-alive',
        'cache-control': 'max-age=0',
        'upgrade-insecure-requests': '1',
        dnt: '1',
        'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
        accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        referer: 'http://exc.10khits.com/surf?id=588794&token=92c2b76e0285738d788934a825fadc60',
        'accept-language': 'en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7',
        cookie:
            '__cfduid=dd40b26d49c51b75f4a58f15cf48b5f7d1602671490; 10khits_notify=0; PHPSESSID=he08i3p1d8mpgvcm64j8mp8777',
        'content-length': '0',
    },
};

const run = async () => {
    return new Promise((res, rej) => {
        setInterval(() => {
            const req = http.request(options, function (res) {
                const chunks = [];

                res.on('data', function (chunk) {
                    chunks.push(chunk);
                });

                res.on('end', function () {
                    const body = Buffer.concat(chunks);
                    console.log(body.toString());
                });
            });

            req.end();
        }, 20000);
    });
};

run();
