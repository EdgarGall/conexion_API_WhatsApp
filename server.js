import express, { text } from 'express';
import axios from 'axios';
import "dotenv/config";


const app = express();
app.use(express.json());

const {WEBHOOK_VERIFY_TOKEN, API_TOKEN, BUSINESS_PHONE, API_VERSION, PORT} = process.env;

app.post("/webhook", async (req, res) => {
    // 1. Extraer el mensaje del JSON anidado de Meta
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // Log para ver qué llega (útil para debugear)
    console.log("Cuerpo recibido:", JSON.stringify(req.body, null, 2));

    // 2. Verificar que sea un mensaje de texto
    if (message?.type === "text") {
        const customerPhoneNumber = message.from;
        const messageText = message.text.body;
        const messageId = message.id;

        try {
            // ENVIAR ECO
            await axios({
                method: "POST",
                url: `https://graph.facebook.com/${API_VERSION}/${BUSINESS_PHONE}/messages`,
                headers: { Authorization: `Bearer ${API_TOKEN}` },
                data: {
                    messaging_product: "whatsapp",
                    to: customerPhoneNumber,
                    text: { body: `BotBombona: ${messageText}` },
                    context: { message_id: messageId } // Responde al mensaje original
                },
            });

            // MARCAR COMO LEÍDO
            await axios({
                method: "POST",
                url: `https://graph.facebook.com/${API_VERSION}/${BUSINESS_PHONE}/messages`,
                headers: { Authorization: `Bearer ${API_TOKEN}` },
                data: {
                    messaging_product: "whatsapp",
                    status: "read",
                    message_id: messageId,
                },
            });

            console.log(`Respuesta enviada a ${customerPhoneNumber}`);
        } catch (error) {
            console.error("Error al contactar la API de Meta:", error.response?.data || error.message);
        }
    }

    // Siempre responder 200 a Meta para que no reenvíe el mensaje
    res.sendStatus(200);
});

app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {

        res.status(200).send(challenge);
        console.log("WEBHOOK_VERIFIED");

    }else{
        res.sendStatus(403);
    }
});

app.get("/", (req, res) => {
    res.send("<pre>Servidor de WhatsApp Business API funcionando correctamente,</pre>");
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);

});


/*
/*const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Variables de entorno
const {
    WEBHOOK_VERIFY_TOKEN,
    API_TOKEN,
    BUSINESS_PHONE_ID,
    API_VERSION,
    PORT
} = process.env;

// 1. Verificación del Webhook (GET)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        return res.status(200).send(challenge);
    }
    res.sendStatus(403);
});

// 2. Recepción y Eco de mensajes (POST)
app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;

        // Verificamos que sea un mensaje de WhatsApp
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const message = value?.messages?.[0];

            if (message && message.type === 'text') {
                const customerPhoneNumber = message.from; // El "Recipient-Phone-Number"
                const customerText = message.text.body;

                console.log(`Mensaje recibido de ${customerPhoneNumber}: ${customerText}`);

                // EJECUTAR EL ECO
                await sendWhatsAppMessage(customerPhoneNumber, `Eco: ${customerText}`);
            }
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('Error procesando el webhook:', error.response?.data || error.message);
        res.sendStatus(500);
    }
});

// Función para enviar mensajes vía Axios
async function sendWhatsAppMessage(to, text) {
    try {
        const url = `https://graph.facebook.com/${API_VERSION}/${BUSINESS_PHONE_ID}/messages`;
        
        await axios.post(url, {
            messaging_product: "whatsapp",
            to: to,
            type: "text",
            text: { body: text }
        }, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Respuesta enviada con éxito');
    } catch (error) {
        console.error('Error al enviar mensaje:', error.response?.data || error.message);
    }
}

app.listen(PORT || 3000, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});
*/