# The house format (`roomy.house/1`)

A house is one JSON document. The client saves it through whichever storage it is using (`PUT /api/house` on the server, IndexedDB in the browser), and everything you do in Renovate mode is an edit to this document. You can also write one by hand.

The types live in `client/src/model/types.ts`. The standard house is built in `client/src/model/defaultHouse.ts` from the templates in `client/src/model/templates.ts`.

## Shape

```jsonc
{
  "format": "roomy.house/1",
  "name": "Nisa's house",
  "columns": 3,                          // cells per floor
  "levels": { "top": 1, "bottom": -1 },  // highest and lowest floor that exist. Ground is 0
  "rooms": [ /* Room */ ],
  "yard":  [ /* Furniture: porch, mailbox, bins */ ],
  "seeded": true,                        // sample files were moved in once
  "updatedAt": 1789000000000
}
```

### Room

```jsonc
{
  "id": "study",
  "kind": "study",            // picks the placeholder backdrop. See the list below
  "name": "Study",
  "purpose": "School work: problem sets, lecture notes, essays, lab reports.",
  "floor": 1,                 // 0 ground, 1 one up, -1 below ground, or "attic"
  "col": 2,                   // left to right, from 0. Ignored for the attic
  "span": 1,                  // cells wide
  "wall": "#D9DEF7",
  "background": "art:9f2c",   // optional: your own drawing for this room
  "furniture": [ /* Furniture */ ]
}
```

`purpose` matters. It is shown to the person on a phone, and it is given to the sorter word for word. If you build a room called "Quantum lab", write what belongs there and new files will find it.

Room kinds: `attic`, `study`, `bedroom`, `bathroom`, `kitchen`, `hall`, `living`, `workshop`, `den`, `cellar`, `office`, `studio`, `library`, `greenhouse`. The kind only chooses the placeholder backdrop and tells the built-in rules what sort of room this is. A room with its own `background` can be any kind.

### Furniture

```jsonc
{
  "id": "study-desk",
  "kind": "desk",             // picks the placeholder drawing
  "name": "Desk",
  "hint": "This semester's work",
  "role": "active",           // what this piece MEANS. See docs/CONCEPT.md
  "x": 4, "y": 50,            // top-left corner, in PERCENT of the room
  "w": 44, "h": 42,           // size, in PERCENT of the room
  "art": {                    // optional: your own drawings for this one piece
    "closed": "art:1a2b",
    "open": "art:3c4d"
  }
}
```

Positions are percentages of the room so that a layout survives a change of art and a change of room width. The floor line of the placeholder rooms is at `y = 80`, and furniture that stands on the floor ends between 90 and 94.

Yard furniture (`porch`, `mailbox`, `bins`) uses pixels instead, because it stands outside the grid: `x < 0` hangs off the left wall of the house, `x >= 0` off the right wall, and `y` is measured up from the ground line.

### Roles

`active`, `archive`, `display`, `drafts`, `reference`, `memories`, `media`, `vault`, `backup`, `cleanup`, `misc` hold files. `inbox` is the porch and the mailbox. `trash` is the bins. `recent`, `shared` and `screen` are live views: they show files from elsewhere and never hold any.

A `display` piece shows its own files plus every pinned file in the same room. A `screen` plays the photos in its room that are pinned or newer than 30 days. `archive`, `memories` and `backup` pieces group their contents by year.

## Geometry

A cell is 400 by 250 lot pixels, so a room is 16:10. Floors are separated by 10 pixel slabs and the outer walls are 12 pixels thick. The roof is 300 pixels tall and the attic sits inside it, 840 by 232, clipped to the slope of the roof. The camera frames the middle of the attic because that is where the headroom is. All of this is in `client/src/model/layout.ts`.

## Files

A file record points at its place in the house with `roomId` and `furnitureId`. Files on the porch use `roomId: "yard"` and `furnitureId: "yard-porch"`. When a room or a piece of furniture is removed, its files are carried back to the porch, so nothing is ever orphaned.

```jsonc
{
  "id": "f-k2x9a",
  "name": "MATH 244 pset 3.md",
  "kind": "note",                 // image pdf doc note sheet slides code audio video archive other
  "roomId": "study",
  "furnitureId": "study-desk",
  "addedAt": 1789000000000,       // when it entered the house
  "modifiedAt": 1788900000000,    // the file's own date: decides what counts as old work
  "touchedAt": 1789000000000,     // last opened or moved: drives dust and room lights
  "pinned": false,
  "tags": ["school", "MATH 244"],
  "snippet": "MATH 244 Problem set 3 ...",   // first lines of text files: shown on the paper, searched, given to the sorter
  "reason": "Coursework for this term"        // why the sorter put it here
}
```
