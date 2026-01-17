import { parseLinks, getUniqueLinks } from "./links.js";

describe("parseLinks", () => {
  it("should parse single link", () => {
    const content = "Check out [[My Note]] for more info";
    const links = parseLinks(content);

    expect(links).toEqual([
      { title: "My Note", fullLink: "My Note", folder: undefined, start: 10, end: 21 },
    ]);
  });

  it("should parse multiple links", () => {
    const content = "See [[Note A]] and [[Note B]] for details";
    const links = parseLinks(content);

    expect(links).toEqual([
      { title: "Note A", fullLink: "Note A", folder: undefined, start: 4, end: 14 },
      { title: "Note B", fullLink: "Note B", folder: undefined, start: 19, end: 29 },
    ]);
  });

  it("should return empty array for no links", () => {
    const content = "No links here, just text";
    const links = parseLinks(content);

    expect(links).toEqual([]);
  });

  it("should handle links with spaces", () => {
    const content = "[[  Spaced Title  ]]";
    const links = parseLinks(content);

    expect(links).toEqual([
      { title: "Spaced Title", fullLink: "Spaced Title", folder: undefined, start: 0, end: 20 },
    ]);
  });

  it("should handle links on multiple lines", () => {
    const content = `Line 1 with [[First Link]]
Line 2 with [[Second Link]]`;
    const links = parseLinks(content);

    expect(links).toHaveLength(2);
    expect(links[0]?.title).toBe("First Link");
    expect(links[1]?.title).toBe("Second Link");
  });

  it("should handle adjacent links", () => {
    const content = "[[Link A]][[Link B]]";
    const links = parseLinks(content);

    expect(links).toEqual([
      { title: "Link A", fullLink: "Link A", folder: undefined, start: 0, end: 10 },
      { title: "Link B", fullLink: "Link B", folder: undefined, start: 10, end: 20 },
    ]);
  });

  it("should not match incomplete brackets", () => {
    const content = "[[incomplete or just [single]";
    const links = parseLinks(content);

    expect(links).toEqual([]);
  });

  it("should handle empty brackets", () => {
    const content = "Empty [[]] brackets";
    const links = parseLinks(content);

    // Empty string after trim would still be captured but as empty title
    expect(links).toHaveLength(0);
  });
});

describe("getUniqueLinks", () => {
  it("should return unique links sorted alphabetically", () => {
    const content = "[[Zebra]] [[Apple]] [[Zebra]] [[Banana]]";
    const links = getUniqueLinks(content);

    expect(links).toEqual(["Apple", "Banana", "Zebra"]);
  });

  it("should return empty array for no links", () => {
    const content = "No links here";
    const links = getUniqueLinks(content);

    expect(links).toEqual([]);
  });

  it("should deduplicate case-sensitive links", () => {
    const content = "[[Note]] [[note]] [[NOTE]]";
    const links = getUniqueLinks(content);

    // These are treated as different links (case-sensitive)
    // localeCompare sorts lowercase before uppercase
    expect(links).toEqual(["note", "Note", "NOTE"]);
  });

  it("should handle single link", () => {
    const content = "Just [[One Link]]";
    const links = getUniqueLinks(content);

    expect(links).toEqual(["One Link"]);
  });
});
