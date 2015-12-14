# Debt Resolver

A command line utility to resolve debts.

Resolves redirected debts (`A -> B -> C`), as well as cyclic debts
(`A -> B -> C -> A`).

## Usage

`./debt-resolver.js [OPTIONS] [FILE]`

### Format

`FILE` is optional. If no filename is given, standard input is used instead.

Input should be lines in the format:
`DEBTOR CREDITOR VALUE`, with blank lines being ignored.

### Options

- `-p`, `--precision`
	- Specifies the digits of precision to use in calculating currency.
	  Defaults to 2.

## Examples

``` sh
$ ./debt-resolver.js
A B 4
B C 3
C D 1

X Y 2
Y Z 2
Z X 2
^D

A       B       1
A       C       2
A       D       1
```
