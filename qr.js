const PastebinAPI = require('pastebin-js'),
pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const {
    default: makeConnection,
    useMultiFileAuthState,
    jidNormalizedUser,
    Browsers,
    delay,
    makeInMemoryStore,
} = require("@whiskeysockets/baileys");

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, {
        recursive: true,
        force: true
    });
}

router.get('/', async (req, res) => {
    const id = makeid();

    async function generateQRCodeSession() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            let connection = makeConnection({
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS("Desktop"),
            });

            connection.ev.on('creds.update', saveCreds);

            connection.ev.on("connection.update", async (s) => {
                const { connection: conn, lastDisconnect, qr } = s;

                if (qr) await res.end(await QRCode.toBuffer(qr));

                if (conn === "open") {
                    await delay(5000);
                    let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                    await delay(800);
                    let b64data = Buffer.from(data).toString('base64');
                    let session = await connection.sendMessage(connection.user.id, { text: 'DaveMd~' + b64data });

                    let sessionText = `

╔════════════════════◇
║『 SESSION CONNECTED』
║ ✨ DAVE SESSIONS 🔷
║ ✨ Gifted Dave 🔷
╚════════════════════╝

---

╔════════════════════◇
║『 YOU'VE CHOSEN DAVE SESSIONS 』
║ - Set the session ID in your bot environment:
║ - SESSION_ID: DaveMd~...
╚════════════════════╝

╔════════════════════◇
║ 『••• VISIT FOR HELP •••』
║❍ YouTube: youtube.com/@davlodavlo19
║❍ Owner: 254104260236
║❍ Repo: https://github.com/gifteddaves/DAVE-Md-V1
║❍ WaGroup: https://chat.whatsapp.com/CaPeB0sVRTrL3aG6asYeAC
║❍ WaChannel: https://whatsapp.com/channel/0029VbApvFQ2Jl84lhONkc3k
║❍ Instagram: https://www.instagram.com/_gifted_dave?igsh=YzZ0NDRoaXFxM2Zk
╚═════════════════════╝
𒂀 Enjoy DaveMd Sessions!

---

Don't Forget To ⭐ Star The Repo!
____________________________________`;

                    await connection.sendMessage(connection.user.id, { text: sessionText }, { quoted: session });
                    await delay(100);
                    await connection.ws.close();
                    return await removeFile('./temp/' + id);
                } else if (
                    conn === "close" &&
                    lastDisconnect &&
                    lastDisconnect.error &&
                    lastDisconnect.error.output.statusCode != 401
                ) {
                    await delay(10000);
                    generateQRCodeSession();
                }
            });
        } catch (err) {
            if (!res.headersSent) {
                await res.json({ code: "Service is Currently Unavailable" });
            }
            console.log(err);
            await removeFile('./temp/' + id);
        }
    }

    return await generateQRCodeSession();
});

module.exports = router;
