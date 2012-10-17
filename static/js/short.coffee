c = (x) ->
    console.log if x? then x else '!'

create = (a, b, c, d) ->
    x = document.createElement(a)
    for key, value of b
        x[key] = value
    x.innerHTML = c if c?
    if d?
        for child in d
            x.appendChild(child)
    x

appendobj = (a) ->
    for b in a
        b[0].appendChild(b[1])

preload = (urls, i) ->
    i = 0 if not i?
    img = new Image()
    return if i == urls.length
    img.onload = ->
        preload(urls, i + 1)
    img.src = urls[i]

# Export
window.c = c
window.create = create
window.appendobj = appendobj
window.preload = preload
