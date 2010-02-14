
( function ( $ ) {
	function BingMap ( options ) {
		var self = this;
		self.options = options;
		self.zoom[ $.ui.placepicker.zoom.STREET ] = 14;
		
		if ( self.options.click ) {
			options.map.AttachEvent( 'onclick', function ( e ) {
				self.options.click( self._getLatLng( {
					latLong: e.latLong,
					pixel: new VEPixel( e.mapX, e.mapY )
				} ) );
			} );
		}
	}
	
	$.extend( BingMap.prototype, $.ui.placepicker.Map.prototype, {
		markers: [],
		defaults: {
			marker: {
				
			}
		},
		
		panTo: function ( latlng ) {
			options.map.PanToLatLong(
				new VELatLong( latlng.lat, latlng.lng ) );
		},
		
		zoom: function ( zoom ) {
			options.map.SetZoomLevel( this.zoom[ zoom ] );
		},
		
		createMarker: function ( options ) {
			var latlng = new VELatLong( 0, 0 );
			if ( options.latlng ) {
				latlng = this._bingLatLng( options.latlng );
			}
			options._bingPin = new VEShape( VEShapeType.Pushpin, latlng );
			if ( options.icon ) {
				options._bingPin.SetCustomIcon( options.icon );
			}
			this.options.map.AddShape(options._bingPin);
			return options;
		},
		
		showMarker: function ( marker, latlng ) {
			marker._bingPin.SetPoints( [ this._bingLatLng( latlng ) ] );
			marker._bingPin.Show();
		},
		
		hideMarker: function ( marker ) {
			marker._bingPin.Hide();
		},
		
		updateMarker: function ( marker ) {
			// TODO: Update changed properties
			//if ( marker.latlng
		},
		
		getCenter: function () {
			var latlng = this.options.map.GetCenter();
			return { 
				lat: latlng.Latitude,
				lng: latlng.Longitude
			};
		},

		_bingLatLng: function ( latlng ) {
			return new VELatLong( latlng.lat, latlng.lng );
		},
		
		_getLatLng: function ( query ) {
			var latlng = query.latLong ? query.latLong
				: options.map.PixelToLatLong( query.pixel );
			return {
				lat: latlng.Latitude,
				lng: latlng.Longitude
			};
		}
	} );
	
	$.ui.placepicker.map.push( BingMap );
	$.ui.placepicker.map[ 'Bing' ] = BingMap;
} )( jQuery );
