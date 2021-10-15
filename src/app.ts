import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { game_driver } from './game_driver/game_driver'

const res = dotenv.config();
if (res.error) {
    throw res.error;
}

const rcon_host: string = process.env.MORDHAU_RCON_HOST ?? "";
const rcon_port: number = parseInt(process.env.MORDHAU_RCON_PORT ?? "");
const rcon_password: string = process.env.MORDHAU_RCON_PASSWORD ?? "";

const red_team: string = process.env.MORDHAU_RED_TEAM_NAME ?? "";
const blue_team: string = process.env.MORDHAU_BLUE_TEAM_NAME ?? "";

const red_score: number = parseInt(process.env.MORDHAU_RED_TEAM_SCORE ?? "0");
const blue_score: number = parseInt(process.env.MORDHAU_RED_TEAM_SCORE ?? "0");

const score_win_set: number = parseInt(process.env.MORDHAU_SCORE_WIN_SET ?? "3");

const express_port: number = parseInt(process.env.EXPRESS_PORT ?? "8080");

const game = game_driver.make_game_driver(
    {
        red_team: red_team,
        blue_team: blue_team,
        red_score: red_score,
        blue_score: blue_score,
        score_win_set: score_win_set
    },
    {
        host: rcon_host,
        port: rcon_port,
        password: rcon_password,
        timeout: 30000
    }).setup();

const app = express().use(cors());
app.get("/data", (_, res) => {
    res.json({
        show_hud: true,
        hud: game.cur_state
    });
});

app.listen(express_port);

// TODO: logging setup
// TODO: try to export all rcon broadcasts to log file
// TODO: mock rcon class for testing with real data logs
// TODO: teardown method for all classes
// TODO: change json output to include gamemode and current match score
// TODO: more comments in code
// TODO: remove dotenv from code and use "-r dotenv/config"
