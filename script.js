let map;
let markers = [];
let selectedCityLocation = null;
let placesService;
let searchRadiusCircle = null; // Для отображения радиуса

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 0, lng: 0 },
        zoom: 2,
    });

    const countryFilter = document.getElementById("countryFilter");
    const cityFilter = document.getElementById("cityFilter");
    const searchBox = document.getElementById("searchBox");
    const radiusFilter = document.getElementById("radiusFilter");
    const radiusValue = document.getElementById("radiusValue");
    const showCigarPlacesNearbyButton = document.getElementById("showCigarPlacesNearbyButton");
    const showCigarPlacesByLocationButton = document.getElementById("showCigarPlacesByLocationButton");

    const cityAutocomplete = new google.maps.places.Autocomplete(cityFilter, {
        types: ["(cities)"],
    });

    cityAutocomplete.setComponentRestrictions({ country: countryFilter.value });

    countryFilter.addEventListener("change", () => {
        cityAutocomplete.setComponentRestrictions({ country: countryFilter.value });
        cityFilter.value = "";
        searchBox.value = "";
    });

    cityAutocomplete.addListener("place_changed", () => {
        const place = cityAutocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
            alert("City not found.");
            return;
        }

        selectedCityLocation = place.geometry.location;
        const cityBounds = place.geometry.viewport;

        map.fitBounds(cityBounds);
        map.setZoom(12);

        // Привязываем bounds города к полю "Enter a Place"
        const searchBoxAutocomplete = new google.maps.places.Autocomplete(searchBox, {
            types: ["establishment"],
        });

        searchBoxAutocomplete.setBounds(cityBounds);
        searchBoxAutocomplete.addListener("place_changed", () => {
            const selectedPlace = searchBoxAutocomplete.getPlace();
            if (!selectedPlace.geometry || !selectedPlace.geometry.location) {
                alert("Place not found.");
                return;
            }

            map.setCenter(selectedPlace.geometry.location);
            map.setZoom(15);
            addPlaceMarker(selectedPlace);
            addToTable(selectedPlace); // Добавляем данные места в таблицу
        });
    });

    radiusFilter.addEventListener("input", () => {
        radiusValue.textContent = `Search Radius: ${radiusFilter.value}m`;
        if (selectedCityLocation) {
            drawRadius(selectedCityLocation, parseInt(radiusFilter.value));
        }
    });

    showCigarPlacesNearbyButton.addEventListener("click", () => {
        if (!selectedCityLocation) {
            alert("Please select a city first.");
            return;
        }
        searchCigarPlaces(selectedCityLocation, parseInt(radiusFilter.value));
    });

    showCigarPlacesByLocationButton.addEventListener("click", () => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                map.setCenter(userLocation);
                map.setZoom(14);
                searchCigarPlaces(userLocation, parseInt(radiusFilter.value));
            },
            () => {
                alert("Unable to retrieve your location.");
            }
        );
    });
}

// Поиск мест поблизости
function searchCigarPlaces(location, radius) {
    clearMarkers();
    clearTable(); // Очищаем таблицу перед добавлением новых данных
    drawRadius(location, radius);

    placesService = new google.maps.places.PlacesService(map);

    const request = {
        location: location,
        radius: radius,
        keyword: "cigar",
    };

    placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            results.forEach((place) => {
                addPlaceMarker(place);
                addToTable(place); // Добавляем каждое место в таблицу
            });
        } else {
            alert("No cigar places found nearby.");
        }
    });
}

// Добавляем маркер на карту
function addPlaceMarker(place) {
    const marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name,
    });

    const infoWindow = new google.maps.InfoWindow({
        content: `<h3>${place.name}</h3><p>${place.vicinity || "No address available"}</p>`,
    });

    marker.addListener("click", () => infoWindow.open(map, marker));
    markers.push(marker);
}

// Очищаем маркеры с карты
function clearMarkers() {
    markers.forEach((marker) => marker.setMap(null));
    markers = [];
}

// Очищаем таблицу
function clearTable() {
    const tableBody = document.querySelector("#infoTable tbody");
    tableBody.innerHTML = ""; // Удаляем все строки в таблице
}

// Добавляем информацию о месте в таблицу
function addToTable(place) {
    const tableBody = document.querySelector("#infoTable tbody");

    const name = place.name || "N/A";
    const address = place.vicinity || "N/A";
    const rating = place.rating || "N/A";
    const reviews = place.user_ratings_total || "N/A";

    let photoUrl = "N/A";
    if (place.photos && place.photos.length > 0) {
        photoUrl = place.photos[0].getUrl();
    }

    const photoHtml = photoUrl !== "N/A" ? `<img src="${photoUrl}" alt="${name}" style="max-width: 100px;">` : "N/A";

    const row = `
        <tr>
            <td>${name}</td>
            <td>${address}</td>
            <td>${rating}</td>
            <td>${reviews}</td>
            <td>${photoHtml}</td>
        </tr>
    `;

    tableBody.insertAdjacentHTML("beforeend", row);
}

// Визуализация радиуса на карте
function drawRadius(center, radius) {
    if (searchRadiusCircle) {
        searchRadiusCircle.setMap(null);
    }
    searchRadiusCircle = new google.maps.Circle({
        strokeColor: "#007BFF",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#007BFF",
        fillOpacity: 0.15,
        map: map,
        center: center,
        radius: radius,
    });
}
