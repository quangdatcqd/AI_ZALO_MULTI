const AppCreate = require("./appCreate");
const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
const bodyParser = require("body-parser");
const LoginZalo = require("./loginZalo");
const { engine } = require("express-handlebars");
const { getRequest } = require("./helper")
// Cấu hình Handlebars làm template engine
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.use(bodyParser.json());

// Cấu hình middleware để phục vụ các tệp tĩnh
app.use(express.static("./static/"));
app.set("views", "./views");
var zaloCookie =
  "zpw_sek=pi2n.376574924.a0.Z4dLGsspCEMXe4BpJBCmvHQHLOvFYHA2BFrAqZgOQh8XXmU26-92qrx1UwCAZWt741ZDQzKPZe8-id7CNzOmvG;  zpw_sek=pi2n.376574924.a0.Z4dLGsspCEMXe4BpJBCmvHQHLOvFYHA2BFrAqZgOQh8XXmU26-92qrx1UwCAZWt741ZDQzKPZe8-id7CNzOmvG";
var imei =
  "aa1fceed-ad8b-43a5-b7eb-3695bd5946dd-e3f8101c41b40572973227d0a64620d0";
var zaloKey = "gANz7W+ZWL47gvQr63rKFg==";
const AIAPP = new AppCreate({ zaloCookie, zaloKey, imei });

app.get("/home", (req, res) => {
  res.render("index", { layout: false });
});

app.get("/genqr", async (req, res) => {
  const Login = new LoginZalo();
  const data = await Login.initLogin();
  res.json(data);
});

app.get("/waiting/:url", async (req, res) => {
  let data = await getRequest(req.params.url);

  res.json(data);
});

app.post("/getLoginInfo", async (req, res) => {
  const Login = new LoginZalo();
  Login.imei = req.body.imei;
  Login.ZCID = req.body.zcid;
  Login.generator_Zcid_Ext();
  let data;
  const statusPC = await getRequest(req.body.url);
  let message = false;
  if (statusPC?.data?.zpw_sek) {
    data = await Login.getLoginInfo(statusPC?.data?.zpw_sek);
    if (data.status) {
      data = {
        zaloCookie: "zpw_sek=" + statusPC?.data?.zpw_sek,
        zaloKey: data?.data,
        imei: req.body.imei
      }
      new AppCreate(data);
      message = {
        status: true,
        message: "Đăng ký thành công! hãy tận hưởng.",
        data: null
      }
    }

  }
  res.json(message);
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

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
