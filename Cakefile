## Requires ####################################################################

fs = require "fs"
coffeeScript = require "coffee-script"

## Tasks #######################################################################

FILE = "debt-resolver"

task "build", "Builds the JS file", ->
	file = fs.readFileSync( "#{FILE}.coffee", "utf8" )
	fs.writeFile( "#{FILE}.js",
		"#!/usr/bin/env node\n" +
		coffeeScript.compile( file )
	)
