import { Client, GatewayIntentBits, Events, EmbedBuilder } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

// Inisialisasi Discord Client dengan Message Content Intent
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Inisialisasi Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let channel;

// Mengambil channel tujuan
async function initChannel() {
    try {
        channel = await client.channels.fetch(CHANNEL_ID);
        console.log(`[+] Terhubung ke channel Discord: ${channel.name}`);
    } catch (error) {
        console.error("[-] Gagal mengambil channel Discord:", error.message);
    }
}

// Event ready
client.on(Events.ClientReady, async () => {
    console.log(`[+] Bot AI Conversational Scheduler Online: ${client.user.tag}`);
    await initChannel();
    if (channel) {
        const welcomeEmbed = new EmbedBuilder()
            .setColor(0x7D3C98)
            .setTitle('🟢 Piccolo AI Calendar Assistant Aktif!')
            .setDescription(
                'Aku adalah Piccolo, mentormu. Mulai sekarang, kamu tidak perlu mengetik perintah yang kaku.\n\n' +
                '**Cukup mengobrol denganku secara langsung.** Katakan jadwal latihanmu, janji temu, atau acaramu, dan aku akan langsung mengurus pendaftaran kalendernya.\n\n' +
                '*Contoh:* \n' +
                '• *"Piccolo, tolong ingatkan besok jam 10 pagi ada rapat dengan dosen selama 1 jam."*\n' +
                '• *"Nanti malam jam 8 saya mau belajar coding selama 2 jam."*'
            )
            .setFooter({ text: 'Latihan dimulai sekarang. Fokus!' })
            .setTimestamp();
        await channel.send({ embeds: [welcomeEmbed] });
    }
});

// Handler pesan masuk
client.on(Events.MessageCreate, async (message) => {
    // Abaikan pesan dari bot lain atau jika bukan di channel target
    if (message.author.bot || message.channel.id !== CHANNEL_ID) return;

    const messageText = message.content.trim();
    if (!messageText) return;

    // Jika pengguna meminta bantuan secara eksplisit
    if (messageText.toLowerCase() === '!bantuan' || messageText.toLowerCase() === '!help') {
        const helpEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🛡️ Panduan Asisten AI Piccolo')
            .setDescription(
                'Kamu tidak perlu menggunakan perintah kaku lagi. Cukup ketik pesan biasa seolah sedang berbicara denganku.\n\n' +
                '**Cara Penggunaan:**\n' +
                '1. **Menjadwalkan Acara:** Tulis aktivitas, hari/tanggal, jam, dan estimasi durasinya.\n' +
                '   *Contoh: "Jadwalkan belajar coding nanti malam jam 8 selama 2 jam"* atau *"Besok jam 1 siang saya ada janji ke dokter"*.\n' +
                '2. **Konsultasi & Motivasi:** Kamu bisa bercakap-cakap biasa, meminta masukan, atau mengeluh lelah, dan aku akan memberikan arahan tegas ala Piccolo.'
            );
        return message.reply({ embeds: [helpEmbed] });
    }

    // Aktifkan indikator bot sedang mengetik
    await message.channel.sendTyping();

    // Dapatkan waktu lokal Jakarta (WIB - UTC+7)
    const timeOptions = { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'long', hour12: false };
    const formatter = new Intl.DateTimeFormat('id-ID', timeOptions);
    const currentLocalTimeStr = formatter.format(new Date());

    // Format ISO untuk acuan kalkulasi tanggal
    const isoOptions = { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const isoFormatter = new Intl.DateTimeFormat('sv-SE', isoOptions);
    const currentLocalTimeISO = isoFormatter.format(new Date()).replace(' ', 'T') + '+07:00';

    // Prompt instruksi sistem untuk Gemini AI
    const prompt = `
Kamu adalah Piccolo, Namekian bijaksana dari Dragon Ball yang bertindak sebagai mentor dan asisten penjadwalan taktis pengguna.
Pengguna mengobrol denganmu secara langsung. Tugasmu adalah mendengarkan pesan mereka, menanggapi dengan gaya mentormu, dan otomatis membuat jadwal kalender jika mereka menyebutkan acara/kegiatan tertentu.

Waktu sekarang di wilayah pengguna (Jakarta/WIB): ${currentLocalTimeStr}
Format ISO Waktu Sekarang: ${currentLocalTimeISO}

Pesan dari pengguna:
"${messageText}"

Tugas & Batasanmu:
1. **Analisis Niat (Intent Analysis)**:
   - Jika pengguna berniat **menjadwalkan, mencatat kegiatan, membuat janji temu, meminta pengingat, atau merencanakan acara** pada waktu tertentu:
     - Tentukan waktu mulai (start) dan selesai (end) yang tepat berdasarkan pesan mereka dan acuan Waktu Sekarang (${currentLocalTimeISO}).
     - Jika durasi tidak disebutkan secara eksplisit oleh pengguna, buat perkiraan logis (misalnya: belajar/olahraga = 2 jam, rapat/pertemuan/makan = 1 jam).
     - Di bagian **PALING BAWAH** responmu, wajib sertakan blok kode JSON yang berisi struktur perintah pembuatan event:
       \`\`\`json
       {
         "action": "create_event",
         "event": {
           "title": "Nama/Deskripsi Acara",
           "start": "YYYY-MM-DDTHH:mm:ss+07:00",
           "end": "YYYY-MM-DDTHH:mm:ss+07:00"
         }
       }
       \`\`\`
   - Jika pengguna hanya mengobrol santai, bertanya hal umum, curhat, atau mengeluh lelah:
     - Balas hanya dengan teks biasa berupa nasihat tegas, disiplin, namun peduli khas Piccolo. Jangan segan menegur jika mereka malas ("Berdiri. Latihan belum selesai!"). Jangan sertakan blok JSON apa pun jika tidak ada kegiatan untuk dijadwalkan.

2. **Gaya Bicara**: Singkat, dingin, bijaksana, tidak suka basa-basi, memanggil pengguna dengan "kamu" atau "muridku", sesekali gunakan analogi latihan, pertarungan, atau energi (Ki). Jangan gunakan emoji berlebihan.

3. **PENTING**: Blok JSON wajib ditulis dengan format JSON yang valid. Jangan meletakkan teks apa pun di dalam atau di sekitar blok kode JSON tersebut selain pembuka (\`\`\`json) dan penutup (\`\`\`).
`;

    try {
        const result = await aiModel.generateContent(prompt);
        const responseText = result.response.text();

        // Ekstrak blok JSON dari respon Gemini
        const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = responseText.match(jsonRegex);
        let textResponse = responseText;
        let actionPayload = null;

        if (match) {
            // Pisahkan teks tanggapan Piccolo dari blok JSON
            textResponse = responseText.replace(jsonRegex, '').trim();
            try {
                actionPayload = JSON.parse(match[1].trim());
            } catch (jsonError) {
                console.error("[-] Gagal mem-parse JSON perintah dari Gemini:", jsonError);
            }
        }

        let isSynced = false;
        let syncErrorMsg = "";

        // Jika terdeteksi perintah create_event dan N8N_WEBHOOK_URL dikonfigurasi
        if (actionPayload && actionPayload.action === 'create_event' && actionPayload.event) {
            if (N8N_WEBHOOK_URL) {
                try {
                    const syncResponse = await fetch(N8N_WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(actionPayload.event)
                    });

                    if (syncResponse.ok) {
                        isSynced = true;
                    } else {
                        syncErrorMsg = `Status n8n: ${syncResponse.status}`;
                    }
                } catch (webhookError) {
                    console.error("[-] Gagal mengirim ke n8n webhook:", webhookError);
                    syncErrorMsg = "Tidak dapat menghubungi n8n VPS";
                }
            } else {
                syncErrorMsg = "N8N_WEBHOOK_URL belum dikonfigurasi di file .env";
            }
        }

        // Tampilkan tanggapan Piccolo ke Discord
        const embedColor = actionPayload && actionPayload.action === 'create_event' ? 0x2ECC71 : 0x7D3C98;
        const embedTitle = actionPayload && actionPayload.action === 'create_event' ? '📅 Jadwal Baru Terdaftar' : '🟢 Nasihat Piccolo';

        const aiEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(embedTitle)
            .setDescription(textResponse)
            .setFooter({ text: 'Latihan belum selesai. Tetap fokus!' })
            .setTimestamp();

        if (actionPayload && actionPayload.action === 'create_event' && actionPayload.event) {
            const ev = actionPayload.event;
            // Format tampilan waktu untuk user di embed
            const dateStr = new Date(ev.start).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });
            
            aiEmbed.addFields({
                name: 'Detail Kalender:',
                value: `📝 **Acara:** ${ev.title}\n⏱️ **Waktu:** ${dateStr} WIB`
            });

            if (isSynced) {
                aiEmbed.addFields({
                    name: 'Status Sinkronisasi:',
                    value: '✅ Berhasil didaftarkan ke Google Calendar milikmu!'
                });
            } else {
                aiEmbed.addFields({
                    name: 'Status Sinkronisasi:',
                    value: `⚠️ Gagal disinkronkan (${syncErrorMsg})`
                });
            }
        }

        return message.reply({ embeds: [aiEmbed] });
    } catch (error) {
        console.error("[-] Error Gemini:", error);
        return message.reply('💥 Terjadi gangguan energi saat memproses obrolanmu. Tetaplah siaga dan coba lagi nanti.');
    }
});

client.login(DISCORD_TOKEN);
