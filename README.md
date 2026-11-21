# Coca-Cola Retornável: site e chat

Academic prototype from the FGV EBAPE Field Project. **This is not an official Coca-Cola site.**

The site replaces the WhatsApp channel with a chat inside the site. Scanning the QR code on the bottle, the machine or the store opens that chat directly. The site also explains how the returnable bottle works: the machine at Estação Nova Iguaçu, the vale-casco (bottle voucher) and the partner stores on the map.

Published at: https://coca-retornavel.vercel.app

## Structure

| Folder | Contents |
|---|---|
| `site/` | The site that gets published: `index.html` (generated), `styles.css`, scripts (`chat.js`, `app.js`, `map.js`, `seq.js`, `fx.js`), images, fonts and the 3D bottle frames (`site/seq`, WebP). |
| `blender/template.html`, `blender/sheets.html` | Source of the page. `blender/build.py` assembles `site/index.html` from them. |
| `blender/build.py` | Assembles the page (`python blender/build.py blender site`). |
| `blender/deploy.sh` | Copies only the public files and publishes them to Vercel. |
| `blender/master/` | 3D model of the bottle in Blender: `master.py`, the `.blend` file, label textures, validation renders and a README with the details. |

## Updating the site

```bash
python blender/build.py blender site
bash blender/deploy.sh
```

The raw render frames (PNG) are excluded from the repository because they are too large. To generate them again, run `blender/master/master.py` (instructions are in `blender/master/README.md`).
