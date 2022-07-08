export default class ShiptmizeMagento {

  constructor() {
    this.bootstrap();
    this.rate_carrier = {};
    this.rate_requested = false;
    this.pickupPoint = {};
    this.currentMethod = null;
  }


  /**   
   * If it's a multi step ajax checkout.. we don't try to understand  what convoluted logic the theme developers have going on, but just wait for the 
   * methods to be included 
   *
   * Furthermore we are plugin into the footer to inject the map, but we can't guarantee it will be included in the outer body tag, so we need to do that after load. 
   * If there is a table rate present we need to ask the server if the selected method has pickup 
   */
  bootstrap() {
    //Not ideal, but also not horrendous wait for the element to exist 
    if (jQuery("input[type='radio']:checked").length == 0) {
      setTimeout(() => {
        this.bootstrap();
      }, 500);
      return;
    }

    jQuery("#maincontent").bind("DOMSubtreeModified",  () => {
      this.addEvents();
    });
    

    let map_wrapper = jQuery(".shiptimize-pickup");
    jQuery("body")
      .append(map_wrapper);

    this.addEvents();
  }

  /** 
   * Because it's possible for functions to modify the html structure 
   * and remove our events  
   */ 
  addEvents() {
    this.addCheckoutButton();

    jQuery("#maincontent")
      .on('change', "input[type='radio']", () => {
        this.addCheckoutButton();
      });

    /**
     * If the user clicks the row the method is changed 
     * but the change event is not triggered 
     */
    jQuery("#maincontent")
      .on('click', "tr", () => {
        this.addCheckoutButton();
      });

    /**
     *  Shops may use any html structure, not necessarily a table to server 
     *  Shipping methods 
     */
     jQuery("input[type='radio']").parent().parent().on('click', () => {
        console.log("clicked", );
        this.addCheckoutButton();
     });   
  }
  /** 
   * If the selected Shipping method allows the user to choose a pickup address we add a button 
   * We always refresh the address, because people can go back and change it and we have no way of knowing if that happened 
   * 
   * Layout options by order: 
   * if there is a label, insert after the label 
   * if there is a table, insert in the last td 
   * else insert after the selected radio 
   */
  addCheckoutButton() {

    const shippingMethod = this.getSelectedShipppingMethod();
    if (this.currentMethod === shippingMethod) {
      return;
    }

    this.currentMethod = shippingMethod;
    this.pickupPoint = {};
    
    if (!this.hasPickup(shippingMethod)) {
      jQuery(".shiptimize-choose-pickup")
        .remove();
      return;
    }

    jQuery(".shiptimize-choose-pickup")
      .remove();

    /** 
     * This function is declared on our mage script
     */
    shiptimize_get_shipping_address();

    let eSelectedMethod = jQuery(jQuery("input[type='radio']:checked")
      .get(0));
    let parentRow = eSelectedMethod.parents("tr");

    let eLabel = eSelectedMethod.siblings('label');

    let eShiptimizeButton = jQuery("<span class='shiptimize-choose-pickup' >" +
      "<button class='button btn btn-primary' type='button' onClick='shiptimize.getPickupLocations()'>" + shiptmize_choose + '</button>' +
      "<span class='shiptimize-pickup__description'></span>" +
      "</span>");

    if (eLabel.length > 0) {
      eShiptimizeButton.insertAfter(eLabel);
    } else if (parentRow.length > 0) {
      let tds = parentRow.children("td");
      jQuery(tds.get(tds.length - 1))
        .append(eShiptimizeButton);
    } else {
      /** default to block layout **/ 
      eShiptimizeButton.addClass('shiptimize-custom-layout'); 
      eSelectedMethod.parent().parent().parent().append(eShiptimizeButton);
    }

  }

  /**
   * 
   */
  hasPickup(mage_id) {
    /** 
     * Shiptimize table rates adds sufix pickup if method provides pickup points 
     */
    if (mage_id.match(/([\d]+)_pickup/) != null) {
      return true;
    }

    for (let x = 0; x < shiptimize_carriers.length; ++x) {
      if (shiptimize_carriers[x].ClassName === mage_id && shiptimize_carriers[x].HasPickup) {
        return true;
      }
    }

    return false;
  }

  /** 
   * @return the id of the shiptimize carrier associated with this method 
   */
  getShiptimizeId(mage_id) {
    var carrier_id = mage_id.match(/([\d]+)_pickup/);
    if (carrier_id != null) {
      return carrier_id[1];
    }

    for (let x = 0; x < shiptimize_carriers.length; ++x) {
      if (shiptimize_carriers[x].ClassName === mage_id) {
        return typeof (shiptimize_carriers[x].Id) == 'object' ? shiptimize_carriers[x].Id['0'] : shiptimize_carriers[x].Id;
      }
    }

    return 0;
  }

  getSelectedShipppingMethod() {
    const eSelectedMethod = jQuery("input[type='radio']:checked");

    if (eSelectedMethod.length == 0) {
      return '';
    }

    var method = eSelectedMethod.val();
    /** 
     * Mage repeats the method name 
     */
    var parts = method.split('_');
    return parts.length > 1 && parts[0] == parts[1] ? parts[0] : method;
  }

  /** 
   * We only include this script on checkout, so it's always true
   */
  isCheckout() {
    return true;
  }

  /** 
   * Returns the shipping data as an object in the same format that the api receives 
   * We get the address parts server side here 
   * Some checkouts will modify the address in ways not saved to mage 
   */
  getShippingData() { 
    shiptimize_get_shipping_address();  

    return {
      "Address": {
        "Lat": "",
        "Long": "",
        'Streetname1': shiptimize_address.Streetname1,
        'Streetname2': shiptimize_address.Streetname2,
        'HouseNumber': '',
        'NumberExtension': '',
        'PostalCode': shiptimize_address.PostalCode,
        'City': shiptimize_address.City,
        'Country': shiptimize_address.Country,
        "State": shiptimize_address.State,
      },
      "CarrierId": this.getShiptimizeId(this.getSelectedShipppingMethod()), //in prestashop we can get this server side 
    };
  }

  /** 
   * @param Pickup pickup - a pickupPoint as received from the api 
   */
  setPickupPoint(pickup) {
    this.pickupPoint = pickup;

    let label = pickup.Information.Name ? pickup.Information.Name : (pickup.Information.Address + " " + pickup.Information.ZipCode);

    let data = {
      'PointId': pickup.PointId,
      'Label': label,
      'Extendedinfo': pickup.Extendedinfo
    };
    console.log(data);
    jQuery.getJSON(shiptimize_ajax_save_pickup, data, (resp) => {
      console.log(resp);
    });
  }
}
