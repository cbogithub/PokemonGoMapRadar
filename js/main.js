// START_CUSTOM_CODE_home
var setLabelTime = function() {
    $('.label-countdown').each(function(index, element) {
        var disappearsAt = new Date(parseInt(element.getAttribute("disappears-at")) * 1000);
        var now = new Date();
        var difference = Math.abs(disappearsAt - now);
        var hours = Math.floor(difference / 36e5);
        var minutes = Math.floor((difference - (hours * 36e5)) / 6e4);
        var seconds = Math.floor((difference - (hours * 36e5) - (minutes * 6e4)) / 1e3);
        var timestring = false;
        if (disappearsAt < now) {
            timestring = "(expired)";
        } else {
            timestring = "(";
            if (hours > 0)
                timestring = hours + "h";

            timestring += ("0" + minutes).slice(-2) + "m" + ("0" + seconds).slice(-2) + "s)";
        }
        $(element).text(timestring)
    });
};
window.setInterval(setLabelTime, 1000);
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}
function deg2rad(deg) {
  return deg * (Math.PI/180)
}
var serverConections = 0;
function data(response) {
    if(map === null || typeof google.maps == 'undefined'){
        return false;
    }
    var json_obj = response;
    var now = new Date();
    if (json_obj.length > 1) {
        $('#message.search, #message.no-pokemons').hide();
        serverConections = 0;
    } else {
        serverConections++;
        if (serverConections > 3) {
            $('#message.no-pokemons').show();
            $('#message.search').hide();

        } else {
            $('#message.search').show();
        }
    }
    for (var index in json_obj) {
        var item = json_obj[index];
        var key = item["type"] + item["key"];
        if (Object.keys(markerCache).indexOf(key) >= 0) {
            var needs_replacing = false;
            if (item["type"] == "gym" && item["icon"] != markerCache[key].item.icon) {
                (function(_marker) {
                    setTimeout(_marker.setMap(null), 500)
                })(markerCache[key].marker);
                needs_replacing = true;
            }
            if ((markerCache[key].item.lat != item["lat"] && markerCache[key].item.lng != item['lng'])) {
                needs_replacing = true;
            }
            if (!needs_replacing) {
                continue;
            }
        }
        if (markerCache[key] != null && markerCache[key].marker != null) {
            markerCache[key].marker.setMap(null);
        }
        var marker = addMarker({
            position: new google.maps.LatLng(item["lat"], item["lng"]),
            map: map,
            icon: item["icon"],
        });
        if (item.key === 'start-position') {
            map.setCenter(marker.getPosition());
        }
        else{
            var position = map.getCenter();
            var distance = getDistanceFromLatLonInKm(position.lat(), position.lng(), item['lat'], item['lng']);
            if(distance < 0.02){
                alert($(item.infobox).find('b').text()+' a la vista!')
            }
        }
        markerCache[key] = {
            item: item,
            marker: marker
        };
        var disappearsAt = 0;

        if (item["disappear_time"] != null) {
            if (parseInt(item["disappear_time"]) < 0) {
                disappearsAt = -1;
            } else {
                disappearsAt = new Date(parseInt(item["disappear_time"] * 1000)) - now;
            }
        } else {
            disappearsAt = auto_refresh + 500;
        }
        if (typeof item["infobox"] !== 'undefined') {
            (function(_infobox, _map, _marker) {
                _marker.infoWindow = new google.maps.InfoWindow({
                    content: _infobox
                });
                _marker.addListener('click', function() {
                    _marker.infoWindow.open(_map, _marker);
                    _marker["persist"] = true;
                });

                google.maps.event.addListener(_marker.infoWindow, 'closeclick', function() {
                    _marker["persist"] = null;
                });
            })(item["infobox"], map, marker);
        }
        (function(_marker, _disappearsAt) {
            if (_disappearsAt > 0) {
                var timeout = setTimeout(function() {
                    _marker.setMap(null);
                }, Math.ceil(_disappearsAt));
                _marker.timeout = timeout;
            }
            _marker.key = key;
        })(marker, disappearsAt);
    }
}
var port = 5000;
var baseURL = "http://achc.mx";
var options = {};
var map = null;
var markers = [];
var markerCache = {};
var auto_refresh = 10000;

function init(data) {
    port = data.port;
    baseURL += ':' + port;
    $.ajax({
        url: baseURL + "/config",
        dataType: 'jsonp',
        error: function(e) {
            if (e.status !== 200) {
                $('#message.error').show();
                resetSession();
            }
            else{
                $('#message.error').hide();
            }
        }
    });
}
// Adds a marker to the map and push to the array.
function addMarker(attributes = {}) {
    if(map === null || typeof google.maps === 'undefined'){
        return false;
    }
    var default_options = {
        map: map
    };
    for (var prop in attributes) {
        if (attributes.hasOwnProperty(prop)) {
            default_options[prop] = attributes[prop];
        }
    }
    var marker = new google.maps.Marker(default_options);
    markers.push(marker);
    return marker;
}
// Sets the map on all markers in the array.
function setMapOnAll(map, length = null) {
    var lastIndex = markers.length - 1;
    if (length != null) {
        lastIndex = length;
    }
    for (var i = lastIndex; i >= 0; i--) {
        if (!markers[i].persist) {
            markers[i].setMap(map);
            if (map == null) {
                if (markers[i].timeout != null) {
                    clearTimeout(markers[i].timeout);
                }
                if (markers[i].key != null) {
                    var cacheIndex = Object.keys(markerCache).indexOf(markers[i].key);
                    if (cacheIndex >= 0) {
                        delete markerCache[markers[i].key];
                    }
                }
                markers.slice(i, 1);
            }
        }
    }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setMapOnAll(null);
}
// Shows any markers currently in the array.
function showMarkers() {
    setMapOnAll(map);
}
// Deletes all markers in the array by removing references to them.
function config(response) {
    var json_obj = response;
    options["lat"] = json_obj["lat"];
    options["lng"] = json_obj["lng"];
    options["zoom"] = json_obj["zoom"];
    options["identifier"] = json_obj["identifier"];
    updateMap();
    window.setInterval(updateMap, auto_refresh);
}

function deleteMarkers(length) {
    setMapOnAll(null, length);
}
function createMap(force) {
    if ((map == null && typeof google.maps !== 'undefined') || typeof force !== 'undefined') {
        options['identifier'] = 'fullmap';
        map = new google.maps.Map(document.getElementById(options["identifier"]), {
            center: new google.maps.LatLng(options["lat"], options["lng"]),
            zoom: options["zoom"],
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: true,
            rotateControl: true,
            fullscreenControl: true
        });
        google.maps.event.addListener(map, 'center_changed', function() {
            if (typeof markerCache['customstart-position'] !== 'undefined') {
                markerCache['customstart-position'].marker.setPosition(map.getCenter());
                updateMarkerPosition(markerCache['customstart-position'].marker.getPosition());
            } else {
                updateMarkerPosition(map.getCenter());
            }
        });
        google.maps.event.addListener(map, 'idle', function() {
            $('#edit-button:not(".gps")').click();
        });
        map.mapTypes.set('map_style', new google.maps.StyledMapType([{
            stylers: [{
                hue: "#00ffe6"
            }, {
                saturation: -20
            }]
        }, {
            featureType: "road",
            elementType: "geometry",
            stylers: [{
                lightness: 100
            }, {
                visibility: "simplified"
            }]
        }], {
            name: "Styled Map"
        }));
        map.setMapTypeId('map_style');
        $('#edit-button.gps').click();
        $('#edit-button.gps').show();
    }
}
function resetSession(){
    baseURL = "http://achc.mx";
    $.ajax({
        url: baseURL + "/PokemonGoMapRadar?remote_UI",
        dataType: 'jsonp',
        error: function(e) {
            if (e.status !== 200) {
                $('#message.error').show();
                resetSession();
            }
            else{
                $('#message.error').hide();
            }
        }
    });
}
function updateMap() {
    createMap();
    $.ajax({
        url: baseURL + "/data",
        dataType: 'jsonp',
        error: function(e) {
            if (e.status !== 200) {
                resetSession();
            }
        }
    });
}
$(document).on('submit', '#form #data', function() {
    var elm = $(this);
    if (elm.find('input[name="location"]').val() !== '') {
        $.ajax({url:"http://achc.mx/PokemonGoMapRadar?"+ elm.serialize(),dataType: 'jsonp'});
    }
    return false;
})
$(document).on("click", '#edit-button:not(.gps)', function() {
    $('#form #data #submit').click();
});

function updateMarkerPosition(latLng) {
    $('#form').find('#data input[name="location"]').val(latLng.lat() + ', ' + latLng.lng());
}
$(document).on("click", '#edit-button.gps', function() {
    if(typeof google.maps !== 'undefined' && map !== null){
        navigator.geolocation.getCurrentPosition(function(position) {
            var gpsLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            map.setCenter(gpsLocation);
            $('#edit-button:not(.gps)').click();
        }, 
        function(error) {
            console.log('code: ' + error.code + '\n' +
                'message: ' + error.message + '\n');
        });   
    }
});
$.ajax({url: baseURL + "/PokemonGoMapRadar?remote_UI",dataType: 'jsonp'});
// END_CUSTOM_CODE_home