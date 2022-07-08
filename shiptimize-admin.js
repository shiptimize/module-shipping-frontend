import './scss/shiptimize-admin.scss';
import Popper from 'popper.js';  

class Shiptimize {

  constructor(){
    console.log("I'm alive!"); 
    this.boostrap(); 
  }

  /** 
   *  
   */ 
  boostrap(){
    if (jQuery(".shiptimize-tooltip-message").size()  == 0 ) {
        setTimeout(()=>{ this.boostrap(); }, 500);  
        return;
    }

    console.log(jQuery(".shiptimize-tooltip-message").size());

    this.tooltips();   
    this.loadAnalytics();   
  }

  tooltips( ){
    let toltip = jQuery(".shiptimize-tooltip-message"); 

    if( toltip.size() == 0 ){
      return; 
    }

    let me = this; 
    toltip.each( function ( idx, elem ) {
      me.attachPopper(elem,container);  
    });      
  }

  attachPopper(toltip, container){  
    let eToltip = jQuery(toltip); 
    let toltipReference = eToltip.siblings(".shiptimize-tooltip-reference");
    let arrow = eToltip.children('.shiptimize-tooltip-message__arrow').get(0); 

    var popper = new Popper(toltipReference.get(0), toltip, {
      placement: 'left',
      modifiers: {
          flip: {
              behavior: ['top','left', 'bottom']
          },
          preventOverflow: {
              boundariesElement: container,
          },
          offset: { 
              enabled: true,
              offset: '10,10'
          },
          arrow: {
            enabled: true,
            element: arrow
          }
      }, 
    });  
    setTimeout ( () => { popper.update(); } , 200);     
  }

  exportSuccess(appLink){
    this.platform.exportSuccess(appLink);
  }

  /** 
   * @param string category 
   * @param string action 
   * @param string label 
   */
  sendAnalyticsEvent(category, action, label) {
      ga('shiptimize.send', 'event', category, action, label, { transport: 'beacon' });
  }

  loadAnalytics() {
      if (typeof(ga) == 'undefined') {
          (function(i, s, o, g, r, a, m) {
              i['GoogleAnalyticsObject'] = r;
              i[r] = i[r] || function() {
                  (i[r].q = i[r].q || []).push(arguments)
              }, i[r].l = 1 * new Date();
              a = s.createElement(o),
                  m = s.getElementsByTagName(o)[0];
              a.async = 1;
              a.src = g;
              m.parentNode.insertBefore(a, m)
          })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
          console.log("inserting analytics ");
      } 
      ga('create', 'UA-101485643-1', 'auto', 'shiptimize');
      ga('shiptimize.set', 'anonymizeIp', true);
      console.log("creating tracker");
  }
}

jQuery(function () {
  window.shiptimize = new Shiptimize();
  window.Popper = Popper;
});

