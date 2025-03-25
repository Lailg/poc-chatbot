require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Webhook xác thực
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified");
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Xử lý tin nhắn từ Messenger
app.post("/webhook", (req, res) => {
    const body = req.body;

    if (body.object === "page") {
        body.entry.forEach((entry) => {
            const webhookEvent = entry.messaging[0];
            const senderPsid = webhookEvent.sender.id;

            if (webhookEvent.message) {
                handleMessage(senderPsid, webhookEvent.message);
            }
        });

        res.status(200).send("EVENT_RECEIVED");
    } else {
        res.sendStatus(404);
    }
});

// Gửi tin nhắn phản hồi
function sendMessage(senderPsid, response) {
    const requestBody = {
        recipient: { id: senderPsid },
        message: { text: response },
    };

    axios
        .post(`https://graph.facebook.com/v22.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, requestBody)
        .then((res) => console.log("Message sent"))
        .catch((err) => console.error("Unable to send message:", err));
}

// Xử lý tin nhắn từ người dùng
function handleMessage(senderPsid, receivedMessage) {
    let response;

    if (receivedMessage.text) {
        response = `Bạn vừa nói: "${receivedMessage.text}"`;
    } else {
        response = "Xin lỗi, tôi chỉ hiểu tin nhắn dạng văn bản.";
    }

    sendMessage(senderPsid, response);
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
