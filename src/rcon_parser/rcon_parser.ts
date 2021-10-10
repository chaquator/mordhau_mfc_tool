// events:
// login, matchstate, killfeed, scorefeed, chat, custom, punishment
// currently supported:
// matchstate, scorefeed

import { Rcon } from '../rcon/rcon'
import { EventEmitter } from 'events'
import TypedEmitter from 'typed-emitter'

interface events {
    matchstate: (map_name: string, gamemode: string) => void,
    scorefeed: (team: number, score: number) => void
};

export class rcon_parser {
    emitter = new EventEmitter() as TypedEmitter<events>;

    on = this.emitter.on.bind(this.emitter);
    once = this.emitter.once.bind(this.emitter);
    removeListener = this.emitter.removeListener.bind(this.emitter);
    removeAllListeners = this.emitter.removeAllListeners.bind(this.emitter);

    rcon: Rcon;

    constructor(rcon: Rcon) {
        this.rcon = rcon;

        if (rcon.authenticated) {
            rcon.send("listen allon").then((res: string) => {
                if (res != "Now listening to all broadcast channels\n") {
                    // TOOD: logging pass
                    console.warn("Unexpected response");
                }
            });

            rcon.on("broadcast", async (data: string) => await this.handlePayload(data));

            // keep alive
            setInterval(() => rcon.send("alive"), 30000);
        }
    }

    private async handlePayload(payload: string) {
        if (payload.startsWith("MatchState: Waiting")) {
            const info: string = await this.rcon.send("info");
            const kva = info.split("\n")
                .filter(line => line.length > 1)
                .map(line => line.split(": "));
            const obj = Object.fromEntries(kva);

            this.emitter.emit("matchstate", obj.Map, obj.GameMode);
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
