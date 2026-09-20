/**
 * Sample files for a fresh house, so there is something to explore, search,
 * unpack and spring-clean before any real files are added. Everything is
 * generated on the fly: text, tiny PDFs, WAV tones and SVG "photos".
 * "Start with an empty house" in the menu removes all of it.
 */
import type { FileItem } from './types';
import { BINS_ID, MAILBOX_ID, PORCH_ID, YARD_ID } from './types';
import { extOf, kindOf, mimeOf } from '../lib/fileKinds';
import { DAY } from '../lib/time';
import { makeThumb, rasterizeSvg } from '../lib/thumbs';
import { SCENES, type Scene } from './sampleScenes';
import { uid } from './templates';

interface Seed {
  name: string;
  to: [room: string, furniture: string];
  /** Last modified, in days before today. */
  days: number;
  /** Last touched, in days before today. Defaults to `days`. */
  touched?: number;
  pinned?: boolean;
  text?: string;
  scene?: Scene;
  pdf?: string[];
  tones?: number[];
  zip?: boolean;
  tags?: string[];
  trashed?: boolean;
}

const BANANA = `Banana bread
Makes one loaf. Better on day two.

Ingredients
- 3 very ripe bananas
- 1/3 cup melted butter
- 1/2 cup sugar
- 1 egg, 1 tsp vanilla
- 1 tsp baking soda, pinch of salt
- 1 1/2 cups flour

Preheat the oven to 350 F. Mash, mix, pour into a buttered loaf pan.
Bake 55 to 60 minutes until a knife comes out clean.`;

export const SEEDS: Seed[] = [
  /* ---- study ---- */
  { name: 'CPSC 223 Problem Set 2.md', to: ['study', 'study-desk'], days: 2, tags: ['school', 'cpsc 223'], text: `CPSC 223 Problem Set 2: Hash tables\nDue Friday 11:59 pm\n\n1. Implement open addressing with linear probing in C. Track the load factor and resize at 0.7.\n2. Show that expected probes for an unsuccessful search is about 1/(1 - a)^2 / 2.\n3. Write tests for delete with tombstones.\n\nNotes to self: start with the resize bug from section.` },
  { name: 'MATH 244 Lecture 5 notes.md', to: ['study', 'study-desk'], days: 3, tags: ['school', 'math 244'], text: `MATH 244 Lecture 5: Trees and spanning trees\n\n- A tree on n vertices has exactly n - 1 edges.\n- Every connected graph has a spanning tree (delete edges on cycles).\n- Cayley: there are n^(n-2) labeled trees. Proof via Prufer codes next time.\n\nQuestion for office hours: why does the bijection need the smallest leaf?` },
  { name: 'Quantum circuits lab writeup (draft).md', to: ['study', 'study-desk'], days: 5, tags: ['school', 'lab'], text: `Lab 2 writeup (draft): Bell states on a simulator\n\nGoal: prepare |phi+> with H then CNOT and check the 50/50 split on 1024 shots.\nResult so far: 00 -> 517, 11 -> 507. Noise model still to add.\n\nTODO: figure for the circuit, discussion of readout error.` },
  { name: 'ENGL 120 essay outline.md', to: ['study', 'study-desk'], days: 8, tags: ['school', 'essay'], text: `ENGL 120 essay outline: On keeping things\n\nThesis: what we keep says more about who we hope to be than who we were.\n1. The junk drawer as autobiography\n2. Didion on notebooks\n3. Digital hoarding: nothing is ever thrown away, so nothing is ever chosen\n\nNeeds a better ending.` },
  { name: 'CPSC 201 pset 1.md', to: ['study', 'study-desk'], days: 585, tags: ['school', 'cpsc 201'], text: `CPSC 201 Problem set 1: Racket warmup\n\n1. Write (my-reverse lst) without using reverse.\n2. Tail recursive factorial.\n3. Explain why (define (f x) (f x)) never returns.` },
  { name: 'Fall 2026 deadlines.md', to: ['study', 'study-corkboard'], days: 6, pinned: true, tags: ['school', 'deadlines'], text: `Fall 2026 deadlines\n\nSep 25  CPSC 223 pset 2\nOct 02  ENGL 120 essay draft\nOct 09  MATH 244 midterm 1\nOct 16  Quantum lab 2 writeup\nNov 20  CPSC 223 final project proposal` },
  { name: 'Class schedule.csv', to: ['study', 'study-corkboard'], days: 20, pinned: true, tags: ['school', 'schedule'], text: `Course,Days,Time,Room\nCPSC 223,Mon Wed,1:00-2:15,DL 220\nMATH 244,Tue Thu,11:35-12:50,LOM 206\nENGL 120,Tue Thu,2:30-3:45,LC 104\nQuantum lab,Fri,1:30-4:30,SPL 51\n` },
  { name: 'Linear algebra cheat sheet.md', to: ['study', 'study-bookshelf'], days: 210, touched: 30, tags: ['school', 'reference'], text: `Linear algebra cheat sheet\n\nrank(A) + nullity(A) = n\ndet(AB) = det(A) det(B)\nA is invertible iff det(A) != 0 iff columns independent\nEigen: Av = lv. Trace = sum of eigenvalues, det = product.\nSpectral theorem: real symmetric => orthonormal eigenbasis.` },
  { name: 'Nielsen and Chuang ch 1-2 notes.md', to: ['study', 'study-bookshelf'], days: 40, tags: ['school', 'reading'], text: `Reading notes: Nielsen and Chuang, chapters 1 and 2\n\n- A qubit is a unit vector in C^2. Global phase does not matter.\n- Measurement in the computational basis: probabilities are |amplitude|^2.\n- No-cloning follows from linearity. Short proof on p. 532.` },
  { name: 'CPSC 201 Final project report.md', to: ['study', 'study-closet'], days: 130, tags: ['school', 'cpsc 201'], text: `CPSC 201 Final project report: A tiny Scheme interpreter\n\nWe implemented eval/apply with environments as association lists, added let and cond as derived forms, and wrote 40 tests. Tail calls are not optimized.\n\nGrade: A-` },
  { name: 'MATH 120 Midterm review.md', to: ['study', 'study-closet'], days: 190, tags: ['school', 'math 120'], text: `MATH 120 Midterm review\n\nGradient, directional derivatives, Lagrange multipliers.\nDouble integrals: switch the order when the inner one is ugly.\nPractice: 14.7 #31, 15.3 #12, 15.4 #9.` },
  { name: 'PHYS 200 Lab 4 data.csv', to: ['study', 'study-closet'], days: 170, tags: ['school', 'lab'], text: `trial,length_m,period_s\n1,0.20,0.91\n2,0.40,1.27\n3,0.60,1.56\n4,0.80,1.80\n5,1.00,2.01\n` },
  { name: 'Spring reading responses.md', to: ['study', 'study-closet'], days: 150, tags: ['school'], text: `Reading responses, spring term\n\nWeek 3: Borges, "Funes the Memorious". Perfect memory as a kind of paralysis.\nWeek 5: Sontag on photographs as a way of refusing experience.` },

  /* ---- bedroom ---- */
  { name: 'Journal - September.md', to: ['bedroom', 'bedroom-nightstand'], days: 1, tags: ['personal'], text: `Journal, September\n\nFirst week back. The room finally feels like mine now that the lights are up.\nWent to the hackathon info session. I keep thinking about how nobody can ever find their own files.` },
  { name: 'Books to read.md', to: ['bedroom', 'bedroom-nightstand'], days: 25, tags: ['personal'], text: `Books to read\n\n- The Design of Everyday Things\n- Piranesi\n- Moonwalking with Einstein (memory palaces!)\n- A Pattern Language` },
  { name: 'Sophomore year goals.md', to: ['bedroom', 'bedroom-nightstand'], days: 22, tags: ['goals'], text: `Sophomore year goals\n\n1. Ship one project people actually use\n2. Office hours every week, even when I think I get it\n3. Call home on Sundays\n4. Sleep before 1` },
  { name: 'Winter break packing list.md', to: ['bedroom', 'bedroom-wardrobe'], days: 270, tags: ['personal'], text: `Winter break packing list\n\nLaptop + charger, the good headphones, heavy coat stays here, gifts, passport just in case.` },
  { name: 'Dorm room measurements.txt', to: ['bedroom', 'bedroom-wardrobe'], days: 30, tags: ['personal'], text: `Room: 11 ft 4 in x 9 ft 8 in\nWindow: 34 in wide, sill at 31 in\nDesk: 42 x 24 in\nUnder-bed clearance: 13 in` },
  { name: 'Passport scan.pdf', to: ['bedroom', 'bedroom-safe'], days: 400, touched: 60, tags: ['important'], pdf: ['Sample document', 'This stands in for a scan of a passport photo page.', 'DropHome keeps documents like this in the bedroom safe.'] },
  { name: 'Lease agreement 2026.pdf', to: ['bedroom', 'bedroom-safe'], days: 95, tags: ['important', 'lease'], pdf: ['RESIDENTIAL LEASE AGREEMENT (sample)', 'Term: June 1, 2026 to May 31, 2027', 'Rent is due on the first of each month.', 'Tenant is responsible for electricity and internet.'] },
  { name: 'Health insurance card.pdf', to: ['bedroom', 'bedroom-safe'], days: 250, touched: 40, tags: ['important'], pdf: ['Student health plan (sample)', 'Member services: see the back of your card.', 'Keep a copy of this in your wallet.'] },

  /* ---- bathroom ---- */
  { name: 'Resume - Sept 2026.pdf', to: ['bathroom', 'bathroom-vanity'], days: 9, pinned: true, tags: ['career'], pdf: ['RESUME (sample)', 'Education: B.S. Computer Science and Mathematics, expected 2029', 'Experience: research assistant, teaching fellow, campus events lead', 'Projects: DropHome, a spatial file system built at a hackathon', 'Skills: TypeScript, Python, C, React'] },
  { name: 'Headshot.jpg', to: ['bathroom', 'bathroom-vanity'], days: 60, pinned: true, scene: 'headshot', tags: ['headshot'] },
  { name: 'Hackathon ideas.md', to: ['bathroom', 'bathroom-bathtub'], days: 4, tags: ['draft', 'ideas'], text: `Hackathon ideas\n\n- Files as a house. Rooms instead of folders. You remember WHERE things are.\n- A syllabus that turns itself into calendar events\n- Camera roll that groups by who is laughing\n\nThe house one. Definitely the house one.` },
  { name: 'Dorm decor moodboard.jpg', to: ['bathroom', 'bathroom-bathtub'], days: 12, scene: 'moodboard', tags: ['inspiration', 'decor'] },
  { name: 'LinkedIn bio draft.md', to: ['bathroom', 'bathroom-bathtub'], days: 15, tags: ['draft', 'career'], text: `LinkedIn bio draft\n\nSophomore studying computer science and math. I like building tools that make messy things feel simple.\n\n(too generic? try again after coffee)` },
  { name: 'Poem draft - september.md', to: ['bathroom', 'bathroom-bathtub'], days: 18, tags: ['draft'], text: `september, draft\n\nthe radiator clears its throat\nand the whole building remembers winter\n\n(second stanza is not working yet)` },
  { name: 'Screenshot 2026-09-02 at 10.14.22.png', to: ['bathroom', 'bathroom-hamper'], days: 17, scene: 'screenshot', tags: ['screenshot'] },
  { name: 'Untitled document (3).md', to: ['bathroom', 'bathroom-hamper'], days: 44, tags: ['messy'], text: `call the registrar about the form\nask about swapping sections\n??? tuesday` },
  { name: 'essay_final_FINAL_v2.md', to: ['bathroom', 'bathroom-hamper'], days: 140, tags: ['messy'], text: `On keeping things (final final)\n\nThis is the version I actually turned in. I think.` },
  { name: 'Cover letter (polished).md', to: ['bathroom', 'bathroom-wallCabinet'], days: 35, tags: ['career'], text: `Cover letter\n\nWhen I was nine I reorganized my family's entire photo drawer by who was laughing in each picture. I have been trying to make information feel like that ever since.` },

  /* ---- kitchen ---- */
  { name: "Mom's chicken biryani.md", to: ['kitchen', 'kitchen-recipeBox'], days: 80, tags: ['recipe', 'family'], text: `Mom's chicken biryani\nServes 6. Do not rush the onions.\n\nIngredients\n- 2 cups basmati rice, soaked 30 min\n- 1.5 lb chicken, yogurt, ginger garlic paste\n- 3 onions, sliced thin and fried deep brown\n- whole spices: bay, cardamom, cloves, cinnamon\n- saffron in warm milk, mint, cilantro\n\nMarinate overnight. Par-boil rice to 70%. Layer, seal the pot, 25 minutes on the lowest heat.` },
  { name: 'Weeknight garlic pasta.md', to: ['kitchen', 'kitchen-recipeBox'], days: 14, tags: ['recipe'], text: `Weeknight garlic pasta\n15 minutes, one pot.\n\nIngredients\n- 8 oz spaghetti\n- 6 cloves garlic, sliced\n- 1/4 cup olive oil, chili flakes\n- parsley, lemon, parmesan\n\nSave a cup of pasta water. Toss everything off the heat.` },
  { name: 'Banana bread.md', to: ['kitchen', 'kitchen-recipeBox'], days: 50, tags: ['recipe'], text: BANANA },
  { name: 'Masala chai.md', to: ['kitchen', 'kitchen-recipeBox'], days: 120, tags: ['recipe'], text: `Masala chai\nFor two mugs.\n\nIngredients\n- 1 cup water, 1 cup milk\n- 2 tsp loose black tea\n- 4 cardamom pods, 1 inch ginger, 2 cloves\n- sugar to taste\n\nSimmer spices in water 3 minutes, add tea, then milk. Let it rise twice.` },
  { name: 'Grocery list.md', to: ['kitchen', 'kitchen-fridge'], days: 1, pinned: true, tags: ['kitchen'], text: `Grocery list\n\n- eggs\n- spinach\n- basmati rice\n- yogurt\n- lemons\n- the good chili crisp` },
  { name: 'Meal plan - this week.md', to: ['kitchen', 'kitchen-fridge'], days: 3, pinned: true, tags: ['kitchen'], text: `Meal plan, this week\n\nMon  garlic pasta\nTue  dining hall\nWed  fried rice with whatever is left\nThu  dining hall\nFri  biryani (call mom first)` },
  { name: 'Rice cooker manual.pdf', to: ['kitchen', 'kitchen-pantry'], days: 300, tags: ['household', 'manual'], pdf: ['RICE COOKER: USER MANUAL (sample)', '1. Rinse rice until the water runs clear.', '2. Fill water to the matching line.', '3. Press COOK. Do not lift the lid.', 'Warranty: 12 months from purchase.'] },
  { name: 'Mini fridge warranty.txt', to: ['kitchen', 'kitchen-pantry'], days: 380, tags: ['household'], text: `Mini fridge warranty\nPurchased last August. 2 year limited warranty, compressor 5 years.\nKeep the receipt with this note.` },
  { name: 'wifi and printer setup.txt', to: ['kitchen', 'kitchen-counter'], days: 28, tags: [], text: `Printer: add by IP from the housing page\nGuest wifi resets every semester\nThe library printers take the mobile app` },
  { name: 'random thoughts.txt', to: ['kitchen', 'kitchen-counter'], days: 66, tags: [], text: `why do we still use folders\nname for the app?? drophome? drawers?\nbuy a lamp` },
  { name: 'Banana bread (1).md', to: ['kitchen', 'kitchen-counter'], days: 50, tags: ['recipe'], text: BANANA },

  /* ---- living room ---- */
  { name: 'Move-in day.jpg', to: ['living', 'living-coffeeTable'], days: 24, scene: 'campus', tags: ['photo', 'college'] },
  { name: 'East Rock sunrise.jpg', to: ['living', 'living-coffeeTable'], days: 10, scene: 'mountains', tags: ['photo', 'hike'] },
  { name: 'Pier sunset.jpg', to: ['living', 'living-coffeeTable'], days: 6, scene: 'sunset', tags: ['photo'] },
  { name: "Grandma's birthday.jpg", to: ['living', 'living-photoWall'], days: 70, pinned: true, scene: 'cake', tags: ['photo', 'family'] },
  { name: 'Beach day.jpg', to: ['living', 'living-photoWall'], days: 75, pinned: true, scene: 'beach', tags: ['photo', 'family', 'summer'] },
  { name: 'First snow.jpg', to: ['living', 'living-albumShelf'], days: 280, scene: 'snow', tags: ['photo', 'winter'] },
  { name: 'Campfire night.jpg', to: ['living', 'living-albumShelf'], days: 420, scene: 'campfire', tags: ['photo', 'camping'] },
  { name: 'City lights.jpg', to: ['living', 'living-albumShelf'], days: 330, scene: 'city', tags: ['photo', 'trip'] },
  { name: 'Graduation caps.jpg', to: ['living', 'living-albumShelf'], days: 470, scene: 'graduation', tags: ['photo', 'graduation'] },
  { name: 'Family picnic 2015.jpg', to: ['living', 'living-toyChest'], days: 4100, scene: 'picnic', tags: ['photo', 'family', 'childhood'] },
  { name: 'Kindergarten drawing.jpg', to: ['living', 'living-toyChest'], days: 5100, scene: 'kidart', tags: ['childhood'] },

  /* ---- workshop ---- */
  { name: 'drophome-notes.md', to: ['workshop', 'workshop-workbench'], days: 1, tags: ['project'], text: `DropHome: build notes\n\n- house is a grid of rooms, rooms hold furniture, furniture holds files\n- every room uses the same roles: surface = now, closet = past, wall = pinned\n- porch = inbox. AI unpacks it.\n- dust = time since you touched it. lights = recent activity.` },
  { name: 'train_model.py', to: ['workshop', 'workshop-workbench'], days: 7, tags: ['project', 'python'], text: `import numpy as np\n\n# tiny logistic regression, no libraries\ndef sigmoid(z):\n    return 1 / (1 + np.exp(-z))\n\ndef train(X, y, lr=0.1, epochs=500):\n    w = np.zeros(X.shape[1])\n    for _ in range(epochs):\n        w -= lr * X.T @ (sigmoid(X @ w) - y) / len(y)\n    return w\n` },
  { name: 'quantum_sim.ipynb', to: ['workshop', 'workshop-workbench'], days: 16, tags: ['project', 'notebook'], text: `{\n "cells": [\n  {"cell_type": "markdown", "source": ["# Two qubit simulator\\n", "State vectors and gates in plain numpy."]},\n  {"cell_type": "code", "source": ["H = np.array([[1, 1], [1, -1]]) / np.sqrt(2)"]}\n ],\n "nbformat": 4\n}\n` },
  { name: 'git cheatsheet.md', to: ['workshop', 'workshop-pegboard'], days: 90, pinned: true, tags: ['reference'], text: `git cheatsheet\n\ngit switch -c name      new branch\ngit restore --staged f  unstage\ngit commit --amend      fix the last commit\ngit rebase -i HEAD~3    tidy up before pushing\ngit reflog              the undo button` },
  { name: 'latex-template.tex', to: ['workshop', 'workshop-toolbox'], days: 210, tags: ['reference', 'template'], text: `\\documentclass[11pt]{article}\n\\usepackage{amsmath, amssymb, amsthm}\n\\usepackage[margin=1in]{geometry}\n\\newtheorem{claim}{Claim}\n\\begin{document}\n\\title{Problem Set}\n\\maketitle\n\\end{document}\n` },
  { name: 'zsh-aliases.sh', to: ['workshop', 'workshop-toolbox'], days: 320, tags: ['reference', 'config'], text: `alias gs="git status -sb"\nalias gl="git log --oneline --graph -20"\nalias serve="python3 -m http.server"\nalias ..="cd .."\n` },
  { name: 'portfolio-site-v1.zip', to: ['workshop', 'workshop-storageShelves'], days: 400, zip: true, tags: ['project'] },
  { name: 'discord-bot.py', to: ['workshop', 'workshop-storageShelves'], days: 500, tags: ['project', 'python'], text: `# homework reminder bot, senior year of high school\nimport discord\n\nclient = discord.Client(intents=discord.Intents.default())\n\n@client.event\nasync def on_ready():\n    print("ready")\n` },

  /* ---- left out for far too long: spring cleaning finds these ---- */
  { name: 'Robotics club notes.md', to: ['workshop', 'workshop-workbench'], days: 820, tags: ['project', 'high school'], text: `Robotics club notes\n\nGear ratio for the arm: 5 to 1 was too slow, 3 to 1 stalls.\nAsk about the encoder that keeps skipping.` },
  { name: 'Prom night.jpg', to: ['living', 'living-coffeeTable'], days: 760, scene: 'city', tags: ['photo', 'high school'] },
  { name: 'old apartment wifi.txt', to: ['kitchen', 'kitchen-counter'], days: 540, tags: [], text: `Network: not-the-fbi\nRouter is behind the bookshelf. Restart it when it blinks orange.` },

  /* ---- den ---- */
  { name: 'Melody idea - voice memo.wav', to: ['den', 'den-recordCrate'], days: 13, tones: [392, 440, 494, 587, 494, 440, 392, 330], tags: ['audio', 'idea'] },
  { name: 'Doorbell jingle.wav', to: ['den', 'den-recordCrate'], days: 90, tones: [659, 523, 587, 392], tags: ['audio'] },

  /* ---- cellar ---- */
  { name: 'Phone backup 2026-08.zip', to: ['cellar', 'cellar-backupRack'], days: 35, zip: true, tags: ['backup'] },
  { name: 'Laptop backup 2026-06.zip', to: ['cellar', 'cellar-backupRack'], days: 100, zip: true, tags: ['backup'] },
  { name: 'Notes app export.json', to: ['cellar', 'cellar-backupRack'], days: 100, tags: ['backup', 'export'], text: `{\n  "exported": "notes",\n  "count": 214,\n  "note": "sample export so the cellar has something in it"\n}\n` },
  { name: 'College applications 2025.zip', to: ['cellar', 'cellar-boxes'], days: 600, zip: true, tags: ['archive'] },

  /* ---- attic ---- */
  { name: 'AP Physics notes.md', to: ['attic', 'attic-trunk'], days: 900, tags: ['school', 'high school'], text: `AP Physics notes\n\nKinematics: the big four equations.\nAlways draw the free body diagram first.\nEnergy is usually the faster way.` },
  { name: 'Gatsby essay - junior year.md', to: ['attic', 'attic-trunk'], days: 1200, tags: ['school', 'high school'], text: `The green light and the problem of wanting\n\nGatsby does not want Daisy. He wants the five years back.` },
  { name: 'SAT prep schedule.csv', to: ['attic', 'attic-trunk'], days: 1100, tags: ['school', 'high school'], text: `week,focus,practice_test\n1,reading,no\n2,math no calc,no\n3,grammar,yes\n4,review,yes\n` },
  { name: 'Science fair poster.jpg', to: ['attic', 'attic-toyChest'], days: 1500, scene: 'poster', tags: ['school', 'memories'] },
  { name: 'Minecraft server config.txt', to: ['attic', 'attic-boxes'], days: 2200, tags: ['old'], text: `server-name=the good server\nmax-players=8\ndifficulty=hard\npvp=false\nmotd=no griefing pls` },
  { name: 'Old resume 2023.md', to: ['attic', 'attic-boxes'], days: 1150, tags: ['career', 'old'], text: `Resume (2023)\n\nRobotics club, tutoring, summer job at the library.` },

  /* ---- waiting on the porch: try "Unpack" ---- */
  { name: 'IMG_5012.jpg', to: [YARD_ID, PORCH_ID], days: 1, scene: 'lake', tags: [] },
  { name: 'Pumpkin bread recipe.md', to: [YARD_ID, PORCH_ID], days: 0, tags: [], text: `Pumpkin bread\nTwo loaves, one to share.\n\nIngredients\n- 1 can pumpkin puree\n- 3 cups flour, 2 cups sugar\n- 1 cup oil, 4 eggs\n- 2 tsp cinnamon, 1 tsp nutmeg, 2 tsp baking soda\n\nPreheat the oven to 350 F. Bake 60 minutes.` },
  { name: 'MATH 244 pset 3.md', to: [YARD_ID, PORCH_ID], days: 0, tags: [], text: `MATH 244 Problem set 3\nDue next Thursday\n\n1. Prove that every tree with at least two vertices has at least two leaves.\n2. Count spanning trees of K_4 two ways.\n3. Show a graph is bipartite iff it has no odd cycle.` },
  { name: 'Club budget fall.csv', to: [YARD_ID, PORCH_ID], days: 2, tags: [], text: `item,amount,notes\nroom booking,0,free through the dean's office\npizza,180,three meetings\nstickers,65,\nspeaker gift,40,\ntotal,285,\n` },
  { name: 'Apartment lease renewal.pdf', to: [YARD_ID, PORCH_ID], days: 1, tags: [], pdf: ['LEASE RENEWAL OFFER (sample)', 'Your lease ends May 31, 2027.', 'Reply by March 1 to renew at the current rate.'] },
  { name: 'Halloween costume ideas.md', to: [YARD_ID, PORCH_ID], days: 3, tags: [], text: `Halloween costume ideas (rough)\n\n- a 404 page\n- the junk drawer\n- Schrodinger's cat, box included` },
  { name: 'sorting_visualizer.py', to: [YARD_ID, PORCH_ID], days: 2, tags: [], text: `# visualize bubble, merge and quick sort side by side\nimport random\n\ndef bubble(a):\n    for i in range(len(a)):\n        for j in range(len(a) - i - 1):\n            if a[j] > a[j + 1]:\n                a[j], a[j + 1] = a[j + 1], a[j]\n                yield a\n` },
  { name: '8th grade yearbook page.jpg', to: [YARD_ID, PORCH_ID], days: 2050, touched: 0, scene: 'yearbook', tags: [] },

  /* ---- mailbox and bins ---- */
  { name: 'Group project slides - from Maya.pdf', to: [YARD_ID, MAILBOX_ID], days: 0, tags: ['shared with me'], pdf: ['CPSC 223 group project (sample)', 'Slide 1: What we are building', 'Slide 2: Who does what', 'Slide 3: Timeline'] },
  { name: 'Untitled.txt', to: [YARD_ID, BINS_ID], days: 12, trashed: true, tags: [], text: `test test` },
];

/* ---------- generators ---------- */

/** A valid one-page PDF with a title and a few lines of Helvetica. ASCII only. */
export function makePdf(lines: string[]): Blob {
  const esc = (s: string) => s.replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7E]/g, '?');
  const [title, ...rest] = lines;
  const content = `BT /F1 20 Tf 56 730 Td (${esc(title ?? '')}) Tj ET\nBT /F2 12 Tf 56 694 Td 18 TL\n${rest.map((l) => `(${esc(l)}) Tj T*`).join('\n')}\nET`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

/** A short melody as 16-bit mono WAV. */
export function makeWav(tones: number[], secondsPerNote = 0.26, rate = 11025): Blob {
  const per = Math.floor(rate * secondsPerNote);
  const n = per * tones.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + n * 2, true);
  str(8, 'WAVEfmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, n * 2, true);
  tones.forEach((hz, t) => {
    for (let i = 0; i < per; i++) {
      const env = Math.min(1, i / 300) * Math.pow(1 - i / per, 1.6);
      const x = i / rate;
      const s = (Math.sin(2 * Math.PI * hz * x) * 0.6 + Math.sin(2 * Math.PI * hz * 2 * x) * 0.18) * env;
      v.setInt16(44 + (t * per + i) * 2, Math.round(s * 22000), true);
    }
  });
  return new Blob([buf], { type: 'audio/wav' });
}

/** The smallest valid zip: an empty archive. */
export function makeZip(): Blob {
  const bytes = new Uint8Array(22);
  bytes.set([0x50, 0x4b, 0x05, 0x06]);
  return new Blob([bytes], { type: 'application/zip' });
}

export async function buildSeed(seed: Seed, now = Date.now()): Promise<{ meta: FileItem; blob: Blob }> {
  let blob: Blob;
  let name = seed.name;
  let thumb: string | undefined;
  let snippet: string | undefined;

  if (seed.scene) {
    const svg = SCENES[seed.scene]();
    const raster = await rasterizeSvg(svg, 800, 600, /\.png$/i.test(name) ? 'image/png' : 'image/jpeg');
    if (raster) {
      blob = raster;
    } else {
      blob = new Blob([svg], { type: 'image/svg+xml' });
      name = name.replace(/\.(jpe?g|png)$/i, '.svg');
    }
    thumb = await makeThumb(blob);
  } else if (seed.pdf) {
    blob = makePdf(seed.pdf);
    snippet = seed.pdf.join('\n');
  } else if (seed.tones) {
    blob = makeWav(seed.tones);
  } else if (seed.zip) {
    blob = makeZip();
  } else {
    blob = new Blob([seed.text ?? ''], { type: mimeOf(name) });
    snippet = (seed.text ?? '').slice(0, 700);
  }

  const modifiedAt = now - seed.days * DAY - 3_600_000;
  const touchedAt = now - (seed.touched ?? seed.days) * DAY - 1_800_000;
  const [roomId, furnitureId] = seed.to;
  const meta: FileItem = {
    id: uid('f'),
    name,
    ext: extOf(name),
    mime: blob.type || mimeOf(name),
    size: blob.size,
    kind: kindOf(name, blob.type),
    roomId,
    furnitureId,
    addedAt: touchedAt,
    modifiedAt,
    touchedAt,
    pinned: !!seed.pinned,
    tags: seed.tags ?? [],
    snippet,
    thumb,
    sample: true,
  };
  if (seed.trashed) meta.trashed = { at: now - 2 * DAY, roomId: 'kitchen', furnitureId: 'kitchen-counter' };
  return { meta, blob };
}
