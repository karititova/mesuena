<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Musical data (figures, time signatures) lives only in `src/musica/`; 1 sixteenth = 1 unit — keeps generator, checker, score and audio consistent.
- VexFlow and Tone.js are imported dynamically in the browser only — both touch DOM/Web Audio and break SSR.
- All audio timing goes through Tone.Transport/Tone.Part, never setTimeout — tempo must be exact.
- Beams always use explicit groups (1/4 simple, 3/8 compound) — default grouping is musically wrong.
