const axios = require('./initAxios'); 
class PoeApi {
  BASE_URL = 'https://www.quora.com';

  FORMKEY_PATTERN = /formkey": "(.*?)"/;
  GRAPHQL_QUERIES = {
    'ChatFragment': `
      fragment ChatFragment on Chat {
        __typename
        id
        chatId
        defaultBotNickname
        shouldShowDisclaimer
      }
    `,
    'MessageFragment': `
      fragment MessageFragment on Message {
        id
        __typename
        messageId
        text
        linkifiedText
        authorNickname
        state
        vote
        voteReason
        creationTime
        suggestedReplies
      }
    `,
  };
  client;
  constructor(headers  ) { 
    this.client = axios.create({
      headers: headers
    });

  }

  getFormkey() {
    return this.client.get(this.BASE_URL)
      .then((response) => {
        const regex = new RegExp(this.FORMKEY_PATTERN);
        const match = response.data.match(regex);  
        return  {
          formKey:match && match[1] ,
          cookie : response.headers["set-cookie"]
        };
      })
      .catch((error) => {
        console.log(error.message);
        throw error;
      });
  }


  async sendRequest(path, data) {
    try {
      const response = await this.client.post(`${this.BASE_URL}/poe_api/${path}`, data);
      
      return response.data;
    } catch (e) {
      console.log(e.message);

    }
  }
  async sendRequestGetCookie(path, data) {
    try {
      const response = await this.client.post(`${this.BASE_URL}/poe_api/${path}`, data);

      return response;
    } catch (e) {
      console.log(e.message);

    }
  }
  async getChatId(bot = 'a2') {
    const query = `
      query ChatViewQuery($bot: String!) {
        chatOfBot(bot: $bot) {
          __typename
          ...ChatFragment
        }
      }
      ${this.GRAPHQL_QUERIES['ChatFragment']}
    `;

    const variables = { bot };
    const data = { operationName: 'ChatViewQuery', query, variables };

    const responseJson = await this.sendRequestGetCookie('gql_POST', data);

    const chatData = responseJson.data.data;
    if (!chatData) {
      throw new Error('Chat data not found!');
    }
    return {
      chatID: chatData.chatOfBot.chatId,
      cookies: responseJson.headers["set-cookie"]
    };
  }

  async sendMessage(message, bot = 'a2', chatId = '') {
    const data = {
      "queryName": "chatHelpers_sendMessageMutation_Mutation",
      "variables": {
        "chatId": chatId,
        "bot": bot,
        "query": message,
        "source": {
          "sourceType": "chat_input",
          "chatInputMetadata": {
            "useVoiceRecord": false
          }
        },
        "withChatBreak": false,
        "clientNonce": "f5JsNITBva7VSPJg",
        "sdid": "a8db7ebb-9738-425f-a3f3-b835eb8f0a2f",
        "attachments": []
      },
      "extensions": {
        "hash": "5fd489242adf25bf399a95c6b16de9665e521b76618a97621167ae5e11e4bce4"
      }
    } 
    return await this.sendRequest('gql_POST', data);
  }


  async createNewChat(bot) {
    const data = {
      "queryName": "chatHelpersSendNewChatMessageMutation",
      "variables": {
          "bot": bot,
          "query": "xin chào",
          "source": {
              "sourceType": "chat_input",
              "chatInputMetadata": {
                  "useVoiceRecord": false,
                  "newChatContext": "plus_new_chat_button"
              }
          },
          "sdid": "a8db7ebb-9738-425f-a3f3-b835eb8f0a2f",
          "attachments": []
      },
      "extensions": {
          "hash": "943e16d73c3582759fa112842ef050e85d6f0048048862717ba861c828ef3f82"
      }
  }
    return await this.sendRequest('gql_POST', data);
  }

  

  async cancelMessage(messageID) {
    const data = {
      "queryName": "chatHelpers_messageCancel_Mutation",
      "variables": {
          "messageId": messageID,
          "textLength": 0,
          "linkifiedTextLength": 0
      },
      "extensions": {
          "hash": "59b10f19930cf95d3120612e72d271e3346a7fc9599e47183a593a05b68c617e"
      }
  }
    return await this.sendRequest('gql_POST', data);
  }



  async clearContext(chatId) {
    const query = `
    mutation AddMessageBreakMutation($chatId: BigInt!) {
      messageBreakCreate(chatId: $chatId) {
        __typename
        message {
          __typename
          ...MessageFragment
        }
      }
    }
    ${GRAPHQL_QUERIES['MessageFragment']}
  `;

    const variables = { chatId };
    const data = { operationName: 'AddMessageBreakMutation', query, variables };
    await sendRequest('gql_POST', data);
  }

  async getLatestMessage(bot) {
    const query = `
    query ChatPaginationQuery($bot: String!, $before: String, $last: Int! = 10) {
      chatOfBot(bot: $bot) {
        id
        __typename
        messagesConnection(before: $before, last: $last) {
          __typename
          pageInfo {
            __typename
            hasPreviousPage
          }
          edges {
            __typename
            node {
              __typename
              ...MessageFragment
            }
          }
        }
      }
    }
    ${GRAPHQL_QUERIES['MessageFragment']}
  `;

    const variables = { before: null, bot, last: 1 };
    const data = { operationName: 'ChatPaginationQuery', query, variables };

    let authorNickname = '';
    let state = 'incomplete';
    while (true) {
      await sleep(2000);
      const responseJson = await sendRequest('gql_POST', data);
      const edges = responseJson.data.chatOfBot.messagesConnection.edges;
      if (edges.length > 0) {
        const latestMessage = edges[edges.length - 1].node;
        const text = latestMessage.text;
        state = latestMessage.state;
        authorNickname = latestMessage.authorNickname;
        if (authorNickname === bot && state === 'complete') {
          return text;
        }
      } else {
        return 'Fail to get a message. Please try again!';
      }
    }
  }
}


module.exports = PoeApi;