# Art guide: putting hand-drawn rooms into Roomy

Everything you see in Roomy right now is a placeholder sketch drawn in code. None of the app logic knows or cares what the art looks like. A room is a rectangle with a picture behind it, and a piece of furniture is a smaller rectangle with a closed picture and an open picture. Replace the pictures and you have a different house.

There are three ways to get drawings in, from quickest to most complete.

**1. In the app.** Turn on Renovate, step into a room, and use "Room backdrop" to upload a drawing of the room. Select a piece of furniture and use "Swap art" to upload its closed and open drawings. This is stored with the house, per person, and is the fastest way to test a drawing.

**2. The art folder.** Put images in `client/public/art/` and list them in `client/public/art/manifest.json`. This is the version that ships with the app, so everybody sees it. `npm run build:artifact` inlines the same manifest into the single-file demo.

**3. Hand the drawings over.** Scans or exports of the pages are enough. Claude can cut them into rooms and pieces, clean the backgrounds, write the manifest, and line up the hotspots.

## What to draw

### Rooms

A room backdrop is a 16:10 picture. Draw it at **1600 × 1000** or larger (2400 × 1500 if you want it crisp on a retina screen at full zoom). PNG, JPG, WebP or SVG all work.

Keep the line where the wall meets the floor about 80 percent of the way down, because that is where the default furniture positions expect it. Leave window glass transparent if you export PNG: the sky colour shows through and follows day and night.

You have two choices for furniture, and you can mix them room by room.

*Draw the room empty and the furniture separately.* This is the better one. Furniture can then open and close, be moved around in Renovate mode, and be reused in other rooms.

*Draw everything in one picture.* Faster. Mark the room as `bakedFurniture` in the manifest and the app stops drawing its own furniture but keeps every hotspot clickable, with a soft highlight on hover. You can still add an `open` drawing per piece later, and it will appear over the backdrop when that piece is opened.

The attic is the odd one: **3360 × 928**, and only the part under the roof slope is visible. `docs/art-templates/rooms/attic.svg` shows the outline.

### Furniture

Each piece is a transparent PNG, drawn twice on the **same canvas**: once closed, once open. Same canvas means the two drawings line up and the piece does not jump when it opens. If the open version sticks out (a pulled drawer, a swung door), make the canvas big enough for the open version and draw the closed one inside it.

The canvas size for every piece in the standard house is listed in [`art-templates/sizes.md`](art-templates/sizes.md). A desk is 704 × 420, a closet is 352 × 800, the TV is 576 × 480. Those numbers are just the piece's rectangle at 4 drawing pixels per lot pixel. The proportions matter, the exact pixels do not: art is scaled to fit its rectangle and anchored to the bottom, so furniture always stands on the floor.

If you move or resize a piece in Renovate mode, its rectangle changes and the art follows.

### Animation

Two drawings give you a quick cross-fade between closed and open. For real hand-drawn animation, give a piece a **flipbook** instead: three to six frames on the same canvas, first frame closed, last frame open. Roomy plays them forward when the piece opens and backward when it closes, at 10 frames a second unless you say otherwise. Animating on twos like this suits the drawn look better than a smooth tween would.

### Live content on top of your art

Some pieces show real files on top of the drawing: the picture on the TV, photos in the frames on the wall, notes on the fridge, the face in the mirror. Tell Roomy where those go with `slots`, in percent of the piece's canvas. Without slots, a custom piece simply shows no live content.

### The house itself

The shell (roof, outer walls, yard, tree, ground) can be one picture too: `shell` in the manifest, drawn over `docs/art-templates/lot.svg` so the rooms land in the right places. This is the last thing to replace, and the app looks fine with a hand-drawn interior inside the sketched shell.

## Tracing templates

`npm run art:templates` writes one SVG per room into `docs/art-templates/rooms/`, with the floor line and a labelled box for every piece of furniture, plus `lot.svg` for the whole house. Open one as the bottom layer in Procreate, Photoshop, Figma or anything else, draw over it, and hide it before you export. If you change the house layout, run it again.

## The manifest

`client/public/art/manifest.json`. Paths are relative to that folder. Keys can be a **kind** (`desk`: every desk in the house) or an **id** (`study-desk`: only that one). An id wins over a kind.

```json
{
  "format": "roomy.art/1",

  "shell": "house/shell.png",

  "rooms": {
    "study": { "background": "rooms/study.png" },
    "kitchen": { "background": "rooms/kitchen-all-in-one.png", "bakedFurniture": true }
  },

  "furniture": {
    "desk": {
      "closed": "furniture/desk-closed.png",
      "open": "furniture/desk-open.png"
    },
    "study-closet": {
      "frames": ["furniture/closet-1.png", "furniture/closet-2.png", "furniture/closet-3.png", "furniture/closet-4.png"],
      "fps": 10
    },
    "tv": {
      "closed": "furniture/tv.png",
      "slots": [{ "x": 9, "y": 4, "w": 82, "h": 52, "shape": "screen" }]
    },
    "photoWall": {
      "closed": "furniture/frames.png",
      "slots": [
        { "x": 2, "y": 14, "w": 27, "h": 58, "rot": -2 },
        { "x": 37, "y": 3, "w": 33, "h": 44 },
        { "x": 78, "y": 20, "w": 20, "h": 50, "rot": 2 }
      ]
    },
    "kitchen-fridge": { "baked": true, "open": "furniture/fridge-open.png" }
  }
}
```

| Field | Meaning |
|---|---|
| `rooms.<key>.background` | The room backdrop |
| `rooms.<key>.bakedFurniture` | The backdrop already contains the furniture: keep hotspots, draw nothing |
| `furniture.<key>.closed` / `open` | The two states. With only one, it is used for both |
| `furniture.<key>.frames`, `fps` | A flipbook from closed to open. Replaces `closed` and `open` |
| `furniture.<key>.baked` | This one piece is part of the backdrop |
| `furniture.<key>.slots` | Where live content sits, in percent of the piece. `shape` is `rect`, `oval` or `screen` |
| `shell` | The whole lot behind the rooms |

Anything not listed keeps its placeholder sketch, so you can replace the house one drawing at a time.

## Making it sit well

The placeholder ink is `#2A2F45`, a blue-black, at roughly 6 pixels on a 1600 pixel room. Matching that weight keeps new drawings and old sketches from fighting while the house is half replaced.

Draw for daylight. Night, unlit rooms and the blueprint look are overlays and filters the app adds on top, so they work on any art without extra drawings.

Keep furniture flat-on, like a dollhouse seen from the front. Perspective inside a piece is fine, but a piece drawn at an angle will not line up with its neighbours.

Leave a few pixels of empty margin inside each furniture canvas. The hover glow follows the outline of the drawing and gets clipped if the ink touches the edge.
