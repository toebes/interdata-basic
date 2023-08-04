# Basic Language Syntax

Full documentation found at [bitsavers.org](http://www.bitsavers.org/pdf/interdata/lang/29-338r03_BASIC_Lang_Ref_Jan75.pdf)

## System Functions

* `SIN(`[&lt;expr&gt;](#expressions)`)`
* `COS(`[&lt;expr&gt;](#expressions)`)`
* `TAN(`[&lt;expr&gt;](#expressions)`)`
* `ATN(`[&lt;expr&gt;](#expressions)`)`
* `LOG(`[&lt;expr&gt;](#expressions)`)`
* `EXP(`[&lt;expr&gt;](#expressions)`)`
* `SQR(`[&lt;expr&gt;](#expressions)`)`
* `ABS(`[&lt;expr&gt;](#expressions)`)`
* `INT(`[&lt;expr&gt;](#expressions)`)`
* `RND(`[&lt;expr&gt;](#expressions)`)` &mdash; Parameter Ignored
* `NOT(`[&lt;expr&gt;](#expressions)`)`
* `SGN(`[&lt;expr&gt;](#expressions)`)`
* `LEN(`[&lt;expr&gt;](#expressions)`)` &mdash; String expressions only
* `EOF(`[&lt;expr&gt;](#expressions)`)` &mdash; Parameter Ignored
* `VAL(`[&lt;expr&gt;](#expressions)`)` &mdash; String expressions only
* `STR$(`[&lt;expr&gt;](#expressions)`)`
* `ERR$(`[&lt;expr&gt;](#expressions)`)` &mdash; Parameter Ignored
* `ERL(`[&lt;expr&gt;](#expressions)`)` &mdash; Parameter Ignored

## Variables

1. \[`A`-`Z`]\[`0`-`9`]? &mdash;  Simple variable
2. \[`A`-`Z`]\[`0`-`9`]? `$` &mdash;  String variable
3. \[`A`-`Z`]\[`0`-`9`]? `(`[&lt;expr&gt;](#expressions) [ `,` [&lt;expr&gt;](#expressions)]`)` &mdash; Array variable
4. \[`A`-`Z`]\[`0`-`9`]? `$(`[&lt;expr&gt;](#expressions) [ `,` [&lt;expr&gt;](#expressions)]`)` &mdash; String Array variable

## Reference Elements

1. [&lt;var&gt;](#variables) &mdash; [Any variable](#variables)
2. \[`A`-`Z`]\[`A`-`Z`]\[`A`-`Z`]`(`[&lt;expr&gt;](#expressions)`)` &mdash;  [System Function](#system-functions)
3. `FN`\[`A`-`Z`]`(`\[`A`-`Z`]`)` &mdash; User defined function
4. `"`.*`"` &mdash; String Literal
5. \[`0`-`9`]* `.`?\[`0`-`9`]\[`E` `-`? \[`0`-`9`]+] &mdash; Numberic constant

## Expressions

Listed in order of precedence

1. Reference Element
2. (`+`|`-`) [&lt;expr&gt;](#expressions) &mdash; Unary plus/minus
3. [&lt;expr&gt;](#expressions) `^` [&lt;expr&gt;](#expressions) &mdash; Raised to power
4. [&lt;expr&gt;](#expressions) (`*`|`/`) [&lt;expr&gt;](#expressions) &mdash; Multiplication/Division
5. [&lt;expr&gt;](#expressions) (`+`|`-`) [&lt;expr&gt;](#expressions) &mdash; Addition/Subtraction
6. [&lt;expr&gt;](#expressions) (`=`|`<`|`>`|`<=`|`>=`|`<>`) [&lt;expr&gt;](#expressions) &mdash; Relational
7. [&lt;expr&gt;](#expressions) `AND` [&lt;expr&gt;](#expressions) &mdash; Boolean AND
8. [&lt;expr&gt;](#expressions) `OR` [&lt;expr&gt;](#expressions) &mdash; Boolean OR

## Statements

### `BSP`         &mdash; Backspace a device

`BSP` \[&lt;logical-unit&gt;](#expression)

### `CALL`        &mdash; Call an assembly language subroutine

`CALL` [&lt;integer-subroutine-id&gt;](#expressions) \[ `,` [&lt;parameter&gt;](#expressions) \]*

### `DATA`        &mdash; Define a block of user data values

`DATA` [&lt;constant&gt;](#expressions) \[ `,` [&lt;constant&gt;](#expressions) \]*

### `DEF`         &mdash; Define a user function

`DEF FN`\[`A`-`Z`] `(`\[`A`-`Z`]`)` `=` [&lt;expr&gt;](#expressions)

Note that the dummy variable may appear in the expression.  Expressions can only be numberic and the result is numeric

### `DIM`         &mdash; Dimension arrays, string variables, and string arrays

`DIM` &lt;array variable&gt;[`,` &lt;array variable&gt;]*

### `END`         &mdash; Optional terminator of program

`END`

### `ENDTRACE`    &mdash; End trace of a running program

`ENDTRACE`

### `FOR`         &mdash; Set up a programming loop

`FOR` [&lt;control-var&gt;](#variables) `=` [&lt;expr&gt;](#expressions) `TO` [&lt;expr&gt;](#expressions) [`STEP` [&lt;expr&gt;](#expressions)]

### `GOSUB`       &mdash; Transfer to an internal subroutine

`GOSUB` [&lt;expr&gt;](#expressions)

Note that the expression must be a numberic value (integerized by the `INT` function if necessary)

### `GOTO`        &mdash; Transfer control to a program statement

`GO` `TO`  [&lt;expr&gt;](#expressions)

Note that the expression must be a numberic value (integerized by the `INT` function if necessary)

### `IF`          &mdash; Conditional transfer to another part of the program; or conditional execution of a statement

`IF` [&lt;expr&gt;](#expressions) [`GO` `TO`| `THEN`]  [&lt;statement-number&gt;](#expressions)

`IF` [&lt;expr&gt;](#expressions) `THEN`  [&lt;statement&gt;](#statements)

### `INPUT`       &mdash; Request data from an input device

`INPUT` [&lt;variable&gt;](#variables) [ `,` [&lt;variable&gt;](#variables) ]*

`INPUT` `ON` ([&lt;logical-unit&gt;](#expressions)) [&lt;variable&gt;](#variables) [ `,` [&lt;variable&gt;](#variables) ]*

`INPUT` `ON` ([&lt;logical-unit&gt;](#expressions) `,` [&lt;record-number&gt;](#expressions)) [&lt;variable&gt;](#variables) [ `,` [&lt;variable&gt;](#variables) ]*

### `LET`         &mdash; Assign values to variables

(`LET`)? [&lt;var&gt;](#variables) `=` [&lt;expr&gt;](#expressions)

Note that the `LET` is optional.

### `MAT`         &mdash; Matrix operations

#### `MAT`` READ A, B, &mdash; Read DATA values for previously dimensioned arrays

#### MAT INPUT A, B, &mdash; Input values for previously dimensioned arrays

#### MAT PRINT A, B, &mdash; Print current values of previously dimensioned arrays. (The semi-colon print delimiter can also be used. )

#### MAT A = B &mdash; Matrix A is dimensioned to the dimensions of matrix B and the values of B are stored into A

#### MAT A = B + C &mdash; Add or subtract matrices B and C. The dimensions of Band C must be identical. Dimension A to the dimensions of B and C and store the result into A

#### MAT A = B - C &mdash;

#### MAT A = B * C &mdash; Matrix multiply B and C. Dimension A to the dimensions of the resulting matrix and store the values into A. The dimensions of B and C must be compatible as defined later in the section on matrix multiplication

#### MAT A = (expression) * B &mdash; Scalar multiply matrix B by the parenthesized expression. Dimension A to the dimensions of B and store the values into A

#### MAT A = INV(B) &mdash; Invert matrix B. Dimension A to the dimensions of Band store the values of the inverse matrix into A. B must be a square matrix

#### MAT A = TRN(B) &mdash; Transpose matrix B. Dimension A to the dimensions of the resulting matrix and store the values into A. A and B must be two distinct arrays

#### MAT A = (expression) &mdash; Store a constant value in all elements of A

#### MAT A = IDN &mdash; Store the identity matrix in A

#### MAT A = DET &mdash; Store the determinant of matrix A into element A (0, 0) of array A

### `NEXT`        &mdash; Terminate programming loop

`NEXT` [&lt;control-var&gt;](#variables)

### `ON`          &mdash; Provide a series of possible transfer points

`ON` [&lt;expr&gt;](#expressions) [`GO` `TO`|`THEN`|`GOSUB`] [&lt;statement-number&gt;](#expressions) [ `,` [&lt;statement-number&gt;](#expressions)]

`ON` `ERROR` [`GO` `TO`|`THEN`] [&lt;statement-number&gt;](#expressions)

### `PRINT`       &mdash; Write data to an output device

`PRINT` [&lt;expr&gt;](#expressions) [  (`,`|`;`) [&lt;expr&gt;](#expressions) ]* (`,`|`;`)?

Note: a semicolon `;` is an alias for `PRINT`

`PRINT` `ON` ([&lt;logical-unit&gt;](#expressions)) [&lt;expr&gt;](#expressions) [  (`,`|`;`) [&lt;expr&gt;](#variables) ]* (`,`|`;`)?

`PRINT` `ON` ([&lt;logical-unit&gt;](#expressions) `,` [&lt;record-number&gt;](#expressions)) [&lt;expr&gt;](#expressions) [  (`,`|`;`) [&lt;expr&gt;](#expressions) ]* (`,`|`;`)?

### `PRINT USING`       &mdash; Write data to an output device

`PRINT` `USING` [&lt;format-string&gt;](#expressions) [&lt;expr&gt;](#expressions) [  `,` [&lt;expr&gt;](#expressions) ]*

`PRINT` `USING` [&lt;format-string&gt;](#expressions) `ON` ([&lt;logical-unit&gt;](#expressions)) [&lt;expr&gt;](#expressions) [ `,` [&lt;expr&gt;](#expressions) ]*

`PRINT` `USING` [&lt;format-string&gt;](#expressions) `ON` ([&lt;logical-unit&gt;](#expressions) `,` [&lt;record-number&gt;](#expressions)) [&lt;expr&gt;](#expressions) [ `,` [&lt;expr&gt;](#expressions) ]*

### `RANDOM`      &mdash; Reinitialize random number generator

`RANDOM`

### `READ`        &mdash; Input data from the DATA block

`READ` [&lt;variable&gt;](#variables) \[ `,` [&lt;variable&gt;](#variables) \]*

### `REM`         &mdash; Comment

`REM` .*

### `RESTORE`     &mdash; Reinitialize data block

`RESTORE`

### `RETURN`      &mdash; Return from an internal subroutine

`RETURN`

### `REW`         &mdash; Rewind a device

`REW` \[&lt;logical-unit&gt;](#expression)

### `SETTRACE`    &mdash; Start trace of a running program

`SETTRACE`

### `STOP`        &mdash; Halt program execution and switch to keyboard mode

`STOP`

### `WFM`         &mdash; Write a file mark to a device

`WFM` \[&lt;logical-unit&gt;](#expression)

## Tokens

```text
^
*
/
+
-
=
<
>
<=
>=
<>
AND
OR
BSP
CALL
,
DATA
DEF
FN?
DIM
END
ENDTRACE
FOR
TO
STEP
GOSUB
GOTO
IF
THEN
INPUT
ON
LET
MAT
READ
MAT
INPUT
MAT
PRINT
MAT
MAT
MAT
MAT
MAT
MAT
INV
TRN
IDN
DET
NEXT
ON
GOTO
THEN
GOSUB
ON
ERROR
GOTO
THEN
PRINT
;

USING
READ
REM
RESTORE
RETURN
REW
SETTRACE
STOP
WFM
```
