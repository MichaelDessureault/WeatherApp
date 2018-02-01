$(document).one("pagecreate", function(){
	//Dates
	var dayArr = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	var date = new Date();
	var day = -1;

	//Location variables
	var latitude;
	var longitude;
	//creates a default localstoage array if empty.
	createLocalStorageVar();
	function createLocalStorageVar(){
		var recentSearches = new Array();
		if(!localStorage.recentSearches) {
			localStorage.recentSearches = JSON.stringify(recentSearches);
		}
	}
	//This was completed before learning about getLocation.done(); 
	getLocation();
	function getLocation() {
		if (navigator.geolocation){
			navigator.geolocation.getCurrentPosition(showPosition, showError);
		}else{
			console.log("geolocation is not supported");
		}
	}

	//Creates the jsonStr for the current location, saves the lat and long coords.
	function showPosition(position){
		latitude = position.coords.latitude;
		longitude = position.coords.longitude;
		var jsonStr = "http://api.openweathermap.org/data/2.5/forecast/daily?lat="+ latitude + "&lon=" + longitude+ "&units=metric&cnt=9&mode=json&appid=d5b53f301893e1be3d05a84c395dba6e";
		
		handleJSON(jsonStr, "showPosition");
	}

	function showError(err){
		console.log(err);
		console.log("geolocation is not supported");
		$('body').html('<h1> Geolocation is not supported </h1>');	
	}

	//creates the weather chart
	function makeChart(temps) {
		var ctx = $('#myCanvas');
		var myLineChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: ["Afternoon", "Evening", "Night", "Morning"],
				datasets: [
				{
					label: "Todays weather",
					fill: true,
					lineTension: 0.1,
					backgroundColor: "rgba(75,192,192,0.4)",
					borderColor: "rgba(75,192,192,1)",
					borderCapStyle: 'butt',
					borderDash: [],
					borderDashOffset: 0.0,
					borderJoinStyle: 'miter',
					pointBorderColor: "rgba(75,192,192,1)",
					pointBackgroundColor: "#fff",
					pointBorderWidth: 1,
					pointHoverRadius: 5,
					pointHoverBackgroundColor: "rgba(75,192,192,1)",
					pointHoverBorderColor: "rgba(220,220,220,1)",
					pointHoverBorderWidth: 2,
					pointRadius: 1,
					pointHitRadius: 10,
					data: temps,
					spanGaps: false,
				}
				]
			},
			options:{
				scales:{
					xAxes:[{labelFontSize: 50}],
					yAxes:[{labelFontSize: 50}]
				}
			} 
		});
	}

	//Handles all the json strings passed to it converts the handblebar script with the data.
	function handleJSON(jsonStr, method) {
		$.getJSON(jsonStr).done(function(data){
			//Checks if the data returned a 401 error or 404 error, else continues
			if(data.cod == 401 || data.cod == 404){
				console.log("The search you tried returned no results.");
				$('#searchbytext').val("").attr('placeholder', 'The search you tried returned no results.');
			}else{
				//generates the handlebar script
				var weatherTemplate = $('#weatherTemplate').html();
				var generateHTML = Handlebars.compile(weatherTemplate);
				var html = generateHTML(data);

				//Creates the html inside the #Home page
				$('#Home').html(html).trigger('create');

				//creates an array for temperature and adds all the temps from the json data
				var temps = new Array();
				temps.push(data.list[0].temp.day, data.list[0].temp.eve, data.list[0].temp.night, data.list[0].temp.morn);
				
				//if the method that called handleJSON was searchByTextButton then add that item to local storage
				if(method === "searchByTextButton"){
					addToLocalStorage(data.city.name);
				}

				//updates the comboBox options for quick searches
				populateComboBoxOptions();
				checkOptions(data.city.name);
				day = -1;
				//creates the weather chart
				makeChart(temps);
			}
		}).fail(function(){
			console.log('Error');
		});
	}
	//Adds the newly searched item to localstorage
	function addToLocalStorage(cityName) {
		var recentSearches = new Array();
		recentSearches = JSON.parse(localStorage.recentSearches);
		recentSearches.push(cityName);
		localStorage.recentSearches = JSON.stringify(recentSearches);
	}

	//Checks if the current location is in the defaulted option list, hides it if it is.
	function checkOptions(name) {
		if($.inArray(name, ["Burlington", "Toronto", "Oakville", "Milton", "Mississauga", "Hamilton"])!= -1){
			var cityName = '#opt'+name;
			$(cityName).hide();
		}
	}

	//repopulates the combo box with default opitions and recent searches
	function populateComboBoxOptions() {
		var optGroup = $('#optGroup');
		var recentSearches = new Array();
		recentSearches = JSON.parse(localStorage.recentSearches);
		$.each(recentSearches, function(key, value){
			var optionStr = "<option value='"+value+"'>"+value+"</option>";
			optGroup.append(optionStr);
		});
	}

	//prevents the user from using the eneter key in the the textbox
	$(document).on('keypress', '#searchbytext', function(event){
		if (event.keyCode == 13){
			event.preventDefault();
		}
	});

	//event called when search combo box index has been changed or clicked
	$(document).on('change', '#searchComboBox', function(event){
		var locationName = $(this).find('option:selected').val();
		if($.inArray(locationName, ["Burlington", "Toronto", "Oakville", "Milton", "Mississauga", "Hamilton"]) != -1){
			var jsonStr = "resources/data/"+locationName+".json";
		}else{
			var jsonStr = "http://api.openweathermap.org/data/2.5/forecast/daily?q="+locationName+"&units=metric&cnt=9&mode=json&appid=d5b53f301893e1be3d05a84c395dba6e"
		}
		handleJSON(jsonStr, "searchComboBox");
	});

	//event called when search text submit button was clicked
	//changes your location to the newly search location, if its not a location that outcome gets handled in handleJSON
	$(document).on('tap', '#searchByTextButton', function(event){
		event.preventDefault();
		var locationName = $('#searchbytext').val();
		if(location != ""){
			var jsonStr = "http://api.openweathermap.org/data/2.5/forecast/daily?q="+locationName+"&units=metric&cnt=9&mode=json&appid=d5b53f301893e1be3d05a84c395dba6e";
			handleJSON(jsonStr, "searchByTextButton");
		}
	});

	//event called when current location button was clicked, resets your location to the current. 
	$(document).on('tap', '#currentLocation', function(event){
		var jsonStr = "http://api.openweathermap.org/data/2.5/forecast/daily?lat="+ latitude + "&lon=" + longitude+ "&units=metric&cnt=9&mode=json&appid=d5b53f301893e1be3d05a84c395dba6e";
		handleJSON(jsonStr, "showPosition");
	});

	//finds out if its day or night
	function dayOrNight() {
		var getTime = new Date();
		var dayornight = "";

		var hour = getTime.getHours();
		if(hour >= 6 && hour < 20){
			dayornight = "day";
		}else{
			dayornight = "night";
		}
		return dayornight
	}
	
	//helper for handlebar that is called when it wants to get the day or night
	Handlebars.registerHelper('dayOrNight', function(){
		var dayornight = dayOrNight();
		return dayornight;
	});

	//helper that will display the weather icon
	Handlebars.registerHelper('weatherImage', function(desc, num){
		var dayornight = dayOrNight();
		if(dayornight == "day" || num == 1){
			switch(desc){
				case "few clouds": return("wi-day-cloudy"); break;
				case "light rain": return("wi-day-showers"); break;
				case "moderate rain": return("wi-day-rain");break;
				case "heavy intensity rain": return("wi-day-thunderstorm");break;
				case "very heavy rain": return("wi-day-thunderstorm");break;
				case "snow": return("wi-day-snow");break;
				case "hail": return("wi-day-hail");break;
				case "fog": return("wi-day-fog"); break;
				case "overcast clouds": return("wi-day-sunny-overcast"); break;
				case "clear sky": return("wi-day-sunny"); break;
				case "broken clouds": return("wi-cloudy"); break; 
				default: console.log(desc); return("wi-day-light-wind");
			}
		}else{
			switch(desc){
				case "few clouds": return("wi-night-alt-cloudy"); break;
				case "light rain": return("wi-night-alt-showers"); break;
				case "moderate rain": return("wi-night-alt-rain");break;
				case "heavy intensity rain": return("wi-night-alt-thunderstorm");break;
				case "very heavy rain": return("wi-night-alt-thunderstorm");break;
				case "snow": return("wi-night-alt-snow");break;
				case "hail": return("wi-night-alt-hail");break;
				case "fog": return("wi-night-alt-fog"); break;
				case "overcast clouds": return("wi-night-alt-partly-cloudy"); break;
				case "clear sky": return("wi-night-clear"); break;
				case "broken clouds": return("wi-cloudy"); break; 
				default: console.log(desc); return("wi-night-cloudy-windy");
			}
		}
	});

	//helper for get day, this will get the day of the week 0 is Sunday 6 is Saturday 
	Handlebars.registerHelper('getDay', function() {
		if (day == -1){
			day = date.getDay();
		}
		day++;
		//Checks to see if the days number was incremented to 7 if so gets reset to 0.
		if(day == 7){
			day = 0;
		}
		return dayArr[day];
	})

	//helper that checks to see if the index of the foreach is 0, if its 0
	//then it will skip over it by returning false.
	//this is used because for the long term weather it wont display todays weather
	//only the next 8 days.
	Handlebars.registerHelper('ifIndexNot0', function(number){
		if(number == 0){
			return false;
		}else{
			return true;
		}
	});

	//helper that rounds the weathers number down eg. 23.9 to 23 degrees
	Handlebars.registerHelper('round', function(number){
		return Math.floor(number);
	});

	//helper that checks if the current location is in the defaulted option list, hides it if it is
	//this helper is not working and replaced with a method above called checkOptions. 
	Handlebars.registerHelper('checkCurrentCity', function(name){
		if($.inArray(name, ["Burlington", "Toronto", "Oakville", "Milton", "Mississauga", "Hamilton"])!= -1){
			
			var cityName = 'opt'+name;
			// console.log(cityName);

			// console.log(document.getElementById(cityName));
			//jQuery('body').html('');
			// $(cityName).attr('hidden', 'true');
			// $(cityName).attr('hidden', true);
			//$(cityName).hide();
			//$(cityName).prop('hidden', 'hidden');
		}
	});
});