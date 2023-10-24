
const crypto = require("crypto")
const axios = require('./initAxios');
const { getEncodeParams, getDecodeParams } = require("./helper");
class LoginZalo {
    imei;
    ZCID;
    ZCID_EXT;
    Key;
    clientVersion = "621";
    HEADERS = {
        "accept": "application/json, text/plain, */*",
        "content-type": "application/x-www-form-urlencoded",
        "user-agent": "ZaloPC-win32-24v" + this.clientVersion
    }
   
    async initLogin() {
        this.imei = this.getIMEI();
        this.getServerInfo();
        this.ZCID = await this.generator_Zcid("24");
        const data = await this.getQRCode();
        return {
            imei: this.imei,
            ZCID: this.ZCID,
            data: data
        }
    }
    generator_Zcid_Ext() {
        this.ZCID_EXT = this.generateRandomString(this.getRandomNumberRange());
        this.Key = this.getKey(this.ZCID, this.ZCID_EXT);
    }
    getRandomNumberRange(min = 8, max = 12) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    async getQRCode() {
        const currentDate = new Date();
        const timestamp = Math.floor(currentDate.getTime() / 1000);
        this.generator_Zcid_Ext();

        const payload = {
            "language": "vi",
            "client_time": timestamp,
            "imei": this.imei,
            "computer_name": "IT-SOFTWARE",
            "logged_uids": ""
        }
        const paramEncode = await getEncodeParams(JSON.stringify(payload), this.Key, "0");
        const params = {
            zcid: this.ZCID,
            zcid_ext: this.ZCID_EXT,
            enc_ver: "v2",
            params: paramEncode,
            type: 24,
            client_version: this.clientVersion
        }

        const signKey = this.getSignKey("reqqr", JSON.stringify(params));
        const url = `https://wpa.chat.zalo.me/api/login/reqqr?zcid=${this.ZCID}&zcid_ext=${this.ZCID_EXT}&enc_ver=v2&params=${encodeURIComponent(paramEncode)}&type=24&client_version=${this.clientVersion}&signkey=${signKey}`;
        let config = {
            method: 'get',
            url: url,
            headers: this.HEADERS,
        };

        const data = await axios.request(config)
        const decodeData = await getDecodeParams(data?.data?.data, this.Key, "0")
        return decodeData?.data;

    }

    async getServerInfo() {

        try {
            const params = {
                imei: this.imei,
                type: 24,
                client_version: this.clientVersion,
                computer_name: "ADMINDESKTOP"
            }
            const signKey = this.getSignKey("getServerInfo", JSON.stringify(params));
            const url = `https://wpa.chat.zalo.me/api/login/getServerInfo?imei=${this.imei}&type=24&client_version=${this.clientVersion}&computer_name=ADMINDESKTOP&signkey=${signKey}`;
            let config = {
                method: 'get',
                url: url,
                headers: this.HEADERS,
            };

            const data = await axios.request(config)
            if (data?.data?.error_code == 0) {
                console.log("getServerInfo OK");
            } else {
                console.log("getServerInfo Fail");

            }
            return data;

        } catch (error) {
            console.log("getServerInfo fail", error);

        }
    }

   
    
    async getLoginInfo(cookie) {

        try {
            const currentDate = new Date();
            const timestamp = currentDate.getTime();
            const payload = {
                "imei": this.imei,
                "computer_name": "ADMINDESKTOP",
                "language": "vi",
                "ts": timestamp
            }
             const paramEncode = await getEncodeParams(JSON.stringify(payload), this.Key, "0");
            const params = {
                zpw_ver: this.clientVersion,
                imei: this.imei,
                type: 24,
                computer_name: "ADMINDESKTOP"
            } 
            const signKey = this.getSignKey("getLoginInfo", JSON.stringify(params));
            const url = `https://wpa.chat.zalo.me/api/login/getLoginInfo?zcid=${this.ZCID}&zcid_ext=${this.ZCID_EXT}&enc_ver=v2&params=${encodeURIComponent(paramEncode)}&type=24&client_version=${this.clientVersion}&signkey=${signKey}&nretry=0`;
            let config = {
                method: 'get',
                url: url,
                headers:{
                    ... this.HEADERS,
                    cookie:"zpw_sek="+cookie
                },
            };

            const data = await axios.request(config) 
            const decodeData = await getDecodeParams(data?.data?.data, this.Key, "0") 
            if (decodeData?.data?.zpw_enk  ) {
                console.log("getLoginInfo OK");
                return {
                    status:true,
                    data:decodeData?.data?.zpw_enk,
                    message:"Login OK"
                };
            } else {
                console.log("getLoginInfo Fail",decodeData?.error_message);
                return {
                    status:false,
                    message:decodeData?.error_message,
                    data:null
                    
                };
            }
            

        } catch (error) {
            console.log("getLoginInfo error", error);
            return {
                status:false,
                message:"Crash app",
                data:null
            }
        }
       
    }


    getIMEI() {
        const uuid = this.generateUUID();
        const arrayUuid = uuid.split('-');
        const imei = uuid + '-' + this.md5(arrayUuid[0] + arrayUuid[2] + arrayUuid[4]);
        return imei;
    }

    generateUUID() {
        let timestamp = new Date().getTime();
        let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

        uuid = uuid.replace(/[xy]/g, function (c) {
            const r = (timestamp + 16 * Math.random()) % 16 | 0;
            timestamp = Math.floor(timestamp / 16);
            const v = (c === 'x') ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

        return uuid;
    }

    md5(data) {
        return crypto.createHash('md5').update(data).digest('hex');
    }
    generateRandomString(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;

        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        return result;
    }


    getSignKey(type, param) {
        let oData = null;
        try {
            oData = JSON.parse(param);
        } catch (error) {
            // Xử lý lỗi nếu không phân tích được chuỗi JSON
        }

        if (!oData) {
            return "";
        }

        let arrKey = Object.keys(oData);
        arrKey.sort();

        let sign = "zsecure" + type.toLowerCase();
        for (let i = 0; i < arrKey.length; i++) {
            sign += oData[arrKey[i]];
        }

        return this.md5(sign);
    }
    getKey(zcid, zcid_ext) {
        const zcidArr = zcid.split('');
        const zcidArrx2 = this.x2Array(zcidArr);
        zcidArrx2[1].reverse();
        const key1 = zcidArrx2[0].slice(0, 12).join('');
        const key2 = zcidArrx2[1].slice(0, 12).join('');

        //-----------------------------------------------------------------

        const md5_zcid_ext = this.md5(zcid_ext).toUpperCase();
        const md5_zcidArr = md5_zcid_ext.split('');
        const md5_zcidArrx2 = this.x2Array(md5_zcidArr);
        const key3 = md5_zcidArrx2[0].slice(0, 8).join('');

        //-----------------------------------------------------------------

        const key = key3 + key1 + key2;
        return key;
    }

    x2Array(arrInput) {
        const arr = [[], []];
        for (let i = 0; i < arrInput.length; i++) {
            if (i % 2 === 0) {
                arr[0].push(arrInput[i]);
            } else {
                arr[1].push(arrInput[i]);
            }
        }
        return arr;
    }

    async generator_Zcid(type = "30") {
        const seconds = this.milliseconds();
        const loginInfo = `${type},${this.imei},${seconds}`;

        const zcid = await getEncodeParams(loginInfo, "3FC4F0D2AB50057BCE0D90D9187A22B1", "0", "hex");
        return this.ZCID = zcid.toUpperCase();

    }
    milliseconds() {
        return Math.floor(new Date().getTime() / 1000);
    }
}
module.exports = LoginZalo;