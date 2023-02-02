import { spawn } from "node:child_process";
import { access, constants, createWriteStream } from "node:fs";
import type { Readable } from "node:stream";
import createFdf from "./fdf.js";

/**
 * convenience chainable method for writing to a file (see examples)
 * @param promised
 * @param path
 * @returns a boolean
 * */
const toFile = (
    promised: Promise<Readable>,
    path: string
): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        promised
            // eslint-disable-next-line promise/always-return
            .then((outputStream) => {
                const output = createWriteStream(path);
                outputStream.pipe(output);
                outputStream.on("close", () => {
                    output.end();
                    resolve(true);
                });
            })
            .catch((error) => reject(error));
    });
};

/**
 * This function will take in a source pdf file and a json object of field values
 * @param sourceFile
 * @param fieldValues
 * @param extraArguments
 * @returns A promise of a Readable stream
 */
export default (
    sourceFile: string,
    fieldValues: any,
    extraArguments: string[] | false = ["flatten"]
): Promise<Readable> => {
    const promised: Promise<Readable> = new Promise((resolve, reject) => {
        // Check to see if sourceFile exists!
        access(sourceFile, constants.F_OK || constants.R_OK, (error) => {
            if (error)
                reject(new Error("File does not exist or is not readable"));
        });

        // Generate the data from the field values.
        const FDFinput = createFdf(fieldValues);

        const runArguments = [sourceFile, "fill_form", "-", "output", "-"];

        if (typeof extraArguments === "object") {
            for (const argument of extraArguments) {
                runArguments.push(argument);
            }
        }

        const childProcess = spawn("pdftk", runArguments);

        childProcess.on("error", (error) => reject(error));
        childProcess.stdout.on("error", (error) => reject(error));
        childProcess.stderr.on("error", (error) => reject(error));
        childProcess.stdin.on("error", (error) => reject(error));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sendData = (chunk: any) => {
            childProcess.stdout.pause();
            childProcess.stdout.unshift(chunk);
            resolve(childProcess.stdout);
            childProcess.stdout.removeListener("data", sendData);
        };

        childProcess.stdout.on("data", sendData);

        // now pipe FDF to pdftk
        childProcess.stdin.write(FDFinput);
        childProcess.stdin.end();
    });

    // bind convenience method toFile for chaining
    // @ts-expect-error We are adding toFile to the promise
    promised.toFile = toFile.bind(undefined, promised);
    return promised;
};

export { default as generateFDFTemplate } from "./generate-fdf-template.js";
export { default as convFieldJson2FDF } from "./convert-field-json-to-fdf.js";
export { default as mapForm2PDF } from "./map-form-to-pdf.js";
