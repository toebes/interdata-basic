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
export type SeekType = 'absolute' | 'relative'
export type OutputFunction = (str: string) => void
export type InputFunction = () => Promise<string | undefined>
export type SeekFunction = (record: number, type: SeekType) => void

export type LogicalUnit = {
    inputFunction: InputFunction
    outputFunction: OutputFunction
    seekFunction: SeekFunction
    tabPos: number
}

export class IO {
    protected units: { [id: number]: LogicalUnit } = {}
    protected EOFonLastIO = false
    /**
     * Return an input string from the default input.  In this case we simulate EOF
     * @returns Input string
     */
    protected defaultInput(): Promise<string | undefined> {
        return new Promise((resolve, reject) => {
            resolve(undefined)
        })
    }
    /**
     * Write output to an unassigned unit
     * @param str String to output
     */
    protected defaultOutput(str: string): void {
        console.log(`Output:${str}`)
    }
    /**
     * Seek within the file
     * @param record Record number to seek to
     * @param type Type of seek operation 'absolute' 'relative'
     * To seek to the beginning seek(0, 'absolute')
     * To seek to the end  seek(-1, 'absolute')
     * To seek to the next to the last record seek(-2, 'absolute')
     * To seek to the third record seek(2, 'absolute')
     * To seek back one record seek(-1, 'relative')
     * To skip to the next record seek(1, 'relative')
     * seek(0, 'relative') does nothing.
     */
    protected defaultSeek(record: number, type: SeekType): void {}
    /**
     *
     * @param unit Unit number to look for
     * @returns Logical unit if found in map or dummy unit
     */
    public GetUnit(unit = 5): LogicalUnit {
        const lookupUnit = this.mapUnitNumber(unit)
        let result: LogicalUnit = this.units[lookupUnit]
        if (result === undefined) {
            result = {
                inputFunction: this.defaultInput,
                outputFunction: this.defaultOutput,
                seekFunction: this.defaultSeek,
                tabPos: 0,
            }
        }
        return result
    }
    /**
     * Map a unit string to a unit number.  non-numbers convert to 0 and numbers are truncated to an integer
     * @param unit String representing the unit
     * @returns number corresponding to the unit.
     */
    protected mapUnitNumber(unit: number) {
        if (isNaN(unit)) {
            return 0
        }
        return Math.floor(unit)
    }
    /**
     * Assign input/output vectors to a unit
     * @param unit Logical Unit
     * @param inputFunction Function to read from unit
     * @param outputFunction Function to write from unit
     */
    public OpenUnit(
        unit: number,
        inputFunction: InputFunction = this.defaultInput,
        outputFunction: OutputFunction = this.defaultOutput,
        seekFunction: SeekFunction = this.defaultSeek
    ) {
        const lookupUnit = this.mapUnitNumber(unit)
        this.units[lookupUnit] = {
            inputFunction: inputFunction,
            outputFunction: outputFunction,
            seekFunction: seekFunction,
            tabPos: 0,
        }
    }
    /**
     * Disconnect I/O to a logical unit
     * @param unit Logical unit
     */
    public CloseUnit(unit: number): void {
        const lookupUnit = this.mapUnitNumber(unit)
        delete this.units[lookupUnit]
    }
    /**
     * Read a string of bytes from a unit
     * @param unit Logical Unit
     * @returns String of bytes from unit
     */
    public async Read(unit = 5): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.EOFonLastIO = false
            const logicalUnit = this.GetUnit(unit)
            logicalUnit.inputFunction().then((result) => {
                if (result === undefined) {
                    result = ''
                    this.EOFonLastIO = true
                }
                resolve(result)
            })
        })
    }
    /**
     * Did the last read operation hit the end of the input?
     * @returns Boolean indicating last operation hit EOF
     */
    public isEOF(): boolean {
        return this.EOFonLastIO
    }
    /**
     * Write bytes to a logical unit
     * @param unit Logical unit
     * @param str String to output
     */
    public Write(unit = 5, str: string) {
        const logicalUnit = this.GetUnit(unit)
        logicalUnit.outputFunction(str)
    }
    /**
     * Write a full line (with carriage return) to a logical unit
     * @param unit Logical unit
     * @param str String to output
     */
    public WriteLine(str: string, unit = 5) {
        this.Write(unit, str)
        this.WriteFileMark(unit)
    }
    /**
     * Rewind the logical unit to the beginnign (if it supports it)
     * @param unit Logical unit
     */
    public Rewind(unit: number = 5) {
        const logicalUnit = this.GetUnit(unit)
        logicalUnit.seekFunction(0, 'absolute')
    }
    /**
     * Write a file mark (end of record) to the logical unit (if it supports it)
     * @param unit Logical unit
     */
    public WriteFileMark(unit: number = 5) {
        const logicalUnit = this.GetUnit(unit)
        logicalUnit.outputFunction('\r\n')
    }
    /**
     * Backspace the logical unit one record (if it supports it)
     * @param unit Logical unit
     */
    public BackSpace(unit: number = 5) {
        const logicalUnit = this.GetUnit(unit)
        logicalUnit.seekFunction(-1, 'relative')
    }
}
