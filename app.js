process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
const PoeApi = require('./poe');
const ZALOSOCKET = require('./zalosocket');
const ZaloSendMessage = require('./zaloapi');
const axios = require('./initAxios');
const WebSocket = require('./initWS');
const express = require('express');
const cors = require('cors')
const appHttp = express();
const appServer = () => {

    var zaloCookie = "zpw_sek=cBsK.257704670.a0.LOhCFd8fBt-iQtDmKoalVmaBIXHG4mqjFX5h1HzlLoOaGLyBG4H0ApfGI4OZ519T3uBIQjX1K2UWA6ENb4qlVm;  zpw_sek=cBsK.257704670.a0.LOhCFd8fBt-iQtDmKoalVmaBIXHG4mqjFX5h1HzlLoOaGLyBG4H0ApfGI4OZ519T3uBIQjX1K2UWA6ENb4qlVm";
    var imei = "5437348f-928f-4fde-88d7-cb5f532b5554-14d58a1ba286f087d9736249ec785314";
    var zaloKey = "RL8DzmFxYVhpt2moTHyg9Q==";

    var listRoomChat = [];

    const ZaloAPI = new ZaloSendMessage(zaloKey, zaloCookie);
    const Cookie = "m-b=YX9BUm_9tRO6EnEzRMbOaQ==;";
    var Formkey = "e817c67ac4f5103a812a4fadd7a96aaa";
    var Zalo;
    var POESocket;
    const Client = axios.create({
        headers: {
            Cookie: Cookie
        }
    })

    function debugError(text) {
        Client.get("https://api.telegram.org/bot5788960686:AAGYGE1T0_Lb8natOx6R_PTeuuJ7HYz5xAU/sendMessage?chat_id=-637175626&text=" + encodeURIComponent(text))
    }

    initZaloSocket();
    initPOESocket();

    function initZaloSocket() {

        Zalo = new ZALOSOCKET(zaloCookie);
        Zalo.Socket.onopen = function (event) {
            debugError("socket zalo connected");
            console.log("socket zalo connected");

        };
        Zalo.Socket.onclose = (code, reason) => {
            debugError("socket zalo connected");
            console.log("zalo socket disconnected");
            initZaloSocket();
        };
        Zalo.Socket.error = () => {
            debugError("error events");
            initZaloSocket();
        };
        Zalo.Socket.on("message", data => {
            try {
                var result = JSON.parse(Zalo.Re(data.slice(4, data.length)));

                if (result?.key) Zalo.cipherKey = result.key;
                if (result?.encrypt === 2)
                    Zalo._decrypt(result.data, 0).then(rs => {

                        Zalo._decompress(rs).then(async res => {

                            const zaloData = JSON.parse(res);
                            if (zaloData?.error_code === 0) {
                                if (zaloData?.data?.msgs) {
                                    const uidFrom = zaloData?.data?.msgs[0]?.uidFrom;
                                    const content = zaloData?.data?.msgs[0]?.content;
                                    const msgId = zaloData?.data?.msgs[0]?.msgId;
                                    // const msgType = zaloData?.data?.msgs[0]?.msgType; //"chat.sticker"   webchat  
                                    if (content && uidFrom !== '0') {
                                        const roomChat = await startApp(uidFrom);
                                        const chatId = roomChat?.data?.chatID;
                                        if (listMessagesWait[chatId] !== undefined && listMessagesWait[chatId].length > 0) {
                                            listMessagesWait[chatId] = [
                                                ...listMessagesWait[chatId],
                                                {
                                                    content: content,
                                                    msgId: msgId,
                                                    makeQs: false,
                                                    uidFrom: uidFrom
                                                }
                                            ]
                                        } else {
                                            listMessagesWait[chatId] = [
                                                {
                                                    content: content,
                                                    msgId: msgId,
                                                    makeQs: false,
                                                    uidFrom: uidFrom
                                                }
                                            ]
                                            sendQuestionPOE(chatId);
                                        }

                                    }
                                }
                            }
                        })
                    })
            } catch (error) {
                console.log(error);
            }

        });

    }
    async function initPOESocket() {
        var timeHost = await getMinSeq();
        var idHost = Math.floor(1e6 * Math.random()) + 1;
        POESocket = new WebSocket(`wss://tch${String(idHost)}.tch.poe.com/up/chan56-8888/updates?min_seq=${timeHost}&channel=poe-chan56-8888-zrpjtkpmrjxawragfguz&hash=4137599082481078584`)

        POESocket.on('error', () => {
            console.log("error events");

        });

        POESocket.on('open', () => {
            console.log("connected")
        });
        POESocket.on('message', function message(data) {
            var message = JSON.parse(data);
            if (message?.messages?.length > 0 && listRoomChat?.length > 0) {

                message?.messages?.forEach(mess => {
                    var data = JSON.parse(mess);

                    if (data?.payload.data?.messageAdded) {

                        dataRES = {
                            messageId: data.payload.data?.messageAdded?.messageId,
                            author: data.payload.data.messageAdded?.author,
                            text: data.payload.data.messageAdded?.text,
                            state: data.payload.data.messageAdded?.state,
                            suggestedReplies: data.payload.data.messageAdded?.suggestedReplies
                        }
                        var checkData = listRoomChat?.find(item => "messageAdded:" + item?.chatID === data?.payload?.unique_id);

                        if (checkData) {

                            if ("messageAdded:" + checkData?.chatID === data?.payload?.unique_id && dataRES?.author !== "human" && dataRES?.suggestedReplies?.length === 0) {
                                if (dataRES?.state === "complete") {
                                    const msgId = listMessagesWait[checkData?.chatID][0]?.msgId;
                                    const msgReply = listMessagesWait[checkData?.chatID][0]?.content;
                                    ZaloAPI.doSendMessage(imei, dataRES?.text, msgReply, checkData?.username, msgId).then(data => {

                                        listMessagesWait[checkData?.chatID].shift();
                                        sendQuestionPOE(checkData?.chatID)
                                    })
                                } else {
                                    ZaloAPI.isTypingState(checkData?.username, imei);
                                }
                            } else {
                                // emitMessage(checkData?.username, dataRES)
                            }
                        }
                    }


                });
            }


        });
        POESocket.on("close", (code, reason) => {
            console.log("poe disconnected");
            initPOESocket();
        });
    }

    function sendQuestionPOE(chatId) {
        const dataRoom = listMessagesWait[chatId] !== undefined && listMessagesWait[chatId].length > 0 ? listMessagesWait[chatId][0] : null;

        if (dataRoom !== null) {
            makeQuestion(dataRoom?.content, chatId);
        }
    }

    async function getMinSeq() {

        return Client.get("https://poe.com/api/settings?channel=poe-chan56-8888-zrpjtkpmrjxawragfguz")
            .then((response) => {
                return response?.data?.tchannelData?.minSeq;
            })
            .catch((error) => {
                console.log(error.message);
                throw error;
            });
    }
    // setInterval(() => {
    //     try {
    //         socket.close();
    //     } catch (error) {
    //         console.log(error);
    //     }
    //     initPOESocket();
    // }, 1000 * 60 * 10);

    var listMessagesWait = {};
    async function newChatCreate() {
        const Poe = new PoeApi({
            ...HEADERS,
            Cookie: Cookie,
        });
        var chatID;
        var success = true;
        var message = "ok";
        try {
            const dataFormKey = await Poe.getFormkey();
            Formkey = dataFormKey?.formKey;
            Poe.client.defaults.headers["Quora-Formkey"] = Formkey;
            const data = await Poe.createNewChat("capybara");

            chatID = data?.data?.messageEdgeCreate?.chat?.chatId;

        } catch (error) {
            message = error.message
        }
        return {
            success: success,
            message: message,
            data: {
                chatID: chatID,
            }
        }
    }


    var HEADERS = {
        'Host': 'www.quora.com',
        'Accept': '*/*',
        'apollographql-client-version': '1.1.6-65',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Poe 1.1.6 rv:65 env:prod (iPhone14,2; iOS 16.2; en_US)',
        'apollographql-client-name': 'com.quora.app.Experts-apollo-ios',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Quora-Formkey': Formkey,
        'Cookie': Cookie
    };


    async function startApp(username) {
        if (listRoomChat?.length <= 0) {
            const data = await newChatCreate(username)
            listRoomChat = [{
                username: username,
                chatID: data?.data?.chatID
            }]
            listMessagesWait[data?.data?.chatID] = [
                {
                    username: username,
                    chatID: data?.data?.chatID,
                    content: "xin chào!"
                }
            ]

            return data;
        } else {
            const checkRoom = listRoomChat.find((user) => user?.username === username);
            if (checkRoom) {
                return {
                    success: true,
                    message: "ok",
                    data: {
                        chatID: checkRoom?.chatID,
                    }
                }

            } else {
                const data = await newChatCreate()
                if (listRoomChat?.length > 0) {
                    listRoomChat = [...listRoomChat, {
                        username: username,
                        chatID: data?.data?.chatID
                    }]
                    listMessagesWait[data?.data?.chatID] = [
                        {
                            username: username,
                            chatID: data?.data?.chatID,
                            content: "xin chào!"
                        }
                    ]
                }
                return data;
            }
        }
    }

    async function makeQuestion(query, chatID) {
        var success = true;
        var message = "ok";
        const Poe = new PoeApi({
            ...HEADERS
        });
        Poe.client.defaults.headers["Quora-Formkey"] = Formkey;
        const data = await Poe.sendMessage(query, "capybara", chatID)
        return response = {
            success: success,
            message: message,
            data: data
        }
    }
    appHttp.get("/start", (req, res) => {
        debugError("start request");
        res.send("started")
    })
    appHttp.listen(3000, () => {
        debugError("http listen");
    })

}
appServer();
module.exports = appServer;