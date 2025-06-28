const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require('pino');
const {
    default: BaileysLib,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    async function NeutralPairingCode() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            let connection = BaileysLib({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
                },
                printQRInTerminal: false,
                logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
                browser: Browsers.macOS('Chrome')
            });

            if (!connection.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await connection.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            connection.ev.on('creds.update', saveCreds);

            connection.ev.on('connection.update', async (update) => {
                const { connection: connStatus, lastDisconnect } = update;

                if (connStatus === 'open') {
                    await delay(5000);
                    let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                    await delay(800);
                    let b64data = Buffer.from(data).toString('base64');

                    // Send the session data with neutral branding and session ID prefix "DaveMd_"
                    const sessionMessage = `
╔════════════════════◇
║ 『 SESSION CONNECTED 』
║ ✨ DAVE SESSIONS 🔷
║ ✨ Gifted Dave 🔷
╚════════════════════╝

---

╔════════════════════◇
║ 『 YOU'VE SUCCESSFULLY PAIRED 』
║ - Use the session ID starting with:
║ - SESSION_ID: DaveMd_${id}
╚════════════════════╝

╔════════════════════◇
║ 『 SUPPORT & COMMUNITY 』
║ ❍ Youtube: youtube.com/@davlodavlo19
║ ❍ Owner: 254104260236
║ ❍ Repo: https://github.com/gifteddaves/Dave-Md-V1
║ ❍ WhatsApp Group: https://chat.whatsapp.com/CaPeB0sVRTrL3aG6asYeAC
║ ❍ WhatsApp Channel: https://whatsapp.com/channel/0029VbApvFQ2Jl84lhONkc3k
║ ❍ Instagram: https://www.instagram.com/_gifted_dave?igsh=YzZ0NDRoaXFxM2Zk
╚═════════════════════╝

𒂀 Enjoy DAVE SESSIONS!

---

Please star ⭐ the GitHub repo to support development.
______________________________
`;

                    await connection.sendMessage(connection.user.id, { text: sessionMessage });

                    await delay(100);
                    await connection.ws.close();
                    return await removeFile('./temp/' + id);
                } else if (connStatus === 'close' && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    NeutralPairingCode();
                }
            });
        } catch (err) {
            console.log('Service restarted:', err);
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: 'Service Currently Unavailable' });
            }
        }
    }

    return await NeutralPairingCode();
});

module.exports = router;
