import * as dotenv from 'dotenv'
import { rcon_parser } from './rcon_parser/rcon_parser'
import { game_parser } from './game_parser/game_parser'
import { Rcon } from './rcon/rcon'

async function main() {
    process.on("exit", (_) => console.log("exiting..."));

    const res = dotenv.config();
    if (res.error) {
        throw res.error;
    }

    const host: string = process.env.MORDHAU_RCON_HOST ?? "";
    const port: number = parseInt(process.env.MORDHAU_RCON_PORT ?? "");
    const password: string = process.env.MORDHAU_RCON_PASSWORD ?? "";
    const rcon = new Rcon({
        host: host,
        port: port,
        password: password,
        timeout: 30000
    });

    rcon.on("connect", () => console.log("connect"));
    rcon.on("authenticated", () => console.log("auth"));
    rcon.on("end", () => console.log("end"));

    await rcon.connect();

    const rcon_p = new rcon_parser(rcon);
    rcon_p.on("matchstate", (map, gm) => {
        console.log(`map: ${map} gamemode: ${gm}`);
    });
    rcon_p.on("scorefeed", (team, score) => {
        console.log(`team ${team} score ${score}`);
    });
    const reg = rcon_p.register();
    if (!reg) {
        console.warn("failed to register");
    }

    // const game_p = new game_parser(rcon_p);
}

// TODO: test rcon parser before continuing with game parser

main().catch(console.error);
