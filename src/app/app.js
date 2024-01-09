/** 
 * app.js
 * Code to display a Google Maps of public restrooms in NYC parks.
 * Fetches data from the Google Maps API and Foursquare API
 * @author Irene Alvarado
 */

/* ======= Model ======= */

// Raw data is in model.js

/**
 * Location object class
 * @param {array of locations} takes in an array of locations (currently the one in model.js)
 * Not necessary to make these observables but probably useful if application is extended in the future
 * (i.e. if we push this data in from a server in the future)
 */
var Location = function(data) {
    this.location = ko.observable(data.location);
    this.name = ko.observable(data.name);
    this.borough = ko.observable(data.borough);
    this.open_year_round = ko.observable(data.open_year_round);
    this.lat = ko.observable(data.lat);
    this.lng = ko.observable(data.lng);
    this.place_id = ko.observable(data.place_id);
    this.handicap = ko.observable(data.handicap_accessible);
};

/**
 * Filter object class
 * @param {array of filters} takes in an array of filters (currently the one in model.js)
 * Represents a filter, one of: All, Manhattan, Brooklyn, Staten Island, Bronx, Queens
 */
var Filter = function(data) {
    this.name = ko.observable(data);
    this.clicked = ko.observable(false);
};

/* ======= ViewModel ======= */

var ViewModel = function() {

    var self = this;

    this.map;
    this.locationList = ko.observableArray([]);
    this.filterList = ko.observableArray([]);
    this.markerList = ko.observableArray([]);

    this.legendIconList = ko.observableArray([]); //Icons for the legend. Represent differnt marker colors.
    this.currentMarker = ko.observable(); // Current marker clicked by user
    this.userSearch = ko.observable(); // Current text input by user in the search bar
    this.currentFilter; // Current filter selected
    this.infoWindow; // There will be one info window for the whole map. It gets closed and opened depending on user clicks

    /* == ViewModel: setup == */

    /**
     * Timeout function in case Google Maps doesn't load
     */
    this.mapTimeout = setTimeout(function() {
        $('#map-canvas').html('Problem loading Google Maps. Please refresh your browser and try again.');
    }, 6000);


    /**
     * Initialize Google Maps by creating a google maps object.
     * Also calls other initialization methods to set up the locations, filters, markers, and legend
     */
    this.initializeMap = function() {
        var mapOptions = {
            center: {
                lat: restrooms[0].lat,
                lng: restrooms[0].lng
            },
            zoom: 10
        };
        self.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
        clearTimeout(self.mapTimeout);
        self.initializeLocations();
        self.initializeFilters();
        self.initializeLegend();
        self.initializeMarkers();
    };

    /**
     * Copy all the restroom locations and information into an observable array
     */
    this.initializeLocations = function() {
        restrooms.forEach(function(restroom) {
            self.locationList.push(new Location(restroom));
        });
    };

    /**
     * Copy all the filters for the restroom data into an observable array
     */
    this.initializeFilters = function() {
        filters.forEach(function(filter) {
            self.filterList.push(new Filter(filter));
        });

        self.currentFilter = ko.observable(self.filterList()[0]);
    };


    /**
     * Setup the icons for the legend.
     * A park, playground, and other location each get a different kind of marker
     */
    this.initializeLegend = function() {
        self.legendIconList.push({
            name: "Park",
            img: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        });
        self.legendIconList.push({
            name: "Playground",
            img: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png'
        });
        self.legendIconList.push({
            name: "Other",
            img: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
        });

    };

    /**
     * Gets data about each restroom location from the 'locationList' array and creates a marker for each location
     */
    this.initializeMarkers = function() {
        //Adds one info window for the map. It will be reassigned to different markers depending on user input
        self.infoWindow = new google.maps.InfoWindow({
            content: ""
        });

        //Creats markers for each location in the 'locationList' array
        ko.utils.arrayForEach(self.locationList(), function(item) {
            var tmpMarker = new google.maps.Marker({
                position: new google.maps.LatLng(item.lat(), item.lng()),
                title: item.name(),
                borough: item.borough(),
                id: item.place_id(),
                openYear: item.open_year_round(),
                handicap: item.handicap(),
                icon: function() { //Assigns an icon depending on whether location is a park, playground or other
                    if (item.name().toLowerCase().indexOf("park") >= 0) {
                        return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
                    } else if (item.name().toLowerCase().indexOf("playground") >= 0) {
                        return 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png';
                    } else {
                        return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
                    }

                }()
            });

            //Pushes each marker into an array called 'markerList'
            self.markerList.push({
                marker: tmpMarker,
                visible: ko.observable(true)
            });

            //Adds an event listener for each marker in case it is clicked
            google.maps.event.addListener(tmpMarker, 'click', function() {
                self.currentMarker(tmpMarker);
                self.findGoogleData(); //Finds Google data on this location by using the Google Maps API
            });

        });

        self.showMarkers();
    };

    /* == ViewModel: basic functionality == */

    /**
     * Renders the markers on the map by calling the 'marker.setMap(map)' function
     */
    this.showMarkers = function() {
        ko.utils.arrayForEach(self.markerList(), function(item) {
            if (self.currentFilter().name() == "All" || self.currentFilter().name() == item.marker.borough) {
                item.visible(true);
                item.marker.setMap(self.map);
            } else {
                item.visible(false);
            }
        });

    };

    /**
     * Clears away all markers from the map
     */
    this.clearMarkers = function() {
        ko.utils.arrayForEach(self.markerList(), function(item) {
            item.marker.setMap(null);
        });
    };

    /**
     * When a user wants to filter the markers on the map, changeFilter cleras all the markers and
     * re-renders only the ones that are relevant based on a filter
     * @param {filter object} a filter clicked by a user
     */
    this.changeFilter = function(clickedFilter) {
        self.currentFilter(clickedFilter);
        self.clearMarkers();
        self.showMarkers();
    };

    /**
     * When a user clicks on a location from the sidebar list of possible park restrooms,
     * we simulate a click on the corresponding marker.
     * @param {a map marker} a marker corresponding to the location selected by the user in the sidebar
     */
    this.selectLocation = function(clickedLocation) {
        google.maps.event.trigger(clickedLocation.marker, 'click');
    };


    /**
     * When a user presses the search buton, 'searchLocation' will search for a list of restrooms in parks
     * NOTE: this function is not required when using 'searchAuto' since that latter will filter results in real-time.
     */
    this.searchLocation = function() {
        ko.utils.arrayForEach(self.markerList(), function(item) {
            if (item.visible() == true) {
                if (item.marker.title.toLowerCase().indexOf(self.userSearch().toLowerCase()) >= 0) {
                    item.visible(true);
                } else {
                    item.visible(false);
                }
            }
        });
    };

    /**
     * When a user types in the search bar, 'searchLocation' will search over available markers and
     * filter the results based on the search text
     */
    this.searchAuto = function() {
        ko.utils.arrayForEach(self.markerList(), function(item) {
            if ((item.marker.title.toLowerCase().indexOf(self.userSearch().toLowerCase()) >= 0) &&
                (self.currentFilter().name() == "All" || self.currentFilter().name() == item.marker.borough)) {
                item.visible(true);
            } else {
                item.visible(false);
            }
        });
    };

    this.userSearch.subscribe(this.searchAuto); //binding the knockout textInput binding to the searchAuto function


    /* == ViewModel: AJAX requests to fetch infoWindow data == */

    var contentGoogle;
    var contentFoursquare;

    /**
     * Makes a request to the Google Places Library to fetch information about a place based on a Google place_id.
     */
    this.findGoogleData = function() {

        // GOOGLE REQUEST
        var service = new google.maps.places.PlacesService(self.map);

        var request = {
            placeId: self.currentMarker().id //Specific Google place_id stored in our model data
        };

        service.getDetails(request, callback);

        function callback(place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                contentGoogle = place;
                self.findFoursquareData();
                
            } else { //In case of an error display a message inside the InfoWindow
                var errorMessage = '<div>Problem loading data...<br>' +
                    'Error message: ' + status + '</div>';
                console.log(status);
                self.infoWindow.setContent(errorMessage);
                self.infoWindow.open(self.map, self.currentMarker());
            }
        }
    };

    /**
     * Makes a request to the Foursquare API to fetch nearby venues to a location (represented with lat and lng)
     */
    this.findFoursquareData = function() {
        // FOURSQUARE REQUEST
        var clientID = 'HYHN4QP4JTA3XGD32S21GJFCXSLHAGTCADUNJEQT4AGCI01N';
        var secret = 'G4M441LF3KLNRI0EXV5K42IC3I0NAH0VOJEBVN0BJNE0GXG5';
        var date = '20150226'; //Foursquare requires a date, essentially a version parameter 
        //console.log(self.currentMarker().position.k) ;
        var lat = self.currentMarker().position.lat();
        var lng = self.currentMarker().position.lng();

        $.ajax({
                url: 'https://api.foursquare.com/v2/venues/explore?client_id=' + clientID + '&client_secret=' +
                    secret + '&ll=' + lat + ',' + lng + '&limit=5&section="food,drinks,coffee,shops"&v=' + date,
                type: 'GET',
                dataType: "json"
            }).done(function(data) { //When the Deferred object is resolved 
                contentFoursquare = data.response.groups[0].items;
                self.showInfoWindow(); //Render the InfoWindow
            })
            .fail(function(reason) { //When the Deferred object is rejected
                var errorMessage = '<div>Problem loading data...<br>' +
                    'Error message: ' + reason + '</div>';
                self.infoWindow.setContent(errorMessage);
                self.infoWindow.open(self.map, self.currentMarker());
            });
    };

    /**
     * Creates the content string to be shown in the InfoWindow
     */
    this.showInfoWindow = function() {
        var title = self.currentMarker().title;
        var openYear = self.currentMarker().openYear;
        var handicap = self.currentMarker().handicap;
        var address = contentGoogle.formatted_address;
        var photos = contentGoogle.photos;
        var localVenues = [];

        //1. Title and basic restroom information
        var contentString = '<div id="content"></div>' +
            '<h3 >' + title + ' Restroom</h3>' +
            '<div id="bodyContent">' +
            '<p>' + address + '</p>' +
            '<p>Bathroom open year round: ' + openYear + '</p>';

        if (typeof handicap !== 'undefined') {
            contentString += '<p>Handicap accessible</p>';
        }

        contentString += '</div></div>';

        //2. Nearby businesses from Foursquare
        var localVenuesString = '<br><h5>Nearby businesses: </h5>';

        contentFoursquare.forEach(function(item) {
            var tmp = item.venue;
            localVenuesString += '<div><strong>' + tmp.name + '</strong> - ' + tmp.categories[0].name + '<br>' +
                tmp.location.formattedAddress[0] + ' ' + tmp.location.formattedAddress[1] + '<br>';

            if (typeof tmp.contact.formattedPhone !== 'undefined') {
                localVenuesString += tmp.contact.formattedPhone + '<br>';
            }
            if (typeof tmp.url !== 'undefined') {
                localVenuesString += '<a href=' + tmp.url + '>' + tmp.url + '</a>';
            }
            localVenuesString += '</div><br>';
        });

        contentString += localVenuesString;

        //3. Nearby photos from Google
        /*
        if (typeof photos !== 'undefined') {
            contentString += '<h5>Nearby photos: </h5>';
            var imageString = '<div class="row text-center">';
            photos.forEach(function(photo) {
                imageString += '<img src=' + photo.getUrl({
                    'maxWidth': 300,
                    'maxHeight': 300
                }) + ' width="300"/><br><br><br>'
            });
            imageString += '</div>';

            contentString += imageString;
        }
        */

        self.infoWindow.setContent(contentString);
        self.infoWindow.open(self.map, self.currentMarker());
    };

    google.maps.event.addDomListener(window, 'load', this.initializeMap);

};

// Necessary to resize the Google Maps and scrolling sidebar to fit the window
$(window).resize(function() {
    var h = $(window).height(),
        MapOffsetTop = 96; // Calculate the top offset
    ScrollOffsetTop = 335; //scrolling bar offset

    $('#map-canvas').css('height', (h - MapOffsetTop));
    $('.scrolling').css('height', (h - ScrollOffsetTop));
}).resize();

ko.applyBindings(new ViewModel());
