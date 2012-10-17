$(document).ready(function(){
    bg = 0;
   	setInterval(function(){
        setTimeout(function(){
            var swap = [1, 0];
            $('#splash_graphic').css('background', 'url("/static/img/' + swap[bg] + '.png")')
            bg = swap[bg];
        }, 500);
        $('#splash_graphic').fadeOut(500).fadeIn(500);
    }, 6000);
});
