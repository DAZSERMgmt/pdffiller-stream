import { spawn } from "child_process";

export interface FormField {
    fieldFlags: string;
    fieldMaxLength: string | number;
    fieldType: string;
    fieldValue: string | boolean;
    title: string;
}

/**
 * Extracts the Form Fields from a PDF Form
 * @param sourceFile
 * @returns A FormField object
 */
    let regName = /FieldName: ([^\n]*)/;
    const regType = /FieldType: ([\t .A-Za-z]+)/;
    const regFlags = /FieldFlags: ([\d\t .]+)/;
    const regMaxLength = /FieldMaxLength: ([\d\t .]+)/;
    const fieldArray: FormField[] = [];

    return new Promise((resolve, reject) => {
        const childProcess = spawn("pdftk", [
            sourceFile,
            "dump_data_fields_utf8",
        ]);
        let output = "";

        childProcess.on("error", (error) => reject(error));
        childProcess.stdout.on("error", (error) => reject(error));
        childProcess.stderr.on("error", (error) => reject(error));
        childProcess.stdin.on("error", (error) => reject(error));

        childProcess.stdout.on("data", (data) => {
            output += data;
        });

        childProcess.stdout.on("end", () => {
            const fields = output.split("---").slice(1);
            for (const field of fields) {
                fieldArray.push({
                    fieldFlags:
                        (regFlags.exec(field)?.[1].trim() as string) ?? "",
                    fieldMaxLength:
                        (regMaxLength.exec(field)?.[1].trim() as string) ?? "",
                    fieldType:
                        (regType.exec(field)?.[1].trim() as string) ?? "",
                    fieldValue: "",
                    title: (regName.exec(field)?.[1].trim() as string) ?? "",
                });
            }
            resolve(fieldArray);
        });
    });
};
