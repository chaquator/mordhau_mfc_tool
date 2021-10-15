// events:
// login, matchstate, killfeed, scorefeed, chat, custom, punishment
// currently supported:
// matchstate, scorefeed

import { Events } from '../rcon/rcon'
import { EventEmitter } from 'events'
import TypedEmitter from 'typed-emitter'

interface IRcon {
    authenticated: boolean;
    send: (_: string) => Promise<string>;
    on: <E extends keyof Events>(event: E, listener: Events[E]) => TypedEmitter<Events>;
    off: <E extends keyof Events>(event: E, listener: Events[E]) => TypedEmitter<Events>;
    connect: () => Promise<IRcon>;
}

interface events {
    matchstate: (map_name: string, gamemode: string) => void,
    scorefeed: (team: number, score: number) => void
};

export interface match_state {
    Map: string;
    GameMode: string;
};

export class rcon_parser {
    readonly rcon: IRcon;
    readonly emitter = new EventEmitter() as TypedEmitter<events>;

    private registered = false;
    private interval: NodeJS.Timer | undefined = undefined;
    private broadcast_cb: ((data: string) => void) | undefined = undefined;

    on = this.emitter.on.bind(this.emitter);
    once = this.emitter.once.bind(this.emitter);
    removeListener = this.emitter.removeListener.bind(this.emitter);
    removeAllListeners = this.emitter.removeAllListeners.bind(this.emitter);

    constructor(rcon: IRcon) {
        this.rcon = rcon;
    }

    /**
     * parses match state from input data
     * assumes data is correct for now
     */
    private static parseGameInfo(data: string): match_state {
        const obj = Object.fromEntries(
            data.split("\n")
                .filter(line => line.length > 1)
                .map(line => line.split(": "))
        );

        if (!obj.Map || !obj.GameMode) {
            // TODO: logging, error handling
            console.warn("missing properties");
            console.log(obj);
        }

        return obj;
    }

    /**
     * register callbacks and begin handling broadcast data of rcon
     * returns true if rcon is authenticated and parser is not already registered
     */
    public register() {
        if (this.registered) return false;

        if (this.rcon.authenticated) {
            this.rcon.send("listen allon").then((res: string) => {
                if (res != "Now listening to all broadcast channels\n") {
                    // TODO: logging
                    console.warn("unexpected response");
                }
            });

            // keep alive
            this.interval = setInterval(() => this.rcon.send("alive"), 30000);

            this.broadcast_cb = (data: string) => this.handlePayload(data);
            this.rcon.on("broadcast", this.broadcast_cb);

            this.registered = true;
            return true;
        }
        return false;
    }

    /**
     * removes all listeners from rcon and stops handling broadcasts
     */
    public deregister() {
        if (this.rcon.authenticated) {
            this.rcon.send("listen allof").then((res: string) => {
                if (res != "Console: No longer listening to any broadcast channels\n") {
                    // TODO: logging
                    console.warn("unexpected response");
                }
            });

            if (this.broadcast_cb) {
                this.rcon.off("broadcast", this.broadcast_cb);
                this.broadcast_cb = undefined;
            }

            if (this.interval) {
                clearInterval(this.interval);
                this.interval = undefined
            }
        }
        this.registered = false;
    }

    public async setup() {
        await this.rcon.connect();
        this.register();
    }

    /**
     * gets match state info in object
     */
    public async getGameInfo() {
        return this.rcon.send("info")
            .then(rcon_parser.parseGameInfo);
    }

    /**
     * handles payload :^)
     */
    private handlePayload(payload: string) {
        if (payload.startsWith("MatchState: Waiting")) {
            this.getGameInfo()
                .then((state: match_state) => this.emitter.emit("matchstate", state.Map, state.GameMode));
        } else if (payload.startsWith("Scorefeed")) {
            const reg = /Scorefeed: [\d\.-]+: Team (?<team>\d)\'s is now (?<cur_score>\d+)\.\d points from (?<prev_score>\d+)*/;
            const match = payload.match(reg);
            if (match) {
                const cur_score = Number.parseInt(match?.groups?.cur_score ?? "");
                const prev_score = Number.parseInt(match?.groups?.prev_score ?? "");
                if (cur_score != prev_score) {
                    const team = Number.parseInt(match?.groups?.team ?? "");
                    this.emitter.emit("scorefeed", team, cur_score);
                }
            }
        }
    }

};
