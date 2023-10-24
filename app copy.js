process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
const PoeApi =  require('./poe');
const ZALOSOCKET = require('./zalosocket');
const ZaloSendMessage = require('./zaloapi');
const axios = require('./initAxios');
const WebSocket = require('./initWS');
const express = require('express');
const cors = require('cors')
const appHttp = express();
const appServer = () => {
   
    var zaloCookie = "zpw_sek=pi2n.376574924.a0.Z4dLGsspCEMXe4BpJBCmvHQHLOvFYHA2BFrAqZgOQh8XXmU26-92qrx1UwCAZWt741ZDQzKPZe8-id7CNzOmvG;  zpw_sek=pi2n.376574924.a0.Z4dLGsspCEMXe4BpJBCmvHQHLOvFYHA2BFrAqZgOQh8XXmU26-92qrx1UwCAZWt741ZDQzKPZe8-id7CNzOmvG";
    var imei = "aa1fceed-ad8b-43a5-b7eb-3695bd5946dd-e3f8101c41b40572973227d0a64620d0";
    var zaloKey = "gANz7W+ZWL47gvQr63rKFg==";

    var listRoomChat = []; 
    const ZaloAPI = new ZaloSendMessage(zaloKey, zaloCookie,imei); 
    var Zalo;
    var POESocket;
   
   
    var PoeAPP  = new PoeApi(); 

    initZaloSocket();
    initPOESocket();

    function initZaloSocket() {

        Zalo = new ZALOSOCKET(zaloCookie);
        Zalo.Socket.onopen = function (event) {
            
            console.log("socket zalo onopen");

        };
        Zalo.Socket.onclose = (code, reason) => {
        
            console.log("zalo socket onclose");
            initZaloSocket();
        };
        Zalo.Socket.error = () => {
           
            console.log("zalo  error");
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
        // var timeHost = await PoeAPP.getMinSeq();
 
        var idHost = Math.floor(1e6 * Math.random()) + 1;
        POESocket = new WebSocket(`wss://tch${String(idHost)}.tch.poe.com/up/chan56-8888/updates?min_seq=&channel=poe-chan56-8888-zrpjtkpmrjxawragfguz&hash=4137599082481078584`)
        
        POESocket.on('error', () => {
            console.log("poe error  ");
        
            initPOESocket();
        });

        POESocket.on('open', () => {
            console.log("poe connected")
     
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
                                    ZaloAPI.doSendMessage( dataRES?.text, msgReply, checkData?.username, msgId).then(data => {

                                        listMessagesWait[checkData?.chatID].shift();
                                        sendQuestionPOE(checkData?.chatID)
                                    })
                                } else {
                                    ZaloAPI.isTypingState(checkData?.username );
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
            console.log("poe close");
          
            initPOESocket();
        });
    }

    function sendQuestionPOE(chatId) {
        const dataRoom = listMessagesWait[chatId] !== undefined && listMessagesWait[chatId].length > 0 ? listMessagesWait[chatId][0] : null;

        if (dataRoom !== null) {
            makeQuestion(dataRoom?.content, chatId);
        }
    }
 
    // setInterval(() => {
    //     try {
    //       
    //         POESocket.close();
    //         Zalo.Socket.close();
            
    //     } catch (error) {
    //         console.log(error);
    //     }
    //     initPOESocket();
    //     initZaloSocket();
    // }, 1000 * 60 * 5);

    var listMessagesWait = {};
    async function newChatCreate() {
        
        
        var chatID;
        var success = true;
        var message = "ok";
        try {
            
            const dataFormKey = await PoeAPP.getFormkey();
            
            Formkey = dataFormKey?.formKey;
            PoeAPP.client.defaults.headers["Quora-Formkey"] = Formkey;
            const data = await PoeAPP.createNewChat("capybara");
            
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
        
        PoeAPP.client.defaults.headers["Quora-Formkey"] = Formkey;
        const data = await PoeAPP.sendMessage(query, "capybara", chatID)
        return response = {
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
appServer();
module.exports = appServer;