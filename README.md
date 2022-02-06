# Trialogue

![Trialogue logo](src/icon.svg)

Trialogue is a chat-style Twine Story Format based on [Paloma](http://mcdemarco.net/tools/scree/paloma/), which is in turn based on [Snowman](https://github.com/videlais/snowman).

👉 Demo story: https://phivk.github.io/trialogue/docs/trialogue-demo.html <br>
✊ Full story powered by Trialogue: https://fillafulla.sng.sk/chat/en/ <br>
🤖 Full story repo: https://github.com/slovakNationalGallery/fillafulla.sng.sk <br>

## How to make a scripted chat experience in Twine using Trialogue

### Import Trialogue into Twine

![trialogue import](/docs/trialogue-import.gif)

1. Open the online [Twine editor](http://twinery.org/2/#!/stories).
2. Choose `Formats` -> `Add a New Format`, paste the Story Format URL (https://phivk.github.io/trialogue/dist/Twine2/Trialogue/format.js) into the input field, click `Add`.
3. Under `Story Formats` select Trialogue.

### Create your first chat story

![trialogue create](/docs/trialogue-create.gif)

1. Create a story in the Twine editor.
2. Edit the start passage to include:
   - Title (e.g. start)
   - Passage text (e.g. "Hi 👋")
   - One or more links (e.g. `[[What's your name?]]`)
   - Speaker tag (e.g. `speaker-bot`). This will display the speaker's name (in this case `bot`) in above their passages. It also sets a `data-speaker="bot"` attribute on the passage's HTML element, which can be used for styling.
3. Edit the newly created passage(s) to include:
   - Passage text (e.g. "My name is Bot")
   - One or more links (e.g. `[[Back to start->start]]`)
   - Speaker tag (e.g. `speaker-bot`)
4. Hit `Play` to test the result (should look something [like this](https://phivk.github.io/trialogue/docs/trialogue-demo.html))

## Editing styles

The way to edit styling is by choosing 'Edit Story Stylesheet' in the story menu:

<img width="264" alt="C76FE0A3-8EEC-4509-9451-00DBB987E17A-1024-00005D7165D9A486" src="https://user-images.githubusercontent.com/902958/152247576-b9073293-3a8d-42e6-b6fc-89be9c9b54b5.png">

To learn more about editing styles via the Story Stylesheet, see:
- [Twine 2.2: Learning Twine: Story Stylesheet](https://www.youtube.com/watch?v=GE_06UFb-O0) by [Dan Cox](https://github.com/videlais)
- [CSS is Your Friend: The Basics of Changing Twine's Default Appearance For Newbs](https://twinery.org/forum/discussion/1528/css-is-your-friend-the-basics-of-changing-twines-default-appearance-for-newbs) by Sharpe

### Changing UI colours

Trialogue uses [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) to set the main colours of the app. You can add the following to your Story Stylesheet and tweak the colours to fit your needs:

```css
:root {
    --bg-color: #C7BDB5;
    --user-color: purple;
    --speaker-color: #A00;
    --sidebar-bg-color: #FFF;
    --navbar-bg-color: #FFF;
    --passage-bg-color: #FFF;
    --passage-text-color: #000;
}
```

### Setting speaker avatars and colours

Setting **avatar image** and **text color** of a bot speaker with the name `bot` (passages tagged `speaker-bot`):
```
.chat-passage-wrapper[data-speaker='bot']:before {
  background-image: url('https://placekitten.com/100/100');
}
.chat-passage-wrapper[data-speaker='bot'] .chat-passage::before {
  color: green;
}
```

Setting the **avatar image** and **text color** of user passages:
```
.chat-passage-wrapper[data-speaker='you']:after {
  background-image: url('https://placekitten.com/100/100');
}
.chat-passage-wrapper[data-speaker='you'] .chat-passage::before {
  color: red;
}
```

Use any [valid CSS color value](https://developer.mozilla.org/en-US/docs/Web/CSS/color) for the color property.

## ⚠️ Changes From Paloma

- Changed chat layout, including rendering links in separate UserResponsePanel
- Added speaker tags; every passage must have one tag starting with "speaker-" (e.g. "speaker-bot" or "speaker-president").
- Added helper function to show a passage delayed based on it's text length `story.showDelayed(idOrName);`. This is helpful to display a next passage without requiring user input, e.g. have two bot speakers reply to each other. Add this code to the passage text:

```
<%
story.showDelayed("idOrName");
%>
```

## Gallery

Example stories using Trialogue (add yours by submitting a Pull Request, or open an issue with a link):

- [Filla Fulla Chat](https://fillafulla.sng.sk/?lang=en#): Take part in an interactive conversation and explore life stories and key artworks of the iconic Czech and Slovak artists Emil Filla and Ľudovít Fulla. Throughout the chat, both artists will answer questions and share artworks as well as archival material.
- [Mother Tongue](https://2370.play.ifcomp.org/content/mother-tongue.html): How to learn Tagalog in just one awkward conversation with your mom a day.

## Development Setup

A possible workflow for collaboration between a Story Author and Format Developer:

1. Story Author works on story in [Twinery GUI](https://twinery.org/2/#!/stories), with current version of published Story Format selected
2. Story Author exports updated version of Story to `.html` file and shares it with Format Developer *(infrequently)*
3. Format Developer decompiles the latest Story version from `.html` to `.twee` using [TweeGo](https://www.motoslave.net/tweego/)/[Twee2](https://dan-q.github.io/twee2/) *(see 'Testing during development')*
4. Format Developer runs [TweeGo](https://www.motoslave.net/tweego/)/[Twee2](https://dan-q.github.io/twee2/) to compile the latest Story from `.twee` to `.html` with WIP/'in development' version of custom Story Format *(see 'Testing during development')*
5. Format Developer adjusts Story Format *(frequently)*
6. Format Developer repeats from step **4.** until happy to release a new version of Story Format
7. Format Developer publishes Story Format as a new version *(infrequently)*
8. Story Author imports the new version of the Story Format and continues working on the Story
9. Repeat from **1.** until happy with Story Format functionality
10. 🎉

### Testing during development

#### Building Story Format from Source

Run `npm install` to install dependencies.  Run `grunt package` to create a release version for Twine under `dist/`.  Run `grunt --help` to list other grunt targets.

#### Compiling a story using Trialogue

A way to test the result of adjustments to the Story Format, is to compile a `.twee` Story to `.html` using the Trialogue format and check the behaviour & styling in a browser.

(De)compilation can be done using either:

- [TweeGo](https://www.motoslave.net/tweego/)
- [Twee2](https://dan-q.github.io/twee2/)

**Decompile** `.html` story to `.twee`/`.tw2` using Trialogue Story Format:

```
tweego --decompile --output=[path/to/target.twee] [path/to/source.html] --format=Trialogue
```

```
twee2 decompile [path/to/source.html] [path/to/target.tw2]
```

**Compile** `.twee`/`.tw2` story to `.html` story using Trialogue Story Format:

```
tweego --output=[path/to/target.html] [path/to/source.twee] --format=Trialogue
```

```
twee2 build [path/to/source.tw2] [path/to/target.html] --format=./dist/Twine2/Trialogue
```

# Paloma

Trialogue is based on [Paloma](http://mcdemarco.net/tools/scree/paloma/) by M. C. DeMarco: a Jonah-style Story Format for Twine 1 and 2 based on [Snowman](https://github.com/videlais/snowman) by [Chris Klimas](https://github.com/klembot).
