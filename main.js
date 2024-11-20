const axios = require('axios');

// Function call api
async function fetchSupplierData(url) {
    const response = await axios.get(url);
    return response.data;
}

// Function call hotel datas and combine datas
async function getAllData() {
    const acme = await fetchSupplierData('https://5f2be0b4ffc88500167b85a0.mockapi.io/suppliers/acme');
    const patagonia = await fetchSupplierData('https://5f2be0b4ffc88500167b85a0.mockapi.io/suppliers/patagonia');
    const paperflies = await fetchSupplierData('https://5f2be0b4ffc88500167b85a0.mockapi.io/suppliers/paperflies');
    return [...acme, ...patagonia, ...paperflies];
}

/*
    Step 1: Create a map to return (The map will save a key is ID of Hotels and value is Object data of Hotels)
    Step 2: For loop all hotels
    Step 3: Create a key of the map is Hotels's ID
    Step 4: Check if the map is already add object value to map else create a new map and create a new object value
 */
function mergeObjects(array) {
    const mergedMap = new Map();

    for (const obj of array) {
        const firstKeyObj = Object.keys(obj)[0];
        const key = obj[firstKeyObj];

        if (!mergedMap.has(key)) {
            mergedMap.set(key, obj);
        } else {
            const existingObj = mergedMap.get(key);
            const mergedObj = { ...existingObj, ...obj };
            mergedMap.set(key, mergedObj);
        }
    }

    return Array.from(mergedMap.values());
}


// map key make sure that structure is correct
const mapKey = {
    "id": ["id", "Id", "hotel_id"],
    "destination_id": ["destination_id", "DestinationId", "destination"],
    "name": ["name", "Name", "hotel_name"],
    "lat": ["lat", "Latitude"],
    "lng": ["lng", "Longitude"],
    "city": ["city", "City"],
    "country": ["country", "Country", "location.country"],
    "address": ["address", "Address", "location.address"],
    "description": ["description", "Description"],
    "amenities": ["amenities"],
    "roomlinks": ["images.rooms", "images.url"],
    "sitelinks": ["images.site"],
    "booking_conditions": ["booking_conditions"]
};

/*  
    This function merges data by mapping keys (e.g., Id: ijhz, hotel_id: ijhz to id: ijhz).
    Step 1: Use getNestedValue to access values from nested keys.
    Step 2: Split the key string for easier traversal.
    Step 3: Iterate through each part of the key, returning the value or undefined.
    Step 4: Iterate through objects array.
    Step 5: Initialize a new object for merged data.
    Step 6: Iterate through mapKey keys.
    Step 7: Get sub-keys to find and select values.
    Step 8: For dot notation keys, use getNestedValue.
    Step 9: Compare and select the longest or first value.
    Step 10: For non-dot keys, access the value directly.
    Step 11: Save the selected value in mergedObj.
    Step 12: Return the merged results.
*/
function mergeData(objects, mapKey) {
    function getNestedValue(obj, key) {
        const keys = key.split('.'); 
        let value = obj;

        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                return undefined; 
            }
        }

        return value;
    }

    return objects.map(obj => {
        const mergedObj = {};

        for (const newKey in mapKey) {
            const keysToMerge = mapKey[newKey];
            let selectedValue = null;

            for (const key of keysToMerge) {
                if (key.includes('.')) {
                    const nestedValue = getNestedValue(obj, key);
                    if (nestedValue !== undefined) {
                        if (selectedValue === null) {
                            selectedValue = nestedValue;
                        } else if (nestedValue.length > selectedValue.length) {
                            selectedValue = nestedValue;
                        }
                    }
                } else {
                    if (obj[key] !== undefined && obj[key] !== null) {
                        if (selectedValue === null) {
                            selectedValue = obj[key];
                        } else if (obj[key].length > selectedValue.length) {
                            selectedValue = obj[key];
                        }
                    }
                }
            }

            if (selectedValue !== null) {
                mergedObj[newKey] = selectedValue;
            }
        }
        return mergedObj;
    });
}
function searchHotels(hotels, hotelIds, destinationIds) {
    if (hotelIds === 'none' && destinationIds === 'none') return hotels;

    const result = [];

    for (const hotel of hotels) {
        const isHotelIdMatch = hotelIds === 'none' || hotelIds.map(id => id.toLowerCase()).includes(hotel.id.toLowerCase());

        const isDestinationIdMatch = destinationIds === 'none' || destinationIds.map(id => id.toString()).includes(hotel.destination_id.toString());
        if (isHotelIdMatch && isDestinationIdMatch) {
            result.push(hotel);
        }
    }

    return result;
}


// Take arugments from bash
const args = process.argv.slice(2);
const hotelIds = args[0] !== 'none' ? args[0].split(',') : 'none';
const destinationIds = args[1] !== 'none' ? args[1].split(',').map(Number) : 'none';

(async () => {
    const allHotels = await getAllData();
    const mergedHotels = mergeObjects(allHotels);
    const mergedData = mergeData(mergedHotels, mapKey)
    const searchHotel = searchHotels(mergedData, hotelIds, destinationIds);

    console.log(searchHotel);

})();