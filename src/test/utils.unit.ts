import { describe } from "mocha";
import { KMP } from "../utils";
import { expect } from "chai";

function array2str(array: Array<any>): string {
    return array.join(";");
}

describe("KMP", () => {
    it("getNext", () => {
        const testCases: {
            pattern: string;
            expected: number[];
        }[] = [
            {
                pattern: "ABABBADAABBOCAA",
                expected: [0, 0, 1, 2, 0, 1, 0, 1, 1, 2, 0, 0, 0, 1, 1],
            },
        ];

        testCases.forEach((val) => {
            const next = KMP.getNext(val.pattern);
            expect(array2str(next)).to.be.equal(array2str(val.expected));
        });
    });
});
