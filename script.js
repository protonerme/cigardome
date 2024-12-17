let map;
let markers = [];
let autocomplete;

function initMap() {
    const center = { lat: -34.397, lng: 150.644 };
    map = new google.maps.Map(document.getElementById("map"), {
        center: center,
        zoom: 8,
    });

    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById("searchBox"),
        {
            types: ["establishment"],
            componentRestrictions: { country: "us" },
        }
    );

    autocomplete.addListener("place_changed", handlePlaceSelect);
}

function handlePlaceSelect() {
    const place = autocomplete.getPlace();

    if (!place.geometry || !place.geometry.location) {
        alert("No location found for this search.");
        return;
    }

    map.setCenter(place.geometry.location);
    map.setZoom(12);

    clearMarkers();

    const marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name,
    });

    const infoWindow = new google.maps.InfoWindow({
        content: `
            <h3>${place.name}</h3>
            <p>${place.formatted_address || "Address not available"}</p>
        `,
    });

    marker.addListener("click", () => {
        infoWindow.open(map, marker);
    });

    // Добавление данных в таблицу
    addToTable(place);

    markers.push(marker);
}

function addToTable(place) {
    const tableBody = document.querySelector("#infoTable tbody");

    const name = place.name || "N/A";
    const address = place.formatted_address || "N/A";
    const rating = place.rating || "N/A";
    const ratingsCount = place.user_ratings_total || "N/A"; // Количество оценок
    const phone = place.formatted_phone_number || "N/A";
    const website = place.website
        ? `<a href="${place.website}" target="_blank">Перейти</a>`
        : "N/A";

    const row = `
        <tr>
            <td>${name}</td>
            <td>${address}</td>
            <td>${rating}</td>
            <td>${ratingsCount}</td>
            <td>${phone}</td>
            <td>${website}</td>
        </tr>
    `;

    tableBody.insertAdjacentHTML("beforeend", row);
}

function clearMarkers() {
    markers.forEach((marker) => marker.setMap(null));
    markers = [];
}

window.onload = initMap;