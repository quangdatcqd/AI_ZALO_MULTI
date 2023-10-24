
 
const axios = require('./initAxios');
const {getEncodeParams } = require ("./helper");
class ZaloSendMessage {
    zaloKey;
    zaloCokie;
    imei;
   
    constructor(zaloKey, zaloCookie, imei) {
        this.zaloCokie = zaloCookie;
        this.zaloKey = zaloKey;
        this.imei = imei;
       
    }

   

    async doSendMessageZalo(content, clientID) {

        let params = { "message": content, "clientId": Date.now(), "imei": this.imei, "ttl": 0, "toid": clientID }

        let paramEncode = await getEncodeParams(JSON.stringify(params),this.zaloKey)
        const qs = require('qs');
        let data = qs.stringify({
            'params': paramEncode
        });
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://tt-chat2-wpa.chat.zalo.me/api/message/sms?zpw_ver=618&zpw_type=30&nretry=0',
            headers: {
                'Cookie': this.zaloCokie,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'ZaloPC-win32-24v618'
            },
            data: data
        };

        var smsData = await axios.request(config);

    }

    async doSendMessage(content, contentReply, clientID, msgId) {
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
                await this.doSendMessageZaloReply(textMessageSplit, contentReply, clientID, msgId, index);

            }
            else {
                // await this.doSendMessageZalo(imei, textMessageSplit, clientID);
            }

        }
    }

    async doSendMessageZaloReply(content, contentReply, clientID, msgId, index) {

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
            "imei": this.imei,
            "qmsgTTL": 0,
            "ttl": 0
        }


        let paramEncode = await  getEncodeParams(JSON.stringify(params),this.zaloKey)
        const qs = require('qs');
        let data = qs.stringify({
            'params': paramEncode
        });
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://tt-chat2-wpa.chat.zalo.me/api/message/quote?zpw_ver=618&zpw_type=30&nretry=0',
            headers: {
                'Cookie': this.zaloCokie,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'ZaloPC-win32-24v618'
            },
            data: data
        };

        var smsData = await axios.request(config);


    }
    userTyping = [

    ];
    async isTypingState(clientID) {
        // if (this.userTyping.length > 0) {  
        if (this.userTyping[clientID] === false || this.userTyping[clientID] === undefined) {
            console.log(this.userTyping[clientID] === false || this.userTyping[clientID] === undefined);
            this.userTyping[clientID] = true
            this.sendTypingState(clientID, this.imei);
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
    async sendTypingState(clientID) {



        var params = { "toid": clientID, "destType": 3, "imei": this.imei };
        let paramEncode = await  getEncodeParams(JSON.stringify(params),this.zaloKey)
        const qs = require('qs');
        let data = qs.stringify({
            'params': paramEncode
        });
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://tt-chat2-wpa.chat.zalo.me/api/message/typing?zpw_ver=618&zpw_type=30',
            headers: {
                'Cookie': this.zaloCokie,
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

