# Tackboard DOM objects

# Main poster object

class poster
    constructor: (@data) ->
        me = @
        
        # Setting up variables
        for key, value of data
            @[key] = value
        @dragging = this.lifted = false
        @tack_color = if data.tack_color? then data.tack_color else 'B'

        # Building objects
        # Starting with the main "all" object
        @all = create 'div',
            className: 'poster_all'
            id: 'poster_' + data.id

        $(@all).attr 'pid', data.id if data.id?
        $(@all).css(
            'left':    data.x + 'px'
            'bottom':  data.y + 'px'
            'z-index': data.id
        )
            .mouseover(->
                if not me.lifted and not me.dragging
#                if not noage and not me.lifted and not me.dragging
                    window.user_interacted = yes
                    $(me.age_div).show()
                    $(me.tear_button).show()
                    return true
            )
            .mouseout(->
                $(me.age_div).hide()
                $(me.tear_button).hide()
            )
        # The rest
        @page = create 'div',
            className: 'poster_page'
        @body = create 'div',
            className: 'poster_text'
        , data.body
        @tack = create 'div',
            className: 'poster_tack'
        $(@tack).css(
            'background-color': tack_colors[@tack_color]
        )

        # Put everything together
        appendobj [
            [@all, @page]
            [@all, @body]
            [@all, @tack]
        ]

        if data.id isnt 1000000
            window['poster_' + data.id] = @

        return @

    lift: ->
        me = @
        @lifted = yes

        $([@lift_button, this.age_div, this.lifted_corner, this.tear_button, this.body]).each(->
            $(@).hide()
        )

        $(@unlift_button).show()

        $(@page).attr('class', 'poster_page_lifted')
            .animate(
                'bottom': '+=7px'
            , 0)
            .css(
                'background-position': '0px 0px'
            )

        $(@tack).animate(
                'bottom': '-=261px'
            , 0)

        $(@all).animate(
                'bottom':  '+=261px'
            , 0)
            .animate(
                'opacity': '0.65'
            , 500)
            .mouseover(->
                if me.lifted
                    $(@).animate(
                        'opacity': '1'
                    , 0)
            )
            .mouseout(->
                if me.lifted
                    $(@).animate(
                        'opacity': '0.65'
                    , 0)
            )
            .addClass('poster_all_lifted')
        true

    unlift: ->
        me = @
        @lifted = no

        $([@lift_button, this.tear_button, this.body]).each(->
            $(@).show()
        )

        $(@page).animate(
                bottom: '0px'
            , 0)
            .css('background-position', '0px 0px')
            .attr(class: 'poster_page')

        $(@all).animate(
                bottom: '-=261px'
                opacity: 1
            , 0)
            .removeClass('poster_all_lifted')

        $(@tack).animate(
                bottom: '+=261px'
            , 0)

        $(@unlift_button).hide()

        true
    
    tear: ->
        me = @
        
        if not @active
            return false

        if not do_ajax?
            ajax.tear(id: @id)

        @unarm_tear()
        $([@tear_button, @age_div]).each(->
            $(@).remove()
        )
        $([@lift_button, @lifted_corner]).each(->
            $(@).hide()
        )
        
        $(@all).css(
            'pointer-events': 'none'
        )

        setTimeout(->
            $([me.page, me.body]).each(->
                $(@).animate(
                    top: '+=100px'
                , 1500, 'easeOutExpo')
                .fadeOut(500)
            )
            setTimeout(->
                $(me.all).css(
                    width:  '0px'
                    height: '0px')
            , 2100)
        , 200)

        @active = no
        
        # Take this poster out of the all_posters list
        all_posters.splice(all_posters.indexOf(@), 1)

    arm_tear: ->
        me = @
        noage = yes
        offset = $(@all).offset()

        @unarm_others()
        $(@age_div).hide()
        $(tear_confirm).css
            top:  parseInt(offset.top)  - 10 + 'px'
            left: parseInt(offset.left) - 15 + 'px'
        .show()
        .attr(armed: me.id)

        $(@tear_fog).fadeIn(50)

    unarm_others: ->
        for p in all_posters
            if p isnt @
                $(p.tear_fog).fadeOut(50)
        
    unarm_tear: ->
        noage = no
        
        $(tear_confirm).fadeOut(100)
        $(@tear_fog).fadeOut(50)
    
    post: (animate_tack = no) ->
        me = @
        @lift_button = create 'div',
            className: 'lift_target'

        @unlift_button = create 'div',
            className: 'unlift_target'

        @lifted_corner = create 'div',
            className: 'lifted_corner'

        @tear_button = create 'div',
            className: 'tear_button'

        @tear_fog = create 'div',
            className: 'tear_fog'

        @age_div = create 'div',
            className: 'poster_age',
            @age
        
        $(@tear_button).click(->
            me.arm_tear()
        ).hide()

        $([@unlift_button, @.age_div, @.lifted_corner, @.lift_button, @.tear_button, @.tear_fog]).each(->
            $(me.all).append(@)
        )

        # Commit it to the target area
        $('#tackboard').append(@all)

        # Lifting tips on hover, and click handlers for the hotspots
        $(@lift_button).click(->
            me.lift()
        ).mouseover(->
            $(me.page).css
                'background-position': '0px -316px'
            $(me.lifted_corner).show()
        ).mouseout(->
            $(me.page).css
                'background-position': '0px 0px'
            $(me.lifted_corner).hide()
        )

        $(@unlift_button).click(->
            me.unlift()
        ).mouseover(->
            $(me.page).css
                'background-position': '0px -70px'
        ).mouseout(->
            $(me.page).css
                'background-position': '0px 0px'
        )
        
        if animate_tack
            $(@tack).hide()

            # Nice little animation for tack being pushed into the page
            setTimeout(->
                $(me.tack).css
                    background: tack_colors[me.tack_color]
                .animate(
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
            , 500)
        true

# Tack only object, for previously torn down posters

class tack_only
    constructor: (data) ->
        me = @
        @tack = create 'div',
            className: 'tack_only'
        $(@tack).css
            left:   data.x + 120 + 'px'
            bottom: data.y + 293 + 'px'
            'background-color': tack_colors[data.tack_color]
            'z-index': 1
        window['tack_' + data.id] = @

    post: ->
        $('#tackboard').append(@tack)


# Export
window.poster = poster
window.tack_only = tack_only
window.tack_colors =
    'B': '#41b2f2'
    'R': '#f23b4c'
    'G': '#32b221'
    'P': '#eb6e96'
    'W': '#c3c3c3'
