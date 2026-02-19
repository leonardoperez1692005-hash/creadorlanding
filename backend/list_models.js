import 'dotenv/config';
import fs from 'fs';

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
    .then(async (res) => {
        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${await res.text()}`);
        }
        return res.json();
    })
    .then((data) => {
        const models = data.models
            .filter(m => m.name.includes('gemini'))
            .map(m => m.name)
            .join('\n');

        fs.writeFileSync('models_clean.txt', models);
        console.log('Models saved to models_clean.txt');
    })
    .catch((err) => {
        console.error(err);
        fs.writeFileSync('models_error.txt', err.toString());
    });
