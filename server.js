// server.mjs
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv'; // Asegúrate de usar esta importación de ESM también
import path from 'path';

dotenv.config(); // Cargar las variables de entorno

const app = express();
const PORT = 5500;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(path.dirname(''), '/')));

app.get('/', (req, res) => {
    res.sendFile(path.join(path.dirname(''), 'index.html'));
});

app.post('/generate', async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `Eres un asistente de viajes. En base a la siguiente descripción de viaje: "${prompt}", por favor, proporciona sugerencias de destinos de viaje que encajen con esta descripción. Responde con un máximo de 3 líneas, incluyendo los nombres de los destinos.`
                            }
                        ]
                    }
                ]
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch suggestions from Gemini API');
        }

        const json = await response.json();
        if (json.candidates && json.candidates.length > 0) {
            const suggestionText = json.candidates[0].content.parts[0].text;
            const destinations = suggestionText.match(/(?:\b[A-Z][a-záéíóúüñ]*\b(?:\s+[A-Z][a-záéíóúüñ]*\b)*)+/g) || [];
            const coordinatesPromises = destinations.map(destination => getCoordinatesFromNominatim(destination));
            const coordinatesResults = await Promise.all(coordinatesPromises);
            const validDestinations = coordinatesResults.filter(result => result !== null);
            res.json({ suggestion: suggestionText, destinations: validDestinations });
        } else {
            res.json({ suggestion: 'No se encontraron sugerencias.', destinations: [] });
        }
    } catch (error) {
        console.error('Error al obtener sugerencias:', error);
        res.status(500).json({ error: 'Error al obtener sugerencias' });
    }
});

async function getCoordinatesFromNominatim(destination) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`);
        if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
                const { lat, lon } = data[0];
                return { name: destination, coords: [parseFloat(lat), parseFloat(lon)] };
            }
        }
    } catch (error) {
        console.error(`Error al obtener coordenadas para ${destination}:`, error);
    }
    return null;
}

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
