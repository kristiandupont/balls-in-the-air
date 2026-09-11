# Balls in the Air

A visual task management tool where tasks grow over time until you "bump" them. Think of it as a live todo list that keeps important recurring tasks visible.

**[Try it live →](https://kristiandupont.github.io/balls-in-the-air/)**

![balls-in-the-air](https://github.com/user-attachments/assets/de2e3290-5dde-4434-aa8f-96c7c27802bc)


## How it works

- Each task is represented as a growing ball
- Each task has an expected frequency; the ball grows from a 20px radius to a 150px radius over that period, and keeps growing (up to 200px) after it is overdue
- Balls past an 80px radius also show how long ago they were last bumped, and switch to "3d overdue" once the frequency has elapsed
- An overdue ball fills with a light tint of its own color
- Click a task to see its details and "bump" it (reset the timer); the pencil button opens the editor
- Drag tasks around the arena
- Tasks bounce off each other using physics simulation

## Development

```bash
npm install
npm run dev
```

## Deployment

The app automatically deploys to GitHub Pages on push to `main`. It's a static frontend-only app built with [Vite](https://vite.dev/) and [Crank.js](https://crank.js.org/).
