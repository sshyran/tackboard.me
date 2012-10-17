// Artur Sapek

poster = function(data){
	var me = this;
	this.id = data.id;
	this.age = data.age;
    this.active = data.active
    this.dragging = false;
	this.tack_color = data.tack_color || 'B';
	this.lifted = false;
    this.x = data.x; this.y = data.y;
	this.side = data.x < 550 ? 'left' : 'right';
	this.all = create('div', { className: 'poster_all', id: 'poster_' + data.id });
    if (data.id){
        $(this.all).attr('pid', data.id)
    }
	$(this.all).css({'left': data.x + 'px', 'bottom': data.y + 'px', 'z-index': data.id})
               .mouseover(function(){
                   if (!window.noage && !me.lifted && !me.dragging){
                       window.user_interacted = true;
                       $(me.age_div).show();
                       $(me.tear_button).show();
                   }
             }).mouseout(function(){
                   $(me.age_div).hide();
                   $(me.tear_button).hide();
             });
	this.page = create('div', { className: 'poster_page' });
	this.body = create('div', { className: 'poster_text' }, data.body);
	this.tack = create('div', { className: 'poster_tack' });
	$(this.tack).css({ 'background-color': {'B': '#41b2f2', 'R': '#f23b4c', 'G': '#32b221', 'P': '#eb6e96', 'W': '#c3c3c3'}[this.tack_color]});

	appendobj([ [this.all, this.page], [this.all, this.body], [this.all, this.tack] ])
}

poster.prototype.lift = function(){
    var me = this;
    $(this.lift_button).hide();
    $(this.age_div).hide();
    $(this.lifted_corner).hide();    
    $(this.tear_button).hide();    
	$(this.unlift_button).show();
	this.lifted = true;
	$(this.page).attr('class', 'poster_page_lifted').animate({'bottom': '+=7px'}, 0).css('background-position', '0px -0px')	
    $(this.tack).animate({'bottom': '-=261px'}, 0);
	$(this.all).addClass('poster_all_lifted').animate({'bottom': '+=261px'}, 0)	
	$(this.body).hide();
    $(this.all).animate({opacity: '0.65'}, 500).mouseover(function(){
        if (me.lifted){
            $(this).animate({opacity: '1'}, 0)
        }
    }).mouseout(function(){
        if (me.lifted){
            $(this).animate({opacity: '0.65'}, 0)
        }
    });
}

poster.prototype.unlift = function(){
	this.lifted = false;
    $(this.lift_button).show();
    $(this.tear_button).show();    
	$(this.unlift_button).hide();
	$(this.page).attr('class', 'poster_page').animate({'bottom': '0px'}, 0).css('background-position', '0px 0px');;
	$(this.tack).animate({'bottom': '+=261px'}, 0);
	$(this.all).removeClass('poster_all_lifted').animate({'bottom': '-=261px'}, 0);
	$(this.body).show();
    $(this.all).animate({opacity: '1'}, 0);
    
}

poster.prototype.tear = function(do_ajax){
    var me = this;
    if (do_ajax == undefined) ajax.tear({id: this.id});
    if (me.active){
        me.unarm_tear();
        $(me.tear_button).remove();
        $(me.lift_button).hide();
        $(me.age_div).remove();
        $(me.lifted_corner).hide();
        setTimeout(function(){
            $(me.page).animate({'top': '+=100px'}, 1500, 'easeOutExpo').fadeOut(500);
            $(me.body).animate({'top': '+=100px'}, 1500, 'easeOutExpo').fadeOut(500);

            setTimeout(function(){
                $(me.all).css({'width': '0px', 'height': '0px'})
            }, 2100);
        }, 200);
    }
    me.active = false;
    var index = all_posters.indexOf(this),
        a1, a2;
    a1 = all_posters.splice(0, index);
    all_tacks.push(this);
    index = all_posters.indexOf(this);
    a2 = all_posters.splice(index + 1);
    all_posters = a1.concat(a2);
}

poster.prototype.arm_tear = function(){
    var me = this;
    window.noage = true;
    $(me.age_div).hide();
    this.unarm_others();
    var offset = $(this.all).offset();
    $(tear_confirm).css({ 'top': parseInt(offset.top) - 10 + 'px', 'left': parseInt(offset.left) - 15 + 'px' }).show().attr('armed', me.id);
    $(this.tear_fog).fadeIn(50);
}

poster.prototype.unarm_others = function(){
    for (var p in all_posters){
        if (all_posters[p] != this) $(all_posters[p].tear_fog).fadeOut(50);
    }
}

poster.prototype.unarm_tear = function(){
    window.noage = false;
    $(tear_confirm).fadeOut(100);
    $(this.tear_fog).fadeOut(50);
}

poster.prototype.post = function(animate_tack, target){ // commit it to the board
	var me = this;
    this.lift_button = create('div', { className: 'lift_target' });
    this.unlift_button = create('div', { className: 'unlift_target' });
    this.lifted_corner = create('div', { className: 'lifted_corner' });
    if (this.id){
        this.tear_button = create('div', { className: 'tear_button' });
        this.tear_fog = create('div', { className: 'tear_fog' });
        $(this.tear_button).click(function(){
            me.arm_tear();
        }).hide();
    } else {
        $(this.all).data('invincible', true);
    }
    this.age_div = create('div', { className: 'poster_age' }, this.age);
    $(this.all).append(this.unlift_button).append(this.age_div).append(this.lifted_corner)
               .append(this.lift_button).append(this.tear_button).append(this.tear_fog);
	if (target == undefined) target = '#tackboard';
	$(target).append(this.all);
	var opp = {'left': 'right', 'right': 'left'};
	$(this.lift_button).click(function(){ 
                           me.lift();
                     }).mouseover(function(){
                           $(me.page).css('background-position', '0px -316px');
                           $(me.lifted_corner).show();
                     }).mouseout(function(){
                           $(me.page).css('background-position', '0px 0px');
                           $(me.lifted_corner).hide();
                     });
	$(this.unlift_button).click(function(){ 
                           me.unlift(); 
                       }).mouseover(function(){
                           $(me.page).css('background-position', '0px -70px');
                       }).mouseout(function(){
                           $(me.page).css('background-position', '0px 0px');
                       }).hide();
                    
	var x = { 'left': 240, 'right': -240 };
    if (animate_tack){
        $(me.tack).hide();
        setTimeout(function(){
            colors = {'B': '#41b2f2', 'R': '#f23b4c', 'G': '#32b221', 'P': '#eb6e96', 'W': '#c3c3c3'}
            $(me.tack).css('background', colors[me.tack_color]).animate({
                'width': '20px',
                'height': '20px',
                'left': '-=7px',
                'bottom': '-=7px'
            }, 0).fadeIn(100).delay(400).animate({
                'width': '6px',
                'height': '6px',
                'left': '+=7px',
                'bottom': '+=7px'
            }, 200);
        }, 500);
    }
}

tack_only = function(data){
    var me = this;
    this.tack = create('div', { className: 'tack_only' });
    $(this.tack).css({'left': data.x + 120 + 'px', 'bottom': data.y + 293 + 'px', 'background-color': {'B': '#41b2f2', 'R': '#f23b4c', 'G': '#32b221', 'P': '#eb6e96', 'W': '#c3c3c3'}[data.tack_color], 'z-index': data.id});
}

tack_only.prototype.post = function(){
    var me = this;
    $('#tackboard').append(this.tack);
}
