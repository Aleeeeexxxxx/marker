import { describe } from "mocha";
import { KMP } from "../utils";
import { expect } from "chai";

function array2str(array: Array<any>): string {
    return array.join(";");
}

describe("KMP", () => {
    const testCases: {
        pattern: string;
        next: number[];
        search?: {
            str: string;
            match: number[];
        }[];
    }[] = [
        {
            pattern: "ABABBADAABBOCAA",
            next: [0, 0, 1, 2, 0, 1, 0, 1, 1, 2, 0, 0, 0, 1, 1],
        },
        {
            pattern: "abcdab",
            next: [0, 0, 0, 0, 1, 2],
            search: [
                {
                    str: "caabcdabsss",
                    match: [2],
                },
                {
                    str: "caabcdabsssabcdab",
                    match: [2, 11],
                },
            ],
        },
    ];

    testCases.forEach((val) => {
        const next = KMP.getNext(val.pattern);
        expect(array2str(next)).to.be.equal(array2str(val.next));

        val.search?.forEach((s) => {
            const match = KMP.searchAll(s.str, val.pattern, next);
            expect(array2str(match)).to.be.equal(array2str(s.match));
        });
    });
});
