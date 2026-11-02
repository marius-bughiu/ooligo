"""Check the two shipped fictional DOCX files using Python's standard library."""

from copy import deepcopy
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

EXAMPLES = Path(__file__).resolve().parent / "examples"
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments"
TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"
REVIEW = "Example Buyer will review each report within three business days of receipt."
RENEWAL = "The pilot renews for another two weeks unless either party gives notice five days before expiry."


def check(condition, message):
    if not condition:
        raise ValueError(message)


def parts(filename):
    with ZipFile(EXAMPLES / filename) as archive:
        check(len(archive.namelist()) == len(set(archive.namelist())), "Duplicate package part")
        return {name: archive.read(name) for name in archive.namelist()}


def xml_bytes(element):
    return ET.tostring(element, encoding="utf-8")


def project(body, decision):
    """Remove comments and resolve this sample's run-level revisions in memory."""
    result = deepcopy(body)
    for paragraph in result.iter(W + "p"):
        children = []
        for node in paragraph:
            if node.tag in {W + "commentRangeStart", W + "commentRangeEnd"}:
                continue
            if node.tag == W + "r" and node.find(W + "commentReference") is not None:
                continue
            if node.tag in {W + "ins", W + "del"}:
                keep = node.tag == (W + "ins" if decision == "accept" else W + "del")
                if keep:
                    for deleted in node.iter(W + "delText"):
                        deleted.tag = W + "t"
                    children.extend(list(node))
            else:
                children.append(node)
        paragraph[:] = children
    return result


def main():
    original, reviewed = parts("incoming.docx"), parts("review-copy.docx")
    comments_path = "word/comments.xml"
    check(set(reviewed) == set(original) | {comments_path}, "Unexpected package parts")
    changed = {name for name in original if original[name] != reviewed[name]}
    check(changed == {"word/document.xml", "word/settings.xml", "word/_rels/document.xml.rels",
                      "[Content_Types].xml"}, "Unrelated package content changed")

    before = ET.fromstring(original["word/document.xml"])
    after = ET.fromstring(reviewed["word/document.xml"])
    deletions = list(after.iter(W + "del"))
    insertions = list(after.iter(W + "ins"))
    check(len(deletions) == len(insertions) == 1, "Expected one deletion and one insertion")
    check([t.text for t in deletions[0].iter(W + "delText")] == ["three"], "Wrong deletion")
    check([t.text for t in insertions[0].iter(W + "t")] == ["ten"], "Wrong insertion")
    ids = [node.get(W + "id") for node in deletions + insertions]
    check(None not in ids and len(set(ids)) == 2, "Revision IDs must be distinct")
    settings = ET.fromstring(reviewed["word/settings.xml"])
    check(settings.find(W + "trackRevisions") is not None, "Tracking is not enabled")

    comments = ET.fromstring(reviewed[comments_path])
    check(len(comments) == 2, "Expected two comment bodies")
    rels = ET.fromstring(reviewed["word/_rels/document.xml.rels"])
    check(any(r.get("Type") == REL and r.get("Target") == "comments.xml" for r in rels),
          "Missing comments relationship")
    types = ET.fromstring(reviewed["[Content_Types].xml"])
    check(any(t.get("PartName") == "/word/comments.xml" and t.get("ContentType") == TYPE for t in types),
          "Missing comments content type")
    for path, tree, addition in [
        ("word/settings.xml", settings, settings.find(W + "trackRevisions")),
        ("word/_rels/document.xml.rels", rels, next(r for r in rels if r.get("Type") == REL)),
        ("[Content_Types].xml", types, next(t for t in types if t.get("PartName") == "/word/comments.xml")),
    ]:
        tree.remove(addition)
        check(xml_bytes(tree) == xml_bytes(ET.fromstring(original[path])), "Unexpected change in " + path)
    for cid, rule, expected in [("0", "REVIEW-01", "threeten"), ("1", "HOLD-01", RENEWAL)]:
        bodies = [c for c in comments.findall(W + "comment") if c.get(W + "id") == cid]
        check(len(bodies) == 1 and rule in "".join(bodies[0].itertext()), "Missing comment " + rule)
        anchors = {}
        for kind in ("commentRangeStart", "commentRangeEnd", "commentReference"):
            matches = [n for n in after.iter(W + kind) if n.get(W + "id") == cid]
            check(len(matches) == 1, "Invalid " + kind + " for " + rule)
            anchors[kind] = matches[0]
        paragraph = next(p for p in after.iter(W + "p") if anchors["commentRangeStart"] in p)
        nodes = list(paragraph)
        start, end = nodes.index(anchors["commentRangeStart"]), nodes.index(anchors["commentRangeEnd"])
        check(start < end and anchors["commentReference"] in nodes[end + 1], "Misplaced comment reference")
        check("".join(text for n in nodes[start + 1:end] for text in n.itertext()) == expected,
              "Comment attached to unexpected text")

    check(xml_bytes(project(after, "reject")) == xml_bytes(before), "Reject changed the original document body")
    accepted = deepcopy(before)
    text_nodes = [t for t in accepted.iter(W + "t") if t.text == "three"]
    check(len(text_nodes) == 1, "Missing unique review-period token")
    paragraphs = ["".join(p.itertext()) for p in before.iter(W + "p")]
    check(REVIEW in paragraphs and RENEWAL in paragraphs, "Missing fixture clause")
    text_nodes[0].text = "ten"
    check(xml_bytes(project(after, "accept")) == xml_bytes(accepted), "Accept changed unrelated content")
    print("PASS: one replacement, two anchored comments, accept/reject document bodies and preserved package parts.")


if __name__ == "__main__":
    main()
