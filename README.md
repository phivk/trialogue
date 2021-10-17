# Trialogue

![Trialogue logo](dist/Twine2/Trialogue/icon.svg)

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

A way to test the result of adjustments to the Story Format, is to compile a `.twee` Story to `.html` using the Trialogue format and check the behaviour & styling in a browser.

Compilation can be done using one of:

- [TweeGo](https://www.motoslave.net/tweego/)
- [Twee2](https://dan-q.github.io/twee2/)

**Decompile** `.html` story to `.twee`/`.tw2` using trialogue story format:

```
tweego --decompile --output=[path/to/target.twee] [path/to/source.html] --format=Trialogue
```

```
twee2 decompile [path/to/source.html] [path/to/target.tw2]
```

**Compile** `.twee`/`.tw2` story to `.html` story using trialogue story format:

```
tweego --output=[path/to/target.html] [path/to/source.twee] --format=Trialogue
```

```
twee2 build [path/to/source.tw2] [path/to/target.html] --format=./dist/Twine2/Trialogue
```

# Paloma

Paloma is a Jonah-style story format for Twine 1 and 2 based on [Snowman](https://github.com/videlais/snowman) by Chris Klimas.

Paloma uses Markdown rather than TiddlyWiki-style text formatting, and Javascript rather than Twine 1.x-style macros for scripting, so it is not a drop-in replacement for Jonah.  It is a drop-in replacement for Snowman, except that Paloma will ignore any checkpoints in your story.

The Paloma page is [here](http://mcdemarco.net/tools/scree/paloma/).

View a demo story [here](http://mcdemarco.net/tools/scree/test-paloma.html).

To add Paloma to Twine 2, use this URL (under Formats > Add a New Format): [https://mcdemarco.net/tools/scree/paloma/format.js](https://mcdemarco.net/tools/scree/paloma/format.js).

To add Paloma to Twine 1, create a new folder called `paloma` inside your targets folder, then download this file: [https://mcdemarco.net/tools/scree/paloma/header.html](https://mcdemarco.net/tools/scree/paloma/header.html) and place it inside the `paloma` folder.   (See the [Twine wiki](http://twinery.org/wiki/twine1:story_format#adding_formats) for more information about installing and using story formats in Twine 1.)

## Changes From Snowman

Paloma displays a running log of all passages, like Jonah.  All story links from previous passages are disabled, and the previously selected link is highlighted.

By default, clicking a passage link adds an entry to the reader's browser history.  The reader can back up through this history, but cannot go forward again (except by clicking story links again).  Paloma does not have Snowman's checkpoint functionality; history is node-by-node only.

There is an inline title at the beginning of the story, as well as an optional subtitle and byline below the title.  To add a subtitle, use the special passage `StorySubtitle`.  To add an author, use `StoryAuthor`.  (The title is handled as usual for your version of Twine.)

To restyle or remove the title, use the selector `#ptitle`.    To restyle or remove the subtitle, use the selectors `#psub` (for both), `#psubtitle` (for the subtitle), and `#pauthor` (for the byline).  See [my website](http://mcdemarco.net/tools/scree/paloma/) for styling examples.

### Non-changes from Snowman

Paloma uses [Marked](https://github.com/chjj/marked/) for Markdown formatting and [jQuery](http://jquery.com) and [Underscore](http://underscorejs.org/) for scripting and templating.

As in Snowman, state is rewound on navigating back.

Some basic Snowman scripting:

* Set a state variable `gender`:  `<% s.gender = "male" %>`.
* Show the variable's value:  `<%= s.gender %>`.
* Show some text based on a variable's value:  `<% if (s.gender == "male") { %>You are male.<% } %>`.
* Show alternate texts based on a variable's value:  `<% if (s.gender == "male") { %>You are male.<% } else { %>You are female.<% } %>`.
* Add a comment: `/* My ToDo list for this node: spellcheck! */`

See [the Snowman docs](https://bitbucket.org/klembot/snowman-2/) for more details.

## Versions

### 1.1.1

Fixed iPhone CSS issue.

### 1.1.0

Added support for Twine 1, and the StoryAuthor and StorySubtitle special passages.

### 1.0.1

Added the title inline in the story.

### 1.0.0

Initial version.

## Building From Source

Run `npm install` to install dependencies.  Run `grunt package` to create a release version for Twine under `dist/`.  Run `grunt --help` to list other grunt targets.

