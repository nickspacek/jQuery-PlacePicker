( function ( $ ) {

	$.widget( 'ui.placepicker', {
		_init: function () {
			var self = this;
				options = self.options,
				text = $.ui.placepicker.regional[ options.region ];
			
			if ( options.form ) {
				var location = self.isCompleteLocation( options.form );
				if ( location ) {
					self.setLocation( location );
				}
			}
			if ( options.initialLocation ) {
				if ( !self.isCompleteLocation( options.initialLocation ) ) {
					throw 'Initial location is not complete.';
				}
				self.setLocation( options.initialLocation );
			}
			
			// TODO: break out service init
			if ( options.map ) { // TODO: move this to _setData?
				self._loadMapEngine();
				self.lastMapLocation = {
					latlng: self.map.getCenter()
				};
			}
			self._loadGeocoderEngine();
			
			var locationText = self.getLocation()
				? self.getFormattedLocation() : text.noLocationText;
			
			var uiContainer = ( self.uiContainer = $( '<div />' )
					.addClass( 'ui-placepicker ui-widget-header' )
					.appendTo( self.element ) ),
					
				uiWrapper = ( self.uiWrapper = $( '<div />' )
					.addClass( 'ui-placepicker-wrapper' )
					.appendTo( uiContainer ) ),
					
				uiLocationLabel = ( self.uiLocationLabel = $( '<label />' )
					.html( text.locationText )
					.appendTo( uiWrapper ) ),
					
				uiCurrentLink = ( self.uiCurrentLink = $( '<a />' )
					.attr( 'href', '#' )
					.addClass( 'ui-placepicker-currentaddress ui-corner-all ui-state-default' )
					.hover(
						function () {
							$( this ).addClass( 'ui-state-hover' )
						},
						function () {
							$( this ).removeClass( 'ui-state-hover' )
						} )
					.click( function ( e ) {
						e.preventDefault();
						
						self.setView( 'search' );
					} )
					.appendTo( uiWrapper ) ),
					
				uiCurrentAddressWrapper = ( self.uiCurrentAddressWrapper =
					$( '<div />' )
						.addClass( 'ui-placepicker-currentaddress' )
						.appendTo( uiCurrentLink ) ),
				
				uiCurrentStreetAddressSpan = ( self.uiCurrentStreetAddressSpan =
					$( '<span />' )
						.appendTo( uiCurrentAddressWrapper ) ),
				
				uiCurrentAddressSpan = ( self.uiCurrentAddressSpan = $( '<span />' )
					.appendTo( uiCurrentAddressWrapper ) ),
					
				uiCurrentButtonSpan = ( self.uiCurrentButtonSpan = $( '<span />' )
					.addClass( 'ui-icon ui-icon-home' )
					.appendTo( uiCurrentLink ) ),
					
				uiSearcherSpan = ( self.uiSearcherSpan = $( '<span />' )
					.addClass( 'ui-placepicker-searcher' )
					.hide()
					.appendTo( uiWrapper ) ),
					
				uiSearchInput = ( self.uiSearchInput = $(
					'<input type="text" value="' + locationText + '" />'
					)
					.addClass( 'ui-placepicker-searchinput' )
					.keypress( function( event ) {
						if( event.keyCode == 13 ) {
							event.preventDefault();
							
							self.search( this.value, event );
						}
					} )
					.appendTo( uiSearcherSpan ) ),
					
				uiSearchButton = ( self.uiSearchButton = $( '<button />' )
					.addClass( 'ui-placepicker-searchbutton' )
					.html( text.searchText )
					.click( function ( event ) {
						event.preventDefault();
						
						self.search( uiSearchInput.val(), event );
					} )
					.appendTo( uiSearcherSpan ) ),
					
				uiCancelLink = ( self.uiCancelLink = $( '<a />' )
					.attr( 'href', '#' )
					.addClass( 'ui-placepicker-cancel' )
					.html( text.cancelText )
					.click( function ( event ) {
						event.preventDefault();
						
						self._trigger( 'cancel', event );
						
						if ( options.map ) {
							var latlng = ( self.getLocation()
								|| self.lastMapLocation ).latlng;

							self.map.hideMarker( self.resultMarker );
							self.map.panTo( latlng );
						}
						
						self.setView( 'default' );
					} )
					.appendTo( uiSearcherSpan ) ),
					
				uiResult = ( self.uiResult = $( '<div />' )
					.addClass( 'ui-placepicker-result ui-widget-header' )
					.hide()
					.appendTo( uiContainer ) ),
					
				uiResultLocation = ( self.uiResultLocation = $( '<div />' )
					.addClass( 'ui-placepicker-result-location' )
					.appendTo( uiResult ) ),
					
				uiResultNotice = ( self.uiResultNotice = $( '<div />' )
					.html( text.noticeIncompleteText )
					.addClass( 'ui-placepicker-notice' )
					.appendTo( uiResult ) ),
				
				uiResultSuccess = ( self.uiResultSuccess = $( '<div />' )
					.addClass( 'ui-placepicker-result-success' )
					.appendTo( uiResult ) ),
				
				uiResultSuccessText = ( self.uiResultSuccessText = $( '<span />' )
					.html( text.resultText )
					.appendTo( uiResultSuccess ) ),
					
				uiResultSaveButton = ( self.uiResultSaveButton = $( '<button />' )
					.addClass( 'ui-placepicker-save' )
					.html( text.saveText )
					.click( function ( event ) {
						event.preventDefault();

						var result = self._getData( 'result' );

						if ( options.ajax ) {
							self._ajaxSubmit( options.ajax, result );
							// TODO: Implement fail/success
						}
						
						self.setLocation( result );
						// TODO: allow massaging of data in this in preparation for form?
						self._trigger( 'saved', event, { location: result } );
						
						if ( options.map ) {
							self.map.hideMarker( self.resultMarker );
							self.map.showMarker( self.locationMarker, result.latlng );
						}
						
						if ( options.form ) {
							options.form.find( ':input' )
								.not( ':button, :submit, :reset, :hidden' )
								.val( '' )
								.removeAttr( 'checked' )
								.removeAttr( 'selected' );
							self._copyObjectToForm( result, options.form );
						}

						var formattedLocation = self.getFormattedLocation( {
							fields: [ 'street', 'city', 'province', 'country' ]
						} );
						
						uiSearchInput.val( formattedLocation );
						self._setLocationText();
						
						self.setView( 'default' );
					} )
					.appendTo( uiResultSuccess ) );
			
			self._setLocationText();
		},
		
		_setLocationText: function () {
			var locationText = this.getLocation()
				? this.getFormattedLocation( {
					fields: [ 'city', 'province', 'country' ]
				} ) : text.noLocationText;
			var streetText = this.getLocation() && this.getLocation().street
				? this.getLocation().street : undefined;

			this.uiCurrentAddressSpan.html( locationText );
			this.uiCurrentAddressWrapper.toggleClass( 'ui-placepicker-currentaddress-multi',
				streetText && streetText.length ? true : false );
			this.uiCurrentStreetAddressSpan
				.toggle( streetText && streetText.length ? true : false )
				.html( streetText || '' )
		},
		
		formatLocation: function ( location, options ) {
						var options = $.extend( {
							fields: [ 'street', 'city', 'province', 'country' ],
							join: ', '
						}, options );
						
						var obj = this._flatten( location );
			
			return $.map( $.grep( options.fields, function ( n, i ) {
				return obj[ n ] !== undefined;
			} ), function ( n, i ) {
				return obj[ n ];
			} ).join( options.join );
		},
		
		getFormattedLocation: function ( options ) {
			var location = this.getLocation();
			return location ? this.formatLocation( location, options ) : '';
		},
		
		getLocation: function () {
			return this._getData( 'location' );
		},
		setLocation: function ( location ) {
			this._setData( 'location', location );
		},
		
		search: function ( query, event ) {
			var self = this;
			
			self.setView( 'search' );
			self._trigger( 'search', event, { query: query } );
			
			var query_obj = typeof query == 'string' ? { address: query }
				: { latlng: query };
			this.geocode( query_obj, function ( response, status ) {
				self._geocodeCallback.apply( self, [ response, status ] );
			} );
		},
		
		geocode: function ( query, callback ) {
			this.geocoder.geocode( query, callback );
		},
		
		_geocodeCallback: function ( response, status ) {
			if ( status == this.geocoder.StatusOK ) {
				var location = this.geocoder.locationFromResponse( response );
				this._setData( 'result', location );
				
				var is_complete = this.isCompleteLocation( location );

				if ( this.options.map ) {
					this.map.panTo( location.latlng );
					if ( location.street ) {
						this.map.zoom( $.ui.placepicker.zoom.STREET );
					}
					this.map.showMarker( this.resultMarker, location.latlng );
				}
				
				this._trigger( 'response', null, {
					complete: is_complete, location: location } );
				
				this.uiResultLocation.html( this.formatLocation( location ) );
				this.uiResultSuccess.toggle( is_complete );
				this.uiResultNotice.toggle( !is_complete );
				this.uiResult.show();
			}
		},
		
		isCompleteLocation: function ( obj ) {
			if ( obj.jquery ) {
				var location = {};
				var full = 1;
				$.each( this.options.formSelectors, function ( field, sel ) {
					var e = obj.find( sel );
					if ( !e || !e.val() ) {
						full = 0;
						return false;
					}
					location[field] = e.val();
				} );
				
				if ( !full ) {
					return null;
				}
				$.extend( location, { latlng: {
					lat: location.lat,
					lng: location.lng
				} } );
				delete location.lat;
				delete location.lng;
				
				return location;
			}
			else {
				return ( obj && obj.city && obj.province
					&& obj.country ) ? true : false;
			}
		},
		
		setView: function ( view ) {
			switch ( view ) {
				case 'default':
					this.uiSearcherSpan.hide();
					this.uiResult.hide();
					this.uiCurrentLink.show();
					break;
				case 'search':
					this.uiResult.hide();
					this.uiCurrentLink.hide();
					this.uiSearcherSpan.show();
					this.uiSearchInput.focus();
					this.uiSearchInput.select();
					
					break;
			}
		},
		
		_loadMapEngine: function () {
			var self = this;
			var engine = self.options.mapEngine;
			
			if ( engine === undefined ) {
				// TODO: Auto-detect map type
				engine = $.ui.placepicker.map[0];
				if ( !engine ) {
					throw 'No map engines were registered.'
				}
			}
			else if ( $.ui.placepicker.map[engine] === undefined ) {
				throw 'The ' + engine + ' map engine was not registered.';
			}

			var map = self.options.map;
			self.map = new engine( {
				placepicker: self,
				map: map,
				click: self.options.clickable
					? function ( latlng ) { self.search( latlng ) } : undefined
			} );

			self.resultMarker = self.map.createMarker( self.options.resultMarker );
			self.locationMarker = self.map.createMarker( self.options.locationMarker );
			
			if ( self.getLocation() && self.getLocation().latlng ) {
				self._initMap();
			}
		},
		
		_initMap: function () {
			this.map.showMarker( this.locationMarker, this.getLocation().latlng );
			this.map.panTo( this.getLocation().latlng );
		},
		
		_loadGeocoderEngine: function () {
			var engine = this.options.geocoderEngine;
			
			if ( engine === undefined ) {
				engine = $.ui.placepicker.geocoder[0];
				if ( !engine ) {
					throw 'No geocoder engines were registered.'
				}
			}
			else if ( $.ui.placepicker.geocoder[engine] === undefined ) {
				throw 'The ' + engine + ' geocoder engine was not registered.';
			}
			
			this.geocoder =
				new engine( {
					placepicker: this
				} );
		},
		
		_ajaxSubmit: function ( url, data ) {
			var obj = this._flatten( data );
			
			$.ajax( {
				type: 'POST',
				url: url,
				data: $.param( obj )
			} );
		},
		
		_flatten: function ( obj ) {	
			var self = this;
			var newobj = {};
			
			$.each( obj, function ( key, val ) {
				if ( typeof val == 'object' ) {
					$.extend( newobj, self._flatten( val ) );
				}
				else {
					newobj[key] = val;
				}
			} );

			return newobj;
		},
		
		_copyObjectToForm: function ( object, form ) {
			var self = this;
			$.each( this._flatten( object ), function ( key, val ) {
				var selector = self.options.formSelectors[key];
				form.find( selector ).val( val );
			} );
			form.find( self.options.formSelectors.geo ).val(
				object.latlng.lat + ';' + object.latlng.lng
			);
		}
	} );

	$.extend( $.ui.placepicker, {
		defaults: {
			region: '',
			initialLocation: '',
			details: null,
			locationMarker: {
				icon: 'images/location.png'
			},
			resultMarker: {
				icon: 'images/result.png'
			},
			formSelectors: {
				street: '[name=street]',
				city: '[name=city]',
				postal_code: '[name=postal_code]',
				province: '[name=province]',
				country: '[name=country]',
				lat: '[name=lat]',
				lng: '[name=lng]',
				geo: '[name=geo]'
			}
		},
		regional: [],
		engines: {},
		zoom: {
			STREET: 0
		},
		getter: 'getFormattedLocation formatLocation getLocation'
	} );
	
	$.ui.placepicker.regional[''] = {
		locationText: 'Location:',
		noLocationText: 'No location entered.',
		noticeIncompleteText: 'The query returned an incomplete result, please try again.',
		resultText: 'Is this the right place?',
		cancelText: 'Cancel',
		searchText: 'Search',
		saveText: 'Save'
	};
	
	function Geocoder () {}
	$.extend( Geocoder.prototype, {
		geocode: function ( query, callback ) {
			throw 'Geocoders must implement the "geocode" function.';
		}
	} );
	
	function Map () {}
	$.extend( Map.prototype, {
		panTo: function ( latlng ) {
			throw 'Maps must implement the "panTo" function.';
		},
		
		zoom: function ( zoom ) {
			throw 'Maps must implement the "zoom" function.';
		},
		
		getCenter: function () {
			throw 'Maps must implement the "getCenter" function.';
		},
		
		createMarker: function ( marker ) {
			throw 'Maps must implement the "createMarker" funciton.';
		},
		
		showMarker: function ( marker, latlng ) {
			throw 'Maps must implement the "showMarker" function.';
		},
		
		hideMarker: function ( marker ) {
			throw 'Maps must implement the "hideMarker" function.';
		}
	} );
	
	$.ui.placepicker.Geocoder = Geocoder;
	$.ui.placepicker.Map = Map;
	$.ui.placepicker.geocoder = new Array();
	$.ui.placepicker.map = new Array();
} ) ( jQuery );
