
const Crypto = require("crypto")
const WebSocket = require('./initWS');
const pako = require('pako');

class ZALOSOCKET {

    Socket = null;

    cipherKey = null;
    constructor(cookie) {
        this.connect(cookie);
    }


    connect(cookie) {
        var host = `wss://ws3-msg.chat.zalo.me/?zpw_ver=618&zpw_type=30&t=${Date.now()}`;
        this.Socket = new WebSocket(
            host,
            {
                headers: {
                    "Cookie": cookie,
                    "User-Agent": "ZaloPC-win32-24v618"
                }
            });
    }

    Se(e) {
        try {

            const t = atob(e)
                , s = t.length
                , a = new Uint8Array(s);
            for (let n = 0; n < s; n++)
                a[n] = t.charCodeAt(n);
            return a
        } catch (error) {
            console.log(error);
        }
    }

    async _decrypt(data, time) {

        return new Promise(((s, a) => {
            try {
                const b64Data = this.Se(data = decodeURIComponent(data));

                const iv = b64Data.slice(0, 16)
                    , additional = b64Data.slice(16, 32)
                    , dataTODecrypte = b64Data.slice(32)
                    , decryptConfig = {
                        name: "AES-GCM",
                        iv: iv,
                        tagLength: 128,
                        additionalData: additional
                    };
                Crypto.subtle.importKey("raw", this.Se(this.cipherKey), decryptConfig, !1, ["decrypt"]).then((e => {
                    Crypto.subtle.decrypt(decryptConfig, e, dataTODecrypte).then((e => {
                        s(e)
                    }
                    )).catch((e => {
                        a(e)
                    }
                    ))
                }
                )).catch((e => {
                    a(e)
                }
                ))

            } catch (error) {
                a(e)
            }

        }
        ))
    }
    Re(e) {
        try {
            const t = new Uint8Array(e);
            return (new TextDecoder).decode(t)
        } catch (t) {

            console.log("fail RE");
        }
    }

    async _decompress(data, type) {
        return new Promise(((resolve, reject) => {
            try {
                const uncompressedData = pako.inflate(data, { to: 'string' });
                return resolve(uncompressedData)
            } catch (n) {
                console.log("loi_decompress");
            }
        }
        ))
    }

}

module.exports = ZALOSOCKET;
// var text = "eIxH6Ay+q8J7EoTd1FMlSEF3jRi8jy+0/9y3yw3yUUhQ41LXasQQxGtX+1VhctggAIFOgRwqCTrPlbU1+8PbM/wJgknJ5SFU1nrVBE+kUnU6d/Afk1TwDwTM9vd8elkQbCYx17tEkU5g5snh63U27JpCSfnhAbws1MQhw+85nKUldyAzEs+Xj+eeEerDyAN73pJ93tW3VfSpOXVXDb59FCcEapuJfzwLHJhgXKbGFA0jh0o7cKtqJUiEwdD3nfgLZKIWEZDdaRfqZqT7aeiaoUBc+JotNyyF3TJY/L2KtupHjWV1n+3VIsNIzi4LaB9Gxor3dWr1T6UqU/+wkGLGGng5xjSAHhgRiB/bSvP568/zUOnX2u+WW3maufGNFDP6uoxfNAOurX/L/oaIgDvJPbFytAHbJrc0VRC2RSKhE8cFUxwQ01k1To2qz9me4KmtxHO28CQnuMBHp8mPkb1DeMhSENmAoHT7aTCv1JMGm6Mcf1WkHmfxQ+5bGHChe736ZtMtCE314sIU3GuXC/dmuRGPA4egvIk/a9Pq9x/huxaitBRHSC2OwGo8vcJWbmPqucgTlJdjJqikzwoXI6YkLsiMNDBIm/bxnRAtrkNGOKr3VAXX7pMNJQytVRWV8ILlkU1LgAEyLRfHvPeUOM4ltqnWvwB+xjD4nfB5TRXrWmhUIZSEF4zbt7qwM5a/Gn7c4V45BNWBsLc=";
// _decrypt(text, 0).then(e => {
//     // console.log(e);
//     _decompress(e, 2).then((e) => {
//         console.log(e);
//     })
// })