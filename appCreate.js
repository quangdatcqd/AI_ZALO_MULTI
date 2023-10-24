process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
const PoeApi = require('./poe');
const ZALOSOCKET = require('./zalosocket');
const ZaloSendMessage = require('./zaloapi');
const WebSocket = require('./initWS');
class AppCreate {
    zaloCookie;
    imei;
    zaloKey;
    listRoomChat = [];
    listMessagesWait = {};
    Zalo;
    POESocket;
    ZaloAPI;
    PoeAPP;
    Formkey;
    constructor({ zaloCookie, zaloKey, imei }) {
        this.zaloCookie = zaloCookie;
        this.imei = imei;
        this.zaloKey = zaloKey;
        this.ZaloAPI = new ZaloSendMessage(zaloKey, zaloCookie, imei);
        this.ZaloSocket;
        this.PoeAPP = new PoeApi();
        this.initZaloSocket();
        this.initPOESocket(); +
            setInterval(() => {
                try {

                    this.POESocket.close();
                    this.ZaloSocket.Socket.close(1000);
                    console.log("close app");

                } catch (error) {
                    console.log(error);
                }

            }, 1000 * 60 * 5);
    }


    initZaloSocket() {
        this.ZaloSocket = new ZALOSOCKET(this.zaloCookie);
        this.ZaloSocket.Socket.onopen = function (event) {
            console.log("socket zalo onopen");
        };
        this.ZaloSocket.Socket.onclose = (code, reason) => {
            console.log("zalo socket onclose");
            this.initZaloSocket();
        };
        this.ZaloSocket.Socket.error = () => {
            console.log("zalo  error");
            this.initZaloSocket();
        };
        this.ZaloSocket.Socket.on("message", data => {

            try {
                var result = JSON.parse(this.ZaloSocket.Re(data.slice(4, data.length)));

                if (result?.key) this.ZaloSocket.cipherKey = result.key;
                if (result?.encrypt === 2)
                    this.ZaloSocket._decrypt(result.data, 0).then(rs => {

                        this.ZaloSocket._decompress(rs).then(async res => {

                            const zaloData = JSON.parse(res);
                            if (zaloData?.error_code === 0) {
                                if (zaloData?.data?.msgs) {
                                    const uidFrom = zaloData?.data?.msgs[0]?.uidFrom;
                                    const content = zaloData?.data?.msgs[0]?.content;
                                    const msgId = zaloData?.data?.msgs[0]?.msgId;
                                    // const msgType = zaloData?.data?.msgs[0]?.msgType; //"chat.sticker"   webchat  
                                    if (content && uidFrom !== '0') {
                                        const roomChat = await this.startApp(uidFrom);
                                        const chatId = roomChat?.data?.chatID;

                                        if (this.listMessagesWait[chatId] !== undefined && this.listMessagesWait[chatId].length > 0) {

                                            this.listMessagesWait[chatId] = [
                                                ...this.listMessagesWait[chatId],
                                                {
                                                    content: content,
                                                    msgId: msgId,
                                                    makeQs: false,
                                                    uidFrom: uidFrom
                                                }
                                            ]
                                        } else {
                                            this.listMessagesWait[chatId] = [
                                                {
                                                    content: content,
                                                    msgId: msgId,
                                                    makeQs: false,
                                                    uidFrom: uidFrom
                                                }
                                            ]

                                            this.sendQuestionPOE(chatId);
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
    async initPOESocket() {
        // var timeHost = await this.PoeAPP.getMinSeq();

        var idHost = Math.floor(1e6 * Math.random()) + 1;
        this.POESocket = new WebSocket(`wss://tch${String(idHost)}.tch.poe.com/up/chan56-8888/updates?min_seq=&channel=poe-chan56-8888-zrpjtkpmrjxawragfguz&hash=4137599082481078584`)

        this.POESocket.on('error', () => {
            console.log("poe error  ");


            this.initPOESocket();

        });

        this.POESocket.on('open', () => {
            console.log("poe connected")

        });
        this.POESocket.on('message', (data) => {
            var message = JSON.parse(data);
            if (message?.messages?.length > 0 && this.listRoomChat?.length > 0) {

                message?.messages?.forEach(mess => {
                    var data = JSON.parse(mess);

                    if (data?.payload.data?.messageAdded) {

                        const dataRES = {
                            messageId: data.payload.data?.messageAdded?.messageId,
                            author: data.payload.data.messageAdded?.author,
                            text: data.payload.data.messageAdded?.text,
                            state: data.payload.data.messageAdded?.state,
                            suggestedReplies: data.payload.data.messageAdded?.suggestedReplies
                        }
                        var checkData = this.listRoomChat?.find(item => "messageAdded:" + item?.chatID === data?.payload?.unique_id);

                        if (checkData) {

                            if ("messageAdded:" + checkData?.chatID === data?.payload?.unique_id && dataRES?.author !== "human" && dataRES?.suggestedReplies?.length === 0) {
                                if (dataRES?.state === "complete") {

                                    const msgId = this.listMessagesWait[checkData?.chatID][0]?.msgId;
                                    const msgReply = this.listMessagesWait[checkData?.chatID][0]?.content;
                                    this.ZaloAPI.doSendMessage(dataRES?.text, msgReply, checkData?.username, msgId).then(data => {

                                        this.listMessagesWait[checkData?.chatID].shift();
                                        this.sendQuestionPOE(checkData?.chatID)
                                    })
                                } else {
                                    this.ZaloAPI.isTypingState(checkData?.username);
                                }
                            } else {
                                // emitMessage(checkData?.username, dataRES)
                            }
                        }
                    }


                });
            }


        });
        this.POESocket.on("close", (code, reason) => {
            console.log("poe close");
            this.initPOESocket();

        });
    }

    sendQuestionPOE(chatId) {
        const dataRoom = this.listMessagesWait[chatId] !== undefined && this.listMessagesWait[chatId].length > 0 ? this.listMessagesWait[chatId][0] : null;

        if (dataRoom !== null) {
            this.makeQuestion(dataRoom?.content, chatId);
        }
    }




    async newChatCreate() {
        var chatID;
        var success = true;
        var message = "ok";
        try {

            const dataFormKey = await this.PoeAPP.getFormkey();
            this.Formkey = dataFormKey?.formKey;
            this.PoeAPP.client.defaults.headers["Quora-Formkey"] = this.Formkey;
            const data = await this.PoeAPP.createNewChat("capybara");
            chatID = data?.data?.messageEdgeCreate?.chat?.chatId;

        } catch (error) {
            message = error.message
            console.log("newChatCreate fail!", message);
        }

        return {
            success: success,
            message: message,
            data: {
                chatID: chatID,
            }
        }
    }





    async startApp(username) {

        if (this.listRoomChat?.length <= 0) {

            const data = await this.newChatCreate(username)

            this.listRoomChat = [{
                username: username,
                chatID: data?.data?.chatID
            }]

            this.listMessagesWait[data?.data?.chatID] = [
                {
                    username: username,
                    chatID: data?.data?.chatID,
                    content: "xin chào!"
                }
            ]
            return data;
        } else {
            const checkRoom = this.listRoomChat.find((user) => user?.username === username);
            if (checkRoom) {
                return {
                    success: true,
                    message: "ok",
                    data: {
                        chatID: checkRoom?.chatID,
                    }
                }

            } else {
                const data = await this.newChatCreate()
                if (this.listRoomChat?.length > 0) {
                    this.listRoomChat = [...this.listRoomChat, {
                        username: username,
                        chatID: data?.data?.chatID
                    }]

                    this.listMessagesWait[data?.data?.chatID] = [
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

    async makeQuestion(query, chatID) {
        var success = true;
        var message = "ok";

        this.PoeAPP.client.defaults.headers["Quora-Formkey"] = this.Formkey;
        const data = await this.PoeAPP.sendMessage(query, "capybara", chatID)
        return {
            success: success,
            message: message,
            data: data
        }
    }


    // const io = require('socket.io')(3000, {
    //   cors: {
    //     origin: "*"
    //   }
    // });

    // // Server Socket.IO Node.js
    // io.on('connection', (socket) => {
    //   socket.on('joinRoom', (data ) => { 
    //     socket.join(data.ID);
    //     console.log(`join ${data.ID} - `);

    //   });  


    //   socket.on('copy', (data) => {
    //     // Xử lý tin nhắn từ client
    //     console.log(data); 
    //     // Gửi tin nhắn đến tất cả các client khác trong cùng một phòng
    //     socket.to(data.ID).emit('copy', data.Message);
    //   }); 
    // });





}
module.exports = AppCreate;