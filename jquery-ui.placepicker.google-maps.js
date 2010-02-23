
( function ( $ ) {
	function GoogleMap ( options ) {
		var self = this;
		self.options = options;
		self.zoom[ $.ui.placepicker.zoom.STREET ] = 14;
		
		if ( self.options.click ) {
			google.maps.event.addListener( options.map, 'click', function ( e ) {
				self.options.click( { lat: e.latLng.lat(), lng: e.latLng.lng() } );
			} );
		}
	}
	
	$.extend( GoogleMap.prototype, $.ui.placepicker.Map.prototype,  {
		defaults: {
			marker: {
				visible: false
			}
		},
		
		panTo: function ( latlng ) {
			options.map.panTo( new google.maps.LatLng( latlng.lat, latlng.lng ) );
		},
		
		zoom: function ( zoom ) {
			options.map.setZoom( this.zoom[ zoom ] );
		},
		
		createMarker: function ( options ) {
			options = this._normalizeOptions( options );
			
			options._googleMarker = new google.maps.Marker( options );
			return options;
		},
		
		showMarker: function ( marker, latlng ) {
			marker._googleMarker.setPosition( this._getLatLng( latlng ) );
			marker._googleMarker.setVisible( true );
		},
		
		hideMarker: function ( marker ) {
			marker._googleMarker.setVisible( false );
		},
		
		updateMarker: function ( marker ) {
			// TODO: Update changed properties
			//if ( marker.latlng
		},
		
		_normalizeOptions: function ( options ) {
			options = $.extend( {}, this.defaults.markers, options );
			if ( options.latlng ) {
				options.latlng = this._getLatLng( options.latlng );
				delete options.latlng;
			}
			options.map = this.options.map;
			
			return options;
		},
		
		_getLatLng: function ( latlng ) {
			return new google.maps.LatLng( latlng.lat, latlng.lng );
		},
		
		getCenter: function () {
			var latlng = this.options.map.getCenter();
			return { 
				lat: latlng.lat(),
				lng: latlng.lng()
			};
		}
	} );
	
	function GoogleGeocoder ( options ) {
		this.options = options;
		this._geocoder = new google.maps.Geocoder();
	}
	
	$.extend( GoogleGeocoder.prototype, $.ui.placepicker.Geocoder.prototype, {
		StatusOK: google.maps.GeocoderStatus.OK,
		
		geocode: function ( query, callback ) {
			if ( query.latlng ) {
				query.latLng = new google.maps.LatLng( query.latlng.lat,
					query.latlng.lng );
				delete query.latlng;
			}
			this._geocoder.geocode( query, callback );
		},
		
		locationFromResponse: function ( response ) {
			var self = this;
			var location;
			$.each( response, function () {
				location = self.locationFromItem( this );
				if ( self.options.placepicker.isCompleteLocation( location ) ) {
					return false;
				}
			} );
			
			return location;
		},
		
		locationFromItem: function ( responseItem ) {
			var location = {};
			var street = {};
			
			$.each( responseItem.address_components, function () {
				var nonpol = $.grep( this.types, function ( n, i ) {
					return n != 'political';
				} );
				if ( nonpol.length == 0 )  {
					return true;
				}
				var type = nonpol[0];
				switch ( type ) {
					case 'street_number':
						street.number = this.long_name;
						break;
					case 'route':
						street.name = this.long_name;
						break;
					case 'locality':
						location.city = this.long_name;
						break;
					// only use this if there isn't already a match; don't know if this is even useful
					case 'sublocality':
						location.city = location.city || this.long_name;
						break;
					case 'administrative_area_level_1':
						location.province = this.long_name;
						break;
					case 'country':
						location.country = this.long_name;
						break;
					case 'postal_code':
						location.postal_code = this.long_name;
				}
				
				if ( street.name && street.number ) {
					location.street = street.number + ' ' + street.name;
				}
			} );
			
			location.latlng = {
				lat: responseItem.geometry.location.lat(),
				lng: responseItem.geometry.location.lng()
			};
			
			return location;
		}
	} );

	$.ui.placepicker.geocoder.push( GoogleGeocoder );
	$.ui.placepicker.geocoder[ 'Google' ] = GoogleGeocoder;
	$.ui.placepicker.map.push( GoogleMap );
	$.ui.placepicker.map[ 'Google' ] = GoogleMap;
} )( jQuery );
