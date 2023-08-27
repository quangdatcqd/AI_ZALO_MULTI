

var zaloKey = "RL8DzmFxYVhpt2moTHyg9Q==";
var zaloCokie = "zpw_sek=cBsK.257704670.a0.LOhCFd8fBt-iQtDmKoalVmaBIXHG4mqjFX5h1HzlLoOaGLyBG4H0ApfGI4OZ519T3uBIQjX1K2UWA6ENb4qlVm; ";
const axios = require('./initAxios');

class ZaloSendMessage {

    async getDecodeParams(params) {
        try {

            const FormData = require('form-data');
            let data = new FormData();
            data.append('type', '1');
            data.append('message', params);
            data.append('key', this.zaloKey);
            data.append('deviceID', '343');
            data.append('output', 'base64');

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'http://cqdgo.com/zalo/zaloencode.php?type=decode',
                headers: {
                    ...data.getHeaders()
                },
                data: data
            };
            const response = await axios.request(config)
            return response.data;
        } catch (error) {

        }
    }



    async getEncodeParams(params) {
        try {
            const FormData = require('form-data');
            let data = new FormData();
            data.append('type', '1');
            data.append('message', params);
            data.append('key', zaloKey);
            data.append('deviceID', '343');
            data.append('output', 'base64');

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'http://cqdgo.com/zalo/zaloencode.php?type=encode',
                headers: {
                    ...data.getHeaders()
                },
                data: data
            };

            const response = await axios.request(config)
            return response.data;
        } catch (error) {

        }
    }


    async doSendMessageZalo(imei, content, clientID) {

        let params = { "message": content, "clientId": Date.now(), "imei": imei, "ttl": 0, "toid": clientID }

        let paramEncode = await this.getEncodeParams(JSON.stringify(params))
        const qs = require('qs');
        let data = qs.stringify({
            'params': paramEncode
        });
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://tt-chat2-wpa.chat.zalo.me/api/message/sms?zpw_ver=618&zpw_type=30&nretry=0',
            headers: {
                'Cookie': zaloCokie,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'ZaloPC-win32-24v618'
            },
            data: data
        };

        var smsData = await axios.request(config);

    }

    async doSendMessage(imei, content, contentReply, clientID, msgId) {
        var textMessage = content;
        var lengthChar = 2000;
        var loopTime = Math.ceil(textMessage?.length / lengthChar);

        var start = 0;
        for (let index = 0; index < loopTime; index++) {
            var lengthIndex = textMessage?.substr(start, lengthChar).lastIndexOf(" ");

            if (index >= (loopTime - 1)) lengthIndex = 2222;
            const textMessageSplit = textMessage.substr(start, lengthIndex)
            start += lengthIndex;
            if (msgId) {
                await this.doSendMessageZaloReply(imei, textMessageSplit, contentReply, clientID, msgId, index);

            }
            else {
                // await this.doSendMessageZalo(imei, textMessageSplit, clientID);
            }

        }
    }

    async doSendMessageZaloReply(imei, content, contentReply, clientID, msgId, index) {

        let params = {
            "toid": clientID,
            "message": content,
            "clientId": Date.now(),
            "qmsgOwner": clientID,
            "qmsgId": msgId,
            "qmsgCliId": Date.now(),
            "qmsgType": 1,
            "qmsgTs": Date.now(),
            "qmsg": contentReply,
            "imei": imei,
            "qmsgTTL": 0,
            "ttl": 0
        }

        let paramEncode = await this.getEncodeParams(JSON.stringify(params))
        const qs = require('qs');
        let data = qs.stringify({
            'params': paramEncode
        });
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://tt-chat2-wpa.chat.zalo.me/api/message/quote?zpw_ver=618&zpw_type=30&nretry=0',
            headers: {
                'Cookie': zaloCokie,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'ZaloPC-win32-24v618'
            },
            data: data
        };

        var smsData = await axios.request(config);
        console.log(index);

    }
    userTyping = [

    ];
    async isTypingState(clientID, imei) {
        // if (this.userTyping.length > 0) {  
        if (this.userTyping[clientID] === false || this.userTyping[clientID] === undefined) {
            console.log(this.userTyping[clientID] === false || this.userTyping[clientID] === undefined);
            this.userTyping[clientID] = true
            this.sendTypingState(clientID, imei);
            setTimeout(() => {
                this.userTyping[clientID] = false
            }, 13000);
        }

        // console.log(checkHas);
        // if (!user?.isTyping) { 
        //     this.sendTypingState(clientID, imei);
        //     setTimeout(() => {
        //         this.isTyping = false;
        //     }, 10000);
        // }
        // }


    }
    async sendTypingState(clientID, imei) {



        var params = { "toid": clientID, "destType": 3, "imei": imei };
        let paramEncode = await this.getEncodeParams(JSON.stringify(params))
        const qs = require('qs');
        let data = qs.stringify({
            'params': paramEncode
        });
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://tt-chat2-wpa.chat.zalo.me/api/message/typing?zpw_ver=618&zpw_type=30',
            headers: {
                'Cookie': zaloCokie,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'ZaloCB-win32-24v618'
            },
            data: data
        };

        var smsData = axios.request(config);
    }
}


// var imei = "5437348f-928f-4fde-88d7-cb5f532b5554-14d58a1ba286f087d9736249ec785314";
// var content = "xin chao  ";
// var clientID = "1717683323690148445";
// doSendMessageZalo(imei, content, clientID).then((data) => {

// })




module.exports = ZaloSendMessage

