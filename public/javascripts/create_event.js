function create_event() {
    var c_ename = document.getElementById("event-name").value;
    var c_eplace = document.getElementById("event-place").value;
    var c_edesc = document.getElementById("event-desc").value;
    var times_array = document.getElementsByName("times");
    //first value is start time, second value is end time, etc etc

    // get values from times_array
    var times_values = [];

    for (let time of times_array)
        times_values.push(time.value);

    var xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200)
            window.location.href = `event.html?event_id=${JSON.parse(this.responseText).event_id}`;
    };

    xhttp.open("POST", "/users/create-event", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({ event_name: c_ename, event_location: c_eplace, event_description: c_edesc, times: times_values }));
}

//variable to count number of forms
var counter = 1;
function addform() {
    var addTo = document.getElementById('timeslots');
    // adds the following to our div; spaced for readability
    addTo.innerHTML += '<form id="form' + counter + '">'+
                            '<div class="row my-2" id="one-form">'+
                                '<div class="form-floating mt-2 col-5">'+
                                    '<input type="datetime-local" class="form-control" id="start-time" name="times">'+
                                    '<label for="start-time">&nbsp;&nbsp;&nbsp;Start time(AM/PM)</label>'+
                                '</div>'+
                                '<div class="form-floating mt-2 col-5">'+
                                    '<input type="datetime-local" class="form-control" id="end-time" name="times">'+
                                    '<label for="end-time">&nbsp;&nbsp;&nbsp;End time(AM/PM)</label>'+
                                '</div>'+
                                '<button type="button" class="btn-close btn-sm float-end my-auto" aria-label="Close" onclick="removeform()"></button>'+
                            '</div>'+
                        '</form>';
    counter++;
}

 function removeform() {
     counter--;
     var del = document.getElementById('form' + counter);
     del.remove();
 }