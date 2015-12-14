#!/usr/bin/env coffee

## Requires ####################################################################

fs = require "fs"
readline = require "readline"

args = require( "yargs" )

	.usage( """
		Usage: $0 [options] [file]
		Parses tab delimited records in the form: FROM    TO      AMOUNT

		If file is not given, standard input is used.
		""" )
	.options(
		p:
			alias: "precision"
			default: 2
			describe: "Decimals of precision to use in calculations"
			type: "integer"
	)
	.help( "help" )
	.version( -> require( "../package" ).version )

	.check( ( args, opts ) ->
		if typeof args.p != "number" or args.p % 1 != 0
			throw "The Precision argument must be an integer!
				(p: #{args.p})"

		return true
	)
	.argv

## Parse #######################################################################

parseInput = ( next ) ->
	input = ""

	if args._[0]
		# Read from file
		fs.readFile( args._[0], "utf8", ( err, data ) ->
			if err
				console.error err.message
				process.exit 1
			next( data )
		)
	else
		# Read from stdin
		stream = readline.createInterface(
			input: process.stdin
			output: process.stdout
		)

		stream.on "line", ( line ) ->
			input += line + "\n"

		stream.on "close", ->
			next( input )

createGraph = ( text ) ->
	output = {}

	for line_raw, line_n in text.split( "\n" )
		line = line_raw.trim()

		# Discard empty lines
		if line == ""
			continue

		# Extract 3 values
		vals = line.match /^(\S+)\s+(\S+)\s+(\S+)$/
		if not vals
			console.error """
				Malformed line on line #{line_n}:
				#{line_raw}
			"""
			process.exit 1

		# Test 3rd value is numeric
		if isNaN( parseFloat( vals[3] ) )
			console.error """
				Malformed number on line #{line_n}:
				#{line_raw}
			"""
			process.exit 1

		# Create Graph Arc
		output[ vals[1] ] ?= {}
		output[ vals[1] ][ vals[2] ] ?= 0
		output[ vals[1] ][ vals[2] ] += parseFloat( vals[3] )

	return output

PRECISION = Math.pow( 10, args.p )

resolveGraph = ( graph ) ->

	# Calculate net worth of all nodes
	values = {}
	for debtor, creditors of graph
		for creditor, value of creditors
			values[ debtor ] ?= 0
			values[ creditor ] ?= 0

			values[ debtor ] -= parseInt( value * PRECISION )
			values[ creditor ] += parseInt( value * PRECISION )

	# Zero-sum all node values
	output = {}
	for debtor, debt of values
		# Only zero-sum nodes in debt
		if debt >= 0
			continue

		debt = -debt
		for creditor, value of values
			# Only attach negative value nodes to positive value nodes
			if value <= 0
				continue

			if value >= debt
				# Debtor completely clear
				values[ creditor ] -= debt
				values[ debtor ] = 0

				output[ debtor ] ?= {}
				output[ debtor ][ creditor ] = debt / PRECISION
			else
				# Creditor out of credit
				values[ creditor ] = 0
				values[ debtor ] += value

				output[ debtor ] ?= {}
				output[ debtor ][ creditor ] = value / PRECISION

			debt = -values[ debtor ]
			if debt == 0
				break

		if debt != 0
			console.error "Non-negative final debt for #{debtor}!"
			process.exit 2

	return output

outputGraph = ( graph ) ->
	for debtor, creditors of graph
		for creditor, value of creditors
			console.log debtor, "\t", creditor, "\t", value

parseInput( ( input ) ->
	graph = createGraph( input )
	graph = resolveGraph( graph )
	outputGraph( graph )
)
