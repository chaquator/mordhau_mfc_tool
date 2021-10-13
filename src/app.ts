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

    const red_team: string = process.env.MORDHAU_RED_TEAM_NAME ?? "";
    const blue_team: string = process.env.MORDHAU_BLUE_TEAM_NAME ?? "";

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
    const reg = rcon_p.register();
    if (!reg) {
        console.warn("failed to register");
    }

    const game_p = new game_parser(rcon_p);
    game_p.cur_state.red_team = red_team;
    game_p.cur_state.blue_team = blue_team;
    await game_p.register();
}

// TODO: interface for mock rcon class for testing with real data logs
// TODO: factory function from game parser to construct whole package
// TODO: expose game state with express route

main().catch(console.error);
