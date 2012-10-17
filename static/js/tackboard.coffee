### 
Global functions being imported

create
appendobj
preload
poster
tack_only

###

###
Global functions being used from within this doc

ajax
tackboard
poster_editor
###

# Tackboard nav and posting functions

$(document).ready(->
    # Export globals
    window.all_posters = [ ]
    window.all_tacks = [ ]
    window.statuses = { }
    window.ignore_stats = no
    window.user_interacted = no
    window.keep_categories = no

    # Load all posters and tacks for current view
    if document.location.hash
        read_hash(yes)
    else
        ajax.all()


    preload(['/static/img/peek_behind.png'], 0)

    # Load editor
    $('#edit_me').wysiwyg()

    $('#editor').append(create('div',
        id: 'close_button')
    ).append(create 'div',
        id: 'save_button')

    $('#save_button').click(->
        tackboard.draggable_poster()
    )
    $('#close_button').click(->
        toggle_editor()
    )

    $(document).bind('paste', (e) ->
        poster_editor.clean_up()
    )

    # Tear-down confirmation dialog

    tear_confirm = create 'div',
        className: 'tear_conf'
    prompt = create 'div',
        className: 'tear_conf_prompt',
        '<b>Permanently</b> remove?'
    yes_ = create 'div',
        className: 'tear_opt_yes',
        'Remove'
    no_ = create 'div',
        className: 'tear_opt_no',
        'Cancel'

    $(yes_).click(->
        window['poster_' + tear_confirm.getAttribute('armed')].tear()
    )
    $(no_).click(->
        window['poster_' + tear_confirm.getAttribute('armed')].unarm_tear()
    )
    $([prompt, yes_, no_]).each(->
        $(tear_confirm).append(@)
    )

    $('body').append(tear_confirm)

    window.tear_confirm = tear_confirm

    tackboard.reset_category_dropdown()

    # Category dropdown:

    $('#category_dropdown').css('left', $('#tackboard_logo').width() + $('#board_name').width() + 52 + 'px')

    # Bind listeners to the category button
    $('#category_dropdown_button').unbind()
        .mouseover(->
            window.keep_categories = yes
            $(@).addClass('category_hover')
            $('#category_dropdown').css(
                display: 'inline-block'
            )
        ).mouseout(->
            window.keep_categories = no
            setTimeout(->
                if not window.keep_categories
                    $('#category_dropdown').hide()
                    $('#category_dropdown_button').removeClass('category_hover')
            , 200)
        )

    # Almost the same thing here for the dropdown itself        
    $('#category_dropdown').unbind()
        .mouseover(->
            window.keep_categories = yes
        ).mouseout(->
            window.keep_categories = no
            setTimeout(->
                if not window.keep_categories
                    $('#category_dropdown').hide()
                    $('#category_dropdown_button').removeClass('category_hover')
            , 200)
        )
        
    # Init hash history
    $(window).hashchange(->
        read_hash(yes)
    )

    # Light fuse on UI flashing event
    flash_UI()
    
    true
)


# AJAX module
ajax =
    all: ->
        ajax_call = $.get('/ajax/active_posters?board_id=' + board_id + '&category=' + current_category)
        ajax_call.done((e) ->
            e = $.parseJSON(e)[0]
            for index, data of e
                p = if data.active then new poster(data) else new tack_only(data)
                p.post(no)
                if data.active
                    all_posters.push(p)
                else
                    all_tacks.push(p)
                statuses[index] = data.active
            tackboard.reset_category_dropdown()
        )
    post: (data, object) ->
        ajax_call = $.ajax(
            type: 'POST'
            url:  '/ajax/add_poster/'
            data:
                csrfmiddlewaretoken: csrf_token
                board_id:            board_id
                x:                   data.x
                y:                   data.y
                tack_color:          data.color
                body:                data.body
                category:            current_category
        )
        ajax_call.done((e) ->
            data = $.parseJSON(e)[1]
            object.id = data.id
            $(object.all).css(
                    'z-index': data.id
                )
                .attr(
                    'id':  'poster_' + data.id
                    'pid': data.id
                )
            statuses[data.id] = data.active
            window['poster_' + data.id] = object
            tackboard.reset_category_dropdown()

        )
    tear: (data) ->
        ajax_call = $.ajax(
            type: 'POST'
            url:  '/ajax/remove_poster/'
            data:
                csrfmiddlewaretoken: csrf_token
                poster_id:           data.id
        )
    update: ->
        ajax_call = $.get('/ajax/update/?board_id=' + board_id + '&category=' + current_category)
        ajax_call.done((e) ->
            update = $.parseJSON(e)[0]
            statuses = window.statuses
            for index, data of update
                if not statuses[index]?
                    ajax.add(index)
                else
                    if not statuses[index] == update[index]
                        window['poster_' + index].tear(no)
            window.statuses = update
        )
    add: (id) ->
        ajax_call = $.get('/ajax/retrieve_poster/?poster_id=' + id)
        ajax_call.done((e) ->
            data = $.parseJSON(e)[0]
            if data.active
                p = new poster(data)
                p.post(yes)
            else
                t = new tack_only(data)
                t.post()
        )

    switch: (category, change_url = yes, load_all = no) ->

        tackboard.clear_board()

        $('#category_dropdown_button').removeClass('category_hover')
            .text(category)
        
        $('#category_dropdown').hide()
            .empty()

        for c in categories when c isnt category
            $('#category_dropdown').append(
                $('<li onclick="ajax.switch($(this).text()); ajax.reference(\'Switched category\');">' + c + '</li>')
            )
            
        window.current_category = category
        
        ajax.all() if load_all

        if change_url
            document.location = '#' + category.toLowerCase().match(/\w+/gi).join('')
    
    reference: (action) ->
        return if ignore_stats
        
        ajax_call = $.ajax(
            type: 'POST'
            url:  '/ajax/reference_counter'
            data:
                csrfmiddlewaretoken: csrf_token
                action:              action
        )

tackboard =
    switch: (text) ->
        document.location = '#' + text.match(/\w+/gi).join('').toLowerCase()
    clear_board: ->
        $(p.all).remove() for p in all_posters
        $(t.tack).remove() for t in all_tacks
        window.all_posters = [ ]
        window.all_tacks = [ ]

    reset_category_dropdown: ->
        $('#category_dropdown').css('min-width', $('#category_dropdown_button').width() + 26 + 'px')

    draggable_poster: ->
        $('#edit_me-wysiwyg-iframe').hide()

        p = new poster(
            body:       poster_editor.html()
            x:          77
            y:          112
            id:         1000000
            tack_color: 'B'
            active:     yes
            age:        'just now'
        )
        p.body_html = poster_editor.html()

        p.post()

        $([p.tack, p.tear_button, p.lift_button]).each(->
            $(@).hide()
        )
        p.dragging = yes

        p.drag_icon = create 'div',
            className: 'drag_icon'
        p.tack_dialog = create 'div',
            className: 'tack_dialog_full'
        p.tack_prompt = create 'div',
            className: 'tack_prompt_1',
            'Drag your poster to where you want to post it.'
        p.tack_options = create 'div',
            className: 'tack_options'

        $(p.tack_dialog).append(p.tack_prompt)
        $(p.all).append(p.drag_icon)
            .append(p.tack_dialog)
            .css('cursor', 'pointer')
            # When the tack color choosing dialog comes up
            .one('mousedown', ->
                $(p.tack_prompt).text('Choose tack color to post.').attr('class', 'tack_prompt_2')
                $(p.tack_dialog).append(p.tack_options)

                for index, color of tack_colors
                    opt = create 'div',
                        className: 'tack_option'
                    tack = create 'div',
                        className: 'poster_tack'
                    $(tack).css(
                        top: '12px'
                        left: '12px'
                        background: tack_colors[index]
                    )

                    $(opt).attr(
                        color: index
                    ).mouseover(->
                        $('.tack_option').each(->
                            $(@).css(opacity: '0.25')
                        )
                        $(@).css(opacity: '1')
                    )
                    .mouseout(->
                        $('.tack_option').each(->
                            $(@).css(opacity: 1)
                        )
                    )
                    # Here is where the tack color is chosen
                    .click(->
                        $(p.tack_dialog).remove()
                        $(p.all).css(cursor: '')
                        p.dragging = no
                        poster_editor.lock_opts = no
                        
                        p.commit(@.getAttribute('color'))
                        setTimeout(->
                            $('#add_button').fadeIn(500)
                        , 2000)
                    )

                    $(opt).append(tack)
                    $(p.tack_options).append(opt)
            )
            poster_editor.drag_handler.attach(p.all)
            $(poster_editor).hide()
            poster_editor.lock_opts = yes

            $('#add_button').hide()
            toggle_editor()

        # Post function that runs when the poster is committed to the board
        p.commit = (color) ->
            me = @

            @x = parseInt($(p.all).css('left'))
            @y = parseInt($(p.all).css('bottom'))
            
            $(@drag_icon).fadeOut(100)
            $(@tear_button).hide()

            setTimeout(->
                 $(me.tack).css('background', tack_colors[color]).animate(
                    'width': '20px'
                    'height': '20px'
                    'left': '-=7px'
                    'bottom': '-=7px',
                    0
                    ).fadeIn(100).delay(400).animate(
                    'width': '6px'
                    'height': '6px'
                    'left': '+=7px'
                    'bottom': '+=7px',
                    200
                    )
                $(@.lift_button).show()

            , 500)

            ajax.post(
                x: @x
                y: @y
                color: color
                body: @body_html
            , @)

            all_posters.push(@)
            
            poster_editor.body().innerHTML = ''


            


poster_editor =
    html: ->
        body = $('#edit_me-wysiwyg-iframe')[0].contentDocument.getElementsByTagName('body')[0].innerHTML
        urls = [ ]
        emails = [ ]

        urls = body.match(/[\w\d\.\/\:\@]+\.(com|net|org|info|me|mobi|co.uk|co|in|us|ca|edu)/gi)
        emails = body.match(/[\w\d\.\-\_\:]+\@[\w\d\.\-\_\:]+\.(com|net|org|info|me|mobi|co.uk|co|in|us|ca|edu)/gi)
        
        if urls
            for x in urls
                if '@' in x
                    continue
                if 'http://' in x
                    url = x
                else
                    url = 'http://' + x
                body = body.replace(x, '<a href="' + url + '" target="_newtab">' + x + '</a>')

        if emails
            for e in emails
                body = body.replace(e, '<a href="mailto:' + e + '" target="_newtab">' + e + '</a>')
        
        body

    body: ->
        return $('#edit_me-wysiwyg-iframe')[0].contentDocument.getElementsByTagName('body')[0]

    clean_up: (input = this.html()) ->
        tags = ['<a.*</a>', '<script.*</script>', '<img.*/>', '<span.*</span>', '<div[^>].*</div>']
        for t in tags
            r = new RegExp(t, 'gi')
            while html.match(r)
                html = html.replace(html.match(r)[0], '')
        @body().innerHTML = html

    hide: ->
        # This happens right before the editor slides closed, to make it appear that the poster
        # has been lifted off the editor
        $(@body()).hide()
        $('#editable_poster').css('background', 'none')

    drag_handler:
        _me: null
        attach: (me) ->
            me.onmousedown = poster_editor.drag_handler._dragBegin
            me.dragBegin = new Function()
            me.drag = new Function()
            me.dragEnd = new Function()
            me
        _dragBegin: (e) ->
            me = poster_editor.drag_handler._me = @
            me.style.left = '0px' if isNaN(parseInt(me.style.left))
            me.style.bottom = '0px' if isNaN(parseInt(me.style.bottom))
            x = parseInt me.style.left
            y = parseInt me.style.bottom
            e = if e then e else window.event
            me.mouseX = e.clientX
            me.mouseY = e.clientY
            me.dragBegin me, x, y
            document.onmousemove = poster_editor.drag_handler._drag
            document.onmouseup = poster_editor.drag_handler._dragEnd
            false
        _drag: (e) ->
            return if not poster_editor.lock_opts
            me = poster_editor.drag_handler._me
            x = parseInt me.style.left
            y = parseInt me.style.bottom
            e = if e then e else window.event
            me.style.left = Math.max(Math.min(x + (e.clientX - me.mouseX), 929), 5) + 'px'
            me.style.bottom = Math.min(Math.max(y + (me.mouseY - e.clientY), 10), 364) + 'px'
            me.mouseX = e.clientX
            me.mouseY = e.clientY
            me.drag me, x, y
            false
        _dragEnd: ->
            me = poster_editor.drag_handler._me
            x = parseInt me.style.left
            y = parseInt me.style.bottom
            me.dragEnd me, x, y
            document.onmousemove = document.onmouseup = poster_editor.drag_handler._me = null
            

    lock_opts: no

    open: no
            

read_hash = (load_all = no) ->
    hash = document.location.hash.substring(1)
    if hash == ''
        ajax.switch(default_category, no, yes)
    for c in categories
        cat = c.toLowerCase().match(/\w+/gi).join('')
        if cat == hash
            if c isnt current_category
                ajax.switch(c, no, load_all)
            else
                ajax.all()

flash_UI = ->
    setTimeout(->
        return if window.user_interacted
        noage = yes
        $('.lifted_corner').each(->
            $(@).show()
        )
        $('.poster_age').each(->
            $(@).hide()
        )
        $('.tear_button').each(->
            $(@).css(
                'background-position': '0px -37px'
            )
            .show()
        )
        $('.poster_page').each(->
            $(@).css(
                'background-position': '0px -316px'
            )
        )
    , 3000)

    setTimeout(->
        return if window.user_interacted
        noage = no
        $('.lifted_corner').each(->
            $(@).hide()
        )
        $('.tear_button').each(->
            $(@).css(
                'background-position': ''
            )
            .hide()
        )

        $('.poster_page').each(->
            $(@).css(
                'background-position': ''
            )
        )
    , 3800)

toggle_editor = ->
    window.user_interacted = yes
    if not poster_editor.open
        $('#edit_me-wysiwyg-iframe').show()
        $('#editor, #close_button, #save_button').animate(
            bottom: '+=530px',
            450, 'easeOutElasticMinimal'
        )
        setTimeout(->
            $('#save_button, #close_button').fadeIn(100)
        , 700)

        setTimeout(->
            poster_editor.open = yes
        , 300)
    else
        $('#close_button, #save_button, #editor').animate(
            bottom: '-=530px',
            150, 'easeOutQuad'
        )
        $('#close_button, #save_button').fadeOut(300)
        
        setTimeout(->
            poster_editor.open = no
        , 300)
    
init_paste = (o) ->
    doc = o.contentWindow.document
    if doc.getElementsByTagName('body').length
        $(doc.body).bind('paste', ->
            false
        )

help = ->
    for x in [0..4]
        $("#help_dialog_#{x}").remove()

    chosen = all_posters[all_posters.length - 1]
    dialog = create 'div',
        className: 'help_dialog'
    dialog_text = create 'div',
        id: 'help_dialog_text_1'
    step = 0

    appendobj([
        [$('body')[0], dialog]
        [dialog, dialog_text]
    ])

    if not chosen?
        step = 2

    if poster_editor.open
        setTimeout(->
            help_steps(step, dialog, dialog_text, chosen)
        , 300)
    else
        help_steps(step, dialog, dialog_text, chosen)

help_steps = (dialog_stage = 0, dialog, dialog_text, chosen) ->
    dialog_bank = [
        'Lift up posters to look underneath.<br><br><span id="click_to_continue">(click me to continue)</span>'
        'You can also take down posters if you have good reason.<br><br>(Spam, outdated, etc.)<br><br><span id="click_to_continue">(click me to continue)</span>'
        'You can add your <br>own poster here.<br><br><span id="click_to_continue">(click me to continue)</span>'
        'Switch between the different<br>categories available here. Have fun!<br><br><span id="click_to_continue">(click me to close)</span>'
    ]
    
    [
        # 0
        ->
            chosen_offset = $(chosen.all).offset()
            $(chosen.page).css(
                'background-position': '0px -316px'
            )
            $(chosen.lifted_corner).show()
            $(dialog).css(
                left: chosen_offset.left + 250 + 'px'
                top:  chosen_offset.top + 260 + 'px'
            )
        # 1
        ->
            chosen_offset = $(chosen.all).offset()
            $(chosen.lifted_corner).hide()
            $(chosen.tear_button).show()
            .css(
                'background-position': '0px -37px'
                )
            $(chosen.page).css(
                'background-position': '0px 0px'
                )
            $(dialog).css(
                top: chosen_offset.top - 34 + 'px'
                )
        # 2
        ->
            add_button_offset = $('#add_button').offset()
            if chosen?
                $(chosen.tear_button).css(
                    'background-position', ''
                    )
            $('#add_button').addClass('add_button_show')
            $(dialog).css(
                top: add_button_offset.top - 5 + 'px'
                left: add_button_offset.left - 190
                )
        # 3
        ->
            categories_dropdown_offset = $('#category_dropdown').offset()
            categories_dropdown_width = $('#category_dropdown').width()
            $('#category_dropdown').css('display', 'inline-block')
            $('#category_dropdown_button').addClass('category_hover')
            $('#add_button').removeClass('add_button_show')
            $(dialog).css(
                top: categories_dropdown_offset.top + 60 + 'px'
                left: categories_dropdown_offset.left + categories_dropdown_width + 460 + 'px'
                )
        # 4
        ->
            setTimeout(->
                $('#category_dropdown').fadeOut(200)
                $('#category_dropdown_button').removeClass('category_hover')
            , 200)
            $(dialog).remove()
            
    ][dialog_stage].call(this)

    if dialog_stage == 4
        return true

    dialog.id = "help_dialog_#{dialog_stage}"
    dialog_text.id = "help_dialog_text_#{dialog_stage}"

    dialog_text.innerHTML = dialog_bank[dialog_stage]

    $(dialog).append(dialog_text)
        .hide()
        .click(->
            help_steps(dialog_stage + 1, dialog, dialog_text, chosen)
        )
    setTimeout(->
        $(dialog).fadeIn(140)
    , 100)
        
        


# Export
        
window.ajax = ajax
window.tackboard = tackboard
window.poster_editor = poster_editor
window.flash_UI = flash_UI
window.read_hash = read_hash
window.init_paste = init_paste
window.help = help
window.help_steps = help_steps
window.toggle_editor = toggle_editor
