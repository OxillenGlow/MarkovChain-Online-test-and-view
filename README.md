# Markov Chain — Online Test & View

Generate text with a Markov chain directly in your browser. Train your own 4-gram model, scrape websites for data, and explore the knowledge web — all free and client-side. Your brain stays in your browser's local storage. Have a 4-gram 3-gram → 2-gram → 1-gram model all in one.

## Features

- **4-gram Markov model** with smart backoff (3-gram → 2-gram → 1-gram → random)
- **Attention mechanism** — important seed words get a probability boost for more coherent output
- **Sentence-aware stopping** — generation continues past the max word count until it hits a period, question mark, or exclamation point
- **Website scraper** — fetch text from any URL, take snapshots, and convert them into training data
- **Knowledge web** — browse your model's n-gram table, filter by context or next word, and inspect probabilities
- **Prompt normalization** — lowercase "un" is automatically linked to uppercase "UN" for better matching
- **Import / Export** — download your brain as a `.json` file or load one back in

## Try it now

👉 **[Launch the website](https://oxillenglow.github.io/MarkovChain-Online-test-and-view/index.html)**

## Does it save my data?
**Yes. If you want it to** Your trained model (the "brain") is automatically saved to your browser's local storage after every training session.

- In a **normal browsing window**, your brain persists across sessions — no action needed.
- In **private / incognito mode**, local storage is cleared when you close the window. Use the **Download Brain** and **Load Brain** buttons (in the top bar or Brain Management section) to save and restore your brain manually.

## Quick start

1. Open the [webpage](https://oxillenglow.github.io/MarkovChain-Online-test-and-view/index.html).
2. Paste some text into the **Training Data** box and click **Train Brain**.
3. Type a seed phrase in the **Prompt** field and click **Generate**.
4. Adjust the **attention factor** to control how strongly important words influence the output.
5. (Optional) Use the **Scraper** to pull text from a URL and feed it into your model.

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` (in training field) | Train brain |
| `Ctrl + G` | Generate text |

## License

Free to use, modify, and share.
