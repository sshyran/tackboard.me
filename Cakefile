fs     = require 'fs'
{exec} = require 'child_process'

app_files = ( 'static/js/' + b + '.coffee' for b in [ 'short', 'objects', 'tackboard' ] )


task 'build', 'Build project from .coffees in static/js to .js in static/js/build', ->
    app_contents = new Array remaining = app_files.length
    for file, index in app_files then do (file, index) ->
        fs.readFile file, 'utf8', (err, file_contents) ->
            throw err if err
            app_contents[index] = file_contents
            process() if --remaining is 0
    process = ->
        console.log 'Concatenating.'
        fs.writeFile 'static/js/build/production.coffee', app_contents.join('\n\n'), 'utf8', (err) ->
            throw err if err
            exec 'coffee --compile static/js/build/production.coffee', (err, stdout, stderr) ->
                throw err if err
                console.log stdout + stderr
                fs.unlink 'static/js/build/production.coffee', (err) ->
                    throw err if err
                    exec 'java -jar "/Users/artur/Useful/closure_compiler/compiler.jar" --js static/js/build/production.js --js_output_file static/js/build/production.min.js', (err, stdout, stderr) ->
                        throw err if err
                        console.log stdout + stderr
