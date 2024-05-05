import cron from "node-cron";
import { kv } from "@vercel/kv";
import { generateMatches, publishCast } from "./utils";

let week = parseInt(process.env.WEEK!); //TODO: get based on date

console.log('Starting up: ', Date.now());

const job = cron.schedule(
    `0 12 * * 0`, // Cron time format: 12:00 on Sundays
    function () {
        generateMatches(kv, week);
    },
    {
        scheduled: true, // Ensure the job is scheduled.
        timezone: 'UTC', // Set the timezone for the schedule.
    }
);


// Logging to inform that the cron job is scheduled.
console.log(
  `Scheduled reminders since ${Date.now()}.`
);