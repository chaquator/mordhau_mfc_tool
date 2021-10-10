import * as dotenv from 'dotenv'
import { rcon_parser } from './rcon_parser/rcon_parser'
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

    const p = new rcon_parser(rcon);
    p.on("matchstate", (map, gm) => {
        console.log(`Map: ${map}, Gamemode: ${gm}`);
    });
    p.on("scorefeed", (team, score) => {
        console.log(`Team ${team} score ${score}`);
    });
}

main().catch(console.error);
