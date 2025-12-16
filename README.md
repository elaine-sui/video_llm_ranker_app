# Video LLM Ranker

Simple React app to load a local video and LLM outputs (from JSON) and let users rank the outputs.

Getting started

1. Install dependencies and start dev server:

```bash
cd video_llm_ranker
npm install
npm run dev
```

2. Open the URL shown by Vite (usually http://localhost:5173).

Usage

- The right panel offers two ways to load data:
  - **Load JSON (LLM outputs)**: choose a JSON file via the standard file picker.
  - **Select folder (JSON + videos)**: picks a directory (uses the File System Access API). The app will list JSON files in the folder and can load videos referenced by relative paths inside that folder.

- Expected JSON entry shape (fields adapted from your test.json):

```json
{
  "id": 0,
  "video": "videos/test/clip.mp4",
  "prompt": "...",
  "ground_truth": "...",
  "llm_response1": "...",
  "llm_response2": "...",
  "llm_response3": "..."
}
```

- If you use **Select folder**, the app assumes the `video` path is relative to that folder and will attempt to open the referenced file automatically. If directory picking is not supported by your browser, use the JSON file input and then use **Load Video File** to select the video manually.

- Users cannot add/remove outputs in the UI; the app reads up to 6 LLM responses (`llm_response1`..`llm_response6` or `llm_output1`..).

Next steps

- I can add drag-and-drop reordering, CSV export, or persistent local storage — tell me which you prefer.
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    # Video LLM Ranker

    Simple React app to load a local video and LLM outputs (from JSON) and let users rank the outputs.

    Getting started

    1. Install dependencies and start dev server:

    ```bash
    cd video_llm_ranker
    npm install
    npm run dev
    ```

    2. Open the URL shown by Vite (usually http://localhost:5173).

    Usage

    - On the right panel, click **Load JSON (LLM outputs)** and select a JSON file. The file can be a single object or an array of objects.
    - Each JSON object should have the format:

    ```json
    {
      "video_id": "VIDEO_ID",
      "video_path": "https://.../video.mp4",
      "llm_output1": "...",
      "llm_output2": "...",
      "llm_output3": "...",
      "llm_output4": "...",
      "llm_output5": "...",
      "llm_output6": "..."
    }
    ```

    - If the JSON file contains an array of such objects, a selector will appear to choose which entry to load.
    - If `video_path` is an HTTP(S) URL, the app will set the video to that URL. Otherwise, use **Load Video File** to pick a local video file from disk (recommended when the video is local).
    - Users cannot add or remove outputs in the UI; the outputs are taken from the JSON fields `llm_output1`..`llm_output6`. Users can edit the output text if desired and reorder them using the rank controls.
    - Click **Download rankings** to save a JSON file with the final rankings and the current video URL.

    JSON notes

    - Fields `llm_output1`..`llm_output6` are optional; the app will include whichever of these keys are present in the chosen JSON object (up to 6).
    - If you need to support local file references inside `video_path`, load the local video separately via **Load Video File**.

    Next steps

    - I can add drag-and-drop reordering, CSV export, or persistent local storage — tell me which you prefer.
