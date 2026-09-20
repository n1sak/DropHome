# Your art goes here

Put drawings in this folder and list them in `manifest.json` (copy `manifest.example.json` to start). Anything you do not list keeps its built-in drawing, so the house can be replaced one drawing at a time.

Sizes, naming, flipbook animation and the full manifest reference are in [`docs/ART_GUIDE.md`](../../../docs/ART_GUIDE.md). Tracing templates for every room are in [`docs/art-templates`](../../../docs/art-templates).

```
art/
  manifest.json
  rooms/        study.png, kitchen.png ...           16:10, 1600 x 1000 or larger
  furniture/    desk-closed.png, desk-open.png ...   transparent, same canvas for both states
  house/        shell.png                            the roof, walls and yard (optional)
```
