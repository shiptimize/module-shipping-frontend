import Utils from './shiptimize-utils.js';  

export default class ShiptimizeGmaps {

    constructor(key) {
        this.isScriptLoaded = false;
        this.markers = [];
        this.map = null;
        this.pickupPoints = [];
        this.key = key;

        /** 
         * the root url for the icons it's different for every platform  
         * make sure to include a trailing / 
         */ 
        this.icon_folder = shiptimize_icon_folder;  
        this.icon_selected = shiptimize_icon_folder+'selected.png';
        this.icon_default = shiptimize_icon_folder+'default.png';
        this.current_icon = this.icon_default; 
    }


    /** 
     * Checks if we have an icon for this carrier.
     * If yes then change the carrier icon
     * If not then use the default icon
     * 
     * @param int carrier_id - the carrier id 
     */ 
    setCarrierIcon(carrier_id){
      let carrier_icon_url = this.icon_folder+''+carrier_id+'.png'; 
      this.current_icon = Utils.isUrlValid(carrier_icon_url) ?  carrier_icon_url : this.icon_default; 
    }


    /** 
     * if the script has not been loaded , load it 
     */
    grantReady() {
        if (!this.isScriptLoaded) {
            this.loadScript();
        }
    }

    loadScript() {
        if(typeof(google) == 'undefined' ||  typeof(google.maps) == 'undefined'){
            Utils.injectExternalScript("https://maps.googleapis.com/maps/api/js?key=" + this.key + "&callback=shiptimize.loadMap");    
        } 
        this.isScriptLoaded = true;
    }

    /** 
     * Load the map into the element 
     * This function needs the script to be loaded 
     */
    loadMap() {        
        console.log("displaying map on container with " + jQuery(".shiptimize-pickup__map").width() + " "+jQuery(".shiptimize-pickup__map").height() ,jQuery(".shiptimize-pickup__map").get(0)); 
        this.map = new google.maps.Map(jQuery(".shiptimize-pickup__map").get(0), {
            center: { lat: -34.397, lng: 150.644 },
            zoom: 16,
            mapTypeControl: false,
        });
    }

    /** 
     * center the map 
     */
    centerMap(lat, lng) {
        this.map.setCenter(new google.maps.LatLng(lat, lng));
    }

    /** 
     * Extract the country code from a geocode result
     * @param geocode - a google.maps.Geocoder result 
     * @return string alpha-2 code for the country name 
     */ 
    getCountryCodeFromResult(geocode){
      if(typeof(geocode.address_components) == "undefined"){
        return ""; 
      }

      let components = geocode.address_components;
      for( let i=0; i < components.length; ++i ){
        let types = components[i].types; 

        for(let j=0; j < types.length; ++j ){
          if( types[j] == 'country') {
            return components[i].short_name; 
          } 
        }
        
      }
    }

    /**
     *  
     * @param shippingData, the address parts       
     * @param f_callback , the function to call when all mighty google returns a result 
     */ 
    geocode(shippingData,  f_callback) { 
      if(typeof(google) == 'undefined'){ //script not loaded yet
        setTimeout(()=>{this.geocode(shippingData, f_callback); }, 200); 
        return;
      }

        let geocoder = new google.maps.Geocoder();
        let me  = this; 

        var address = shippingData.Address.Streetname1 + " " + shippingData.Address.Streetname2 + " " + shippingData.Address.postalCode + " " + shippingData.Address.City + " " + shippingData.Address.State + " " + shippingData.Address.Country;
        console.log('geocoding ' + address);

        geocoder.geocode({ 'address': address }, function(results, status) {
            let geocode = {iso2:'', lat:'', lng:''};

            if (status == 'OK') {
                geocode = results[0];
            }  
            else {
                console.log('Geocode was not successful for the following reason: ' + status);
                f_callback(geocode);
                return; 
            }

            let latlng = geocode.geometry.location;

            geocode.iso2 = me.getCountryCodeFromResult(geocode);
            geocode.lat = latlng.lat(); 
            geocode.lng = latlng.lng(); 

            f_callback(geocode);
        });
    }

    clearMarkers() {
        if (this.markers.length > 0) {
            for (let i = 0; i < this.markers.length; ++i) {
                this.markers[i].setMap(null);
            }

            this.markers = [];
        }
    }

    /** 
     * Add the markers to map 
     * @param array pickupPoints - an array of pickupPoints
     * @param callback - a function to call when the marker is clicked 
     */
    addMarkers(pickupPoints, callback) {
        this.pickupPoints = pickupPoints;

        for (let x = 0; x < pickupPoints.length; ++x) {
            this.markers[x] = this.getMarker(pickupPoints[x]);
            //    we need to do this because the values for lat,lng we have are rounded, so they will not match the ones returned by google
            pickupPoints[x].marker = this.markers[x];

            this.markers[x].addListener('click', () => {
              if(typeof(callback)!= 'undefined'){
                callback(x);
              }
            });
        }

        this.fitBounds()
    }

    /** 
     * Return a marker for the gmaps 
     */
    getMarker(pickupPoint, callback) {
        let marker = new google.maps.Marker({
            position: new google.maps.LatLng(pickupPoint.Lat, pickupPoint.Long),
            map: this.map,
            icon: {
              url:  this.current_icon
            }
        });
 

        return marker;
     }

    fitBounds() {
      var bounds = new google.maps.LatLngBounds();
      for( let x = 0; x< this.markers.length; ++x ){
        bounds.extend(this.markers[x].getPosition()); 
      } 
      this.map.fitBounds(bounds);
    }
 
    /**
     * Reset all markers  
     * Select the marker of index idx in map 
     * @param int idx - the index to select 
     */
    selectMarkerByIdx(idx) { 
        for (let i = 0; i < this.markers.length; ++i) {
            this.markers[i].setIcon(
              idx == i 
              ? 
              this.icon_selected
              :
              this.current_icon
            );  
        }
    }

}