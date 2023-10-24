const axios = require('./initAxios');

  async function getDecodeParams(params, key  , type = "1", output = 'base64') {
    try {

        const FormData = require('form-data');
        let data = new FormData();
        data.append('type',type);
        data.append('message', params);
        data.append('key', key);
        data.append('deviceID', 'cqdcqd113');
        data.append('output', output);

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



  async function getEncodeParams(params, key  , type = "1", output = 'base64') {
    try {
       
        const FormData = require('form-data');
        let data = new FormData();
        data.append('type', type);
        data.append('message', params);
        data.append('key', key);
        data.append('deviceID', 'cqdcqd113');
        data.append('output', output);

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
        console.log("getEncodeParams",error);
    }
}
  function generateRandomString(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;

    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

  async function getRequest(url) {
    try {
        let config = {
            method: 'get',
            url: url,
            headers: this.HEADERS,
        };
        const data = await axios.request(config)
        return data?.data;
    } catch (error) {
        console.log("getRequest fail"   );
        return 0;
    }

}
module.exports = {
    generateRandomString: generateRandomString,
    getDecodeParams: getDecodeParams,
    getEncodeParams: getEncodeParams,
    getRequest:getRequest
  };