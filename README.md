# 🌐 Online Markov Chain Text Generator: Train, Run & Visualize 
Generate text and explore language patterns with this interactive, browser-based Markov Chain Studio that saves memory _privately_. Build multi-gram (1,2,3,4) gram models, scrape data from websites, and visualize the "˙˙：.🕸️˙：.. knowledge web" through an intuitive chart—all. This markov chain bot is open source, client-side and fast.
# 🚀 Quick Start
 **Go to [the website](https://oxillenglow.github.io/MarkovChain-Online-test-and-view/index.html) to try out, **CLICK** *on the big green button to use my pretrained brain*, write a seed(message) and click generate!** 
###### Go to [help section](https://github.com/OxillenGlow/MarkovChain-Online-test-and-view/blob/main/README.md#help) for more info
###### If you like it, please become a stargazer, ie. click the star button on top! 
# 📊 Features
- **Pretrained brain** Includes some built-in English datasets (brains) that you can [choose](https://github.com/OxillenGlow/MarkovChain-Online-test-and-view/blob/main/README.md#trained-brains) and past to brain so you can start chatting immediately see -> [help section](https://github.com/OxillenGlow/MarkovChain-Online-test-and-view/blob/main/README.md#help) for more info.
- **4-gram Markov model** with smart **(dumb)** backoff (3-gram → 2-gram → 1-gram → random)
- **Attention mechanism** — important seed words get a probability boost for more coherent output
- **Sentence-aware stopping** — generation continues past the max word count until it hits a period, question mark, or exclamation point
- **Website scraper** — fetch text from any URL, take snapshots, and convert them into training data
- **Knowledge web** — browse your model's n-gram table, filter by context or next word, and inspect probabilities
- **Prompt normalization** — lowercase "un" is automatically linked to uppercase "UN" for better matching
- **Import / Export** — download your brain as a `.json` file or load one back in

## Does it save my data?
**Yes. If you want it to** Your trained model (the "brain") is automatically saved to your browser's local storage after every training session.

- In a **normal browsing window**, your brain persists across sessions — no action needed.
- In **private / incognito mode**, local storage is cleared when you close the window. Use the **Download Brain** and **Load Brain** buttons (in the top bar or Brain Management section) to save and restore your brain manually.

# Help
## ❓
1. Open the [webpage](https://oxillenglow.github.io/MarkovChain-Online-test-and-view/index.html).
2. Paste some text into the **Training Data** box and click **Train Brain**.  **Important**, Don't expect too much if you trained on just a few KBs of data, you usually need MBs for reasonable conversations.
3.  Alternatively, **choose** a trained [Markov chain brain](https://github.com/OxillenGlow/MarkovChain-Online-test-and-view/blob/main/README.md#trained-brains)  , **click** the toggle on the train brain section (top), and **past** the file URL (given [here](https://github.com/OxillenGlow/MarkovChain-Online-test-and-view/blob/main/README.md#trained-brains) ).
4. Type a seed phrase in the **Prompt** field and click **Generate**.
5. Adjust the **attention factor** to control how strongly important words influence the output 1 for no influence. It is suggested that it is between 1.8 - 5.0 for best results.
6. (Optional) Use the **Website Scraper** to pull text from a URL and feed it into your model. (please make sure you have permission, some websites might block this)
7. *if you like it please become a stargazer, ie. click the star button on top*
## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` (in training field) | Train brain |
| `Ctrl + G` | Generate text |
# Trained Brains
## 🤯
How to use? see [help section](https://github.com/OxillenGlow/MarkovChain-Online-test-and-view/blob/main/README.md#help) for more info
### From OxillenGlow 
Chose the latest one, top:
###### ____________________ ↓  copypast this ↓ _______
| Date | URL weblink, _copypast this↓ see 3rd. entry in [help](https://github.com/OxillenGlow/MarkovChain-Online-test-and-view/blob/main/README.md#help)_ | Type |
|------|-----------|-------|
| 2026-05-06 | https://raw.githubusercontent.com/OxillenGlow/MarkovChain-Online-test-and-view/main/brains/oxg/markov-brain-2026-05-06.json | English-OxillenGlow-General |


# 👋 Others Brains, You can help
I don't want to train all of these brains so **if you have one** make an issue and post the link. I **will** put the JSON file here.
##### You can help! ↑
# 🎯 Other Projects (relos)
Since you scrolled down here, you might like some other projects of mine. See [my sandbox game](github.com/OxillenGlow/MtSharpGrain).
## License
Fee to use, modify, and share. Under MIT license.
Again, I, the creator and contributers, will not be and can not be responsible for any damages caused or linked to the code in this repository. I WILL NOT BE RESPONSIBLE FOR INFORMATION OR MALICIOUS CODE IN BRAINS OR DATASETS. SEE MIT LICENSE [LICENSE](LICENSE)
