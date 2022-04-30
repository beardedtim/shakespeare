# shakespeare

<p align="center">

  <img width="400" height="auto" src="https://i.pinimg.com/originals/12/d7/9c/12d79c922b7a855105f51451ae138897.jpg" alt="Something I thought was funny">

</p>

## Overview

`shakespeare` is a simple [Actor Model](https://en.wikipedia.org/wiki/Actor_model) framework that aims to
offer Primitives for creating complex Async/Message based systems.

## Usage

> NOTE: this is not yet a package. Will release _something_
> once we get a stable thing going and some more internal
> Inboxes/Repositories built. For now, the expectation is
> that you clone this repo and build your system using it
> and this example assumes this project setup. If you are
> wanting to use it in your own project, you may need to
> make some changes.
>
> - Moth

```ts
import { setTimeout } from "timers/promises";
import { Actor } from "@app/Actor";
import { IntervalInbox } from "@app/Inbox";

const main = async () => {
  const actor = new Actor<number>({
    inbox: new IntervalInbox(),
    process: ({ payload }) => {
      console.log("Received payload", payload);
    },
  });

  // start the actor up
  await actor.start();

  // wait for about what it
  // takes to print 100 times
  await setTimeout(1030);

  // stop the actor
  await actor.stop();
};

main();
```
