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

/*
    
*/
function mergeData(objects, mapKey) {
    // Hàm để duyệt sâu vào object con
    function getNestedValue(obj, key) {
        const keys = key.split('.'); // Tách chuỗi key thành mảng để hỗ trợ deep lookup
        let value = obj;

        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                return undefined; // Nếu không tìm thấy key, trả về undefined
            }
        }

        return value;
    }

    return objects.map(obj => {
        const mergedObj = {};

        // Duyệt qua từng key trong mapKey
        for (const newKey in mapKey) {
            const keysToMerge = mapKey[newKey];
            let selectedValue = null;

            // Duyệt qua các khóa trong array của mapKey
            for (const key of keysToMerge) {
                if (key.includes('.')) {
                    // Nếu key có dấu '.' tức là key lồng nhau, cần phải tìm sâu trong object con
                    const nestedValue = getNestedValue(obj, key);
                    if (nestedValue !== undefined) {
                        // So sánh giá trị dài nhất (hoặc giá trị đầu tiên nếu tất cả bằng nhau)
                        if (selectedValue === null) {
                            selectedValue = nestedValue;
                        } else if (nestedValue.length > selectedValue.length) {
                            selectedValue = nestedValue;
                        }
                    }
                } else {
                    // Nếu key không có dấu '.', lấy giá trị từ key trong object cha
                    if (obj[key] !== undefined && obj[key] !== null) {
                        // So sánh và chọn giá trị dài nhất hoặc giá trị đầu tiên nếu tất cả bằng nhau
                        if (selectedValue === null) {
                            selectedValue = obj[key];
                        } else if (obj[key].length > selectedValue.length) {
                            selectedValue = obj[key];
                        }
                    }
                }
            }

            // Lưu giá trị vào mergedObj
            if (selectedValue !== null) {
                mergedObj[newKey] = selectedValue;
            }
        }

        return mergedObj;
    });
}function searchHotels(hotels, hotelIds, destinationIds) {
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
    const mergedData =  mergeData(mergedHotels, mapKey)
    const searchHotel = searchHotels(mergedData, hotelIds, destinationIds);

    console.log(searchHotel);

})();