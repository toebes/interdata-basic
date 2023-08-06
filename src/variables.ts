/**
 * Copyright (c) 2023 John Toebes
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

export type ErrMsg = string | undefined;
export type VarString = { val: string; maxLen: number; curLen: number };
export type VarStringArray = {
    val: string[];
    maxLen: number;
    maxEntries: number;
};
export type VarNumber = number;
export type VarNumberArray = {
    values: number[];
    rows: number;
    columns: number;
    maxEntries: number;
};
export type FNDef = { parm: string; def: string };

export class Variables {
    protected stringMap: { [key: string]: VarString } = {};
    protected stringArrayMap: { [key: string]: VarStringArray } = {};
    protected numberMap: { [key: string]: VarNumber } = {};
    protected numberArrayMap: { [key: string]: VarNumberArray } = {};
    protected fnMap: { [key: string]: FNDef } = {};

    public New(): void {
        this.stringMap = {};
        this.stringArrayMap = {};
        this.numberMap = {};
        this.numberArrayMap = {};
        this.fnMap = {};
    }
    public DefFN(fn: string, parm: string, def: string): ErrMsg {
        this.fnMap[fn] = { parm: parm, def: def };
        return undefined;
    }
    public GetFN(fn: string): FNDef | undefined {
        return this.fnMap[fn];
    }
    /**
     * Dimension a String variable
     * @param variable Variable to be dimensioned
     * @param length Maximum length of variable
     * @returns Error message or undefined upon success
     */
    public DimString(variable: string, length: number): ErrMsg {
        const entry = this.stringMap[variable.toUpperCase()];
        if (entry !== undefined) {
            return `STRING VARIABLE ${variable.toUpperCase()} PREVIOUSLY DECLARED`;
        }
        this.stringMap[variable.toUpperCase()] = {
            val: '',
            maxLen: length,
            curLen: 0,
        };
        return undefined;
    }
    /**
     * Set a string variable to a value.  Note that the
     * string must have been previously DIMe
     * @param variable String variable to set
     * @param value New value to set
     * @returns Error message or undefined upon success
     */
    public setString(variable: string, value: string): ErrMsg {
        const entry = this.stringMap[variable.toUpperCase()];
        if (entry === undefined) {
            return `STRING VARIABLE ${variable.toUpperCase()} NOT DECLARED`;
        }
        if (value.length > entry.maxLen) {
            // Replacing all the characters, so just copy them over
            entry.val = value.substring(0, entry.maxLen);
            entry.curLen = entry.maxLen;
        } else {
            // Remember that we are overwriting character, but only to the length of the source string.
            // So if we started with
            // 10  DIM A$(50),B$(50)                 A$ val = "" curlen=0              B$ val=""  curlen=0
            // 100 LET A$ = "ABCDEF"                 A$ val = "ABCDEF"   curlen=6
            // 110 LET B$ = "1"                                                        B$ val="1"  curlen=1
            // 120 LET A$ (3, 3) = B$                A$ val = "AB1DEF"   curlen=3
            // 130 LET A$ (3, 6) = B$                A$ val = "AB1DEF"   curlen=3
            // 150 LET A$ (3, 6) = B$+B$+B$          A$ val = "AB111F"   curlen=5
            entry.val = value + entry.val.substring(value.length);
            entry.curLen = value.length;
        }
        return undefined;
    }
    /**
     * Update a part of a string variable
     * @param variable Variable to update
     * @param startIndex Starting index to replace characters (1 based)
     * @param endIndex Ending index to replace characters (1 based)
     * @param value New string to place
     * @returns Error message or undefined upon success
     */
    public setSubString(
        variable: string,
        startIndex: number,
        endIndex: number,
        value: string
    ): ErrMsg {
        const entry = this.stringMap[variable.toUpperCase()];
        if (entry === undefined) {
            return `STRING VARIABLE ${variable.toUpperCase()} NOT DECLARED`;
        }
        const start = Math.floor(startIndex);
        const end = Math.floor(endIndex);
        if (start > end) {
            return `START ${start} GREATER THAN END ${end} FOR STRING VARIABLE ${variable.toUpperCase()}`;
        }
        if (start <= 0 || start > entry.maxLen) {
            return `START ${start} OUT OF RANGE ${
                entry.maxLen
            } FOR STRING VARIABLE ${variable.toUpperCase()}`;
        }
        if (end <= 0 || end > entry.maxLen) {
            return `END ${end} OUT OF RANGE ${
                entry.maxLen
            } FOR STRING VARIABLE ${variable.toUpperCase()}`;
        }

        // We are replacing only part of the characters so the default string gets truncated
        entry.val =
            entry.val.substring(0, start - 1) +
            value +
            entry.val.substring(start - 1 + value.length);
        entry.curLen = start - 1 + value.length;
        return undefined;
    }
    /**
     * Get the value of a string variable
     * @param variable String variable to retrieve
     * @returns [Current string based on recorded length or undefined if not found, Error if any or undefined on success]
     */
    public getString(variable: string): [string, ErrMsg] {
        const entry = this.stringMap[variable.toUpperCase()];
        if (entry === undefined) {
            return [
                '',
                `STRING VARIABLE ${variable.toUpperCase()} NOT DEFINED`,
            ];
        }
        return [entry.val.substring(0, entry.curLen), undefined];
    }
    /**
     * Get a substring of a string variable
     * @param variable String variable to retrieve
     * @param startIndex Starting index
     * @param endIndex Ending index
     * @returns [Current string based on start/end or undefined if not found, Error if any or undefined on success]
     */
    public getSubString(
        variable: string,
        startIndex: number,
        endIndex: number
    ): [string | undefined, ErrMsg] {
        const entry = this.stringMap[variable.toUpperCase()];
        if (entry === undefined) {
            return [
                undefined,
                `STRING ARRAY VARIABLE ${variable.toUpperCase()} NOT DEFINED`,
            ];
        }
        const start = Math.floor(startIndex);
        const end = Math.floor(endIndex);
        if (start > end) {
            return [
                undefined,
                `START ${start} GREATER THAN END ${end} FOR STRING ARRAY VARIABLE ${variable.toUpperCase()}`,
            ];
        }
        if (start <= 0 || start > entry.maxLen) {
            return [
                undefined,
                `START ${start} OUT OF RANGE ${
                    entry.maxLen
                } FOR STRING VARIABLE ${variable.toUpperCase()}`,
            ];
        }
        if (end <= 0 || end > entry.maxLen) {
            return [
                undefined,
                `END ${end} OUT OF RANGE ${
                    entry.maxLen
                } FOR STRING VARIABLE ${variable.toUpperCase()}`,
            ];
        }
        return [entry.val.substring(start - 1, end), undefined];
    }
    /**
     * Dimension a string array variable
     * @param variable String Array Variable
     * @param maxLength Maximum length for any entry
     * @param entries Number of entries to create
     * @returns Error if any or undefined on success
     */
    public DimStringArray(
        variable: string,
        maxLength: number,
        entries: number
    ): ErrMsg {
        const entry = this.stringArrayMap[variable.toUpperCase()];
        if (entry !== undefined) {
            return `STRING ARRAY ${variable.toUpperCase()} PREVIOUSLY DECLARED`;
        }
        const maxEntries = Math.floor(entries);
        if (maxEntries < 1 || maxEntries > 255) {
            return `STRING ARRAY ${variable.toUpperCase()} DIMENSION ${entries} OUT OF RANGE`;
        }
        const maxLen = Math.floor(maxLength);
        if (maxLen < 1 || maxLen > 255) {
            return `STRING ARRAY ${variable.toUpperCase()} LENGTH ${maxLength} OUT OF RANGE`;
        }
        this.stringArrayMap[variable.toUpperCase()] = {
            val: Array(entries).fill(''),
            maxLen: maxLen,
            maxEntries: maxEntries,
        };
        return undefined;
    }
    /**
     * Set a string array variable
     * @param variable String Array Variable
     * @param index Index into the array to set
     * @param value String to set it to
     * @returns Error if any or undefined on success
     */
    public SetStringArray(
        variable: string,
        index: number,
        value: string
    ): ErrMsg {
        const entry = this.stringArrayMap[variable.toUpperCase()];
        if (entry === undefined) {
            return `STRING ARRAY VARIABLE ${variable.toUpperCase()} NOT DECLARED`;
        }
        const idx = Math.floor(index);
        if (idx < 1 || idx > entry.maxEntries) {
            return `INDEX ${idx} OUT OF RANGE ${
                entry.maxEntries
            } FOR STRING ARRAY ${variable.toUpperCase()}`;
        }
        if (value.length > entry.maxLen) {
            value = value.substring(0, entry.maxLen);
        }
        entry.val[idx - 1] = value;
        return undefined;
    }
    /**
     *
     * @param variable String Array Variable
     * @param index Index into the array to get
     * @returns [String if found, Error if any or undefined on success]
     */
    public GetStringArray(
        variable: string,
        index: number
    ): [string | undefined, ErrMsg] {
        const entry = this.stringArrayMap[variable.toUpperCase()];
        if (entry === undefined) {
            return [
                undefined,
                `STRING ARRAY VARIABLE ${variable.toUpperCase()} NOT DECLARED`,
            ];
        }
        const idx = Math.floor(index);
        if (idx < 1 || idx > entry.maxEntries) {
            return [
                undefined,
                `INDEX ${idx} OUT OF RANGE ${
                    entry.maxEntries
                } FOR STRING ARRAY ${variable.toUpperCase()}`,
            ];
        }
        return [entry.val[idx], undefined];
    }
    /**
     * Set a numeric variable
     * @param variable Numeric Variable
     * @param value number to set it to
     * @returns Error if any or undefined on success
     */
    public SetNumericVar(variable: string, value: number): ErrMsg {
        this.numberMap[variable.toUpperCase()] = value;
        return undefined;
    }
    /**
     *
     * @param variable Numeric Variable
     * @returns [number if found, Error if any or undefined on success]
     */
    public GetNumbericVar(variable: string): [number | undefined, ErrMsg] {
        const entry = this.numberMap[variable.toUpperCase()];
        if (entry === undefined) {
            return [0, undefined];
        }
        return [entry, undefined];
    }
    /**
     * Dimension a numeric 1D array
     * @param variable Numeric Array Variable
     * @param maxLength Maximum length for any entry
     * @param entries Number of entries to create
     * @returns Error if any or undefined on success
     */
    public DimNumeric1DArray(variable: string, numRows: number): ErrMsg {
        let entry = this.numberArrayMap[variable.toUpperCase()];
        let rows = Math.floor(numRows);
        if (rows < 0 || rows > 2000) {
            return `NUMBER ARRAY ${variable.toUpperCase()} DIMENSION ${numRows} OUT OF RANGE`;
        }
        if (entry === undefined) {
            const maxEntries = rows + 1;
            this.numberArrayMap[variable.toUpperCase()] = {
                values: Array(maxEntries).fill(0),
                rows: rows,
                columns: 1,
                maxEntries: maxEntries,
            };
        } else {
            // We already had an entry, make sure that it is smaller than what was previously declared
            if (numRows > entry.maxEntries) {
                return `MAY NOT GROW NUMBER ARRAY ${variable.toUpperCase()} FROM ${
                    entry.maxEntries
                } TO ${numRows}`;
            }
            // We will resize it, but we don't need to move anything around (i.e. we keep the original values)
            entry.rows = numRows;
            entry.columns = 1;
        }
        return undefined;
    }
    /**
     * Dimension a numeric 1D array
     * @param variable Numeric Array Variable
     * @param maxLength Maximum length for any entry
     * @param entries Number of entries to create
     * @returns Error if any or undefined on success
     */
    public DimNumeric2DArray(
        variable: string,
        numRows: number,
        numColumns: number
    ): ErrMsg {
        let entry = this.numberArrayMap[variable.toUpperCase()];
        let rows = Math.floor(numRows);
        let columns = Math.floor(numColumns);
        const entries = (rows + 1) * (columns + 1);
        if (rows < 0 || columns < 0 || entries > 30000) {
            return `NUMBER ARRAY ${variable.toUpperCase()} DIMENSION (${numRows},${numColumns}) OUT OF RANGE`;
        }
        if (entry === undefined) {
            this.numberArrayMap[variable.toUpperCase()] = {
                values: Array(entries).fill(0),
                rows: rows,
                columns: columns,
                maxEntries: entries,
            };
        } else {
            // We already had an entry, make sure that it is smaller than what was previously declared
            if (entries > entry.maxEntries) {
                return `MAY NOT GROW NUMBER ARRAY ${variable.toUpperCase()} FROM ${
                    entry.maxEntries
                } TO ${entries}`;
            }
            // We will resize it, but we don't need to move anything around (i.e. we keep the original values)
            entry.rows = rows;
            entry.columns = columns;
        }
        return undefined;
    }
    /**
     * Get the location to store a 1D array value (creating one if it doesn't exist)
     * @param variable Number Array Variable
     * @param index Index into the array
     */
    public get1DLocation(
        variable: string,
        index: number
    ): [VarNumberArray, number, ErrMsg] {
        let entry = this.numberArrayMap[variable.toUpperCase()];
        if (entry === undefined) {
            // We assume that it has a dimension of 10 (with a 0 index)
            entry = {
                values: Array(11).fill(0),
                rows: 10,
                columns: 1,
                maxEntries: 11,
            };
            this.numberArrayMap[variable.toUpperCase()] = entry;
        }

        const idx = Math.floor(index);
        if (idx < 0 || idx > entry.rows) {
            return [
                entry,
                idx,
                `INDEX ${idx} OUT OF RANGE ${
                    entry.rows
                } FOR NUMBER ARRAY ${variable.toUpperCase()}`,
            ];
        }
        return [entry, idx, undefined];
    }
    /**
     * Get the location to store a 2D array value (creating one if it doesn't exist)
     * @param variable Number Array Variable
     * @param index Index into the array
     */
    public get2DLocation(
        variable: string,
        rowIndex: number,
        colIndex: number
    ): [VarNumberArray, number, ErrMsg] {
        let entry = this.numberArrayMap[variable.toUpperCase()];
        if (entry === undefined) {
            const maxEntries = 11 * 11;
            // We assume that it has a dimension of 10 x 10 (with a 0 index)
            entry = {
                values: Array(maxEntries).fill(0),
                rows: 10,
                columns: 10,
                maxEntries: maxEntries,
            };
            this.numberArrayMap[variable.toUpperCase()] = entry;
        }

        const rowIdx = Math.floor(rowIndex);
        const colIdx = Math.floor(colIndex);
        if (
            rowIdx < 0 ||
            rowIdx > entry.rows ||
            colIdx < 0 ||
            colIdx > entry.columns
        ) {
            return [
                entry,
                0,
                `INDEX (${rowIndex},${colIndex}) OUT OF RANGE (${entry.rows}, ${
                    entry.columns
                }) FOR NUMBER ARRAY ${variable.toUpperCase()}`,
            ];
        }
        const idx = rowIdx * (entry.columns + 1) + colIdx;
        return [entry, idx, undefined];
    }
    /**
     * Set an element in a 1D numeric array
     * @param variable Numeric Array Variable
     * @param index Index into the array to set
     * @param value number to set it to
     * @returns Error if any or undefined on success
     */
    public SetNumeric1DArray(
        variable: string,
        index: number,
        value: number
    ): ErrMsg {
        let [entry, idx, msg] = this.get1DLocation(variable, index);
        if (msg === undefined) {
            entry.values[idx] = value;
        }
        return msg;
    }
    /**
     * Set an element in a 2D numeric array
     * @param variable Numeric Array Variable
     * @param index Index into the array to set
     * @param value number to set it to
     * @returns Error if any or undefined on success
     */
    public SetNumeric2DArray(
        variable: string,
        rowIndex: number,
        colIndex: number,
        value: number
    ): ErrMsg {
        let [entry, idx, msg] = this.get2DLocation(
            variable,
            rowIndex,
            colIndex
        );
        if (msg === undefined) {
            entry.values[idx] = value;
        }
        return msg;
    }
    /**
     * Get an element from a 1D numeric array
     * @param variable Numeric Array Variable
     * @param index Index into the array to get
     * @returns [number if found, Error if any or undefined on success]
     */
    public GetNumeric1DArray(
        variable: string,
        index: number
    ): [number, ErrMsg] {
        let [entry, idx, msg] = this.get1DLocation(variable, index);
        if (msg !== undefined) {
            return [0, msg];
        }
        return [entry.values[idx], undefined];
    }
    /**
     * Get an element from a 2D numeric array
     * @param variable Numeric Array Variable
     * @param index Index into the array to get
     * @returns [number if found, Error if any or undefined on success]
     */
    public GetNumeric2DArray(
        variable: string,
        rowIndex: number,
        colIndex: number
    ): [number, ErrMsg] {
        let [entry, idx, msg] = this.get2DLocation(
            variable,
            rowIndex,
            colIndex
        );
        if (msg !== undefined) {
            return [0, msg];
        }
        return [entry.values[idx], undefined];
    }
}
