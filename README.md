# Trialogue

![Trialogue logo](src/icon.svg)

Trialogue is a Story Format for [Twine](https://twinery.org/) that let's you turn a branching narrative into an interactive chat story. Write a non-linear story in the Twine editor, add Trialogue as the Story Format and play back your story in the form of an interactive chat.

👉 Demo story: https://phivk.github.io/trialogue/docs/trialogue-demo.html <br>

## User Guide

A guide on how to use Trialogue to create interactive chat bot stories in Twine is available at:

https://phivk.gitbook.io/trialogue/

## Example stories powered by Trialogue

Example stories using Trialogue (add yours by submitting a Pull Request, or open an issue with a link):

- [Chatterpast](https://chatterpast.tolerantfutures.com/): Explore life in Iron Age and Roman Britannia with Enica and her friends.
- [Filla Fulla Chat](https://fillafulla.sng.sk/?lang=en): Take part in an interactive conversation and explore life stories and key artworks of the iconic Czech and Slovak artists Emil Filla and Ľudovít Fulla.
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
