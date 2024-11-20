// script.js

// --- Variables globales ---
let map; // Instancia del mapa
let markersLayer; // Capa para los marcadores

// --- 1. Inicialización del Mapa ---
function initializeMap() {
    // Crear un mapa centrado en las coordenadas [20.0, 0.0] con zoom 2
    map = L.map('map').setView([20.0, 0.0], 2);

    // Añadir la capa de OpenStreetMap al mapa
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);
}

// --- 2. Manejo del evento de envío del formulario ---
document.getElementById('suggest-button').addEventListener('click', async function(e) {
    e.preventDefault(); // Prevenir el comportamiento por defecto del botón
    const input = document.getElementById('travel-input').value.trim(); // Obtener el texto del input
    const suggestionsList = document.getElementById('suggestions-list'); // Obtener la lista donde mostrar las sugerencias

    // Verificar que el input no esté vacío
    if (!input) {
        alert('Please enter your travel preferences.');
        return;
    }

    console.log('Button clicked, sending request to server...');

    try {
        // Llamar al servidor Express para generar las sugerencias de viaje
        const response = await fetch('http://localhost:5500/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: input })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch suggestions from server');
        }

        const data = await response.json(); // Parsear la respuesta JSON

        // Limpiar la lista de sugerencias antes de agregar nuevas
        suggestionsList.innerHTML = '';

        // Verificar si hay destinos, si no, mostrar un mensaje
        const destinations = data.destinations || [];
        if (destinations.length === 0) {
            suggestionsList.innerHTML = '<li>No destinations found. Try another input!</li>';
        } else {
            // Mostrar los destinos en la lista de sugerencias
            destinations.forEach(destination => {
                const li = document.createElement('li');
                li.textContent = destination.name || 'Unnamed destination'; // Si no tiene nombre, mostrar "Unnamed destination"
                suggestionsList.appendChild(li);
            });
        }

        // Llamar a la función para mostrar los destinos en el mapa
        displayMap(destinations);

    } catch (error) {
        // Manejar cualquier error durante la solicitud
        console.error('Error fetching suggestions:', error);
        alert('An error occurred while fetching suggestions. Please try again.');
    }
});

// --- 3. Función para Mostrar los Destinos en el Mapa ---
function displayMap(destinations) {
    // Limpiar los marcadores existentes antes de agregar nuevos
    if (markersLayer) {
        map.removeLayer(markersLayer);
    }
    markersLayer = L.layerGroup().addTo(map); // Crear una nueva capa para los marcadores

    // Añadir un marcador para cada destino recibido
    destinations.forEach(destination => {
        if (destination.coords) {
            const coords = destination.coords; // Obtener las coordenadas del destino
            L.marker(coords).addTo(markersLayer).bindPopup(destination.name || 'Unnamed destination'); // Crear el marcador con el nombre del destino
        }
    });

    // Ajustar el mapa para mostrar todos los marcadores
    if (destinations.length > 0) {
        const bounds = L.latLngBounds(destinations.map(d => d.coords)); // Crear un límite para ajustar la vista del mapa
        map.fitBounds(bounds); // Ajustar la vista del mapa
    }
}

// --- 4. Inicialización del mapa cuando se carga la página ---
initializeMap();
