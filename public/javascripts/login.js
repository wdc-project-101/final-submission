const vueinst = new Vue(
{
    el: "#vue",
    data:
    {
        // login
        login_identifier: "",
        login_password: "",

        // signup
        username: "",
        password: "",
        confirm_password: "",
        email: "",
        first_name: "",
        last_name: "",
        address: "",
        phone: ""
    },
    methods:
    {
        login: function()
        {
            const xhttp = new XMLHttpRequest();

            xhttp.onreadystatechange = function()
            {
                if (this.readyState == 4)
                {
                    switch (this.status)
                    {
                        case 200:
                        window.location.href = "home.html";
                        break;

                        case 400:
                        alert(this.responseText);
                        break;

                        case 401:
                        alert("Incorrect username or password");
                        break;

                        case 500:
                        alert("Something went wrong!");
                    }
                }
            };

            xhttp.open("POST", "/login");
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify({"identifier": this.login_identifier, "password": this.login_password}));
        },

        signup: function()
        {
            if (this.password != this.confirm_password)
            {
                this.signup_text = "Passwords must match!";
                return;
            }

            const xhttp = new XMLHttpRequest();

            xhttp.onreadystatechange = function()
            {
                if (this.readyState == 4)
                {
                    switch (this.status)
                    {
                        case 200:
                        alert("Account Created!");
                        break;

                        case 400:
                        alert(this.responseText);
                        break;

                        case 403:
                        alert("Username already exists!");
                        break;

                        case 500:
                        alert("Something went wrong!");
                    }
                }
            };

            xhttp.open("POST", "/signup");
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify({"username": this.username, "password": this.password, "email": this.email, "first_name" : this.first_name, "last_name" : this.last_name, "location" : this.address, "phone" : this.phone}));
        }
    },
    mounted()
    {
        // user check
        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4 && this.status == 200) // is user
                window.location.href = "home.html";
        };

        xhttp.open("GET", "/users/check", true);
        xhttp.send();
    }
});