import Utils from './shiptimize-utils.js';

export default class ShiptimizeOpenMap {

    constructor() {
        this.isScriptLoaded = false;
        this.markers = [];
        this.map = null;

        /** 
         * the root url for the icons it's different for every platform  
         * make sure to include a trailing / 
         */
        this.icon_folder = shiptimize_icon_folder;
    }

    /** 
     *
     * @param string imageUrl - full url to the icon 
     * @return L.icon object 
     */
    createIcon(imageUrl) {
       return L.icon({
            iconUrl: imageUrl,
            iconSize: [50, 50], // size of the icon 
            iconAnchor: [25, 25], // point of the icon which will correspond to marker's location 
            popupAnchor: [-25, -50] // point from which the popup should open relative to the iconAnchor
        });
    }

    /** 
     * @param decimal lat 
     * @param decimal lng 
     */ 
    centerMap(lat, lng){
        this.map.invalidateSize();
        let latlng = L.latLng(lat, lng);  
    }

    /** 
     * if the script has not been loaded , load it. 
     * We use this function because we only want to load the script when the user clicks the button 
     */
    grantReady() {
        if (!this.isScriptLoaded) {
            this.loadScript();
        }
    }

    /**
     *  
     * @param shippingData, the address parts       
     * @param f_callback , the function to call when all mighty google returns a result 
     */
    geocode(shippingData, f_callback) {
        console.log(shippingData);
        this.grantReady(); 

        jQuery.getJSON("https://nominatim.openstreetmap.org/search?format=json&addressdetails=1" +
            "&city=" + shippingData.Address.City +
            "&country=" + shippingData.Address.Country, {}, (response) => {
                let geocode = {
                    'iso2': '',
                    'lat': '',
                    'lng': ''
                };

                if (response.length > 0) {
                    let location = response[0];

                    geocode.iso2 = location.address.country_code;

                    geocode.lat = location.lat;
                    geocode.lng = location.lon;
                }
                f_callback(geocode);

                console.log(response);
            });
    }

    loadScript() {
        if (typeof(L) == 'undefined') {
            Utils.injectExternalScript(SHIPTIMIZE_LEAFLET_URL);
        }

        this.isScriptLoaded = true;
        this.loadMap();
        return;
    }

    /** 
     * Leaflet does not receive a callback so we wait here for the script to be loaded 
     */
    loadMap() {
        if (typeof(L) == 'undefined') {
            setTimeout(() => { this.loadMap(); }, 1500);
            console.log("Map not loaded, settimeout ");
            return;
        }

        this.icon_selected = this.createIcon(shiptimize_icon_folder + 'selected.png');
        this.icon_default = this.createIcon(shiptimize_icon_folder + 'default.png');
        this.current_icon = this.icon_default;

        this.map = new L.map(jQuery(".shiptimize-pickup__map").get(0), {
            "zoom": 16,
            "center": [51.505, -0.09]
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            "attribution": '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
    }

    clearMarkers() {
        if (this.markers.length > 0) {
            for (let i = 0; i < this.markers.length; ++i) {
                this.map.removeLayer(this.markers[i]);
            }
        }
        this.markers = [];
    }


    /** 
     * Add the markers to map 
     * @param array pickupPoints - an array of pickupPoints
     */
    addMarkers(pickupPoints,callback) {
        this.pickupPoints = pickupPoints; 

        for (let x = 0; x < pickupPoints.length; ++x) {
            this.markers[x] = this.getMarker(pickupPoints[x]);
            //    we need to do this because the values for lat,lng we have are rounded, so they will not match the ones returned by google
            this.pickupPoints[x].marker = this.markers[x];

            this.markers[x].on('click', () => {
                if(typeof(callback) == 'function'){
                    callback(x);
                }
            });
        }

        this.fitBounds();
    }

    resetMarker(marker) {
        marker.setIcon(this.icon_default);
    }

    selectMarker(marker) {
        marker.setIcon(this.icon_selected);
    }

    /** 
     * Adjust the zoom in the map to display all the markers 
     * There's a fit bounds that receives 2 corners, but calculating them is up to us. 
     * corners: top left, bottom right     
     * then we center the map at the center of the square  
     */
    fitBounds() {
        let bottomLeft = [this.pickupPoints[0].Lat, this.pickupPoints[0].Long];
        let topRight = [this.pickupPoints[0].Lat, this.pickupPoints[0].Long];

        for (let i = 0; i < this.pickupPoints.length; ++i) {
            let lat = this.pickupPoints[i].Lat;
            let lng = this.pickupPoints[i].Long;

            if (lat < bottomLeft[0]) {
                bottomLeft[0] = lat;
            }

            if (lat > topRight[0]) {
                topRight[0] = lat;
            }

            if (lng > topRight[1]) {
                topRight[1] = lng;
            }

            if (lng < bottomLeft[1]) {
                bottomLeft[1] = lng;
            }
        }


        let centerX = bottomLeft[0] + (topRight[0] - bottomLeft[0]) / 2;
        let centerY = bottomLeft[1] + (topRight[1] - bottomLeft[1]) / 2;

        this.map.panTo([centerX, centerY]);

        this.map.fitBounds([
            bottomLeft,
            topRight
        ]);
    }

    /** 
     * Return a marker for the openLayers 
     * IconAnchor: The coordinates of the "tip" of the icon (relative to its top left corner). 
     * The icon will be aligned so that this point is at the marker's geographical location. 
     * Centered by default if size is specified, also can be set in CSS with negative margins.
     */
    getMarker(pickupPoint) {
        let marker = L.marker([pickupPoint.Lat, pickupPoint.Long], {
            "icon": this.current_icon,
            "title": pickupPoint.Information.Name + "\n" + pickupPoint.Information.Address
        });
        marker.addTo(this.map);
        return marker;
    }

    /** 
     * Checks if we have an icon for this carrier.
     * If yes then change the carrier icon
     * If not then use the default icon
     * 
     * @param int carrier_id - the carrier id 
     */
    setCarrierIcon(carrier_id) {
        if (typeof(L) == 'undefined') {
            setTimeout(() => { this.setCarrierIcon(carrier_id); }, 200);
            return;
        }
        let carrier_icon_url = this.icon_folder + '' + carrier_id + '.png';
        this.current_icon = Utils.isUrlValid(carrier_icon_url) ? this.createIcon(carrier_icon_url) : this.icon_default;
    }

    /**
     * Reset all markers  
     * Select the marker of index idx in map 
     * @param int idx - the index to select 
     */
    selectMarkerByIdx(idx) {
        for (let i = 0; i < this.markers.length; ++i) {
            this.markers[i].setIcon(
                idx == i ?
                this.icon_selected :
                this.current_icon
            );
        }
    }
}