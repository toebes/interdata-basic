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

import { SourceLine } from './sourceline';
const MAXLINE = 65535;

export type RenumMap = { [key: number]: number };

export class Program {
    protected program: SourceLine[] = [];

    /**
     * Find the index in the program for a given line
     * @param lineNum Line number to locate
     * @returns Index of the line number (or entry immediately after it).  undefined
     *          means the line doesn't exist or is beyond the end of the program
     */
    public findLineIndex(lineNum: number): number | undefined {
        let result = undefined;
        // For efficiency, let's do a binary search
        let low = 0;
        let high = this.program.length - 1;
        while (high > low) {
            const spot = Math.round((low + high) / 2);
            const spotLine = this.program[spot].getLineNum();
            if (lineNum === spotLine) {
                return spot;
            }
            if (lineNum > spotLine) {
                low = spot;
            } else {
                high = spot;
            }
            result = high;
        }
        return result;
    }
    public New(): void {
        this.program = [];
    }
    /**
     * Erase a single line in the program
     * @param lineNum Line number to erase
     */
    public Erase(lineNum: number): void {
        const spot = this.findLineIndex(lineNum);
        if (spot !== undefined && this.program[spot].getLineNum() === lineNum) {
            this.program.splice(spot, 1);
        }
    }
    /**
     * Erase a range of lines in the program
     * @param firstLine First line number to erase
     * @param lastLine Last line number to erase
     */
    public EraseRange(firstLine: number, lastLine: number): void {
        const firstSpot = this.findLineIndex(firstLine);
        if (firstSpot !== undefined) {
            let lastSpot = this.findLineIndex(lastLine);
            if (lastSpot === undefined) {
                lastSpot = this.program.length - 1;
            }
            this.program.splice(firstSpot, 1 + lastSpot - firstSpot);
        }
    }
    /**
     * List source lines
     * @param startLine First line number to return (Default start of program)
     * @param endLine Last line number to return (Default end of program)
     * @returns Array of source lines for the range
     */
    public List(
        startLine: number = 0,
        endLine: number = MAXLINE + 1
    ): SourceLine[] {
        const firstSpot = this.findLineIndex(startLine);
        if (firstSpot === undefined) {
            return [];
        }
        let lastSpot = this.findLineIndex(endLine);
        if (
            lastSpot !== undefined &&
            this.program[lastSpot].getLineNum() === endLine
        ) {
            lastSpot++;
        }
        // Slice it based on the starting / ending number
        return this.program.slice(firstSpot, lastSpot);
    }
    /**
     * Fix up any references on source line
     * @param sourceLine Line to fix
     * @param renumMap Mapping of old line numbers to new line numbers
     * @returns
     */
    public fixReferences(sourceLine: SourceLine, renumMap: RenumMap): string {
        // These are the statements we are trying to fix up.
        // Note that if any of the line numbers are not constants we have to abort the renumber
        // GOSUB #
        // GOTO #
        // IF ... THEN #
        // IF ... GOTO #
        // IF ... THEN GOTO #
        // IF ... THEN GOSUB #
        // ON ... THEN #,#,#,#
        // ON ... GOTO #,#,#,#
        // ON ERROR THEN #
        // ON ERROR GOTO #
        return '';
    }
    /**
     * Renumber all the lines in the progra
     * @param firstLine First line number of new program (default = 10)
     * @param increment Amount to increment each line by (default = 10)
     * @returns Any error when renumbering
     */
    public Renum(firstLine: number = 10, increment: number = 10): string {
        // Make sure we have legal values to increment by
        if (
            firstLine < 0 ||
            firstLine > MAXLINE ||
            !Number.isInteger(firstLine)
        ) {
            return `Illegal starting line ${firstLine}`;
        }
        if (increment <= 1 || !Number.isInteger(increment)) {
            return `Illegal increment ${increment}`;
        }
        if (firstLine + increment * (this.program.length - 1) > MAXLINE) {
            return `Renum would make line numbers out of range`;
        }
        // remember what line numbers got changed from and to so we can fix up the gotos
        const renumMap: RenumMap = {};
        const backupSource: SourceLine[] = [];
        for (let sourceLine of this.program) {
            backupSource.push(
                new SourceLine(sourceLine.getLineNum(), sourceLine.getSource())
            );
            renumMap[firstLine] = sourceLine.getLineNum();
            sourceLine.setLineNum(firstLine);
            firstLine += increment;
        }
        // Now go through and fixup the gotos
        for (let sourceLine of this.program) {
            let error = this.fixReferences(sourceLine, renumMap);
            if (error !== '') {
                // Something couldn't be renumbered, so restore the program
                this.program = backupSource;
                return error;
            }
        }
        // Everything worked, so return it
        return '';
    }
    /**
     * Add/Update a source line
     * @param linenum Line number of line to add/replace
     * @param source Source for the corresponding line
     */
    public addLine(linenum: number, source: string): void {
        // Figure out where we should put this line
        const spot = this.findLineIndex(linenum);
        // If the line already existed, just replace the source for the line
        if (spot !== undefined && this.program[spot].getLineNum() == linenum) {
            this.program[spot].setSource(source);
        } else {
            // This line number doesn't exist so create a new one
            const newSourceLine = new SourceLine(linenum, source);
            if (spot === undefined) {
                // If it is beyond the end of the program, just add it
                this.program.push(newSourceLine);
            } else {
                // Otherwise insert it before the line we found
                this.program.splice(spot, 0, newSourceLine);
            }
        }
    }
    /**
     * Estimate how big the program is
     * @returns Estimated length of program
     */
    public Size(): string {
        let size = 0;
        this.program.forEach(
            (sourceLine) => (size += sourceLine.getSource.length + 3)
        );
        return `${size} BYTES USED`;
    }
}
