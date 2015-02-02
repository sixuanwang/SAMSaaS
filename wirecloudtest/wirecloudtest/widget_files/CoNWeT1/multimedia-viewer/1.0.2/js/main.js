/* inputs */
MashupPlatform.wiring.registerCallback("uriSlot", _urlHandler);

/* prefs */
var apikey = "4cedefbbddc927671820a9ce82155a2f";
MashupPlatform.prefs.registerCallback(prefHandler);


var previous_out_url = "";
var agent=navigator.userAgent;
var is_iphone = (agent.indexOf('iPhone')!=-1);

function prefHandler(preferences) {
    apikey = preferences.apikeyPref;
}

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function _urlHandler(new_value) {
    var url;

    if (new_value.trim()[0] === '{') {
        url = JSON.parse(new_value).url;
    } else {
        url = new_value;
    }

    previous_out_url = url;

    if (fromFlickr(url)) {
        obtainFlickrPhotoURL(url);
    } else if (fromYoutube(url)) {
        previous_out_url = loadVideo(url);
        // wiring propagation
        if (MashupPlatform.prefs.get('synchronousWiringPref').toLowerCase() == "true") {
            propagateWiring();
        }
    } else if (isGoear(url)) {
        setMP3(url);
        // wiring propagation
        if (MashupPlatform.prefs.get('synchronousWiringPref').toLowerCase() == "true") {
            propagateWiring();
        }
    } else {
        previous_out_url = setNewImage(url);
        // wiring propagation
        if (MashupPlatform.prefs.get('synchronousWiringPref').toLowerCase() == "true") {
            propagateWiring();
        }
    }

} // _urlHandler

function fromYoutube(_url) {
    try {
        //FIXME to improve. youtube.dayures.net returns true (error)
        var hostname = getHostname(_url);
        return hostname.match("youtube");
    } catch (error) {
        return false;
    }
}

function fromFlickr(_url) {
    try {
        //FIXME to improve. flickr.dayures.net returns true (error)
        var hostname = getHostname(_url);
        return hostname.match("flickr") && !hostname.match("static.flickr");
    } catch (error) {
        return false;
    }
}

function isGoear(_url) {
    try {
        var hostname = getHostname(_url);
        return hostname.match("goear");
    } catch (error) {
        return false;
    }
}

// http://beardscratchers.com/journal/using-javascript-to-get-the-hostname-of-a-url
function getHostname(str) {
    var re = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
    return str.match(re)[1].toString();
}


function URLDecode( url ){
    // Replace + with ' '
    // Replace %xx with equivalent character
    // Put [ERROR] in output if %xx is invalid.
    var HEXCHARS = "0123456789ABCDEFabcdef"; 
    var encoded = url;
    var plaintext = "";
    var i = 0;
    while (i < encoded.length) {
        var ch = encoded.charAt(i);
        if (ch == "+") {
            plaintext += " ";
            i++;
        } else if (ch == "%") {
            if (i < (encoded.length-2) &&
                    HEXCHARS.indexOf(encoded.charAt(i+1)) != -1 &&
                    HEXCHARS.indexOf(encoded.charAt(i+2)) != -1 ) {
                plaintext += unescape( encoded.substr(i,3) );
                i += 3;
            } else {
                alert( 'Bad escape combination near ...' + encoded.substr(i) );
                plaintext += "%[ERROR]";
                i++;
            }
        } else {
            plaintext += ch;
            i++;
        }
    } // while

    return plaintext;
}

///// Youtube

function loadVideo(_url) {
    var obj = null;
    var embed = null;

    _url = _url.replace('/watch?v=','/v/');
    if (location.protocol == 'https:' && _url.match('http:')) {
        _url = _url.replace('http', 'https');
    }

    if (!is_iphone) {
        obj = document.createElement('object');
        obj.id = "videoId";
        obj.setAttribute('width',"100%");
        obj.setAttribute('height',"90%");

        var param = document.createElement('param');
        param.name = "movie";
        param.value = _url;
        obj.appendChild(param);

        param = document.createElement('param');
        param.name = "wmode";
        param.value = "transparent";
        obj.appendChild(param);

        embed = document.createElement('embed');
        embed.id="rep";
        embed.setAttribute('src', _url);
        embed.setAttribute('width',"100%");
        embed.setAttribute('height',"90%");
        embed.setAttribute('wmode',"transparent");
        embed.setAttribute('type',"application/x-shockwave-flash");
    } else { //iphone
        obj = document.createElement('a');
        obj.setAttribute('href',_url);
        obj.setAttribute('target',"blank");
    }

    var divAnt = document.getElementById("multimedia");
    var divMultimedia = document.createElement("div");
    divMultimedia.id="multimedia";
    divMultimedia.appendChild(embed); // FIXME create a valid xhtml
    divMultimedia.appendChild(obj);
    document.body.replaceChild(divMultimedia,divAnt);
    document.getElementById("headerFlickr").setAttribute("style", "display:none"); // remove flickr zoom utilities
    document.getElementById("headerYoutube").setAttribute("style", "display:block"); // show youtube utilities

    // Return example: http://www.youtube.com/v/sECzJY07oK4
    return _url;

} // function

///////// MP3
function setMP3(url) {
    var divAnt = document.getElementById("multimedia");
    var divMultimedia = document.createElement("div");
    divMultimedia.id="multimedia";

    var divImageContainer = document.createElement("div");
    divImageContainer.id="imageContainer";

    var audio = document.createElement('audio');
    audio.id="audio";

    audio.setAttribute('controls', 'true');
    audio.setAttribute('src', url);
    audio.setAttribute('autoplay', 'autoplay');
    audio.setAttribute('autoplay', 'autoplay');
    divImageContainer.appendChild(audio);
    divMultimedia.appendChild(divImageContainer);
    document.body.replaceChild(divMultimedia,divAnt);
    document.getElementById("headerFlickr").style.display = "block"; //Show flickr zoom utilities
    document.getElementById("headerYoutube").style.display = "none"; // remove youtube utilities

    // Return url to propagate
    return url;
}

///////// Flickr

var originalSizeX = 0;
var originalSizeY = 0;
var actualSizeX = 0;
var actualSizeY = 0;

var MAX_ZOOM = 200;
var MIN_ZOOM = 10;
var DEFAULT_ZOOM = 100;
var INC = 10;

var actualZoom = DEFAULT_ZOOM;

function obtainFlickrPhotoURL(uri) {

    if (!apikey) {
        alert("Please, introduce a Flickr API Key in the prefereces.");
        return null;
    }
    //obtain the photo id
    var parts = uri.split("/");
    var photo_id = parts[(parts.length -2)];

    var url = "";
    url += "http://api.flickr.com/services/rest/";
    url += "?method=flickr.photos.getSizes";
    url += "&api_key=" + apikey;
    url += "&photo_id=" + photo_id;
    url += "&format=json";
    url += "&nojsoncallback=1";

    MashupPlatform.http.makeRequest(url, {
        context: this,
        onSuccess: _flickrSuccess,
        onFailure: displayError
    });
}

function _flickrSuccess(resp) {

    var response = resp.responseText;
    var items = JSON.parse(response);

    items = items.sizes.size;
    var photo = null;
    for (var i = 0; i < items.length ; i++) {
        var item = items[i];
        if (item.label === "Medium") {
            photo = {url: item.source};
            break;
        }
    }

    previous_out_url = setNewImage(photo.url);
    //wiring propagation
    if (MashupPlatform.prefs.get('synchronousWiringPref').toLowerCase() == "true") {
        propagateWiring();
    }
}

function displayError(resp) {
    alert("It couldn't get that information. Please, try it later.");
}


///// Other images
function setNewImage(url) {
    var divAnt = document.getElementById("multimedia");
    var divMultimedia = document.createElement("div");
    divMultimedia.id="multimedia";

    var divImageContainer = document.createElement("div");
    divImageContainer.id="imageContainer";

    var img = document.createElement('img');
    img.id="image";

    img.setAttribute('src', url);
    img.addEventListener("load", imgLoaded, false);
    divImageContainer.appendChild(img);
    divMultimedia.appendChild(divImageContainer);
    document.body.replaceChild(divMultimedia,divAnt);
    document.getElementById("headerFlickr").style.display = "block"; //Show flickr zoom utilities
    document.getElementById("headerYoutube").style.display = "none"; // remove youtube utilities

    // Return url to propagate
    return url;
}

function imgLoaded (){
    originalSizeX = document.getElementById("image").width;
    originalSizeY = document.getElementById("image").height;
}

function setSize(value) {
    var image = document.getElementById('image');
    if (value !== 0) {
        image.style.width = (originalSizeX * value/100) + 'px';
        image.style.height = (originalSizeY * value/100) + 'px';
    } else {
        image.style.width = originalSizeX;
        image.style.height = originalSizeY;
    }
}

function expandZoom() {
    setSize((((actualZoom + INC) < MAX_ZOOM)?(actualZoom+=INC):(actualZoom=MAX_ZOOM)));
}

function reduceZoom() {
    setSize((((actualZoom - INC) > MIN_ZOOM)?(actualZoom-=INC):(actualZoom=MIN_ZOOM)));
}

function defaultZoom() {
    setSize(0);
    actualZoom = DEFAULT_ZOOM;
}

function nextImage() {
    if (actualImage < (selectedImages.length-1)) {
        setSelectedImage(++actualImage);
    }
}

function propagateWiring() {
    // propagate urls
    if (previous_out_url) {
        MashupPlatform.wiring.pushEvent("urlEvent", URLDecode(previous_out_url));
    }
}
