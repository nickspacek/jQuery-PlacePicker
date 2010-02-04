jQuery PlacePicker - 20100203
=====================

This plugin provides a widget that can be used with a geocoding service (and
optionally a map interface) to allow users to search for and select locations.

Requirements
---------------
jQuery 1.3.2 (maybe not, but haven't tested with other versions)
jQuery UI 1.7.2 (ditto)

Optional
Google Maps API v3 (http://maps.google.com/maps/api/js?sensor=false) (make sure
to set the sensor parameter appropriately)

Features
---------------
* Supports Google Map API v3 out of the box, framework for others
* Internationalization support
* Lightweight
* Automatically fill form fields with location data

Usage
---------------
Note: The included stylesheet pretties it up, but shouldn't be strictly
required. That said, it will look like junk if you don't use any. ;D

Note: See examples directory for more details.

Given this HTML (style and script tags not shown):

<div id="placepicker"></div>
<div id="map-canvas"></div>

You can apply the plugin like this: $( '#placepicker' ).placepicker( {
  // options, event handlers
 
  // ex: enable display on map
  map: someMapObject, // where the map is a map object initialized earlier
  
  // ex: enable form fill
  form: $( 'form' ) // this parameter is a jQuery object containing the form

  // ex: make map clickable to select location
  clickable: true

} );

Issues
---------------
* Better location detail parsing (in Google Plugin; they need to standardize
 their geocoder response!)

Let me know if you find others: nick.spacek@gmail.com
