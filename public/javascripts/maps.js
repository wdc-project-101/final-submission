/* eslint-disable no-console */

function get_address() {
  let location = "";
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      location = this.responseText;
    }
  };
  xhttp.open("GET", "/users/user?field=location");
  xhttp.send();
  return location;
}

console.log(get_address());

function get_coords(address) {
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      latitude = results[0].geometry.location.lat();
      longitude = results[0].geometry.location.lng();
      window.lati = latitude;
      window.longi = longitude;
      setValue(latitude, longitude);
      // localStorage.setItem('latitute', latitude);
      // localStorage.setItem('longitude', longitude);
    }
  });
}
// window.lati = 0;
//  window.longi = 0;
function setValue(lat, long){
  lati = lat;
  longi = long;
}

var default_address = "University of Adelaide, Adelaide";

async function initMap() {
  console.log(default_address);
  await get_coords(default_address);
  navigator.geolocation.getCurrentPosition(function(location) {
    currLat = location.coords.latitude;
    currLong = location.coords.longitude;
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: latitude, lng: longitude},
      zoom: 8,
      mapId: '82dd435488128fcf'
    });

    new google.maps.Marker({
      position: {lat: latitude, lng: longitude},
      map,
    });
  });
  // window.location;
}
