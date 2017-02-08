# booleval

Logic expression evaluator.


This packages takes an string like `a & b` and calculates its truth table. It can handle expressions that contain errors such as 
missing closing parenthesis. It exports three functions: `evaluar`, `rpn`, and `leer`. It's meant to be used like this:

```js
const result_maybe = evaluar(rpn(leer('a & b')))
```

Because these functions can handle expressions with errors in them they return `reports`. Reports are objects with two properties: `error` and `resultado`.
If `error` is `true` then `resultado` contains information about the error found. Otherwise `resultado` contains the return of the function.

With that in mind, `result_maybe` contains either the truth table or the error found in the expression. Assuming there aren't any errors in the expression,
`result_maybe.resultado` is an object with two props: values and vars. `vars` is an array of type boolean[][] that has one entry for every row of the truth
table, and each one of those has the value of each variable for that row. Similarly, `values` (array of type boolean[]) contains the value of the expression
for every row.

I'm in the process of translating the source to English so using this package or reading the code should be easier in the future.