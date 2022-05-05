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

### Basic Example

> Here we use the IntervalInbox which is helpful for
> demo purposes or for some sort of internal interval
> for whatever you may want to map it into.

```ts
import { setTimeout } from "timers/promises";
import { Actor } from "@app/Actor";
import { IntervalInbox } from "@app/Inbox";

const main = async () => {
  const actor = new Actor<number>({
    inbox: new IntervalInbox(
      // the interval that you want to wait between intervals. optional.
      // Defaults to 10
      10,
      // any mapping function you want to take the interval index and map to
      // defaults to a => a
      (index: number) => `Index of ${index}`
    ),
    process: ({ payload, self }) => {
      // You will receive the value of the inbox
      // as the `payload` of the incoming message
      console.log("Received payload", payload // "Index of ...");

      // you will receive the actor itself
      // as well
      console.log(actor === self, 'The actor is equal to self')
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

### Custom Inbox

> Since we don't have many prebuilt Inboxes,
> you will probably find yourself having to
> create your own. Here is an example of
> creating a custom Inbox

```ts
import { InboxInterface } from "@app/Inbox";

/**
 * This Inbox will "receive a message" every
 * `timeout` milliseconds and it will be in
 * the shape of OutputType, that you can create
 * via `optionalMapper`
 *
 * Ex: const inbox = new InternalInbox<string>(100, num => `Index: ${num}`)
 */
export class IntervalInbox<OutputType = any>
  implements InboxInterface<OutputType>
{
  #mapper: (input: number) => OutputType;
  #inbox: Inbox<OutputType>;
  #interval?: NodeJS.Timer;

  message$: Observable<OutputType>;

  constructor(timeout = 10, optionalMapper?: (input: number) => OutputType) {
    this.#mapper = optionalMapper ?? ((input: any) => input);

    this.#inbox = new Inbox<OutputType>({
      /**
       * Inbox offers a callback to send messages by
       **/
      connect: (cb) => {
        let i = 0;
        this.#interval = setInterval(() => {
          cb(this.#mapper(i++));
        }, timeout);
      },
      /**
       * And will request the disconnection
       * whenever it needs to
       */
      disconnect: () => {
        this.#interval && clearInterval(this.#interval);
      },
    });

    this.message$ = this.#inbox.message$;
  }

  connect() {
    return this.#inbox.connect();
  }

  disconnect() {
    return this.#inbox.disconnect();
  }
}
```

### Development

```sh
# Start minikube
minikube start
# Apply infra to cluster
# if this fails due to
# error: unable to recognize "./k8s": no matches for kind "Kafka" in version "kafka.strimzi.io/v1beta2"
# it's okay. do it again once the operator starts
kubectl apply -k ./k8s
```
