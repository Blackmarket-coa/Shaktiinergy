# Services

One photo per service block. Filenames should match the service so the code
can map them without guesswork.

| Filename | Service | Status |
| --- | --- | --- |
| `life-coaching.jpg` | Life Coaching | **missing** — block renders text-only |
| `wellness-coaching.jpg` | Wellness Coaching | wired |
| `public-speaking.jpg` | Public Speaking | wired |

`components/Services.tsx` treats the photo as optional, so Life Coaching
renders without one until a file is added and imported there. Target size is
1600 × 1200 landscape; the images display at a 4:3 crop in a 240px column.

Keep the three consistent — same general lighting and crop — so the row reads
as one set. Wellness works well with sound bowls, yoga, or breathwork;
speaking works well with a live audience shot.
