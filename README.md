# Farhack project

## Data Layout

rsvp-week-{number} e.g. rsvp-week-20

```
{ "fid": user?.fid, "fname": user?.username, "matched": false }
```

rsvp-week-{number}-matches e.g. rsvp-week-20-matches
```
{"fidOne": number, "fidTwo": number, "posted": false}
```

## TODOs

- add style to all frames
- [ ] /mate route to show the match for the interacting user
- [ ] nodejs cronjob 
  - that matchmakes all users every sunday noon UTC
  - that makes the bot cast and marks match as posted after success
  - second cron that runs an hour and two hours later to catch all unposted casts