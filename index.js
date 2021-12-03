//Tiedosto sisältää kaikki päivän esitykset
var ul1 = "https://www.finnkino.fi/xml/Schedule/";
var ul2 = ul1 + "?area=";
const d = new Date();
var date = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
var end = "&dt=" + date;
//Tiedosto sisältää pelkistetyn tiedon teattereista
const theaters = 'https://www.finnkino.fi/xml/TheatreAreas/';
const idList = {};
// Piilotetaan etsinnän tekstipalkki
hideSearch();
function hideSearch(){
    $("#textSearch").hide();
}
// Kun dokumentti on latautunut, se lataa teattereiden-listan
$(document).ready(function(){
    $.ajax({
        type: "get",
        url: theaters,
        dataType: "xml",
        success: function(data){
            getLocations(data)
        },
        error: function(xhr, status) {
            console.log(status);
        }
    })
});
//Listänään ensimmäiseen pudotusvalikkoon paikkakunnat
function getLocations(data) {
    var lista = [];
    $(data).find("Name").each(function(){
        var text = this.innerHTML;
        if (text.includes(":")) {
            var a = text.split(":");
            text = a[0];
        }
        if (!(text.includes("kaupunki"))) {
            if (!(lista.includes(text))) {
                lista.push(text);
                $("#locations").append('<option>'+text+'</option>');
            }
        }
    });
}
/*Jos valitaan 1. pudotusvalikosta teatteri, niin ladataan uudestaan
yleistä tietoa sisältävän tiedoston*/
$("#locations").change(function(){
    $.ajax({
        type: "get",
        url: theaters,
        dataType: "xml",
        success: function(data){
            getTheaters(data)
        },
        error: function(xhr, status) {
            console.log(status);
        }
    })
})
//Lisätään 2. pudotusvalikkoon paikkakunnan teattereiden nimet
function getTheaters(data) {
    var value = $("#locations option:selected").text();
    createIdList($(data).find("TheatreArea"));
    $("#theaters").empty();
    $(data).find("Name").each(function(){
        var text = this.innerHTML;
        if (text.includes(":")) {
            var parts = text.split(":");
            if (parts[0] === value) {
                $("#theaters").append('<option value="'+text+
                '">'+modifyTheatreName(parts[1])+'</option>');
            }
        }
    })
}
/*Muutetaan teattereiden nimien osien aina alkavan isosta
alkukirjaimesta, mutta muiden kirjainten on oltava pieniä*/
function modifyTheatreName(name){
    name = name.slice(1);
    if (name.includes(" ")){
        var parts = name.split(" ");
        for (var i = 0; i<parts.length; i++){
            parts[i] = parts[i].charAt(0) + (parts[i].slice(1)).toLowerCase();
        }
        return parts.join(" ")
    } else {
        name = name.charAt(0) + (name.slice(1)).toLowerCase();
    }
    return name;
}
//Lisätään teattereiden id:t listaan
function createIdList(list) {
    for (var i = 0; i < list.length; i++) {
        if (!(idList.hasOwnProperty(list[i].childNodes[1]))) {
            idList[list[i].childNodes[1].innerHTML] = list[i].childNodes[3].innerHTML
        }
    }
}
//Käsitellään valittuja valintoja
$("#form").submit(function(event){
    /*Puhdistetaan ja piilotetaan valikko, 
    jotta tulokset liukuisivat yhtäaikaisesti alas*/
    $("#main").empty();
    $("#main").hide();
    //Saadaan valitun teatterin id
    var textid = $("#theaters").val();
    var id = "";
    for (var key in idList) {
        if (idList[key] === textid) {
            id = key;
        }
    }
    /*Muodostetaan linkki tiedostoon, josta löytyy
    kaikki teatterin esitykset*/
    var ulLink = ul2 + id + end;
    event.preventDefault();
    $.ajax({
        type: "get",
        url: ulLink,
        dataType: "xml",
        success: function(data){
            displayMovies(data)
            //Tulokset liukuvat alas
            $("#main").slideDown(300);
        },
        error: function(xhr, status) {
            console.log(status);
        }
    })
})
//Lähetetään käsky tuloksien tulostamiseen
function displayMovies(data) {
    $(data).find("Show").each(function(){
        createTitle(this)
    });
}
//Piilotetaan kysymysmerkki ja näytetään tekstikenttä
$("#searchButton").click(function(){
    $("#searchButton").hide();
    $("#textSearch").show();
})
/*Jos tekstikentässä painetaan enter-näppäintä,
ohjelma nappaa tiedoston, joka sisältää kaikki tiedot*/
$("#textSearch").keydown(function(event){
    if (event.key === "Enter") {
        event.preventDefault();
        $.ajax({
            type: "get",
            url: ul1,
            dataType: "xml",
            success: function(data){
                searchInput(data, $("#textSearch").val())
            },
            error: function(xhr, status) {
                console.log(status);
            }
        })
    }
})
/*Funktio etsii arvo tiedoston paikkakuntien, teattereiden
ja elokuvien nimistä. Mikäli osuma löytyy, lähetetään rivet
tulostettavaksi*/
function searchInput(data, value) {
    $("#main").empty();
    /*Puhdistetaan ja piilotetaan valikko, 
    jotta tulokset liukuisivat yhtäaikaisesti alas*/
    $("#main").hide();
    $(data).find("Show").each(function(){
        var title = ($(this).find("Title")[0].innerHTML).toLowerCase();
        var place = ($(this).find("TheatreAndAuditorium")[0].innerHTML).toLowerCase()
        if (title.includes(value.toLowerCase()) || place.includes(value.toLowerCase())){
            createTitle(this)
        }
    });
    //Tulokset liukuvat alas
    $("#main").slideDown(300);
}
//Tulostetaan elokuvan ikoni
function createTitle(show) {
    $("#main").append('<div class="movie">'+
    '<img src="' + $(show).find("Images")[0].childNodes[3].innerHTML + 
    '"><div class="movie-info"><h3>' + $(show).find("Title")[0].innerHTML +
    '</h3><span class="dot">' + testRating($(show).find("Rating")[0].innerHTML) + 
    '</span></div><div class="overview">Paikka ja sali: ' +
    $(show).find("TheatreAndAuditorium")[0].innerHTML +
    '<br>Lipunmyynti loppuu: ' +getTime($(show).find("ShowSalesEndTime")[0].innerHTML)+
    '<br>Näytös alkaa: ' +getTime($(show).find("dttmShowStart")[0].innerHTML) + 
    '</div>');
}
/*Mikäli ikäraja-teksti sisältää "Anniskelu"-osan,
funktio palauttaa tekstin "18"*/
function testRating(rating) {
    if (rating.includes("Anniskelu")) {
        return "18"
    } else {
        return rating
    }
}
//Funktio muokkaa aikan näkyvyyttä
function getTime(time) {
    var time = time.split("T");
    time = time[1].split(":");
    time = time[0] + ":" + time[1];
    return time
}