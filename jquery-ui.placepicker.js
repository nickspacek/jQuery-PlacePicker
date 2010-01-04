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
            self.service = {};
            if ( options.map ) { // TODO: move this to _setData?
                self._loadMapService();
                self.lastMapLocation = {
                    latlng: self.service.map.getCenter()
                };
            }
            self._loadGeocoderService();
            
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
                        console.debug( 'current link clicked' );
                        
		                self._setView( 'search' );
                    } )
                    .appendTo( uiWrapper ) ),
                    
                uiCurrentAddressSpan = ( self.uiCurrentAddressSpan = $( '<span />' )
                    .html( locationText )
                    .appendTo( uiCurrentLink ) ),
                    
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
			                console.debug( 'enter pressed in input' );
			                
			                self.search( this.value, event );
		                }
	                } )
                    .appendTo( uiSearcherSpan ) ),
                    
                uiSearchButton = ( self.uiSearchButton = $( '<button />' )
                    .addClass( 'ui-placepicker-searchbutton' )
                    .html( text.searchText )
                    .click( function ( event ) {
                        event.preventDefault();
                        console.debug( 'search button clicked' );
                        
                        self.search( uiSearchInput.val(), event );
                    } )
                    .appendTo( uiSearcherSpan ) ),
                    
                uiCancelLink = ( self.uiCancelLink = $( '<a />' )
                    .attr( 'href', '#' )
                    .addClass( 'ui-placepicker-cancel' )
                    .html( text.cancelText )
                    .click( function ( event ) {
		                event.preventDefault();
		                console.debug( 'cancel link clicked' );
		                
		                self._trigger( 'cancel', event );
		                
		                if ( options.map ) {
		                    var latlng = ( self.getLocation()
		                        || self.lastMapLocation ).latlng;
		                    
		                    self.service.map.hideMarker( 'result' );
		                    self.service.map.panTo( latlng );
		                }
		                
		                self._setView( 'default' );
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
	                    console.debug( 'save button clicked' );

                        var result = self._getData( 'result' );

                        if ( options.ajax ) {
                            self._ajaxSubmit( options.ajax, result );
                            // TODO: Implement fail/success
                        }
                        
	                    self.setLocation( result );
	                    // TODO: allow massaging of data in this in preparation for form?
	                    self._trigger( 'saved', event, { location: result } );
	                    
	                    if ( options.map ) {
	                        self.service.map.hideMarker( 'result' );
	                        self.service.map.showMarker( 'location',
	                            result.latlng );
	                    }
	                    
	                    if ( options.form ) {
	                        self._copyObjectToForm( result, options.form );
	                    }

                        var formattedLocation = self.getFormattedLocation();
	                    
	                    uiSearchInput.val( formattedLocation );
	                    uiCurrentAddressSpan.html( formattedLocation );
                        self._setView( 'default' );
                    } )
                    .appendTo( uiResultSuccess ) );
        },
        
        formatLocation: function ( location, fields ) {
            var format_fields = fields || [ 'city', 'province', 'country' ];
            
            return $.map( $.grep( format_fields, function ( n, i ) {
                return location[ n ] !== undefined;
            } ), function ( n, i ) {
                return location[ n ];
            } ).join( ', ' );
        },
        
        getFormattedLocation: function () {
            var location = this.getLocation();
            return location ? this.formatLocation( location ) : '';
        },
        
        getLocation: function () {
            return this._getData( 'location' );
        },
        setLocation: function ( location ) {
            this._setData( 'location', location );
        },
        
        search: function ( query, event ) {
            var self = this;
            
            self._setView( 'search' );
            
            self._trigger( 'search', event, { query: query } );
            
            this.geocode( { address: query }, function ( response, status ) {
                self._geocodeCallback.apply( self, [ response, status ] );
            } );
        },
        
        geocode: function ( query, callback ) {
            this.service.geocoder.geocode( query, callback );
        },
        
        _geocodeCallback: function ( response, status ) {
            console.dir( status );
            console.dir( response );
            
            if ( status == this.service.geocoder.StatusOK ) {
                var location = this.service.geocoder.locationFromResponse( response );
                this._setData( 'result', location );
                
                var is_complete = this.isCompleteLocation( location );

                if ( this.options.map ) {
                    this.service.map.panTo( location.latlng ); 
                    this.service.map.showMarker( 'result', location.latlng );
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
        
        _setView: function ( view ) {
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
        
        _loadMapService: function () {
            var service = this.options.mapService;
            
            if ( service === undefined ) {
                // TODO: Auto-detect map type
                service = this._firstKey(
                    $.ui.placepicker.services.map );
                if ( !service ) {
                    throw 'No map services were registered.'
                }
            }
            else if ( $.ui.placepicker.services.map[service] === undefined ) {
                throw 'The ' + service + ' map service was not registered.';
            }

            var map = this.options.map;
            this.service.map = new $.ui.placepicker.services.map[service]( {
                placepicker: this,
                map: map
            } );
           
            this.service.map.createMarker( 'result',
                this.options.resultMarker );
            this.service.map.createMarker( 'location',
                this.options.locationMarker );
            
            if ( this.getLocation() ) {
                this._initMap();
            }
        },
        
        _initMap: function () {
            this.service.map.showMarker( 'location', this.getLocation().latlng );
            this.service.map.panTo( this.getLocation().latlng );
        },
        
        _loadGeocoderService: function () {
            var service = this.options.geocoderService;
            
            if ( service === undefined ) {
                service =
                    this._firstKey( $.ui.placepicker.services.geocoder );
                if ( !service ) {
                    throw 'No geocoder services were registered.'
                }
            }
            else if ( this.services.geocoder[service] === undefined ) {
                throw 'The ' + service
                    + ' geocoder service was not registered.';
            }
            
            this.service.geocoder =
                new $.ui.placepicker.services.geocoder[service]( {
                    placepicker: this
                } );
        },
        
        _firstKey: function ( obj ) {
            var first;
            $.each( obj, function ( index, item ) {
                first = index;
                return false;
            } );
            return first;
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
            $.each( this._flatten( object ), function ( key, val ) {
                form.find( '[name=' + key + ']' ).val( val );
            } );
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
                city: '[name=city]',
                province: '[name=province]',
                country: '[name=country]',
                lat: '[name=lat]',
                lng: '[name=lng]'
            }
        },
        regional: [],
        services: {}
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

} ) ( jQuery );
