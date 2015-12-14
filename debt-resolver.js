#!/usr/bin/env node
(function() {
  var PRECISION, args, createGraph, fs, outputGraph, parseInput, readline, resolveGraph;

  fs = require("fs");

  readline = require("readline");

  args = require("yargs").usage("Usage: $0 [options] [file]\nParses tab delimited records in the form: FROM    TO      AMOUNT\n\nIf file is not given, standard input is used.").options({
    p: {
      alias: "precision",
      "default": 2,
      describe: "Decimals of precision to use in calculations",
      type: "integer"
    }
  }).help("help").version(function() {
    return require("../package").version;
  }).check(function(args, opts) {
    if (typeof args.p !== "number" || args.p % 1 !== 0) {
      throw "The Precision argument must be an integer! (p: " + args.p + ")";
    }
    return true;
  }).argv;

  parseInput = function(next) {
    var input, stream;
    input = "";
    if (args._[0]) {
      return fs.readFile(args._[0], "utf8", function(err, data) {
        if (err) {
          console.error(err.message);
          process.exit(1);
        }
        return next(data);
      });
    } else {
      stream = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      stream.on("line", function(line) {
        return input += line + "\n";
      });
      return stream.on("close", function() {
        return next(input);
      });
    }
  };

  createGraph = function(text) {
    var base, i, len, line, line_n, line_raw, name, name1, output, ref, vals;
    output = {};
    ref = text.split("\n");
    for (line_n = i = 0, len = ref.length; i < len; line_n = ++i) {
      line_raw = ref[line_n];
      line = line_raw.trim();
      if (line === "") {
        continue;
      }
      vals = line.match(/^(\S+)\s+(\S+)\s+(\S+)$/);
      if (!vals) {
        console.error("Malformed line on line " + line_n + ":\n" + line_raw);
        process.exit(1);
      }
      if (isNaN(parseFloat(vals[3]))) {
        console.error("Malformed number on line " + line_n + ":\n" + line_raw);
        process.exit(1);
      }
      if (output[name = vals[1]] == null) {
        output[name] = {};
      }
      if ((base = output[vals[1]])[name1 = vals[2]] == null) {
        base[name1] = 0;
      }
      output[vals[1]][vals[2]] += parseFloat(vals[3]);
    }
    return output;
  };

  PRECISION = Math.pow(10, args.p);

  resolveGraph = function(graph) {
    var creditor, creditors, debt, debtor, output, value, values;
    values = {};
    for (debtor in graph) {
      creditors = graph[debtor];
      for (creditor in creditors) {
        value = creditors[creditor];
        if (values[debtor] == null) {
          values[debtor] = 0;
        }
        if (values[creditor] == null) {
          values[creditor] = 0;
        }
        values[debtor] -= parseInt(value * PRECISION);
        values[creditor] += parseInt(value * PRECISION);
      }
    }
    output = {};
    for (debtor in values) {
      debt = values[debtor];
      if (debt >= 0) {
        continue;
      }
      debt = -debt;
      for (creditor in values) {
        value = values[creditor];
        if (value <= 0) {
          continue;
        }
        if (value >= debt) {
          values[creditor] -= debt;
          values[debtor] = 0;
          if (output[debtor] == null) {
            output[debtor] = {};
          }
          output[debtor][creditor] = debt / PRECISION;
        } else {
          values[creditor] = 0;
          values[debtor] += value;
          if (output[debtor] == null) {
            output[debtor] = {};
          }
          output[debtor][creditor] = value / PRECISION;
        }
        debt = -values[debtor];
        if (debt === 0) {
          break;
        }
      }
      if (debt !== 0) {
        console.error("Non-negative final debt for " + debtor + "!");
        process.exit(2);
      }
    }
    return output;
  };

  outputGraph = function(graph) {
    var creditor, creditors, debtor, results, value;
    results = [];
    for (debtor in graph) {
      creditors = graph[debtor];
      results.push((function() {
        var results1;
        results1 = [];
        for (creditor in creditors) {
          value = creditors[creditor];
          results1.push(console.log(debtor, "\t", creditor, "\t", value));
        }
        return results1;
      })());
    }
    return results;
  };

  parseInput(function(input) {
    var graph;
    graph = createGraph(input);
    graph = resolveGraph(graph);
    return outputGraph(graph);
  });

}).call(this);
