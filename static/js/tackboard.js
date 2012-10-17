// Artur Sapek

ajax = {
    'all': function(){
        var ajax = $.get('/ajax/active_posters?board_id=' + board_id + '&category=' + current_category),
            interval;
        init_loader();
        all_posters = [ ];
        interval = setInterval(function(){
            loader_step();
        }, 200);
        ajax.done(function(e){
            var e = $.parseJSON(e);
            clearInterval(interval);
            $('#loader').hide();
            for (var p in e[0]){
                var P = window['poster_' + e[0][p].id] = e[0][p].active ? 
                    new poster(e[0][p]) : new tack_only(e[0][p]);
                P.post(false, '#tackboard');
                if (e[0][p].active){ 
                    all_posters.push(P);
                } else {
                    all_tacks.push(P);
                }
                statuses[p] = e[0][p].active
            }
            $('#category_dropdown').css('min-width', $('#category_dropdown_button').width() + 26 + 'px');
        })
    },
    'post': function(data, object){
        
        var ajax_call = $.ajax({
            type: 'POST',
            url: '/ajax/add_poster/',
            data: {
                'csrfmiddlewaretoken': csrf_token,
                'board_id' : board_id,
                'x': data.x,
                'y': data.y,
                'tack_color': data.color,
                'body': data.body,
                'category': current_category
            }
        });
        ajax_call.done(function(e){
            var data = $.parseJSON(e)[1];
            window['poster_' + data.id] = object;
            object.id = data.id;
            $(object.all).css('z-index', data.id).attr('id', 'poster_' + data.id).attr('pid', data.id);
            statuses[data.id] = data.active
            
        });
    },
    'tear': function(data){
        var ajax_call = $.ajax({
            type: 'POST',
            url: '/ajax/remove_poster/',
            data: {
                'csrfmiddlewaretoken': csrf_token,
                'poster_id': data.id
            }
        });
    },
    'update': function(){
        var ajax_call = $.get('/ajax/update/?board_id=' + board_id + '&category=' + current_category);
        ajax_call.done(function(e){
            var update = $.parseJSON(e)[0];
            for (var p in update){
                if (statuses[p] == undefined){
                    // It's a new poster - do a deeper AJAX call to get all its data
                    ajax.add(p);
                } else {
                    if (statuses[p] == update[p]){
                        // Nothing has changed
                    } else {
                        // It has been removed
                        window['poster_' + p].tear(false);
                    }
                }
            }
            statuses = update;
        });
    },
    'add': function(id){
        var ajax_call = $.get('/ajax/retrieve_poster/?poster_id=' + id);
        ajax_call.done(function(e){
            var data = $.parseJSON(e)[0];
            if (data.active){
                var p = window['poster_' + data.id] = new poster(data);


                p.post(true, '#tackboard');
            } else {
                var t = window['poster_' + data.id] = new tack_only(data);
                t.post();
            }
        });
    },
    'switch': function(category, change_url){
        clear_board();
        $('#category_dropdown_button').removeClass('category_hover').text(category);
        
        if (change_url == undefined){
            change_url = true;
        }

        $('#category_dropdown').hide().empty().css('min-width', $('#category_dropdown_button').width() + 26 + 'px');
        for (var c in categories){
            if (categories[c] != category){
                $('#category_dropdown').append($('<li onclick="ajax.switch($(this).text()); ajax.reference(\'Switched category\');">' + categories[c] + '</li>'));
            }
        }
        current_category = category;
        ajax.all();
        if (change_url){
            document.location = '#' + category.toLowerCase().match(/\w+/gi).join('');
        }
    },
    'reference': function(action){
        if (ignore_stats) return;
        var ajax_call = $.ajax({
            type: 'POST',
            url: '/ajax/reference_counter/',
            data: {
                'csrfmiddlewaretoken': csrf_token,
                'action' : action,
            }
        });
    }
}

clear_board = function(){
    for (var t in all_tacks){
            $(all_tacks[t].tack).remove();
    }
    for (var p in all_posters){
        if (!$(all_posters[p].all).data('invincible')){
            $(all_posters[p].all).remove();
        }
    }
}

draggable_poster = function(){
    $('#edit_me-wysiwyg-iframe').hide()
    var p = new poster({
        'body': poster_editor.html(),
        'x': 77,
        'y': 112,
        'id': 1000000,
        'tack_color': 'B',
        'active': true,
        'age': 'just now'
    });

    p.body_html = poster_editor.html();

    p.post();
    $(p.tack).hide();
    $(p.tear_button).hide();
    $(p.lift_button).hide();
    p.dragging = true;

    p.post = function(color){
        var p = this,
            colors = {'B': '#41b2f2', 'R': '#f23b4c', 'G': '#32b221', 'P': '#eb6e96', 'W': '#c3c3c3'}
        p.x = parseInt($(p.all).css('left'));
        p.y = parseInt($(p.all).css('bottom'));
        p.side = p.x < 550 ? 'left' : 'right';
        var opp = {'left':'right', 'right':'left'}
        $(p.drag_icon).fadeOut(100);
        $(p.tear_button).hide();
        setTimeout(function(){
            $(p.tack).css('background', colors[color]).animate({
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
            $(p.lift_button).show()
        }, 500);
        var offset = $(p.all).offset();
        var x = { 'left': 245, 'right': -240 };
        $(p.opts).attr({ 'class': 'poster_opts ' + opp[p.side] }).css({
            'left': offset.left + x[p.side] + 'px', 
            'top': offset.top - 50 + 'px', 
            'z-index': 999999
        })
        ajax.post({'x': parseInt(p.x), 'y': parseInt(p.y), 'color': color, 'body': p.body_html}, p)
        all_posters.push(p);
    }

    p.drag_icon = create('div', { className: 'drag_icon' });
    p.tack_dialog = create('div', { className: 'tack_dialog_full' });
    p.tack_prompt = create('div', { className: 'tack_prompt_1' }, 'Drag your poster to where you want to post it.');
    p.tack_options = create('div', { className: 'tack_options' });
    $(p.tack_dialog).append(p.tack_prompt);
    $(p.all).append(p.drag_icon)
            .append(p.tack_dialog)
            .css('cursor', 'pointer')
            .one('mousedown', function(){
                $(p.tack_prompt).text('Choose tack color to post.').attr('class', 'tack_prompt_2');
                $(p.tack_dialog).append(p.tack_options);
                var colors = {1: ['B', '#41b2f2'], 2: ['R', '#f23b4c'], 3: ['G', '#32b221'], 4: ['P', '#eb6e96'], 5: ['W', '#c3c3c3'] }
                for (var i = 1; i < 6; i ++){
                    var opt = create('div', { className: 'tack_option'} );
                    var tack = create('div', { className: 'poster_tack' });
                    $(tack).css({'top': '12px', 'left': '12px', 'background': colors[i][1]});
                    $(opt).attr('color', colors[i][0])
                        .mouseover(function(){
                            $('.tack_option').each(function(){
                                $(this).css('opacity', '0.25');
                            });
                            $(this).css('opacity', '1');
                        })
                        .mouseout(function(){
                            $('.tack_option').each(function(){
                                $(this).css('opacity', '1');
                            });
                        })
                        .click(function(){
                            $(p.tack_dialog).remove();
                            $(p.all).css('cursor', '')
                            p.dragging = false;
                            poster_editor.lock_opts = false;
                            p.post(this.getAttribute('color'));
                            setTimeout(function(){
                                $('#add_button').fadeIn(500)
                            }, 2000);
                        });
                    $(opt).append(tack)
                    $(p.tack_options).append(opt);
                                    }
    });
    poster_editor.drag_handler.attach(p.all);
    $(poster_editor).hide();
    poster_editor.lock_opts = true;
    $('#add_button').hide();
    editor();
}

poster_editor = {
    'html': function(){
        var body = $('#edit_me-wysiwyg-iframe')[0].contentDocument.getElementsByTagName('body')[0].innerHTML,
            urls = [ ],
            emails = [ ];

        urls = body.match(/[\w\d\.\/\:\@]+\.(com|net|org|info|me|mobi|co.uk|co|in|us|ca)[^\<]+/gi);
        emails = body.match(/[\w\d\.\-\_\:]+\@[\w\d\.\-\_\:]+\.(com|net|org|info|me|mobi|co.uk|co|in|us|ca|edu)/gi);
        
        for (var u in urls){
            var x = urls[u],
                    url;
            if (x.indexOf('@') > -1){
                continue;
            }
            if (x.indexOf('http://') > -1){
                url = x;
            } else {
                url = 'http://' + x;
            }
            body = body.replace(x, '<a href="' + url + '" target="_newtab">' + x + '</a>');
        }
        
        for (var e in emails){
            x = emails[e];
            body = body.replace(x, '<a href="mailto:' + x + '" target="_newtab">' + x + '</a>');
        }

        return body

    

    },
    'clean_up': function(input){
        var html = input || this.html(),
            tags = ['<a.*</a>', '<script.*</script>', '<img.*/>', '<span.*</span>', '<div[^>].*</div>'];
            for (var t in tags){
                var r = new RegExp(tags[t], 'gi');
                while (html.match(r)){
                    html = html.replace(html.match(r)[0], '')
                }
            }
            $('#edit_me-wysiwyg-iframe')[0].contentDocument.getElementsByTagName('body')[0].innerHTML = html;
    }
    ,
    'hide': function(){
        $('#edit_me-wysiwyg-iframe')[0].contentDocument.getElementsByTagName('body')[0].style.display = 'none';
        $('#editable_poster').css('background', 'none')
    },
    'lock_opts': false,
    'HTML_cache': '',
}

// Let's rock this joint
$(document).ready(function(){
    // GLOBAL VARIABLES OOOH I'M A BAD DEVELOPER
    window.all_posters = [];
    window.all_tacks = [];
    window.ignore_stats = false;
    window.user_interacted = false;
    window.statuses = { };
    
    // Load all posters (JSON)
    ajax.all();

    // Set up poster editor with toggle var
    new_post_editor = { open: false };

    // Preload peeled-up page graphic
    preload(['/static/img/peek_behind.png'], 0);    

    // Initialize wysiwyg plug-in
    $('#edit_me').wysiwyg();

    $('#editor').append(create('div', {id: 'close_button'}));
    $('#editor').append(create('div', {id: 'save_button'}));

    // Set up editor buttons
    $('#save_button').click(function(){ draggable_poster(); });
    $('#close_button').click(function(){ editor(); });

    // No paste into poster composer
//    $(document).bind('paste', function(e){ poster_editor.clean_up(); });

    // Build and set up tear confirmation window
    tear_confirm = create('div', { className: 'tear_conf' });
    var prompt = create('div', { className: 'tear_conf_prompt' }, '<b>Permanently</b> remove?');
    var yes = create('div', { className: 'tear_opt_yes' }, 'Remove');
    var no = create('div', { className: 'tear_opt_no' }, 'Cancel');
    $(yes).click(function(){ window['poster_' + tear_confirm.getAttribute('armed')].tear(); });
    $(no).click(function(){ window['poster_' + tear_confirm.getAttribute('armed')].unarm_tear(); });
    $(tear_confirm).append(prompt).append(yes).append(no);

    // Append it and keep it hidden
    $('body').append(tear_confirm);

    // Put the categories dropdown in the correct position
    $('#category_dropdown').css('left', $('#tackboard_logo').width() + $('#board_name').width() + 52 + 'px' )
    
    // Set up the dropdown button
    $('#category_dropdown_button').unbind().mouseover(function(){
        keep_categories = true;
        $(this).addClass('category_hover');      
        $('#category_dropdown').css('display', 'inline-block');
    }).mouseout(function(){
        keep_categories = false;
        setTimeout(function(){
            if (!keep_categories){
                $('#category_dropdown').hide();
                $('#category_dropdown_button').removeClass('category_hover');      
            }
        }, 200);
    });

    // Set up the dropdown itself
    $('#category_dropdown').mouseover(function(){
        keep_categories = true;
    }).mouseout(function(){
        keep_categories = false;
        setTimeout(function(){
            if (!keep_categories){
                $('#category_dropdown').hide();
                $('#category_dropdown_button').removeClass('category_hover');      
            }
        }, 200);
    });

    if (document.location.hash){
        ajax.reference('Permalink read');
    }

    $(window).hashchange(function(){
        read_hash();
    });
  

    // Finish by lighting the fuse on the UI flashing event
    flash_UI();

}).keydown(function(e){
    if (e.which == 192){
        ignore_stats = true; // Ignore me key, for testing
    }
});

// Read the URL hash, switch category if applicable
read_hash = function(){
    var hash = document.location.hash.substring(1);
    if (hash === ''){
        ajax.switch(default_category, false);
    }
    for (var c in categories){
        var cat = categories[c].toLowerCase().match(/\w+/gi).join('');
        if (cat == hash && categories[c] != current_category){
            ajax.switch(categories[c]);
        }
    }
}

// Flash dat UI, help people know you can do shit
flash_UI = function(){
    setTimeout(function(){
        if (window.user_interacted){
            return
        }
        window.noage = true;
        $('.lifted_corner').each(function(){
            $(this).show();
        });
        $('.poster_age').each(function(){
            $(this).hide();
        });
        $('.tear_button').each(function(){
            $(this).css('background-position', '0px -37px').show();
        });
        $('.poster_page').each(function(){
            $(this).css('background-position', '0px -316px');
        });
    }, 3000);
    setTimeout(function(){
        window.noage = false;
        $('.lifted_corner').each(function(){
            $(this).hide();
        });
        $('.tear_button').each(function(){
            $(this).css('background-position', '').hide();
        });
        $('.poster_page').each(function(){
            $(this).css('background-position', '');
        });
    }, 3800);
}

// Toggles and sets up the editor
editor = function(){
    window.user_interacted = true;
    if (!new_post_editor.open){
        $('#edit_me-wysiwyg-iframe').show();
        $('#edit_me-wysiwyg-iframe')[0].contentDocument.getElementsByTagName('body')[0].innerHTML = '';
        $('#editor').animate({'bottom': '+=530px'}, 450, 'easeOutElasticMinimal');
        $('#close_button').animate({'bottom': '+=530px'}, 450, 'easeOutElasticMinimal');
        $('#save_button').animate({'bottom': '+=530px'}, 450, 'easeOutElasticMinimal');
        setTimeout(function(){
            $('#save_button').fadeIn(100)
            $('#close_button').fadeIn(100)
        }, 700);
        setTimeout(function(){
            new_post_editor.open = true;
        }, 300);
    } else {
        $('#close_button').animate({'bottom': '-=530px'}, 150, 'easeOutQuad').fadeOut(300);
        $('#save_button').animate({'bottom': '-=530px'}, 150, 'easeOutQuad').fadeOut(300);
        $('#editor').animate({'bottom': '-=530px'}, 150, 'easeOutQuad');
        setTimeout(function(){
            new_post_editor.open = false;
        }, 300);
    }
}

function init_paste(o) {
    var doc = o.contentWindow.document;
    if (doc.getElementsByTagName('body').length) {
        $(doc.body).bind('paste', function(e){
            return false;
        });
    }
} 

function help(){
    var chosen = all_posters.slice(all_posters.length - 1)[0],
        dialog = create('div', { className: 'help_dialog' }),
        dialog_text = create('div', { id: 'help_dialog_text_1' }),
        step = 0;

        $('body').append(dialog);
        $(dialog).append(dialog_text);

        ajax.reference('Opened help');

        if (chosen == undefined){
            c();
            step = 2;
        }

        if (new_post_editor.open){
            setTimeout(function(){
                help_steps(step, dialog, dialog_text, chosen);
            }, 300);
            editor();
        } else {
            help_steps(step, dialog, dialog_text, chosen);
        }
}   

function help_steps(i, dialog, dialog_text, chosen){
    var dialog_bank = [
            'Lift up posters to look underneath.<br><br><span id="click_to_continue">(click me to continue)</span>',
            'You can also take down posters if you have good reason.<br><br>(Spam, outdated, etc.)<br><br><span id="click_to_continue">(click me to continue)</span>',
            'You can add your <br>own poster here.<br><br><span id="click_to_continue">(click me to continue)</span>',
            'Switch between the different<br>categories available here. Have fun!<br><br><span id="click_to_continue">(click me to close)</span>'
            ],
        dialog_stage = i || 0;

        [(function(){
            var chosen_offset = $(chosen.all).offset();
            $(chosen.page).css('background-position', '0px -316px');
            $(chosen.lifted_corner).show();
            $(dialog).css({'left': chosen_offset.left + 250 + 'px', 'top': chosen_offset.top + 260 + 'px'});
            }),
         (function(){
            var chosen_offset = $(chosen.all).offset();
            $(chosen.lifted_corner).hide();
            $(chosen.tear_button).show().css('background-position', '0px -37px');
            $(chosen.page).css('background-position', '0px 0px');
            $(dialog).css({'top': chosen_offset.top - 34 + 'px'})
            }),
         (function(){
            var add_button_offset = $('#add_button').offset();
            if (chosen){
                $(chosen.tear_button).css('background-position', '');
            }
            $('#add_button').addClass('add_button_show');
            $(dialog).css({'top': add_button_offset.top - 5 + 'px', 'left': add_button_offset.left - 190 });
            }),
         (function(){
            var categories_dropdown_offset = $('#category_dropdown').offset(),
                categories_dropdown_width = $('#category_dropdown').width();
            $('#category_dropdown').css('display', 'inline-block');
            $('#category_dropdown_button').addClass('category_hover');
            $('#add_button').removeClass('add_button_show');
            $(dialog).css({'top': categories_dropdown_offset.top + 60 + 'px', 'left': categories_dropdown_offset.left + categories_dropdown_width + 460 + 'px' });
         }),
         (function(){
            setTimeout(function(){
                $('#category_dropdown').fadeOut(200);
                $('#category_dropdown_button').removeClass('category_hover');
            }, 200);
            $(dialog).remove();
            ajax.reference('Finished help');
         })
         ][dialog_stage]();

        if (dialog_stage == 4){ // End
            return;
        }

        dialog.id = 'help_dialog_' + dialog_stage;
        dialog_text.id = 'help_dialog_text_' + dialog_stage;
        dialog_text.innerHTML = dialog_bank[dialog_stage];
    
        $(dialog).append(dialog_text).hide().unbind().click(function(){
            help_steps(dialog_stage + 1, dialog, dialog_text, chosen);
        });
        setTimeout(function(){
            $(dialog).fadeIn(140)
        }, 100);
}

  

function init_loader(){
    $('#l1').attr('active', true);
    $('#l2').attr('active', false);
    $('#l3').attr('active', false);
    loader_direction = 'r';
}

function loader_step(){
    var left = {'l1': ['l4', 'l3', 'l2'], 'l2': ['l1', 'l4', 'l3'], 'l3': ['l2', 'l1', 'l4'], 'l4': ['l3', 'l2', 'l3']},
        right = {'l1': ['l4', 'l3', 'l2'], 'l2': ['l1', 'l4', 'l3'], 'l3': ['l2', 'l1', 'l4'], 'l4': ['l3', 'l2', 'l1']},
        right = 
        active = $('[active=true]')[0];
    $(active).attr('active', false).css('background', 'rgba(0,0,0,0.26)');
    $('#' + left[active.id][2]).attr('active', true).css('background', 'rgba(0,0,0,0.35)');
    $('#' + left[active.id][1]).css('background', 'rgba(0,0,0,0.1)');
    $('#' + left[active.id][0]).css('background', 'rgba(0,0,0,0.2)');

    if (active.id == 'l4'){
        loader_dir = 'l';
    } else if (active.id == 'l1'){
        loader_dir = 'r';
    }

}
