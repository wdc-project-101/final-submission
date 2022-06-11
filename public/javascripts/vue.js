/* eslint-disable no-console */
// eslint-disable-next-line no-undef
var vueinst = new Vue({
    el: '#vue',
    data: {
        event_id: -1,
        title: "Title",
        location: "Location",
        description: "Description",
        times: [],
        availablity: [],
        isHost: false,
        evrdonly: false,
        lcrdonly: false,
        dscrdonly: false,

        user_id: "",
        users: "",
        hostedevents: [],
        events: [],
        email: "",
        firstname: "",
        lastname: "",
        address: "",
        number: "",
        image: "https://www.theholler.org/wp-content/uploads/2021/10/default-avatar-profile-icon-vector-social-media-user-portrait-176256935.jpg",
        isAdmin: false,
    },
    methods: {
        confirmTime: function()
        {
            var checkedRadio = document.querySelectorAll('input[type=radio]:checked');

            var xhttp = new XMLHttpRequest();

            xhttp.open("PUT", "/users/hosts/confirm-time", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify({ time_id: checkedRadio[0].id, event_id: vueinst.event_id}));
        },

        getEvent: function()
        {
            // event fields
            let field = new XMLHttpRequest();
            field.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var myArr = JSON.parse(this.responseText);

                    vueinst.title = myArr.event_name;
                    vueinst.description = myArr.event_description;
                    vueinst.location = myArr.event_location;
                    vueinst.event_id = myArr.event_id;
                }
            };
            field.open("GET", `/event?event_id=${this.event_id}`, true);
            field.send();
        },

        getTimes: function()
        {
            // time slots and count
            let timeslots = new XMLHttpRequest();
            timeslots.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var myArr = JSON.parse(this.responseText);

                    for (let i=0; i < myArr.length; i++){
                        vueinst.times.push({ "tid": myArr[i].time_id, "start": myArr[i].time_start, "end": myArr[i].time_end, "count": myArr[i].time_count });
                    }
                }
            };
            timeslots.open("GET", `/times?event_id=${this.event_id}`, true);
            timeslots.send();
        },

        getAvailability: function()
        {
            let avails = new XMLHttpRequest();
            avails.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var myArr = JSON.parse(this.responseText);

                    for (let i = 0; i < myArr.length; i++) {
                        vueinst.availablity.push({ "tid": myArr[i].time_id, "available": myArr[i].available });
                    }

                    for (let i = 0; i < vueinst.times.length; i++) {
                        for (let x = 0; x < vueinst.availablity.length; x++){
                            //if availability is true for checkbox id
                            if (vueinst.times[i].tid === vueinst.availablity[x].tid && vueinst.availablity[x].available === true){
                                vueinst.times[i].available = true;
                            }
                        }
                    }
                }
            };
            avails.open("GET", `/users/availability?event_id=${this.event_id}`, true);
            avails.send();
        },

        checkHost: function()
        {
            let hostcheck = new XMLHttpRequest();
            hostcheck.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    // not host
                    vueinst.isHost = true;
                }
            };
            hostcheck.open("GET", `/users/hosts/check?event_id=${this.event_id}`, true);
            hostcheck.send();
        },

        modifyEvent: function(field)
        {
            var checkBox = document.getElementById(field);
            if (checkBox.checked == false){
                var xhttp = new XMLHttpRequest();

                xhttp.open("PUT", "/users/hosts/modify-event", true);
                xhttp.setRequestHeader("Content-type", "application/json");

                switch(field){
                    case "event-switch":
                        xhttp.send(JSON.stringify({ event_name: vueinst.title, event_id: vueinst.event_id }));
                        break;
                    case "location-switch":
                        xhttp.send(JSON.stringify({ event_location: vueinst.location, event_id: vueinst.event_id }));
                        break;
                    case "desc-switch":
                        xhttp.send(JSON.stringify({ event_description: vueinst.description, event_id: vueinst.event_id }));
                        break;
                }
            }
        },

        modifyTimes: function(time_s, time_e, tid)
        {
            if(confirm("Save new timeslot?") == true){
                var xhttp = new XMLHttpRequest();

                xhttp.open("PUT", "/users/hosts/modify-time", true);
                xhttp.setRequestHeader("Content-type", "application/json");
                xhttp.send(JSON.stringify({ time_start: time_s, time_end: time_e, time_id: tid, event_id: vueinst.event_id }));
            }
        },

        specifyAvailability: function()
        {
            var checkedBoxes = document.querySelectorAll('input[name=guestAvail]');

            var selected = [];
            for(let i=0; i < checkedBoxes.length; i++){
                if(checkedBoxes[i].checked == true){
                    selected.push({time_id: checkedBoxes[i].id, available: true});
                } else if (checkedBoxes[i].checked == false) {
                    selected.push({time_id: checkedBoxes[i].id, available: false });
                }
            }

            var xhttp = new XMLHttpRequest();

            console.log(selected);

            xhttp.open("POST", "/users/specify-availability", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify({ "availabilities": selected }));
        },

        createGuest: function () {
            var xhttp = new XMLHttpRequest();

            var g_first = document.getElementById("guest_first").value;
            var g_last = document.getElementById("guest_last").value;
            var g_loc = document.getElementById("guest_address").value;

            if(!(g_first && g_last && g_loc)){
                alert("Please enter all fields.");
                return;
            }

            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var guest_user = JSON.parse(this.responseText);
                    vueinst.user_id = guest_user.username;
                    alert("Your guest username is " + guest_user.username + ".");
                }
            };

            xhttp.open("POST", "/create-guest", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify({ first_name: g_first, last_name: g_last, location: g_loc, event_id: vueinst.event_id }));
        },

        loginGuest: function()
        {
            var xhttp = new XMLHttpRequest();

            var g_user = document.getElementById("guest_user").value;

            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    vueinst.user_id = g_user;
                    alert("Welcome back.");
                }
            };

            xhttp.open("POST", "/login-guest", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify({ username: g_user, event_id: vueinst.event_id }));
        },

        deleteTime: function(id)
        {
            //prompt user to confirm timeslot deletion
            //delete timeslot if user confirms
            if(confirm("Delete this timeslot?") == true){
                var delTime = new XMLHttpRequest();


                delTime.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        var del = document.getElementById(id);
                        del.remove();
                    }
                };

                delTime.open("POST", "/users/hosts/delete-time", true);
                delTime.setRequestHeader("Content-type", "application/json");
                delTime.send(JSON.stringify({ time_id: id, event_id: vueinst.event_id}));
                // console.log(JSON.stringify({ time_id: id }));
            }
        },

        getUser: function ()
        {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4)
                {
                    if (this.status == 200)
                    {
                        var myArr = JSON.parse(this.responseText);

                        vueinst.user_id = myArr.username;
                        vueinst.email = myArr.email;
                        vueinst.firstname = myArr.first_name;
                        vueinst.lastname = myArr.last_name;
                        vueinst.address = myArr.location;
                        vueinst.number = myArr.phone;

                        if (myArr.image !== null)
                            vueinst.image = myArr.image;

                        vueinst.getHostEvents();
                        vueinst.getUserEvents();
                    }
                    else if (this.status == 401 && window.location.href.indexOf("event.html") == -1)
                        window.location.href = "index.html";
                }
            };
            xhttp.open("GET", "/users/user", true);
            xhttp.send();
        },

        getHostEvents: function ()
        {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var myArr = JSON.parse(this.responseText);
                    for (let i = 0; i < myArr.length; i++) {
                        vueinst.hostedevents.push({ "eid": myArr[i].event_id, "e_name": myArr[i].event_name });
                    }
                }
            };

            xhttp.open("GET", "/users/hosted-events?field=event_name", true);
            xhttp.send();
        },

        getUserEvents: function ()
        {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var myArr = JSON.parse(this.responseText);
                    for (let i = 0; i < myArr.length; i++) {
                        vueinst.events.push({ "eid": myArr[i].event_id, "e_name": myArr[i].event_name });
                    }
                }
            };

            xhttp.open("GET", "/users/events?field=event_name", true);
            xhttp.send();
        },

        usermodify: function ()
        {
            var xhttp = new XMLHttpRequest();

            xhttp.open("PUT", "/users/modify", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify({ email: vueinst.email, first_name: vueinst.firstname, last_name: vueinst.lastname, location: vueinst.address, phone: vueinst.number }));
        },

        signout: function ()
        {
            var xhttp = new XMLHttpRequest();

            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    vueinst.user_id = "";
                    vueinst.isHost = false;

                    if (window.location.href.indexOf("event.html") == -1)
                        window.location.href = "index.html";
                }
            };

            xhttp.open("POST", "/users/logout", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send();
        },

        addAdmin: function()
        {
            var xhttp = new XMLHttpRequest();

            xhttp.open("POST", "/users/admin/add", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send({"username": "default"});
        },

        deleteEvent: function()
        {
            var xhttp = new XMLHttpRequest();

            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    window.location.href = "home.html";
                }
            };

            xhttp.open("DELETE", "/users/hosts/delete-event", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify({ event_id: vueinst.event_id }));
        },

        checkAdmin: function()
        {
            let admincheck = new XMLHttpRequest();
            admincheck.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    // not host
                    vueinst.isAdmin = true;
                }
            };
            admincheck.open("GET", `/users/admin/check`, true);
            admincheck.send();
        },

        adminEvent: function()
        {
            window.location.href = `event.html?event_id=${document.getElementById("e_search").value}`;
        }

    },
    mounted() // called on page load (init function)
    {
        if (window.location.href.indexOf("event.html") != -1)
        {
            this.event_id = window.location.href.substring(window.location.href.indexOf('=') + 1);

            this.getEvent();
            this.getTimes();
            this.getAvailability();
            this.checkHost();
        }

        this.getUser();
        this.checkAdmin();
    }
});




var formcounter = 1;

function addTimeform() {
    var addTo = document.getElementById('hosttime');
    // adds the following to our div; spaced for readability
    addTo.innerHTML += '<form id="hostform' + formcounter + '">' +
        '<div class="row border border-3 rounded mb-3">' +
        '<div class="form-floating my-2 col-5">' +
        '<input type="datetime-local" class="form-control" id="newstart'+ formcounter +'">' +
        '<label for="start-time">&nbsp;&nbsp;&nbsp;Start time(AM/PM)</label>' +
        '</div>' +
        '<div class="form-floating my-2 col-5">' +
        '<input type="datetime-local" class="form-control" id="newend'+ formcounter +'">' +
        '<label for="end-time">&nbsp;&nbsp;&nbsp;End time(AM/PM)</label>' +
        '</div>' +
        '<div class="d-flex justify-content-end mb-2" role ="toolbar">' +
        '<button type="button" class="btn btn-sm btn-secondary float-end me-2" onclick="removeTimeform(' + formcounter + ')"> Delete Timeslot </button>' +
        '<button type="button" class="btn btn-sm btn-primary" onclick="addNewTime('+ formcounter +')">Save New Timeslot</button>' +
        '</div>' +
        '</form>';
   formcounter++;
}

function removeTimeform(formid) {
    var del = document.getElementById('hostform' + formid);
    del.remove();
}

function addNewTime(timeid) {
    var start = document.getElementById('newstart' + timeid).value;
    var end = document.getElementById('newend' + timeid).value;
    var eid = window.location.href.substring(window.location.href.indexOf('=') + 1);
    console.log(eid);

    var xhttp = new XMLHttpRequest();
    // if (this.readyState == 4 && this.status == 200) {

    // }

    xhttp.open("POST", "/users/hosts/create-time", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({ time_start: start, time_end: end, event_id: eid}));
}